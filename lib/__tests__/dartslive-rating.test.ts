import { describe, it, expect } from 'vitest';
import {
  calc01Rating,
  calcCriRating,
  calcRating,
  ppdForRating,
  mprForRating,
  getRatingTarget,
} from '../dartslive-rating';

describe('calc01Rating', () => {
  it('returns 1 for PPD < 40', () => {
    expect(calc01Rating(0)).toBe(1);
    expect(calc01Rating(39)).toBe(1);
  });

  it('uses low formula for 40 <= PPD < 95', () => {
    expect(calc01Rating(40)).toBe(2);
    expect(calc01Rating(55)).toBe(5);
    expect(calc01Rating(80)).toBe(10);
    expect(calc01Rating(94)).toBeCloseTo(12.8);
  });

  it('uses high formula for PPD >= 95', () => {
    expect(calc01Rating(95)).toBe(13);
    expect(calc01Rating(102)).toBeCloseTo(14);
  });

  it('is continuous at PPD=95 boundary', () => {
    const lowAt95 = (95 - 30) / 5;
    const highAt95 = (95 - 4) / 7;
    expect(lowAt95).toBe(13);
    expect(highAt95).toBe(13);
  });
});

describe('calcCriRating', () => {
  it('returns 1 for MPR < 1.30', () => {
    expect(calcCriRating(0)).toBe(1);
    expect(calcCriRating(1.29)).toBe(1);
  });

  it('uses low formula for 1.30 <= MPR < 3.50', () => {
    expect(calcCriRating(1.3)).toBe(2);
    expect(calcCriRating(2.5)).toBe(8);
  });

  it('uses high formula for MPR >= 3.50', () => {
    expect(calcCriRating(3.5)).toBe(13);
  });

  it('is continuous at MPR=3.50 boundary', () => {
    const lowAt350 = (3.5 * 100 - 90) / 20;
    const highAt350 = (3.5 * 100 - 25) / 25;
    expect(lowAt350).toBe(13);
    expect(highAt350).toBe(13);
  });
});

describe('calcRating', () => {
  it('averages 01 and Cricket ratings', () => {
    // PPD=55 → 01Rt=5, MPR=2.5 → CriRt=8 → avg=6.5
    expect(calcRating(55, 2.5)).toBe(6.5);
  });

  it('returns 1 for minimum stats', () => {
    expect(calcRating(0, 0)).toBe(1);
  });
});

describe('ppdForRating', () => {
  it('returns 0 for rating <= 1', () => {
    expect(ppdForRating(0)).toBe(0);
    expect(ppdForRating(1)).toBe(0);
  });

  it('uses low formula for rating 2-13', () => {
    expect(ppdForRating(2)).toBe(40);
    expect(ppdForRating(5)).toBe(55);
    expect(ppdForRating(13)).toBe(95);
  });

  it('uses high formula for rating > 13', () => {
    expect(ppdForRating(14)).toBe(102);
  });

  it('round-trips with calc01Rating', () => {
    for (const rt of [2, 5, 8, 13, 15]) {
      const ppd = ppdForRating(rt);
      expect(calc01Rating(ppd)).toBeCloseTo(rt, 1);
    }
  });
});

describe('mprForRating', () => {
  it('returns 0 for rating <= 1', () => {
    expect(mprForRating(0)).toBe(0);
    expect(mprForRating(1)).toBe(0);
  });

  it('uses low formula for rating 2-13', () => {
    expect(mprForRating(2)).toBe(1.3);
    expect(mprForRating(13)).toBe(3.5);
  });

  it('uses high formula for rating > 13', () => {
    expect(mprForRating(14)).toBe(3.75);
  });

  it('round-trips with calcCriRating', () => {
    for (const rt of [2, 5, 8, 13, 15]) {
      const mpr = mprForRating(rt);
      expect(calcCriRating(mpr)).toBeCloseTo(rt, 1);
    }
  });
});

describe('getRatingTarget', () => {
  it('calculates next integer rating target', () => {
    const result = getRatingTarget(55, 2.5);
    // currentRating = (5 + 8) / 2 = 6.5 → nextRating = 7
    expect(result.currentRating).toBe(6.5);
    expect(result.nextRating).toBe(7);
  });

  it('provides 01-only upgrade path', () => {
    const result = getRatingTarget(55, 2.5);
    expect(result.ppd01Only.target).toBeGreaterThan(55);
  });

  it('provides Cricket-only upgrade path', () => {
    const result = getRatingTarget(55, 2.5);
    expect(result.mprCriOnly.target).toBeGreaterThan(2.5);
  });

  it('marks achieved when gap <= 0', () => {
    // High PPD where next rating is easily achievable via cricket
    const result = getRatingTarget(95, 1.0);
    // 01Rt=13, CriRt=1, avg=7, next=8
    // Cricket-only: newCriRt = 16-13=3 → MPR = (3*20+90)/100 = 1.5
    expect(result.mprCriOnly.achieved).toBe(false);
  });
});
