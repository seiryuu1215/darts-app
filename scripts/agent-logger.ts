import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';

// ── 定数 ──────────────────────────────────────────────
const ROOT = process.cwd();
const LOGS_DIR = join(ROOT, 'docs', 'logs');
const CLAUDE_DIR = join(ROOT, '.claude');
const SESSION_FILE = join(CLAUDE_DIR, 'current-session-id');
const START_TS_FILE = join(CLAUDE_DIR, 'tool-start-ts');
const ENV_DEBUG_FILE = join(LOGS_DIR, 'env-debug.json');

const TOOL_ICONS: Record<string, string> = {
  Read: '📖',
  Write: '✏️ ',
  Edit: '🔧',
  Bash: '⚡',
  Glob: '🔍',
  Grep: '🔎',
  Agent: '🤖',
  LSP: '🧠',
  WebFetch: '🌐',
  WebSearch: '🌐',
};

// ── ユーティリティ ────────────────────────────────────
function ensureDir(dir: string): void {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function now(): string {
  return new Date().toLocaleTimeString('ja-JP', { hour12: false });
}

function today(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function getSessionId(): string {
  ensureDir(CLAUDE_DIR);
  if (existsSync(SESSION_FILE)) {
    return readFileSync(SESSION_FILE, 'utf-8').trim();
  }
  const id = randomUUID();
  writeFileSync(SESSION_FILE, id);
  return id;
}

function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

// ── 環境変数デバッグ出力（初回のみ） ─────────────────
function dumpEnvOnce(): void {
  if (existsSync(ENV_DEBUG_FILE)) return;
  ensureDir(LOGS_DIR);

  const claudeVars: Record<string, string> = {};
  for (const [k, v] of Object.entries(process.env)) {
    if (k.startsWith('CLAUDE_') && v !== undefined) {
      claudeVars[k] = v;
    }
  }

  const debug = {
    timestamp: new Date().toISOString(),
    node_version: process.version,
    platform: process.platform,
    claude_env_vars: claudeVars,
    claude_env_count: Object.keys(claudeVars).length,
    all_env_keys: Object.keys(process.env).sort(),
    notes: [
      'CLAUDE_* で始まる環境変数がトークン数やエージェント名に対応',
      'このファイルは .gitignore に追加済み',
    ],
  };

  writeFileSync(ENV_DEBUG_FILE, JSON.stringify(debug, null, 2));
}

// ── メイン処理 ────────────────────────────────────────
function main(): void {
  try {
    const [phase, tool, agentArg] = process.argv.slice(2);
    if (!phase || !tool) return;

    const agent = agentArg || process.env.CLAUDE_AGENT || 'main';
    const icon = TOOL_ICONS[tool] || '▶️';
    const sessionId = getSessionId();

    ensureDir(LOGS_DIR);
    dumpEnvOnce();

    const logFile = join(LOGS_DIR, `${today()}.jsonl`);

    // ターゲット情報を環境変数から取得
    const target =
      process.env.CLAUDE_FILE_PATH?.slice(-50) || process.env.CLAUDE_TOOL_INPUT?.slice(0, 50) || '';

    if (phase === 'pre') {
      // ターミナル出力
      console.log(`[${now()}] [${agent.padEnd(16)}] ${icon} ${tool.padEnd(8)} ${target}`);

      // 開始タイムスタンプ保存
      writeFileSync(START_TS_FILE, Date.now().toString());

      // JSONL追記
      const entry = {
        ts: new Date().toISOString(),
        session_id: sessionId,
        agent,
        phase: 'pre' as const,
        tool,
        target,
        tokens_in: Number(process.env.CLAUDE_TOKENS_IN) || undefined,
        tokens_out: Number(process.env.CLAUDE_TOKENS_OUT) || undefined,
      };
      appendFileSync(logFile, JSON.stringify(entry) + '\n');
    } else if (phase === 'post') {
      // 経過時間計算
      let elapsedMs: number | undefined;
      if (existsSync(START_TS_FILE)) {
        const startTs = parseInt(readFileSync(START_TS_FILE, 'utf-8').trim(), 10);
        elapsedMs = Date.now() - startTs;
      }

      const tokensIn = Number(process.env.CLAUDE_TOKENS_IN) || undefined;
      const tokensOut = Number(process.env.CLAUDE_TOKENS_OUT) || undefined;

      // ターミナル出力
      const elapsed = elapsedMs != null ? `(${(elapsedMs / 1000).toFixed(1)}s)` : '';
      const tokenInfo =
        tokensIn || tokensOut
          ? ` [tokens: ${formatNumber(tokensIn || 0)}/${formatNumber(tokensOut || 0)}]`
          : '';
      console.log(
        `[${now()}] [${agent.padEnd(16)}] ✔ DONE    ${tool.padEnd(8)} ${elapsed}${tokenInfo}`,
      );

      // JSONL追記
      const entry = {
        ts: new Date().toISOString(),
        session_id: sessionId,
        agent,
        phase: 'post' as const,
        tool,
        target,
        elapsed_ms: elapsedMs,
        tokens_in: tokensIn,
        tokens_out: tokensOut,
      };
      appendFileSync(logFile, JSON.stringify(entry) + '\n');
    }
  } catch {
    // 開発フローを止めない
  }
}

main();
