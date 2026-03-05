import { describe, it, expect } from 'vitest';
import {
  classifyFinishRange,
  analyzeDoublePreference,
  computeClutchRatio,
  analyzeDartout,
} from '../dartout-analysis';

const sampleDartout = [
  { score: 50, count: 10 }, // BULL
  { score: 40, count: 8 }, // D20
  { score: 32, count: 6 }, // D16
  { score: 16, count: 5 }, // D8
  { score: 8, count: 3 }, // D4
  { score: 3, count: 2 }, // S3
];

describe('classifyFinishRange', () => {
  it('returns empty for empty list', () => {
    expect(classifyFinishRange([])).toEqual([]);
  });

  it('classifies scores into correct ranges', () => {
    const result = classifyFinishRange(sampleDartout);
    expect(result).toHaveLength(6);
    // 2-10: score 8(3) + 3(2) = 5
    expect(result[0].label).toBe('2-10');
    expect(result[0].count).toBe(5);
    // 51+: score 50 is NOT in 51+, it's in 41-50
    const range51 = result.find((r) => r.label === '51+');
    expect(range51!.count).toBe(0);
  });

  it('calculates percentage correctly', () => {
    const result = classifyFinishRange([{ score: 20, count: 10 }]);
    const range = result.find((r) => r.label === '11-20');
    expect(range!.percentage).toBe(100);
  });
});

describe('analyzeDoublePreference', () => {
  it('returns empty for empty list', () => {
    expect(analyzeDoublePreference([])).toEqual([]);
  });

  it('marks doubles correctly', () => {
    const result = analyzeDoublePreference(sampleDartout);
    const bull = result.find((d) => d.score === 50);
    expect(bull!.isDouble).toBe(true);
    const d20 = result.find((d) => d.score === 40);
    expect(d20!.isDouble).toBe(true);
    const s3 = result.find((d) => d.score === 3);
    expect(s3!.isDouble).toBe(false);
  });

  it('sorts by count descending', () => {
    const result = analyzeDoublePreference(sampleDartout);
    for (let i = 1; i < result.length; i++) {
      expect(result[i].count).toBeLessThanOrEqual(result[i - 1].count);
    }
  });
});

describe('computeClutchRatio', () => {
  it('returns 0 for empty list', () => {
    expect(computeClutchRatio([])).toBe(0);
  });

  it('counts finishes >= 40', () => {
    // 50(10) + 40(8) = 18 clutch out of 34 total
    const ratio = computeClutchRatio(sampleDartout);
    expect(ratio).toBeCloseTo(52.9, 0);
  });
});

describe('analyzeDartout', () => {
  it('returns null for empty list', () => {
    expect(analyzeDartout([])).toBeNull();
  });

  it('returns null for null input', () => {
    expect(analyzeDartout(null as never)).toBeNull();
  });

  it('computes total finishes', () => {
    const result = analyzeDartout(sampleDartout);
    expect(result).not.toBeNull();
    expect(result!.totalFinishes).toBe(34);
  });

  it('calculates average finish score', () => {
    const result = analyzeDartout(sampleDartout);
    // (50*10 + 40*8 + 32*6 + 16*5 + 8*3 + 3*2) / 34
    const expectedAvg = (500 + 320 + 192 + 80 + 24 + 6) / 34;
    expect(result!.avgFinishScore).toBeCloseTo(expectedAvg, 5);
  });

  it('calculates median finish score', () => {
    const result = analyzeDartout(sampleDartout);
    expect(result!.medianFinishScore).toBeGreaterThan(0);
  });

  it('reports bull finish stats', () => {
    const result = analyzeDartout(sampleDartout);
    expect(result!.bullFinishCount).toBe(10);
    expect(result!.bullFinishPercentage).toBeCloseTo(29.4, 0);
  });

  it('computes type breakdown', () => {
    const result = analyzeDartout(sampleDartout);
    expect(result!.typeBreakdown.bullRate).toBeGreaterThan(0);
    expect(result!.typeBreakdown.doubleRate).toBeGreaterThan(0);
  });
});
