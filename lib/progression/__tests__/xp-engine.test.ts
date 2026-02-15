import { describe, it, expect } from 'vitest';
import { calculateLevel, checkAchievements, type UserStatsSnapshot } from '../xp-engine';
import { RANKS } from '../ranks';

describe('calculateLevel', () => {
  it('returns level 1 for 0 XP', () => {
    const info = calculateLevel(0);
    expect(info.level).toBe(1);
    expect(info.currentXp).toBe(0);
  });

  it('returns correct level for mid-range XP', () => {
    const info = calculateLevel(500);
    expect(info.level).toBeGreaterThan(1);
    expect(info.currentXp).toBe(500);
  });

  it('returns max level for very high XP', () => {
    const maxRank = RANKS[RANKS.length - 1];
    const info = calculateLevel(maxRank.requiredXp + 1000);
    expect(info.level).toBe(maxRank.level);
    expect(info.nextLevelXp).toBeNull();
  });

  it('returns next level XP threshold', () => {
    const info = calculateLevel(0);
    expect(info.nextLevelXp).not.toBeNull();
    expect(info.nextLevelXp!).toBeGreaterThan(0);
  });
});

describe('checkAchievements', () => {
  const baseStats: UserStatsSnapshot = {
    totalGames: 0,
    streak: 0,
    rating: null,
    hatTricks: 0,
    ton80: 0,
    dBullRate: null,
    discussionCount: 0,
    statsCount: 0,
    level: 1,
  };

  it('returns empty array when no conditions met', () => {
    const result = checkAchievements(baseStats, []);
    expect(result).toEqual([]);
  });

  it('detects first_stats achievement', () => {
    const result = checkAchievements({ ...baseStats, statsCount: 1 }, []);
    expect(result).toContain('first_stats');
  });

  it('detects games_100 achievement', () => {
    const result = checkAchievements({ ...baseStats, totalGames: 100 }, []);
    expect(result).toContain('games_100');
  });

  it('does not duplicate existing achievements', () => {
    const result = checkAchievements({ ...baseStats, statsCount: 1 }, ['first_stats']);
    expect(result).not.toContain('first_stats');
  });

  it('detects streak achievements', () => {
    const result = checkAchievements({ ...baseStats, streak: 30 }, []);
    expect(result).toContain('streak_7');
    expect(result).toContain('streak_30');
  });

  it('detects rating achievement', () => {
    const result = checkAchievements({ ...baseStats, rating: 8.5 }, []);
    expect(result).toContain('rating_5');
    expect(result).toContain('rating_8');
  });
});

describe('RANKS', () => {
  it('has 20 ranks', () => {
    expect(RANKS).toHaveLength(20);
  });

  it('ranks are in ascending XP order', () => {
    for (let i = 1; i < RANKS.length; i++) {
      expect(RANKS[i].requiredXp).toBeGreaterThan(RANKS[i - 1].requiredXp);
    }
  });
});
