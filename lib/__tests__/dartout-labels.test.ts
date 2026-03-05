import { describe, it, expect } from 'vitest';
import { getDartoutLabel } from '../dartout-labels';

describe('getDartoutLabel', () => {
  it('returns BULL for score 50', () => {
    expect(getDartoutLabel(50)).toBe('BULL');
  });

  it('returns S-BULL for score 25', () => {
    expect(getDartoutLabel(25)).toBe('S-BULL');
  });

  it('returns double labels for even scores 2-40', () => {
    expect(getDartoutLabel(2)).toBe('D1');
    expect(getDartoutLabel(20)).toBe('D10');
    expect(getDartoutLabel(40)).toBe('D20');
  });

  it('returns single labels for odd scores 1-20', () => {
    expect(getDartoutLabel(1)).toBe('S1');
    expect(getDartoutLabel(3)).toBe('S3');
    expect(getDartoutLabel(19)).toBe('S19');
  });

  it('returns triple labels for valid triples (51-60, divisible by 3)', () => {
    expect(getDartoutLabel(51)).toBe('T17');
    expect(getDartoutLabel(54)).toBe('T18');
    expect(getDartoutLabel(57)).toBe('T19');
    expect(getDartoutLabel(60)).toBe('T20'); // 60 % 3 === 0, triple takes priority
  });

  it('returns double labels for even scores 42-58', () => {
    expect(getDartoutLabel(42)).toBe('D21');
    expect(getDartoutLabel(44)).toBe('D22');
  });

  it('returns raw score for high odd non-triple scores', () => {
    expect(getDartoutLabel(41)).toBe('41');
    expect(getDartoutLabel(43)).toBe('43');
  });

  it('returns raw score for scores above 60', () => {
    expect(getDartoutLabel(70)).toBe('70');
    expect(getDartoutLabel(100)).toBe('100');
  });
});
