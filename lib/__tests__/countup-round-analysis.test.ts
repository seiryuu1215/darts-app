import { describe, it, expect } from 'vitest';
import {
  parseRounds,
  computeRoundAverages,
  detectRoundPatterns,
  analyzeRounds,
  analyzeRoundBulls,
  type RoundScore,
} from '../countup-round-analysis';

describe('parseRounds', () => {
  it('splits 24 darts into 8 rounds of 3', () => {
    // All singles: S1 through S20 + repeats = 1 per dart
    const log = 'BB,BB,BB,B,B,B,S20,S20,S20,S1,S1,S1,T20,T20,T20,D20,D20,D20,I5,I5,I5,O,O,O';
    const rounds = parseRounds(log);
    expect(rounds).toHaveLength(8);
    expect(rounds[0]).toBe(150); // BB(50)*3
    expect(rounds[1]).toBe(75); // B(25)*3
    expect(rounds[2]).toBe(60); // S20*3
    expect(rounds[3]).toBe(3); // S1*3
    expect(rounds[4]).toBe(180); // T20(60)*3
    expect(rounds[5]).toBe(120); // D20(40)*3
    expect(rounds[6]).toBe(15); // I5(5)*3
    expect(rounds[7]).toBe(0); // O*3
  });

  it('handles fewer than 24 darts', () => {
    const log = 'BB,BB,BB';
    const rounds = parseRounds(log);
    expect(rounds).toHaveLength(8);
    expect(rounds[0]).toBe(150);
    expect(rounds[1]).toBe(0);
  });
});

describe('computeRoundAverages', () => {
  it('returns empty for empty logs', () => {
    expect(computeRoundAverages([])).toEqual([]);
  });

  it('computes averages across multiple games', () => {
    const logs = [
      'BB,BB,BB,B,B,B,S1,S1,S1,S1,S1,S1,S1,S1,S1,S1,S1,S1,S1,S1,S1,S1,S1,S1',
      'B,B,B,BB,BB,BB,S1,S1,S1,S1,S1,S1,S1,S1,S1,S1,S1,S1,S1,S1,S1,S1,S1,S1',
    ];
    const result = computeRoundAverages(logs);
    expect(result).toHaveLength(8);
    // R1: (150+75)/2 = 112.5
    expect(result[0].avgScore).toBe(112.5);
    expect(result[0].maxScore).toBe(150);
    expect(result[0].minScore).toBe(75);
  });
});

describe('detectRoundPatterns', () => {
  it('returns stable for insufficient data', () => {
    const rounds: RoundScore[] = [];
    expect(detectRoundPatterns(rounds).pattern).toBe('stable');
  });

  it('detects cold_start when first rounds are low', () => {
    const rounds: RoundScore[] = Array.from({ length: 8 }, (_, i) => ({
      round: i + 1,
      scores: [],
      avgScore: i < 2 ? 20 : 60,
      maxScore: 80,
      minScore: 10,
    }));
    const result = detectRoundPatterns(rounds);
    expect(result.pattern).toBe('cold_start');
    expect(result.label).toBe('コールドスタート型');
  });

  it('detects fade_out when last rounds are low', () => {
    const rounds: RoundScore[] = Array.from({ length: 8 }, (_, i) => ({
      round: i + 1,
      scores: [],
      avgScore: i >= 6 ? 20 : 60,
      maxScore: 80,
      minScore: 10,
    }));
    const result = detectRoundPatterns(rounds);
    expect(result.pattern).toBe('fade_out');
  });

  it('detects stable when scores are uniform', () => {
    const rounds: RoundScore[] = Array.from({ length: 8 }, (_, i) => ({
      round: i + 1,
      scores: [],
      avgScore: 50,
      maxScore: 50,
      minScore: 50,
    }));
    expect(detectRoundPatterns(rounds).pattern).toBe('stable');
  });

  it('detects peak_middle when middle rounds are highest', () => {
    const avgScores = [30, 30, 40, 70, 70, 40, 30, 30];
    const rounds: RoundScore[] = avgScores.map((avg, i) => ({
      round: i + 1,
      scores: [],
      avgScore: avg,
      maxScore: avg + 10,
      minScore: avg - 10,
    }));
    expect(detectRoundPatterns(rounds).pattern).toBe('peak_middle');
  });

  it('detects improving when last rounds are higher than first', () => {
    // Need first2 >= overall - threshold so cold_start doesn't trigger
    const avgScores = [48, 48, 49, 49, 50, 51, 55, 60];
    const rounds: RoundScore[] = avgScores.map((avg, i) => ({
      round: i + 1,
      scores: [],
      avgScore: avg,
      maxScore: avg + 10,
      minScore: avg - 10,
    }));
    expect(detectRoundPatterns(rounds).pattern).toBe('improving');
  });
});

describe('analyzeRoundBulls', () => {
  it('空配列では全て0', () => {
    const result = analyzeRoundBulls([]);
    expect(result.totalRounds).toBe(0);
    expect(result.hatTrickCount).toBe(0);
    expect(result.lowTonCount).toBe(0);
    expect(result.hatTrickRate).toBe(0);
    expect(result.lowTonRate).toBe(0);
  });

  it('ハットトリック（1ラウンド3ブル）を検出', () => {
    // R1=BB,BB,BB (3 bulls = hat trick), R2-R8 はS1
    const log = 'BB,BB,BB,S1,S1,S1,S1,S1,S1,S1,S1,S1,S1,S1,S1,S1,S1,S1,S1,S1,S1,S1,S1,S1';
    const result = analyzeRoundBulls([log]);
    expect(result.totalRounds).toBe(8);
    expect(result.hatTrickCount).toBe(1);
    expect(result.lowTonCount).toBe(0);
    expect(result.hatTrickRate).toBeCloseTo(12.5, 1); // 1/8 * 100
  });

  it('ロートン（1ラウンド2ブル）を検出', () => {
    // R1=BB,B,S1 (2 bulls = low ton), R2-R8 はS1
    const log = 'BB,B,S1,S1,S1,S1,S1,S1,S1,S1,S1,S1,S1,S1,S1,S1,S1,S1,S1,S1,S1,S1,S1,S1';
    const result = analyzeRoundBulls([log]);
    expect(result.totalRounds).toBe(8);
    expect(result.hatTrickCount).toBe(0);
    expect(result.lowTonCount).toBe(1);
    expect(result.lowTonRate).toBeCloseTo(12.5, 1);
  });

  it('複数ゲームのラウンドを正しく集計', () => {
    const log1 = 'BB,BB,BB,BB,B,S1,S1,S1,S1,S1,S1,S1,S1,S1,S1,S1,S1,S1,S1,S1,S1,S1,S1,S1';
    const log2 = 'S1,S1,S1,S1,S1,S1,S1,S1,S1,S1,S1,S1,S1,S1,S1,S1,S1,S1,S1,S1,S1,S1,S1,S1';
    const result = analyzeRoundBulls([log1, log2]);
    expect(result.totalRounds).toBe(16); // 8*2
    expect(result.hatTrickCount).toBe(1); // log1 R1
    expect(result.lowTonCount).toBe(1); // log1 R2 (BB,B = 2 bulls)
  });

  it('1ブルのみのラウンドはカウントされない', () => {
    const log = 'BB,S1,S1,S1,S1,S1,S1,S1,S1,S1,S1,S1,S1,S1,S1,S1,S1,S1,S1,S1,S1,S1,S1,S1';
    const result = analyzeRoundBulls([log]);
    expect(result.hatTrickCount).toBe(0);
    expect(result.lowTonCount).toBe(0);
  });
});

describe('analyzeRounds', () => {
  it('returns null for fewer than 5 games', () => {
    const logs = ['BB,BB,BB,B,B,B,S1,S1,S1,S1,S1,S1,S1,S1,S1,S1,S1,S1,S1,S1,S1,S1,S1,S1'];
    expect(analyzeRounds(logs)).toBeNull();
  });

  it('returns full analysis for sufficient games', () => {
    const log = 'BB,BB,BB,B,B,B,S20,S20,S20,S1,S1,S1,T20,T20,T20,D20,D20,D20,I5,I5,I5,S10,S10,S10';
    const logs = Array(6).fill(log);
    const result = analyzeRounds(logs);
    expect(result).not.toBeNull();
    expect(result!.rounds).toHaveLength(8);
    expect(result!.bestRound).toBeGreaterThanOrEqual(1);
    expect(result!.worstRound).toBeGreaterThanOrEqual(1);
    expect(result!.maxSingleRound).toBeGreaterThan(0);
  });
});
