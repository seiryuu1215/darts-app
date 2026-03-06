import { describe, it, expect } from 'vitest';
import { RATING_BENCHMARKS, getExpectedRange, getRatingFromPpd } from '../dartslive-reference';

describe('dartslive-reference', () => {
  describe('getExpectedRange', () => {
    it('PPD 80 → Rt10 → 62.8mm', () => {
      expect(getExpectedRange(80)).toBe(62.8);
    });

    it('PPD 50 → Rt4 → 76.7mm', () => {
      expect(getExpectedRange(50)).toBe(76.7);
    });

    it('PPD 0 → Rt1 → 111.9mm', () => {
      expect(getExpectedRange(0)).toBe(111.9);
    });

    it('PPD 130 → Rt18 → 59.2mm', () => {
      expect(getExpectedRange(130)).toBe(59.2);
    });
  });

  describe('RATING_BENCHMARKS avgRange', () => {
    it('全ベンチマークに avgRange が定義されている', () => {
      for (const b of RATING_BENCHMARKS) {
        expect(b.avgRange).toBeGreaterThan(0);
      }
    });

    it('18エントリ全てに avgRange がある', () => {
      expect(RATING_BENCHMARKS).toHaveLength(18);
      expect(RATING_BENCHMARKS.every((b) => typeof b.avgRange === 'number')).toBe(true);
    });
  });

  describe('getRatingFromPpd + getExpectedRange 整合性', () => {
    it('各Rtの ppdMin で正しいレンジを返す', () => {
      for (const b of RATING_BENCHMARKS) {
        const rating = getRatingFromPpd(b.ppdMin);
        expect(rating).toBe(b.rating);
        expect(getExpectedRange(b.ppdMin)).toBe(b.avgRange);
      }
    });
  });
});
