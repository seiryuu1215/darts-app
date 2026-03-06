import { describe, it, expect } from 'vitest';
import {
  pearsonCorrelation,
  movingAverage,
  analyzeDartsHealthCorrelations,
} from '../health-analytics';
import type { HealthDartsCorrelation } from '@/types';

describe('pearsonCorrelation', () => {
  it('完全正相関の場合1.0を返す', () => {
    const r = pearsonCorrelation([1, 2, 3, 4, 5], [2, 4, 6, 8, 10]);
    expect(r).toBeCloseTo(1.0, 5);
  });

  it('完全負相関の場合-1.0を返す', () => {
    const r = pearsonCorrelation([1, 2, 3, 4, 5], [10, 8, 6, 4, 2]);
    expect(r).toBeCloseTo(-1.0, 5);
  });

  it('データが3件未満の場合0を返す', () => {
    expect(pearsonCorrelation([1, 2], [3, 4])).toBe(0);
    expect(pearsonCorrelation([], [])).toBe(0);
  });

  it('配列の長さが異なる場合0を返す', () => {
    expect(pearsonCorrelation([1, 2, 3], [1, 2])).toBe(0);
  });

  it('全て同じ値の場合0を返す', () => {
    expect(pearsonCorrelation([5, 5, 5], [1, 2, 3])).toBe(0);
  });
});

describe('movingAverage', () => {
  it('通常の移動平均を計算する', () => {
    const result = movingAverage([10, 20, 30], 3);
    expect(result).toEqual([10, 15, 20]);
  });

  it('null値をスキップして計算する', () => {
    const result = movingAverage([10, null, 30], 3);
    expect(result).toEqual([10, 10, 20]);
  });

  it('全てnullの場合nullを返す', () => {
    const result = movingAverage([null, null, null], 3);
    expect(result).toEqual([null, null, null]);
  });

  it('ウィンドウサイズ1の場合そのままの値を返す', () => {
    const result = movingAverage([10, 20, 30], 1);
    expect(result).toEqual([10, 20, 30]);
  });
});

describe('analyzeDartsHealthCorrelations', () => {
  it('空データの場合空配列を返す', () => {
    const results = analyzeDartsHealthCorrelations([]);
    expect(results).toEqual([]);
  });

  it('データ不足(5件未満)の場合空配列を返す', () => {
    const data: HealthDartsCorrelation[] = [
      {
        date: '2025-01-01',
        restingHr: 60,
        hrvSdnn: 45,
        sleepDurationMinutes: 420,
        steps: 8000,
        activeEnergyKcal: 300,
        exerciseMinutes: 30,
        rating: 5,
        ppd: 40,
        mpr: 2.5,
        condition: 4,
        gamesPlayed: 10,
      },
    ];
    const results = analyzeDartsHealthCorrelations(data);
    expect(results).toEqual([]);
  });

  it('十分なデータがある場合相関結果を返す', () => {
    const data: HealthDartsCorrelation[] = Array.from({ length: 10 }, (_, i) => ({
      date: `2025-01-${String(i + 1).padStart(2, '0')}`,
      restingHr: 55 + i,
      hrvSdnn: 50 - i * 2,
      sleepDurationMinutes: 400 + i * 10,
      steps: 7000 + i * 500,
      activeEnergyKcal: 250 + i * 20,
      exerciseMinutes: 20 + i * 3,
      rating: 5 + i * 0.5,
      ppd: 35 + i * 2,
      mpr: 2.0 + i * 0.1,
      condition: Math.min(5, 3 + Math.floor(i / 3)),
      gamesPlayed: 10 + i,
    }));

    const results = analyzeDartsHealthCorrelations(data);
    expect(results.length).toBeGreaterThan(0);

    // 各結果にrとnが含まれること
    for (const r of results) {
      expect(r.r).toBeDefined();
      expect(r.n).toBeGreaterThanOrEqual(5);
      expect(r.messageJa).toBeTruthy();
    }
  });

  it('相関の強さでソートされる', () => {
    const data: HealthDartsCorrelation[] = Array.from({ length: 10 }, (_, i) => ({
      date: `2025-01-${String(i + 1).padStart(2, '0')}`,
      restingHr: 55 + i,
      hrvSdnn: 50 - i * 2,
      sleepDurationMinutes: 400 + i * 10,
      steps: 7000 + i * 500,
      activeEnergyKcal: 250 + i * 20,
      exerciseMinutes: 20 + i * 3,
      rating: 5 + i * 0.5,
      ppd: 35 + i * 2,
      mpr: 2.0 + i * 0.1,
      condition: 3,
      gamesPlayed: 10,
    }));

    const results = analyzeDartsHealthCorrelations(data);
    for (let i = 1; i < results.length; i++) {
      expect(Math.abs(results[i - 1].r)).toBeGreaterThanOrEqual(Math.abs(results[i].r));
    }
  });
});
