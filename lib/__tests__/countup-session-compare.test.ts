import { describe, it, expect } from 'vitest';
import {
  extractQualifiedSessions,
  summarizeSession,
  compareLastTwoSessions,
} from '../countup-session-compare';
import type { CountUpPlayData } from '../dartslive-api';

/** テスト用ヘルパー: 指定日に指定数のプレイデータを生成 */
function makePlays(date: string, count: number, baseScore = 500): CountUpPlayData[] {
  return Array.from({ length: count }, (_, i) => ({
    time: `${date} ${String(10 + Math.floor(i / 4)).padStart(2, '0')}:${String((i % 4) * 15).padStart(2, '0')}:00`,
    score: baseScore + (i % 10) * 5,
    playLog: 'BB,B,S20,T20,D10,I5,S1,BB,S15,T19,D20,I10,B,S5,T18,D15,I20,S10,T17,D5,I15,S3,BB,B',
    dl3VectorX: 2.5,
    dl3VectorY: -1.3,
    dl3Radius: 25.0,
    dl3Speed: 12.5,
  }));
}

describe('extractQualifiedSessions', () => {
  it('30ゲーム未満の日は除外される', () => {
    const plays = makePlays('2025-03-01', 20);
    const sessions = extractQualifiedSessions(plays, 30);
    expect(sessions).toHaveLength(0);
  });

  it('30ゲーム以上の日が抽出される', () => {
    const plays = makePlays('2025-03-01', 35);
    const sessions = extractQualifiedSessions(plays, 30);
    expect(sessions).toHaveLength(1);
    expect(sessions[0].date).toBe('2025-03-01');
    expect(sessions[0].plays).toHaveLength(35);
  });

  it('複数日がある場合、日付順にソートされる', () => {
    const plays = [...makePlays('2025-03-05', 30), ...makePlays('2025-03-01', 30)];
    const sessions = extractQualifiedSessions(plays, 30);
    expect(sessions).toHaveLength(2);
    expect(sessions[0].date).toBe('2025-03-01');
    expect(sessions[1].date).toBe('2025-03-05');
  });

  it('カスタムminGamesで閾値を変更できる', () => {
    const plays = makePlays('2025-03-01', 10);
    expect(extractQualifiedSessions(plays, 10)).toHaveLength(1);
    expect(extractQualifiedSessions(plays, 15)).toHaveLength(0);
  });
});

describe('summarizeSession', () => {
  it('基本的なサマリーを正しく算出する', () => {
    const plays = makePlays('2025-03-01', 30, 500);
    const summary = summarizeSession('2025-03-01', plays);

    expect(summary.date).toBe('2025-03-01');
    expect(summary.gameCount).toBe(30);
    expect(summary.avgScore).toBeGreaterThan(0);
    expect(summary.maxScore).toBeGreaterThanOrEqual(summary.avgScore);
    expect(summary.minScore).toBeLessThanOrEqual(summary.avgScore);
    expect(summary.consistency).toBeGreaterThanOrEqual(0);
    expect(summary.bullRate).toBeGreaterThanOrEqual(0);
    expect(summary.doubleBullRate).toBeGreaterThanOrEqual(0);
  });

  it('lowTonRate/hatTrickRate/oneBullRate/noBullRateが含まれる', () => {
    const plays = makePlays('2025-03-01', 30);
    const summary = summarizeSession('2025-03-01', plays);

    expect(typeof summary.lowTonRate).toBe('number');
    expect(typeof summary.hatTrickRate).toBe('number');
    expect(typeof summary.oneBullRate).toBe('number');
    expect(typeof summary.noBullRate).toBe('number');
    expect(summary.lowTonRate).toBeGreaterThanOrEqual(0);
    expect(summary.hatTrickRate).toBeGreaterThanOrEqual(0);
    expect(summary.oneBullRate).toBeGreaterThanOrEqual(0);
    expect(summary.noBullRate).toBeGreaterThanOrEqual(0);
  });

  it('DL3センサーデータの平均が算出される', () => {
    const plays = makePlays('2025-03-01', 30);
    const summary = summarizeSession('2025-03-01', plays);

    expect(summary.avgVectorX).toBeCloseTo(2.5, 0);
    expect(summary.avgVectorY).toBeCloseTo(-1.3, 0);
    expect(summary.avgRadius).toBeCloseTo(25.0, 0);
    expect(summary.avgSpeed).toBeCloseTo(12.5, 0);
  });

  it('DL3データが全て0の場合は0になる', () => {
    const plays = makePlays('2025-03-01', 10).map((p) => ({
      ...p,
      dl3VectorX: 0,
      dl3VectorY: 0,
      dl3Radius: 0,
      dl3Speed: 0,
    }));
    const summary = summarizeSession('2025-03-01', plays);
    expect(summary.avgVectorX).toBe(0);
    expect(summary.avgRadius).toBe(0);
  });
});

describe('compareLastTwoSessions', () => {
  it('有効セッションが2つ未満の場合nullを返す', () => {
    const plays = makePlays('2025-03-01', 35);
    expect(compareLastTwoSessions(plays, 30)).toBeNull();
  });

  it('2つの有効セッションがある場合、比較結果を返す', () => {
    const plays = [...makePlays('2025-03-01', 35, 480), ...makePlays('2025-03-05', 40, 520)];
    const result = compareLastTwoSessions(plays, 30);

    expect(result).not.toBeNull();
    expect(result!.prev.date).toBe('2025-03-01');
    expect(result!.current.date).toBe('2025-03-05');
    expect(result!.prev.gameCount).toBe(35);
    expect(result!.current.gameCount).toBe(40);
  });

  it('deltasが正しく算出される', () => {
    const plays = [...makePlays('2025-03-01', 35, 480), ...makePlays('2025-03-05', 40, 520)];
    const result = compareLastTwoSessions(plays, 30)!;

    expect(result.deltas.avgScore).toBeGreaterThan(0);
    expect(typeof result.deltas.bullRate).toBe('number');
    expect(typeof result.deltas.lowTonRate).toBe('number');
    expect(typeof result.deltas.hatTrickRate).toBe('number');
    expect(typeof result.deltas.oneBullRate).toBe('number');
    expect(typeof result.deltas.noBullRate).toBe('number');
  });

  it('insightsが生成される', () => {
    const plays = [...makePlays('2025-03-01', 35, 450), ...makePlays('2025-03-05', 40, 520)];
    const result = compareLastTwoSessions(plays, 30)!;

    expect(result.insights.length).toBeGreaterThan(0);
    expect(result.insights.every((s) => typeof s === 'string')).toBe(true);
  });
});
