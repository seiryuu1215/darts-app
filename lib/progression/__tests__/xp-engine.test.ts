import { describe, it, expect } from 'vitest';
import { calculateLevel, checkAchievements, type AchievementSnapshot } from '../xp-engine';
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
  const baseSnapshot: AchievementSnapshot = {
    totalGames: 0,
    currentStreak: 0,
    highestRating: null,
    hatTricksTotal: 0,
    ton80: 0,
    dBullTotal: 0,
    sBullTotal: 0,
    lowTon: 0,
    highTon: 0,
    threeInABed: 0,
    whiteHorse: 0,
    level: 1,
  };

  it('returns empty array when no conditions met', () => {
    const result = checkAchievements(baseSnapshot, []);
    expect(result).toEqual([]);
  });

  it('detects games_100 achievement', () => {
    const result = checkAchievements({ ...baseSnapshot, totalGames: 100 }, []);
    expect(result).toContain('games_100');
    expect(result).toContain('games_50');
  });

  it('does not duplicate existing achievements', () => {
    const result = checkAchievements({ ...baseSnapshot, totalGames: 100 }, ['games_50']);
    expect(result).not.toContain('games_50');
    expect(result).toContain('games_100');
  });

  it('detects streak achievements', () => {
    const result = checkAchievements({ ...baseSnapshot, currentStreak: 30 }, []);
    expect(result).toContain('streak_3');
    expect(result).toContain('streak_7');
    expect(result).toContain('streak_14');
    expect(result).toContain('streak_30');
  });

  it('detects rating achievement based on highestRating', () => {
    const result = checkAchievements({ ...baseSnapshot, highestRating: 8.5 }, []);
    expect(result).toContain('rating_3');
    expect(result).toContain('rating_5');
    expect(result).toContain('rating_8');
    expect(result).not.toContain('rating_9');
  });

  it('detects bulls achievement (D+S combined)', () => {
    const result = checkAchievements({ ...baseSnapshot, dBullTotal: 300, sBullTotal: 250 }, []);
    expect(result).toContain('bulls_100');
    expect(result).toContain('bulls_500');
    expect(result).not.toContain('bulls_1000');
  });

  it('detects hat_trick achievement', () => {
    const result = checkAchievements({ ...baseSnapshot, hatTricksTotal: 50 }, []);
    expect(result).toContain('hat_trick_10');
    expect(result).toContain('hat_trick_50');
    expect(result).not.toContain('hat_trick_100');
  });

  it('detects level achievement', () => {
    const result = checkAchievements({ ...baseSnapshot, level: 10 }, []);
    expect(result).toContain('level_5');
    expect(result).toContain('level_10');
    expect(result).not.toContain('level_15');
  });

  it('detects ton80 achievement', () => {
    const result = checkAchievements({ ...baseSnapshot, ton80: 30 }, []);
    expect(result).toContain('ton80_5');
    expect(result).toContain('ton80_10');
    expect(result).toContain('ton80_30');
    expect(result).not.toContain('ton80_50');
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
