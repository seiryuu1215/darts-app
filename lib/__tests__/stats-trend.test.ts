import { describe, it, expect } from 'vitest';
import { computeSMA, detectCrosses, classifyTrend, type SmaDataPoint } from '../stats-trend';

function makeData(values: (number | null)[]): { date: string; value: number | null }[] {
  return values.map((v, i) => ({ date: `2025-01-${String(i + 1).padStart(2, '0')}`, value: v }));
}

describe('computeSMA', () => {
  it('returns null SMAs for insufficient data', () => {
    const data = makeData([100, 200]);
    const result = computeSMA(data);
    expect(result[0].sma7).toBeNull();
    expect(result[0].sma14).toBeNull();
    expect(result[0].sma30).toBeNull();
  });

  it('calculates SMA7 starting from index 6', () => {
    const values = [100, 200, 300, 400, 500, 600, 700];
    const result = computeSMA(makeData(values));
    expect(result[6].sma7).toBe(400); // avg of 100-700
    expect(result[5].sma7).toBeNull();
  });

  it('calculates SMA14 starting from index 13', () => {
    const values = Array.from({ length: 14 }, (_, i) => (i + 1) * 10);
    const result = computeSMA(makeData(values));
    expect(result[13].sma14).not.toBeNull();
    expect(result[12].sma14).toBeNull();
  });

  it('handles null values by counting only non-null', () => {
    const values: (number | null)[] = [100, null, 100, null, 100, null, 100];
    const result = computeSMA(makeData(values));
    expect(result[6].sma7).toBe(100); // only 4 non-null values, all 100
  });

  it('preserves original values', () => {
    const data = makeData([42, 84]);
    const result = computeSMA(data);
    expect(result[0].value).toBe(42);
    expect(result[1].value).toBe(84);
  });
});

describe('detectCrosses', () => {
  it('detects golden cross (short crosses above long)', () => {
    const data: SmaDataPoint[] = [
      { date: '2025-01-01', value: 100, sma7: 90, sma14: null, sma30: 100 },
      { date: '2025-01-02', value: 110, sma7: 110, sma14: null, sma30: 100 },
    ];
    const crosses = detectCrosses(data);
    expect(crosses).toHaveLength(1);
    expect(crosses[0].type).toBe('golden');
  });

  it('detects dead cross (short crosses below long)', () => {
    const data: SmaDataPoint[] = [
      { date: '2025-01-01', value: 100, sma7: 110, sma14: null, sma30: 100 },
      { date: '2025-01-02', value: 90, sma7: 90, sma14: null, sma30: 100 },
    ];
    const crosses = detectCrosses(data);
    expect(crosses).toHaveLength(1);
    expect(crosses[0].type).toBe('dead');
  });

  it('returns empty when no crosses occur', () => {
    const data: SmaDataPoint[] = [
      { date: '2025-01-01', value: 100, sma7: 110, sma14: null, sma30: 100 },
      { date: '2025-01-02', value: 110, sma7: 120, sma14: null, sma30: 100 },
    ];
    expect(detectCrosses(data)).toHaveLength(0);
  });

  it('skips entries with null SMAs', () => {
    const data: SmaDataPoint[] = [
      { date: '2025-01-01', value: 100, sma7: null, sma14: null, sma30: null },
      { date: '2025-01-02', value: 110, sma7: 110, sma14: null, sma30: null },
    ];
    expect(detectCrosses(data)).toHaveLength(0);
  });
});

describe('classifyTrend', () => {
  it('returns flat for insufficient data', () => {
    const data: SmaDataPoint[] = [
      { date: '2025-01-01', value: 100, sma7: 100, sma14: null, sma30: null },
    ];
    expect(classifyTrend(data).direction).toBe('flat');
    expect(classifyTrend(data).label).toBe('データ不足');
  });

  it('detects upward trend', () => {
    const data: SmaDataPoint[] = Array.from({ length: 10 }, (_, i) => ({
      date: `2025-01-${String(i + 1).padStart(2, '0')}`,
      value: 100 + i * 20,
      sma7: 100 + i * 20,
      sma14: null,
      sma30: null,
    }));
    const result = classifyTrend(data);
    expect(result.direction).toBe('up');
    expect(result.label).toBe('上昇トレンド');
  });

  it('detects downward trend', () => {
    const data: SmaDataPoint[] = Array.from({ length: 10 }, (_, i) => ({
      date: `2025-01-${String(i + 1).padStart(2, '0')}`,
      value: 200 - i * 20,
      sma7: 200 - i * 20,
      sma14: null,
      sma30: null,
    }));
    const result = classifyTrend(data);
    expect(result.direction).toBe('down');
    expect(result.label).toBe('下降トレンド');
  });

  it('detects flat when values are constant', () => {
    const data: SmaDataPoint[] = Array.from({ length: 10 }, (_, i) => ({
      date: `2025-01-${String(i + 1).padStart(2, '0')}`,
      value: 100,
      sma7: 100,
      sma14: null,
      sma30: null,
    }));
    expect(classifyTrend(data).direction).toBe('flat');
  });
});
