import { describe, it, expect } from 'vitest';
import {
  GOAL_TYPES,
  getGoalTypeDef,
  getDailyPace,
  getProgressPercent,
  calculateGoalCurrent,
  type StatsRecord,
} from '../goals';

describe('GOAL_TYPES', () => {
  it('has 6 goal types', () => {
    expect(GOAL_TYPES).toHaveLength(6);
  });

  it('includes bulls, games, rating types', () => {
    const types = GOAL_TYPES.map((g) => g.type);
    expect(types).toContain('bulls');
    expect(types).toContain('games');
    expect(types).toContain('rating');
  });

  it('each type has valid periods', () => {
    GOAL_TYPES.forEach((g) => {
      expect(g.periods.length).toBeGreaterThan(0);
      g.periods.forEach((p) => {
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

// Helper to create StatsRecord
function makeRecord(overrides: Partial<StatsRecord> = {}): StatsRecord {
  return {
    date: '2025-01-15T00:00:00.000Z',
    rating: 5.0,
    gamesPlayed: 10,
    dBull: 100,
    sBull: 200,
    hatTricks: 50,
    ...overrides,
  };
}

describe('calculateGoalCurrent', () => {
  describe('returns 0 for empty records', () => {
    it.each(['bulls', 'games', 'rating', 'cu_score', 'play_days', 'hat_tricks'] as const)(
      'type=%s',
      (type) => {
        expect(calculateGoalCurrent(type, [])).toBe(0);
      },
    );
  });

  describe('bulls', () => {
    it('calculates bull difference from first to last record', () => {
      const records = [
        makeRecord({ date: '2025-01-01T00:00:00Z', dBull: 100, sBull: 200 }),
        makeRecord({ date: '2025-01-15T00:00:00Z', dBull: 150, sBull: 250 }),
        makeRecord({ date: '2025-01-31T00:00:00Z', dBull: 200, sBull: 350 }),
      ];
      // (200+350) - (100+200) = 250
      expect(calculateGoalCurrent('bulls', records)).toBe(250);
    });

    it('uses baseline record when provided', () => {
      const baseline = makeRecord({ dBull: 80, sBull: 180 });
      const records = [
        makeRecord({ date: '2025-01-05T00:00:00Z', dBull: 100, sBull: 200 }),
        makeRecord({ date: '2025-01-31T00:00:00Z', dBull: 200, sBull: 350 }),
      ];
      // (200+350) - (80+180) = 290
      expect(calculateGoalCurrent('bulls', records, baseline)).toBe(290);
    });

    it('returns 0 when bulls did not increase', () => {
      const records = [
        makeRecord({ dBull: 100, sBull: 200 }),
        makeRecord({ dBull: 100, sBull: 200 }),
      ];
      expect(calculateGoalCurrent('bulls', records)).toBe(0);
    });

    it('handles null dBull/sBull as 0', () => {
      const records = [
        makeRecord({ dBull: null, sBull: null }),
        makeRecord({ dBull: 50, sBull: 100 }),
      ];
      expect(calculateGoalCurrent('bulls', records)).toBe(150);
    });
  });

  describe('games', () => {
    it('sums gamesPlayed across all records', () => {
      const records = [
        makeRecord({ gamesPlayed: 5 }),
        makeRecord({ gamesPlayed: 10 }),
        makeRecord({ gamesPlayed: 3 }),
      ];
      expect(calculateGoalCurrent('games', records)).toBe(18);
    });

    it('handles zero games', () => {
      const records = [makeRecord({ gamesPlayed: 0 })];
      expect(calculateGoalCurrent('games', records)).toBe(0);
    });
  });

  describe('rating', () => {
    it('returns the last record rating', () => {
      const records = [
        makeRecord({ rating: 5.0 }),
        makeRecord({ rating: 6.5 }),
        makeRecord({ rating: 8.2 }),
      ];
      expect(calculateGoalCurrent('rating', records)).toBe(8.2);
    });

    it('returns 0 when rating is null', () => {
      const records = [makeRecord({ rating: null })];
      expect(calculateGoalCurrent('rating', records)).toBe(0);
    });
  });

  describe('cu_score', () => {
    it('always returns 0 (not tracked in dartsLiveStats)', () => {
      const records = [makeRecord(), makeRecord()];
      expect(calculateGoalCurrent('cu_score', records)).toBe(0);
    });
  });

  describe('play_days', () => {
    it('counts unique dates', () => {
      const records = [
        makeRecord({ date: '2025-01-01T10:00:00Z' }),
        makeRecord({ date: '2025-01-01T18:00:00Z' }), // same day
        makeRecord({ date: '2025-01-05T12:00:00Z' }),
        makeRecord({ date: '2025-01-10T09:00:00Z' }),
      ];
      expect(calculateGoalCurrent('play_days', records)).toBe(3);
    });

    it('returns 1 for single record', () => {
      const records = [makeRecord({ date: '2025-01-15T00:00:00Z' })];
      expect(calculateGoalCurrent('play_days', records)).toBe(1);
    });
  });

  describe('hat_tricks', () => {
    it('calculates hat trick difference from first to last', () => {
      const records = [
        makeRecord({ hatTricks: 10 }),
        makeRecord({ hatTricks: 25 }),
        makeRecord({ hatTricks: 40 }),
      ];
      expect(calculateGoalCurrent('hat_tricks', records)).toBe(30);
    });

    it('uses baseline record when provided', () => {
      const baseline = makeRecord({ hatTricks: 5 });
      const records = [makeRecord({ hatTricks: 10 }), makeRecord({ hatTricks: 30 })];
      expect(calculateGoalCurrent('hat_tricks', records, baseline)).toBe(25);
    });

    it('handles null hatTricks as 0', () => {
      const records = [makeRecord({ hatTricks: null }), makeRecord({ hatTricks: 15 })];
      expect(calculateGoalCurrent('hat_tricks', records)).toBe(15);
    });

    it('returns 0 when hat tricks did not increase', () => {
      const records = [makeRecord({ hatTricks: 20 }), makeRecord({ hatTricks: 20 })];
      expect(calculateGoalCurrent('hat_tricks', records)).toBe(0);
    });
  });
});
