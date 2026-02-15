import { describe, it, expect } from 'vitest';
import {
  GOAL_TYPES,
  getGoalTypeDef,
  getDailyPace,
  getProgressPercent,
} from '../goals';

describe('GOAL_TYPES', () => {
  it('has 6 goal types', () => {
    expect(GOAL_TYPES).toHaveLength(6);
  });

  it('includes bulls, games, rating types', () => {
    const types = GOAL_TYPES.map(g => g.type);
    expect(types).toContain('bulls');
    expect(types).toContain('games');
    expect(types).toContain('rating');
  });

  it('each type has valid periods', () => {
    GOAL_TYPES.forEach(g => {
      expect(g.periods.length).toBeGreaterThan(0);
      g.periods.forEach(p => {
        expect(['monthly', 'yearly']).toContain(p);
      });
    });
  });
});

describe('getGoalTypeDef', () => {
  it('finds existing type', () => {
    const def = getGoalTypeDef('bulls');
    expect(def).toBeDefined();
    expect(def!.label).toBe('ブル数');
  });

  it('returns undefined for invalid type', () => {
    expect(getGoalTypeDef('invalid' as 'bulls')).toBeUndefined();
  });
});

describe('getDailyPace', () => {
  it('calculates correct daily pace', () => {
    expect(getDailyPace(0, 100, 10)).toBe(10);
  });

  it('returns 0 when target met', () => {
    expect(getDailyPace(100, 100, 10)).toBe(0);
  });

  it('returns 0 when no remaining days', () => {
    expect(getDailyPace(50, 100, 0)).toBe(0);
  });

  it('rounds up for daily pace', () => {
    // 7 remaining in 3 days → ceil(7/3) = 3
    expect(getDailyPace(93, 100, 3)).toBe(3);
  });
});

describe('getProgressPercent', () => {
  it('returns 0% at start', () => {
    expect(getProgressPercent(0, 100)).toBe(0);
  });

  it('returns 50% at half', () => {
    expect(getProgressPercent(50, 100)).toBe(50);
  });

  it('caps at 100%', () => {
    expect(getProgressPercent(200, 100)).toBe(100);
  });

  it('handles zero target', () => {
    expect(getProgressPercent(50, 0)).toBe(0);
  });
});
