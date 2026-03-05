import { describe, it, expect } from 'vitest';
import { getDiffColors } from '../comparison';

describe('getDiffColors', () => {
  it('returns inherit for equal values', () => {
    expect(getDiffColors(100, 100)).toEqual({ colorA: 'inherit', colorB: 'inherit' });
  });

  it('returns inherit when valueA is null', () => {
    expect(getDiffColors(null, 100)).toEqual({ colorA: 'inherit', colorB: 'inherit' });
  });

  it('returns inherit when valueB is null', () => {
    expect(getDiffColors(100, null)).toEqual({ colorA: 'inherit', colorB: 'inherit' });
  });

  it('returns inherit when valueA is undefined', () => {
    expect(getDiffColors(undefined, 100)).toEqual({ colorA: 'inherit', colorB: 'inherit' });
  });

  it('highlights A green when A > B', () => {
    const result = getDiffColors(200, 100);
    expect(result.colorA).toBe('#66bb6a');
    expect(result.colorB).toBe('inherit');
  });

  it('highlights B green when B > A', () => {
    const result = getDiffColors(100, 200);
    expect(result.colorA).toBe('inherit');
    expect(result.colorB).toBe('#66bb6a');
  });
});
