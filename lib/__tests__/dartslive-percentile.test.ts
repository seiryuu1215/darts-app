import { describe, it, expect } from 'vitest';
import { getPercentile, getPercentileColor, getPercentileLabel } from '@/lib/dartslive-percentile';

describe('getPercentile', () => {
  describe('rating', () => {
    it('returns high percentile for low rating', () => {
      const p = getPercentile('rating', 1);
      expect(p).toBeGreaterThan(90);
    });
    it('returns low percentile for high rating', () => {
      const p = getPercentile('rating', 18);
      expect(p).toBeLessThan(1);
    });
    it('returns moderate percentile for mid rating', () => {
      const p = getPercentile('rating', 6);
      expect(p).toBeGreaterThan(10);
      expect(p).toBeLessThan(50);
    });
    it('returns 99 for rating below minimum', () => {
      expect(getPercentile('rating', 0)).toBe(99);
    });
  });

  describe('ppd', () => {
    it('returns high percentile for low PPD', () => {
      const p = getPercentile('ppd', 15);
      expect(p).toBeGreaterThanOrEqual(90);
    });
    it('returns low percentile for high PPD', () => {
      const p = getPercentile('ppd', 110);
      expect(p).toBeLessThanOrEqual(1);
    });
    it('interpolates between thresholds', () => {
      const p = getPercentile('ppd', 50);
      // PPD 50 = Rt.4境界 = 上位66.93%（公式データ準拠）
      expect(p).toBeGreaterThan(50);
      expect(p).toBeLessThan(90);
    });
  });

  describe('mpr', () => {
    it('returns high percentile for low MPR', () => {
      const p = getPercentile('mpr', 0.5);
      expect(p).toBeGreaterThanOrEqual(90);
    });
    it('returns low percentile for high MPR', () => {
      const p = getPercentile('mpr', 5.0);
      expect(p).toBeLessThanOrEqual(1);
    });
  });

  describe('countup', () => {
    it('returns high percentile for low score', () => {
      const p = getPercentile('countup', 200);
      expect(p).toBeGreaterThanOrEqual(85);
    });
    it('returns low percentile for high score', () => {
      const p = getPercentile('countup', 900);
      expect(p).toBeLessThanOrEqual(1);
    });
  });

  describe('bull', () => {
    it('returns high percentile for low bull count', () => {
      const p = getPercentile('bull', 50);
      expect(p).toBeGreaterThanOrEqual(80);
    });
    it('returns low percentile for high bull count', () => {
      const p = getPercentile('bull', 20000);
      expect(p).toBeLessThanOrEqual(1);
    });
    it('interpolates between thresholds', () => {
      const p = getPercentile('bull', 1500);
      expect(p).toBeGreaterThan(15);
      expect(p).toBeLessThan(25);
    });
  });

  it('always returns at least 0.1', () => {
    expect(getPercentile('ppd', 999)).toBeGreaterThanOrEqual(0.1);
    expect(getPercentile('mpr', 999)).toBeGreaterThanOrEqual(0.1);
    expect(getPercentile('countup', 9999)).toBeGreaterThanOrEqual(0.1);
    expect(getPercentile('bull', 999999)).toBeGreaterThanOrEqual(0.1);
  });
});

describe('getPercentileColor', () => {
  it('returns red for top 5%', () => {
    expect(getPercentileColor(1)).toBe('#E53935');
    expect(getPercentileColor(5)).toBe('#E53935');
  });
  it('returns orange for top 6-15%', () => {
    expect(getPercentileColor(10)).toBe('#FF9800');
    expect(getPercentileColor(15)).toBe('#FF9800');
  });
  it('returns yellow for top 16-30%', () => {
    expect(getPercentileColor(20)).toBe('#FDD835');
    expect(getPercentileColor(30)).toBe('#FDD835');
  });
  it('returns green for top 31-50%', () => {
    expect(getPercentileColor(40)).toBe('#4CAF50');
    expect(getPercentileColor(50)).toBe('#4CAF50');
  });
  it('returns blue for average', () => {
    expect(getPercentileColor(60)).toBe('#1E88E5');
    expect(getPercentileColor(90)).toBe('#1E88E5');
  });
});

describe('getPercentileLabel', () => {
  it('returns トップ級 for top 1%', () => {
    expect(getPercentileLabel(0.5)).toBe('トップ級');
    expect(getPercentileLabel(1)).toBe('トップ級');
  });
  it('returns 上級者 for top 2-5%', () => {
    expect(getPercentileLabel(3)).toBe('上級者');
    expect(getPercentileLabel(5)).toBe('上級者');
  });
  it('returns 中上級 for top 6-15%', () => {
    expect(getPercentileLabel(10)).toBe('中上級');
  });
  it('returns 中級者 for top 16-30%', () => {
    expect(getPercentileLabel(20)).toBe('中級者');
  });
  it('returns 平均以上 for top 31-50%', () => {
    expect(getPercentileLabel(40)).toBe('平均以上');
  });
  it('returns アベレージ for 50%+', () => {
    expect(getPercentileLabel(60)).toBe('アベレージ');
    expect(getPercentileLabel(90)).toBe('アベレージ');
  });
});
