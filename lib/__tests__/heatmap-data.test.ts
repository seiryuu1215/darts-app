import { describe, it, expect } from 'vitest';
import { computeSegmentFrequency, getSegmentLabel, getHeatIntensity } from '../heatmap-data';

describe('computeSegmentFrequency', () => {
  it('counts segments correctly in all mode', () => {
    const result = computeSegmentFrequency(['BB,B,T20,D16,S5,I3,O']);
    expect(result.totalDarts).toBe(7);
    expect(result.bullCount).toBe(2);
    expect(result.doubleBullCount).toBe(1);
    expect(result.outCount).toBe(1);
    expect(result.segments.get('BB')).toBe(1);
    expect(result.segments.get('B')).toBe(1);
    expect(result.segments.get('T20')).toBe(1);
    expect(result.segments.get('D16')).toBe(1);
    expect(result.segments.get('S5')).toBe(1);
    expect(result.segments.get('I3')).toBe(1);
    expect(result.segments.get('OUT')).toBe(1);
  });

  it('excludes bull and out in miss mode', () => {
    const result = computeSegmentFrequency(['BB,B,S20,O'], 'miss');
    expect(result.segments.has('BB')).toBe(false);
    expect(result.segments.has('B')).toBe(false);
    expect(result.segments.has('OUT')).toBe(false);
    expect(result.segments.get('S20')).toBe(1);
  });

  it('handles multiple logs', () => {
    const result = computeSegmentFrequency(['T20,T20,T20', 'T20,S1,S1']);
    expect(result.segments.get('T20')).toBe(4);
    expect(result.segments.get('S1')).toBe(2);
    expect(result.totalDarts).toBe(6);
  });

  it('handles empty logs', () => {
    const result = computeSegmentFrequency([]);
    expect(result.totalDarts).toBe(0);
    expect(result.segments.size).toBe(0);
  });

  it('computes maxCount correctly', () => {
    const result = computeSegmentFrequency(['T20,T20,T20,S1']);
    expect(result.maxCount).toBe(3); // T20 appears 3 times
  });
});

describe('getSegmentLabel', () => {
  it('returns D-BULL for BB', () => {
    expect(getSegmentLabel('BB')).toBe('D-BULL');
  });
  it('returns S-BULL for B', () => {
    expect(getSegmentLabel('B')).toBe('S-BULL');
  });
  it('returns OUT for OUT', () => {
    expect(getSegmentLabel('OUT')).toBe('OUT');
  });
  it('passes through other IDs', () => {
    expect(getSegmentLabel('T20')).toBe('T20');
    expect(getSegmentLabel('D16')).toBe('D16');
  });
});

describe('getHeatIntensity', () => {
  it('returns 0 for maxCount 0', () => {
    expect(getHeatIntensity(5, 0)).toBe(0);
  });
  it('returns 1 for count equal to maxCount', () => {
    expect(getHeatIntensity(10, 10)).toBe(1);
  });
  it('returns 0.5 for half of max', () => {
    expect(getHeatIntensity(5, 10)).toBe(0.5);
  });
});
