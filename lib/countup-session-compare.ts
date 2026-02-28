/**
 * COUNT-UP セッション間比較分析
 * 30ゲーム以上の日を「有効セッション」として抽出し、直近2セッションを比較する
 */

import {
  calculateConsistency,
  analyzeMissDirection,
  parsePlayTime,
} from './stats-math';

import type { CountUpPlayData } from './dartslive-api';

// ─── 型定義 ──────────────────────────────────

export interface CuSessionSummary {
  date: string;
  gameCount: number;
  avgScore: number;
  maxScore: number;
  minScore: number;
  consistency: number;       // CV-based (0-100)
  bullRate: number;
  avgVectorX: number;        // 横ずれ平均 (mm)
  avgVectorY: number;        // 縦ずれ平均 (mm)
  avgRadius: number;         // グルーピング半径平均 (mm)
  avgSpeed: number;
  primaryMissDir: string;    // 主傾向方向
  directionStrength: number; // 偏り強度
}

export interface CuSessionComparison {
  prev: CuSessionSummary;
  current: CuSessionSummary;
  deltas: {
    avgScore: number;
    consistency: number;
    bullRate: number;
    vectorX: number;    // 横ずれ変化
    vectorY: number;    // 縦ずれ変化
    radius: number;     // レンジ変化
    speed: number;
  };
  insights: string[];   // 日本語インサイト
}

// ─── ヘルパー ────────────────────────────────

/** 日付文字列 (YYYY-MM-DD) を取得 */
function toDateKey(time: string): string {
  const dt = parsePlayTime(time);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const d = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ─── 公開関数 ────────────────────────────────

/** 有効セッション（minGames以上の日）を抽出 */
export function extractQualifiedSessions(
  plays: CountUpPlayData[],
  minGames: number = 30,
): { date: string; plays: CountUpPlayData[] }[] {
  // 日付ごとにグルーピング
  const byDate = new Map<string, CountUpPlayData[]>();
  for (const p of plays) {
    const key = toDateKey(p.time);
    const arr = byDate.get(key);
    if (arr) {
      arr.push(p);
    } else {
      byDate.set(key, [p]);
    }
  }

  // minGames以上の日のみ抽出し、日付順にソート
  return [...byDate.entries()]
    .filter(([, ps]) => ps.length >= minGames)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, ps]) => ({
      date,
      plays: ps.sort(
        (a, b) => parsePlayTime(a.time).getTime() - parsePlayTime(b.time).getTime(),
      ),
    }));
}

/** セッション（1日分のプレイ）をサマリーに変換 */
export function summarizeSession(
  date: string,
  plays: CountUpPlayData[],
): CuSessionSummary {
  const scores = plays.map((p) => p.score);
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const con = calculateConsistency(scores);

  const missResult = analyzeMissDirection(plays.map((p) => p.playLog));

  // DL3センサーデータ（0以外のもの）
  const dl3Plays = plays.filter(
    (p) => p.dl3VectorX !== 0 || p.dl3VectorY !== 0 || p.dl3Radius !== 0 || p.dl3Speed !== 0,
  );
  const hasDl3 = dl3Plays.length > 0;

  return {
    date,
    gameCount: plays.length,
    avgScore: Math.round(avg * 10) / 10,
    maxScore: Math.max(...scores),
    minScore: Math.min(...scores),
    consistency: con?.score ?? 0,
    bullRate: missResult?.bullRate ?? 0,
    avgVectorX: hasDl3
      ? Math.round((dl3Plays.reduce((s, p) => s + p.dl3VectorX, 0) / dl3Plays.length) * 10) / 10
      : 0,
    avgVectorY: hasDl3
      ? Math.round((dl3Plays.reduce((s, p) => s + p.dl3VectorY, 0) / dl3Plays.length) * 10) / 10
      : 0,
    avgRadius: hasDl3
      ? Math.round((dl3Plays.reduce((s, p) => s + p.dl3Radius, 0) / dl3Plays.length) * 10) / 10
      : 0,
    avgSpeed: hasDl3
      ? Math.round((dl3Plays.reduce((s, p) => s + p.dl3Speed, 0) / dl3Plays.length) * 10) / 10
      : 0,
    primaryMissDir: missResult?.primaryDirection ?? '-',
    directionStrength: missResult?.directionStrength ?? 0,
  };
}

/** 直近2つの有効セッションを比較 */
export function compareLastTwoSessions(
  plays: CountUpPlayData[],
  minGames: number = 30,
): CuSessionComparison | null {
  const sessions = extractQualifiedSessions(plays, minGames);
  if (sessions.length < 2) return null;

  const prevSession = sessions[sessions.length - 2];
  const currSession = sessions[sessions.length - 1];

  const prev = summarizeSession(prevSession.date, prevSession.plays);
  const current = summarizeSession(currSession.date, currSession.plays);

  const deltas = {
    avgScore: Math.round((current.avgScore - prev.avgScore) * 10) / 10,
    consistency: current.consistency - prev.consistency,
    bullRate: Math.round((current.bullRate - prev.bullRate) * 10) / 10,
    vectorX: Math.round((current.avgVectorX - prev.avgVectorX) * 10) / 10,
    vectorY: Math.round((current.avgVectorY - prev.avgVectorY) * 10) / 10,
    radius: Math.round((current.avgRadius - prev.avgRadius) * 10) / 10,
    speed: Math.round((current.avgSpeed - prev.avgSpeed) * 10) / 10,
  };

  const insights = generateInsights(prev, current, deltas);

  return { prev, current, deltas, insights };
}

// ─── インサイト生成 ──────────────────────────

function generateInsights(
  prev: CuSessionSummary,
  current: CuSessionSummary,
  deltas: CuSessionComparison['deltas'],
): string[] {
  const insights: string[] = [];

  // スコア変化
  if (deltas.avgScore > 20) {
    insights.push(`平均スコアが${deltas.avgScore}点アップ。好調な練習日でした。`);
  } else if (deltas.avgScore < -20) {
    insights.push(`平均スコアが${Math.abs(deltas.avgScore)}点ダウン。コンディションや環境の違いを確認。`);
  }

  // 安定性変化
  if (deltas.consistency > 10) {
    insights.push(`安定性が${deltas.consistency}pt改善。ムラが減っています。`);
  } else if (deltas.consistency < -10) {
    insights.push(`安定性が${Math.abs(deltas.consistency)}pt低下。集中力やフォームのばらつきに注意。`);
  }

  // ブル率変化
  if (deltas.bullRate > 3) {
    insights.push(`ブル率が${deltas.bullRate}%改善。精度が上がっています。`);
  } else if (deltas.bullRate < -3) {
    insights.push(`ブル率が${Math.abs(deltas.bullRate)}%低下。狙い方やリリースを確認。`);
  }

  // 横ずれ変化
  if (Math.abs(deltas.vectorX) > 2) {
    const dir = deltas.vectorX > 0 ? '右' : '左';
    if (Math.abs(current.avgVectorX) < Math.abs(prev.avgVectorX)) {
      insights.push(`横ずれが中心に近づいています（${dir}方向に${Math.abs(deltas.vectorX)}mm変化）。`);
    } else {
      insights.push(`横ずれが${dir}方向に${Math.abs(deltas.vectorX)}mm広がっています。スタンス確認を。`);
    }
  }

  // 縦ずれ変化
  if (Math.abs(deltas.vectorY) > 2) {
    const dir = deltas.vectorY > 0 ? '下' : '上';
    if (Math.abs(current.avgVectorY) < Math.abs(prev.avgVectorY)) {
      insights.push(`縦ずれが中心に近づいています（${dir}方向に${Math.abs(deltas.vectorY)}mm変化）。`);
    } else {
      insights.push(`縦ずれが${dir}方向に${Math.abs(deltas.vectorY)}mm広がっています。リリース高さを確認。`);
    }
  }

  // レンジ（グルーピング半径）変化
  if (deltas.radius < -1) {
    insights.push(`グルーピングが${Math.abs(deltas.radius)}mm改善。リリースが安定しています。`);
  } else if (deltas.radius > 1) {
    insights.push(`グルーピングが${deltas.radius}mm広がっています。フォームの安定を意識。`);
  }

  // ミス方向変化
  if (
    prev.primaryMissDir !== '-' &&
    current.primaryMissDir !== '-' &&
    prev.primaryMissDir !== current.primaryMissDir
  ) {
    insights.push(
      `ミス傾向が${prev.primaryMissDir}方向→${current.primaryMissDir}方向に変化。フォーム修正の影響の可能性。`,
    );
  }

  if (insights.length === 0) {
    insights.push('前回と大きな変化はありません。安定したパフォーマンスです。');
  }

  return insights;
}
