import { describe, it, expect } from 'vitest';
import { phoenixRatingFromPpd, phoenixRatingFromMpr, convertToPhoenix } from '../phoenix-rating';

describe('phoenixRatingFromPpd', () => {
  it('returns Rt.1 (N) for PPD 0', () => {
    const result = phoenixRatingFromPpd(0);
    expect(result.rating).toBe(1);
    expect(result.class).toBe('N');
  });

  it('returns Rt.2 (C) for PPD at threshold 10.65', () => {
    expect(phoenixRatingFromPpd(10.65).rating).toBe(2);
    expect(phoenixRatingFromPpd(10.65).class).toBe('C');
  });

  it('returns Rt.8 (B) for PPD at threshold 18.15', () => {
    const result = phoenixRatingFromPpd(18.15);
    expect(result.rating).toBe(8);
    expect(result.class).toBe('B');
  });

  it('returns Rt.17 (AA) for PPD at threshold 30.00', () => {
    const result = phoenixRatingFromPpd(30.0);
    expect(result.rating).toBe(17);
    expect(result.class).toBe('AA');
  });

  it('returns Rt.30 for PPD >= 48.00', () => {
    expect(phoenixRatingFromPpd(48.0).rating).toBe(30);
    expect(phoenixRatingFromPpd(50.0).rating).toBe(30);
  });

  it('returns Rt just below next threshold', () => {
    expect(phoenixRatingFromPpd(10.64).rating).toBe(1);
    expect(phoenixRatingFromPpd(11.89).rating).toBe(2);
  });
});

describe('phoenixRatingFromMpr', () => {
  it('returns Rt.1 (N) for MPR 0', () => {
    expect(phoenixRatingFromMpr(0).rating).toBe(1);
  });

  it('returns Rt.10 (BB) for MPR at 2.21', () => {
    const result = phoenixRatingFromMpr(2.21);
    expect(result.rating).toBe(10);
    expect(result.class).toBe('BB');
  });

  it('returns Rt.25 (MASTER) for MPR at 4.70', () => {
    const result = phoenixRatingFromMpr(4.7);
    expect(result.rating).toBe(25);
    expect(result.class).toBe('MASTER');
  });

  it('returns Rt.28 (GRAND MASTER) for MPR at 5.48', () => {
    const result = phoenixRatingFromMpr(5.48);
    expect(result.rating).toBe(28);
    expect(result.class).toBe('GRAND MASTER');
  });
});

describe('convertToPhoenix', () => {
  it('returns combined conversion result', () => {
    const result = convertToPhoenix(25, 2.5);
    expect(result.zeroOne.rating).toBeGreaterThan(0);
    expect(result.cricket.rating).toBeGreaterThan(0);
    expect(result.overall.rating).toBeGreaterThan(0);
    expect(result.ppd100).toBe(25);
    expect(result.mpr100).toBe(2.5);
  });

  it('overall is average of 01 and Cricket ratings', () => {
    const result = convertToPhoenix(20.75, 2.21);
    // Both should be Rt.10
    expect(result.zeroOne.rating).toBe(10);
    expect(result.cricket.rating).toBe(10);
    expect(result.overall.rating).toBe(10);
  });

  it('overall class maps to nearest integer rating', () => {
    const result = convertToPhoenix(0, 0);
    expect(result.overall.class).toBe('N');
  });

  it('clamps overall to 1-30', () => {
    const result = convertToPhoenix(48, 6.0);
    expect(result.overall.rating).toBeLessThanOrEqual(30);
    expect(result.overall.rating).toBeGreaterThanOrEqual(1);
  });
});
