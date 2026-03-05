import { describe, it, expect } from 'vitest';
import {
  computeStats,
  buildHistogram,
  calculateConsistency,
  getConsistencyLabel,
  buildScoreBands,
  parseDartCode,
  analyzeMissDirection,
  parsePlayTime,
  simulateBullImprovement,
  analyzeWeekdayHourly,
  getDayLabel,
} from '../stats-math';

describe('computeStats', () => {
  it('calculates avg, max, min, median for odd-length array', () => {
    const result = computeStats([10, 20, 30]);
    expect(result.avg).toBe(20);
    expect(result.max).toBe(30);
    expect(result.min).toBe(10);
    expect(result.median).toBe(20);
  });

  it('calculates median for even-length array', () => {
    const result = computeStats([10, 20, 30, 40]);
    expect(result.median).toBe(25);
  });

  it('handles single element', () => {
    const result = computeStats([42]);
    expect(result.avg).toBe(42);
    expect(result.max).toBe(42);
    expect(result.min).toBe(42);
    expect(result.median).toBe(42);
  });

  it('handles unsorted input', () => {
    const result = computeStats([30, 10, 50, 20, 40]);
    expect(result.min).toBe(10);
    expect(result.max).toBe(50);
    expect(result.median).toBe(30);
  });
});

describe('buildHistogram', () => {
  it('builds histogram with correct bins', () => {
    const scores = [105, 110, 115, 210, 215, 310];
    const result = buildHistogram(scores, 100);
    expect(result).toEqual([
      { range: '100-199', count: 3 },
      { range: '200-299', count: 2 },
      { range: '300-399', count: 1 },
    ]);
  });

  it('fills gaps between bins', () => {
    const scores = [10, 30];
    const result = buildHistogram(scores, 10);
    expect(result).toHaveLength(3);
    expect(result[1].count).toBe(0);
  });

  it('handles single score', () => {
    const result = buildHistogram([500], 100);
    expect(result).toEqual([{ range: '500-599', count: 1 }]);
  });
});

describe('calculateConsistency', () => {
  it('returns null for fewer than 3 scores', () => {
    expect(calculateConsistency([100, 200])).toBeNull();
  });

  it('returns null for all zeros', () => {
    expect(calculateConsistency([0, 0, 0])).toBeNull();
  });

  it('returns score 100 for identical scores', () => {
    const result = calculateConsistency([500, 500, 500]);
    expect(result).not.toBeNull();
    expect(result!.stdDev).toBe(0);
    expect(result!.score).toBe(100);
  });

  it('returns lower score for high variance', () => {
    const result = calculateConsistency([100, 500, 900]);
    expect(result).not.toBeNull();
    expect(result!.score).toBeLessThan(80);
  });

  it('clamps score between 0 and 100', () => {
    const result = calculateConsistency([1, 100, 200, 300, 400, 500]);
    expect(result).not.toBeNull();
    expect(result!.score).toBeGreaterThanOrEqual(0);
    expect(result!.score).toBeLessThanOrEqual(100);
  });
});

describe('getConsistencyLabel', () => {
  it('returns 非常に安定 for score >= 90', () => {
    expect(getConsistencyLabel(95)).toEqual({ label: '非常に安定', color: '#4caf50' });
  });
  it('returns 安定 for score 75-89', () => {
    expect(getConsistencyLabel(80)).toEqual({ label: '安定', color: '#8bc34a' });
  });
  it('returns 普通 for score 60-74', () => {
    expect(getConsistencyLabel(65)).toEqual({ label: '普通', color: '#ff9800' });
  });
  it('returns ムラあり for score 40-59', () => {
    expect(getConsistencyLabel(50)).toEqual({ label: 'ムラあり', color: '#f44336' });
  });
  it('returns 不安定 for score < 40', () => {
    expect(getConsistencyLabel(20)).toEqual({ label: '不安定', color: '#d32f2f' });
  });
});

describe('buildScoreBands', () => {
  it('returns empty for empty scores', () => {
    const bands = [{ label: 'low', min: 0, max: 100 }];
    expect(buildScoreBands([], bands)).toEqual([]);
  });

  it('correctly categorizes scores into bands', () => {
    const scores = [50, 150, 250, 350, 450];
    const bands = [
      { label: '0-199', min: 0, max: 199 },
      { label: '200-399', min: 200, max: 399 },
      { label: '400+', min: 400, max: 999 },
    ];
    const result = buildScoreBands(scores, bands);
    expect(result[0]).toEqual({ label: '0-199', count: 2, percentage: 40 });
    expect(result[1]).toEqual({ label: '200-399', count: 2, percentage: 40 });
    expect(result[2]).toEqual({ label: '400+', count: 1, percentage: 20 });
  });
});

describe('parseDartCode', () => {
  it('parses double bull (BB)', () => {
    expect(parseDartCode('BB')).toEqual({ number: 50, area: 'doubleBull', isBull: true });
  });
  it('parses single bull (B)', () => {
    expect(parseDartCode('B')).toEqual({ number: 25, area: 'singleBull', isBull: true });
  });
  it('parses out (O)', () => {
    expect(parseDartCode('O')).toEqual({ number: 0, area: 'out', isBull: false });
  });
  it('parses push out (PO)', () => {
    expect(parseDartCode('PO')).toEqual({ number: 0, area: 'out', isBull: false });
  });
  it('parses triple (T20)', () => {
    expect(parseDartCode('T20')).toEqual({ number: 20, area: 'triple', isBull: false });
  });
  it('parses double (D16)', () => {
    expect(parseDartCode('D16')).toEqual({ number: 16, area: 'double', isBull: false });
  });
  it('parses inner single (I20)', () => {
    expect(parseDartCode('I20')).toEqual({ number: 20, area: 'innerSingle', isBull: false });
  });
  it('parses outer single (S5)', () => {
    expect(parseDartCode('S5')).toEqual({ number: 5, area: 'outerSingle', isBull: false });
  });
  it('returns null for invalid code', () => {
    expect(parseDartCode('XYZ')).toBeNull();
  });
  it('trims whitespace', () => {
    expect(parseDartCode(' BB ')).toEqual({ number: 50, area: 'doubleBull', isBull: true });
  });
});

describe('analyzeMissDirection', () => {
  it('returns null for empty logs', () => {
    expect(analyzeMissDirection([])).toBeNull();
  });

  it('returns null when all darts are unparseable', () => {
    expect(analyzeMissDirection(['XYZ,XYZ,XYZ'])).toBeNull();
  });

  it('calculates bull rate correctly', () => {
    // 3 darts: 2 bulls + 1 miss
    const result = analyzeMissDirection(['BB,B,S20']);
    expect(result).not.toBeNull();
    expect(result!.totalDarts).toBe(3);
    expect(result!.bullCount).toBe(2);
    expect(result!.doubleBullCount).toBe(1);
  });

  it('counts out darts', () => {
    const result = analyzeMissDirection(['BB,O,S1']);
    expect(result!.outCount).toBe(1);
  });

  it('excludes outer singles when option is set', () => {
    const result = analyzeMissDirection(['BB,S20,I20'], { excludeOuterSingle: true });
    expect(result!.totalDarts).toBe(2); // S20 excluded
  });

  it('8方向の分布を正しく返す', () => {
    const result = analyzeMissDirection(['S20,S1,S5,S12']);
    expect(result).not.toBeNull();
    expect(result!.directions).toHaveLength(8);
    // 各方向にlabel, count, percentage, numbersがある
    for (const d of result!.directions) {
      expect(d).toHaveProperty('label');
      expect(d).toHaveProperty('count');
      expect(d).toHaveProperty('percentage');
      expect(d).toHaveProperty('numbers');
    }
  });

  it('percentageの合計が100%になる', () => {
    const result = analyzeMissDirection(['S20,S1,S18,S5,S12,S3,S7,S16']);
    expect(result).not.toBeNull();
    const totalPct = result!.directions.reduce((sum, d) => sum + d.percentage, 0);
    expect(totalPct).toBeCloseTo(100, 0);
  });

  it('primaryDirectionが最も多い方向を示す', () => {
    // S20(0°=上), S1(18°=上), S18(36°=右上) → 上方向に偏る
    const result = analyzeMissDirection(['S20,S20,S20,S20,S1,S1,S1,S18']);
    expect(result).not.toBeNull();
    expect(result!.primaryDirection).toBe('上');
  });

  it('directionStrengthが0-1の範囲', () => {
    const result = analyzeMissDirection(['S20,S1,S5,S12']);
    expect(result).not.toBeNull();
    expect(result!.directionStrength).toBeGreaterThanOrEqual(0);
    expect(result!.directionStrength).toBeLessThanOrEqual(1);
  });

  it('均等分布でdirectionStrengthが低い', () => {
    // 全方向に均等 → strengthが低い
    const allNumbers = 'S20,S1,S18,S4,S13,S6,S10,S15,S2,S17,S3,S19,S7,S16,S8,S11,S14,S9,S12,S5';
    const result = analyzeMissDirection([allNumbers]);
    expect(result).not.toBeNull();
    expect(result!.directionStrength).toBeLessThan(0.3);
  });

  it('topMissNumbersが最大5件で降順', () => {
    const result = analyzeMissDirection(['S20,S20,S20,S1,S1,S5,S12,S3,S7']);
    expect(result).not.toBeNull();
    expect(result!.topMissNumbers.length).toBeLessThanOrEqual(5);
    expect(result!.topMissNumbers[0].number).toBe(20); // 最頻出
    expect(result!.topMissNumbers[0].count).toBe(3);
    // 降順確認
    for (let i = 1; i < result!.topMissNumbers.length; i++) {
      expect(result!.topMissNumbers[i].count).toBeLessThanOrEqual(
        result!.topMissNumbers[i - 1].count,
      );
    }
  });

  it('bullRate/doubleBullRateがパーセンテージで計算される', () => {
    // 10 darts: 3 BB + 2 B + 5 miss
    const result = analyzeMissDirection(['BB,BB,BB,B,B,S20,S1,I5,T3,D10']);
    expect(result).not.toBeNull();
    expect(result!.bullRate).toBeCloseTo(50, 0); // 5/10 * 100
    expect(result!.doubleBullRate).toBeCloseTo(30, 0); // 3/10 * 100
  });

  it('missCountがbullとout以外のダーツ数', () => {
    const result = analyzeMissDirection(['BB,B,O,S20,I5,T3']);
    expect(result).not.toBeNull();
    expect(result!.missCount).toBe(3); // S20, I5, T3
  });

  it('複数ログを跨いで正しく集計', () => {
    const result = analyzeMissDirection(['BB,S20,S1', 'BB,S20,S5']);
    expect(result).not.toBeNull();
    expect(result!.totalDarts).toBe(6);
    expect(result!.bullCount).toBe(2);
    expect(result!.missCount).toBe(4);
    const s20 = result!.topMissNumbers.find((n) => n.number === 20);
    expect(s20?.count).toBe(2);
  });

  it('avgVectorがx,yプロパティを持つ', () => {
    const result = analyzeMissDirection(['S20,S1']);
    expect(result).not.toBeNull();
    expect(result!.avgVector).toHaveProperty('x');
    expect(result!.avgVector).toHaveProperty('y');
  });
});

describe('parsePlayTime', () => {
  it('parses space-separated datetime', () => {
    const d = parsePlayTime('2025-01-15 14:30:00');
    expect(d.getFullYear()).toBe(2025);
    expect(d.getMonth()).toBe(0);
    expect(d.getDate()).toBe(15);
  });

  it('parses underscore-separated datetime', () => {
    const d = parsePlayTime('2025-06-20_09:00:00');
    expect(d.getFullYear()).toBe(2025);
    expect(d.getMonth()).toBe(5);
  });
});

describe('simulateBullImprovement', () => {
  it('returns null for empty logs', () => {
    expect(simulateBullImprovement([], 500)).toBeNull();
  });

  it('returns 10 simulation steps', () => {
    const logs = ['BB,B,S20,I5,T20,D10,BB,B,S1,I3,T19,D5,BB,BB,S20,I1,T18,D3,BB,B,S5,I7,T20,D1'];
    const result = simulateBullImprovement(logs, 500);
    expect(result).not.toBeNull();
    expect(result!.steps).toHaveLength(10);
  });

  it('each step has increasing bull rate', () => {
    const logs = ['BB,B,S20,I5,T20,D10,BB,B,S1,I3,T19,D5,BB,BB,S20,I1,T18,D3,BB,B,S5,I7,T20,D1'];
    const result = simulateBullImprovement(logs, 500);
    for (let i = 1; i < result!.steps.length; i++) {
      expect(result!.steps[i].improvedBullRate).toBeGreaterThan(
        result!.steps[i - 1].improvedBullRate,
      );
    }
  });
});

describe('getDayLabel', () => {
  it('returns correct labels for 0-6', () => {
    expect(getDayLabel(0)).toBe('日');
    expect(getDayLabel(1)).toBe('月');
    expect(getDayLabel(6)).toBe('土');
  });

  it('returns empty string for out of range', () => {
    expect(getDayLabel(7)).toBe('');
    expect(getDayLabel(-1)).toBe('');
  });
});

describe('analyzeWeekdayHourly', () => {
  it('returns null for empty plays', () => {
    expect(analyzeWeekdayHourly([])).toBeNull();
  });

  it('returns null when fewer than 3 cells have 2+ games', () => {
    const plays = [
      { time: '2025-01-06 10:00:00', score: 500 },
      { time: '2025-01-06 10:30:00', score: 520 },
      { time: '2025-01-07 14:00:00', score: 480 },
      { time: '2025-01-07 14:30:00', score: 490 },
    ];
    expect(analyzeWeekdayHourly(plays)).toBeNull();
  });

  it('returns result with best/worst cells when enough data', () => {
    const plays = [
      // Mon 10:00 (2 games)
      { time: '2025-01-06 10:00:00', score: 600 },
      { time: '2025-01-06 10:30:00', score: 620 },
      // Tue 14:00 (2 games)
      { time: '2025-01-07 14:00:00', score: 400 },
      { time: '2025-01-07 14:30:00', score: 420 },
      // Wed 18:00 (2 games)
      { time: '2025-01-08 18:00:00', score: 500 },
      { time: '2025-01-08 18:30:00', score: 510 },
    ];
    const result = analyzeWeekdayHourly(plays);
    expect(result).not.toBeNull();
    expect(result!.bestCell!.avgScore).toBeGreaterThan(result!.worstCell!.avgScore);
  });
});
