/**
 * COUNT-UPラウンド別分析ユーティリティ
 * PLAY_LOG（24本カンマ区切り）を8ラウンドに分割し分析
 */

import { parseDartCode } from './stats-math';

/** ラウンド分析結果 */
export interface RoundScore {
  round: number; // 1-8
  scores: number[]; // 各ゲームでのラウンドスコア
  avgScore: number;
  maxScore: number;
  minScore: number;
}

/** パターン分類 */
export type RoundPattern = 'cold_start' | 'fade_out' | 'stable' | 'peak_middle' | 'improving';

export interface RoundPatternResult {
  pattern: RoundPattern;
  label: string;
  description: string;
  color: string;
}

/** ラウンド別統合分析結果 */
export interface RoundAnalysis {
  rounds: RoundScore[];
  pattern: RoundPatternResult;
  bestRound: number;
  worstRound: number;
  maxSingleRound: number; // 全体で最高のラウンドスコア
}

/** PLAY_LOG文字列を1本ずつのダーツスコアに変換 */
function dartCodeToScore(code: string): number {
  const parsed = parseDartCode(code);
  if (!parsed) return 0;
  if (parsed.area === 'doubleBull') return 50;
  if (parsed.area === 'singleBull') return 25;
  if (parsed.area === 'out') return 0;
  if (parsed.area === 'triple') return parsed.number * 3;
  if (parsed.area === 'double') return parsed.number * 2;
  return parsed.number; // innerSingle or outerSingle
}

/** PLAY_LOGを8ラウンド×3本に分割 */
export function parseRounds(playLog: string): number[] {
  const darts = playLog.split(',').map((c) => c.trim());
  const rounds: number[] = [];

  for (let r = 0; r < 8; r++) {
    let roundScore = 0;
    for (let d = 0; d < 3; d++) {
      const idx = r * 3 + d;
      if (idx < darts.length) {
        roundScore += dartCodeToScore(darts[idx]);
      }
    }
    rounds.push(roundScore);
  }

  return rounds;
}

/** 複数ゲームのラウンド別平均を算出 */
export function computeRoundAverages(playLogs: string[]): RoundScore[] {
  if (playLogs.length === 0) return [];

  const allRounds: number[][] = playLogs.map(parseRounds);
  const roundScores: RoundScore[] = [];

  for (let r = 0; r < 8; r++) {
    const scores = allRounds.map((rounds) => rounds[r]);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    roundScores.push({
      round: r + 1,
      scores,
      avgScore: Math.round(avg * 10) / 10,
      maxScore: Math.max(...scores),
      minScore: Math.min(...scores),
    });
  }

  return roundScores;
}

/** ラウンドパターンを検知 */
export function detectRoundPatterns(rounds: RoundScore[]): RoundPatternResult {
  if (rounds.length < 8) {
    return { pattern: 'stable', label: '安定型', description: 'データ不足', color: '#888' };
  }

  const avgs = rounds.map((r) => r.avgScore);
  const first2 = (avgs[0] + avgs[1]) / 2;
  const mid2 = (avgs[3] + avgs[4]) / 2;
  const last2 = (avgs[6] + avgs[7]) / 2;
  const overall = avgs.reduce((a, b) => a + b, 0) / avgs.length;
  const threshold = overall * 0.08; // 8%の差を有意とする

  // コールドスタート型: 序盤が全体平均より低い
  if (first2 < overall - threshold && last2 >= overall) {
    return {
      pattern: 'cold_start',
      label: 'コールドスタート型',
      description: '序盤のスコアが低く、後半に上がるパターン。ウォームアップに時間がかかる傾向。',
      color: '#2196f3',
    };
  }

  // 失速型: 終盤が全体平均より低い
  if (last2 < overall - threshold && first2 >= overall) {
    return {
      pattern: 'fade_out',
      label: '失速型',
      description: '序盤〜中盤は好調だが終盤に落ちるパターン。集中力の持続が課題。',
      color: '#f44336',
    };
  }

  // ピーク中盤型: 中盤がピーク
  if (mid2 > first2 + threshold && mid2 > last2 + threshold) {
    return {
      pattern: 'peak_middle',
      label: '中盤ピーク型',
      description: '中盤にピークがくるパターン。ウォームアップ後に安定し終盤少し疲労が出る。',
      color: '#FF9800',
    };
  }

  // 上昇型: 後半に向かって上がっていく
  if (last2 > first2 + threshold) {
    return {
      pattern: 'improving',
      label: '上昇型',
      description: '後半に向けてスコアが上がるパターン。ウォームアップ型とも。',
      color: '#4caf50',
    };
  }

  // 安定型
  return {
    pattern: 'stable',
    label: '安定型',
    description: '全ラウンドでスコアが安定しているパターン。',
    color: '#4caf50',
  };
}

/** ラウンド別ブル統計 */
export interface RoundBullStats {
  totalRounds: number;
  hatTrickCount: number; // 1ラウンド3 bulls
  lowTonCount: number; // 1ラウンド2 bulls
  oneBullCount: number; // 1ラウンド1 bull
  noBullCount: number; // 1ラウンド0 bulls
  hatTrickRate: number; // %
  lowTonRate: number; // %
  oneBullRate: number; // %
  noBullRate: number; // %
}

/** PLAY_LOGからラウンド別ブル数を分析（ロートン・ハットトリック率算出） */
export function analyzeRoundBulls(playLogs: string[]): RoundBullStats {
  let totalRounds = 0;
  let hatTrickCount = 0;
  let lowTonCount = 0;
  let oneBullCount = 0;
  let noBullCount = 0;

  for (const log of playLogs) {
    const darts = log.split(',').map((c) => c.trim());
    for (let r = 0; r < 8; r++) {
      let bullsInRound = 0;
      for (let d = 0; d < 3; d++) {
        const idx = r * 3 + d;
        if (idx < darts.length) {
          const parsed = parseDartCode(darts[idx]);
          if (parsed?.isBull) bullsInRound++;
        }
      }
      totalRounds++;
      if (bullsInRound >= 3) hatTrickCount++;
      else if (bullsInRound === 2) lowTonCount++;
      else if (bullsInRound === 1) oneBullCount++;
      else noBullCount++;
    }
  }

  return {
    totalRounds,
    hatTrickCount,
    lowTonCount,
    oneBullCount,
    noBullCount,
    hatTrickRate: totalRounds > 0 ? Math.round((hatTrickCount / totalRounds) * 1000) / 10 : 0,
    lowTonRate: totalRounds > 0 ? Math.round((lowTonCount / totalRounds) * 1000) / 10 : 0,
    oneBullRate: totalRounds > 0 ? Math.round((oneBullCount / totalRounds) * 1000) / 10 : 0,
    noBullRate: totalRounds > 0 ? Math.round((noBullCount / totalRounds) * 1000) / 10 : 0,
  };
}

/** ラウンド分析統合実行 */
export function analyzeRounds(playLogs: string[]): RoundAnalysis | null {
  if (playLogs.length < 5) return null;

  const rounds = computeRoundAverages(playLogs);
  if (rounds.length < 8) return null;

  const pattern = detectRoundPatterns(rounds);
  const bestRound = rounds.reduce((a, b) => (b.avgScore > a.avgScore ? b : a)).round;
  const worstRound = rounds.reduce((a, b) => (b.avgScore < a.avgScore ? b : a)).round;
  const maxSingleRound = Math.max(...rounds.map((r) => r.maxScore));

  return { rounds, pattern, bestRound, worstRound, maxSingleRound };
}
