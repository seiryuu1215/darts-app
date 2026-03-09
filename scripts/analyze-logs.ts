import { existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';

// ── 型定義 ────────────────────────────────────────────
interface LogEntry {
  ts: string;
  session_id: string;
  agent: string;
  phase: 'pre' | 'post';
  tool: string;
  target?: string;
  elapsed_ms?: number;
  tokens_in?: number;
  tokens_out?: number;
}

interface AgentStats {
  tokensIn: number;
  tokensOut: number;
  toolCalls: number;
  totalElapsed: number;
  elapsedCount: number;
}

interface ToolStats {
  totalElapsed: number;
  count: number;
}

// ── 定数 ──────────────────────────────────────────────
const ROOT = process.cwd();
const LOGS_DIR = join(ROOT, 'docs', 'logs');
const CONTEXT_WINDOW = 200_000; // Claude Opus コンテキストウィンドウ

// ── ユーティリティ ────────────────────────────────────
function parseArgs(): number {
  const daysArg = process.argv.find((a) => a.startsWith('--days='));
  return daysArg ? parseInt(daysArg.split('=')[1], 10) || 7 : 7;
}

function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

function pad(s: string, len: number): string {
  return s.padEnd(len);
}

function padNum(n: number, len: number): string {
  return formatNumber(n).padStart(len);
}

function pct(part: number, total: number): string {
  if (total === 0) return '  -  ';
  return `${((part / total) * 100).toFixed(1)}%`.padStart(5);
}

function contextPct(tokens: number): string {
  return `${((tokens / CONTEXT_WINDOW) * 100).toFixed(1)}%`;
}

// ── メイン処理 ────────────────────────────────────────
function main(): void {
  const days = parseArgs();

  if (!existsSync(LOGS_DIR)) {
    console.log('ログディレクトリが見つかりません: docs/logs/');
    console.log('agent-logger.ts が一度実行されるとログが生成されます。');
    return;
  }

  // 対象日付の範囲を計算
  const now = new Date();
  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const cutoffStr = cutoff.toISOString().split('T')[0];

  // JSONL ファイル読み込み
  const files = readdirSync(LOGS_DIR)
    .filter((f) => f.endsWith('.jsonl') && f >= cutoffStr)
    .sort();

  if (files.length === 0) {
    console.log(`直近${days}日間のログが見つかりません。`);
    return;
  }

  const entries: LogEntry[] = [];
  for (const file of files) {
    const lines = readFileSync(join(LOGS_DIR, file), 'utf-8')
      .split('\n')
      .filter((l) => l.trim());
    for (const line of lines) {
      try {
        entries.push(JSON.parse(line) as LogEntry);
      } catch {
        // 不正行はスキップ
      }
    }
  }

  if (entries.length === 0) {
    console.log('ログエントリが0件です。');
    return;
  }

  // ── 集計 ────────────────────────────────────────────
  const agentMap = new Map<string, AgentStats>();
  const toolMap = new Map<string, ToolStats>();
  const sessions = new Set<string>();

  for (const e of entries) {
    sessions.add(e.session_id);

    // エージェント別集計（postのみ）
    if (e.phase === 'post') {
      const a = agentMap.get(e.agent) || {
        tokensIn: 0,
        tokensOut: 0,
        toolCalls: 0,
        totalElapsed: 0,
        elapsedCount: 0,
      };
      a.tokensIn += e.tokens_in || 0;
      a.tokensOut += e.tokens_out || 0;
      a.toolCalls += 1;
      if (e.elapsed_ms != null) {
        a.totalElapsed += e.elapsed_ms;
        a.elapsedCount += 1;
      }
      agentMap.set(e.agent, a);

      // ツール別集計
      const t = toolMap.get(e.tool) || { totalElapsed: 0, count: 0 };
      if (e.elapsed_ms != null) {
        t.totalElapsed += e.elapsed_ms;
        t.count += 1;
      }
      toolMap.set(e.tool, t);
    }
  }

  // 合計トークン
  let totalIn = 0;
  let totalOut = 0;
  let totalCalls = 0;
  for (const a of agentMap.values()) {
    totalIn += a.tokensIn;
    totalOut += a.tokensOut;
    totalCalls += a.toolCalls;
  }
  const totalTokens = totalIn + totalOut;

  // ── 出力 ────────────────────────────────────────────
  const sep = '━'.repeat(60);

  console.log('');
  console.log(sep);
  console.log(`📊 エージェント分析レポート（直近${days}日間）`);
  console.log(sep);
  console.log('');

  // トークン使用量
  console.log('[トークン使用量]');
  console.log(
    `  ${pad('エージェント', 20)} ${pad('入力', 10)} ${pad('出力', 10)} ${pad('計', 10)} ${pad('割合', 6)} コンテキスト比`,
  );
  console.log(`  ${'─'.repeat(76)}`);

  const sortedAgents = [...agentMap.entries()].sort(
    (a, b) => b[1].tokensIn + b[1].tokensOut - (a[1].tokensIn + a[1].tokensOut),
  );

  for (const [name, stats] of sortedAgents) {
    const agentTotal = stats.tokensIn + stats.tokensOut;
    console.log(
      `  ${pad(name, 20)} ${padNum(stats.tokensIn, 10)} ${padNum(stats.tokensOut, 10)} ${padNum(agentTotal, 10)} ${pct(agentTotal, totalTokens)} ${contextPct(agentTotal)}`,
    );
  }

  console.log(`  ${'─'.repeat(76)}`);
  console.log(
    `  ${pad('合計', 20)} ${padNum(totalIn, 10)} ${padNum(totalOut, 10)} ${padNum(totalTokens, 10)} 100%  ${contextPct(totalTokens)}`,
  );

  if (totalTokens > 0) {
    console.log('');
    console.log(
      `  💡 コンテキストウィンドウ(${formatNumber(CONTEXT_WINDOW)}): ${contextPct(totalTokens)} 使用中`,
    );
  }

  // 平均実行時間（ツール別）
  console.log('');
  console.log('[平均実行時間（ツール別）]');

  const sortedTools = [...toolMap.entries()]
    .filter(([, s]) => s.count > 0)
    .sort((a, b) => b[1].count - a[1].count);

  const toolLines: string[] = [];
  for (const [name, stats] of sortedTools) {
    const avg = stats.count > 0 ? stats.totalElapsed / stats.count / 1000 : 0;
    toolLines.push(`${name}: ${avg.toFixed(1)}s (${stats.count}回)`);
  }

  // 4つずつ1行に
  for (let i = 0; i < toolLines.length; i += 4) {
    console.log(`  ${toolLines.slice(i, i + 4).join('   ')}`);
  }

  // セッションサマリー
  console.log('');
  console.log('[セッションサマリー]');
  console.log(`  総セッション数: ${sessions.size}`);
  console.log(`  累計トークン:   ${formatNumber(totalTokens)}`);
  console.log(`  ツール呼出数:   ${formatNumber(totalCalls)}`);
  console.log(`  ログファイル数: ${files.length}`);
  console.log(
    `  対象期間:       ${files[0].replace('.jsonl', '')} 〜 ${files[files.length - 1].replace('.jsonl', '')}`,
  );

  console.log('');
  console.log(sep);
}

main();
