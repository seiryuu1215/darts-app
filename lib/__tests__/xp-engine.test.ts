import { describe, it, expect } from 'vitest';
import {
  calculateLevel,
  getRankVisual,
  calculateCronXp,
  type CronStatsSnapshot,
} from '../progression/xp-engine';

describe('calculateLevel', () => {
  it('returns Rookie for 0 XP', () => {
    const result = calculateLevel(0);
    expect(result.level).toBe(1);
    expect(result.rank).toBe('Rookie');
  });

  it('returns correct level for mid-range XP', () => {
    const result = calculateLevel(1500);
    expect(result.level).toBe(7);
    expect(result.rank).toBe('B Player');
  });

  it('returns THE GOD for max XP', () => {
    const result = calculateLevel(65000);
    expect(result.level).toBe(20);
    expect(result.rank).toBe('THE GOD');
    expect(result.nextLevelXp).toBeNull();
  });
});

describe('getRankVisual', () => {
  it('returns icon and color for level 1', () => {
    const visual = getRankVisual(1);
    expect(visual.icon).toBe('🎯');
    expect(visual.color).toBe('#9E9E9E');
  });

  it('returns icon and color for level 20', () => {
    const visual = getRankVisual(20);
    expect(visual.icon).toBe('🏆');
    expect(visual.color).toBe('#FFD700');
  });
});

describe('calculateCronXp', () => {
  const basePrev: CronStatsSnapshot = {
    totalGames: 95,
    streak: 2,
    rating: 4.5,
    hatTricks: 10,
    ton80: 3,
    threeInABlack: 1,
    nineMark: 0,
    lowTon: 20,
    highTon: 5,
    threeInABed: 0,
    whiteHorse: 0,
  };

  it('returns empty array when no changes', () => {
    const result = calculateCronXp(basePrev, { ...basePrev });
    expect(result).toEqual([]);
  });

  it('detects games_10 milestone', () => {
    const current = { ...basePrev, totalGames: 105 };
    const result = calculateCronXp(basePrev, current);
    const games = result.find((r) => r.action === 'games_10');
    expect(games).toBeDefined();
    expect(games!.xp).toBe(20);
    expect(games!.count).toBe(1);
  });

  it('detects multiple games_10 milestones', () => {
    const current = { ...basePrev, totalGames: 125 };
    const result = calculateCronXp(basePrev, current);
    const games = result.find((r) => r.action === 'games_10');
    expect(games!.count).toBe(3);
    expect(games!.xp).toBe(60);
  });

  it('detects rating milestone', () => {
    const current = { ...basePrev, rating: 5.2 };
    const result = calculateCronXp(basePrev, current);
    const rating = result.find((r) => r.action === 'rating_milestone');
    expect(rating).toBeDefined();
    expect(rating!.xp).toBe(30);
  });

  it('detects hat trick award diff', () => {
    const current = { ...basePrev, hatTricks: 15 };
    const result = calculateCronXp(basePrev, current);
    const ht = result.find((r) => r.action === 'award_hat_trick');
    expect(ht).toBeDefined();
    expect(ht!.count).toBe(5);
    expect(ht!.xp).toBe(25);
  });

  it('detects 9mark award', () => {
    const current = { ...basePrev, nineMark: 3 };
    const result = calculateCronXp(basePrev, current);
    const nm = result.find((r) => r.action === 'award_9_mark');
    expect(nm).toBeDefined();
    expect(nm!.count).toBe(3);
    expect(nm!.xp).toBe(30);
  });

  it('detects streak 3', () => {
    const current = { ...basePrev, streak: 3 };
    const result = calculateCronXp(basePrev, current);
    const streak = result.find((r) => r.action === 'play_streak_3');
    expect(streak).toBeDefined();
    expect(streak!.xp).toBe(15);
  });

  it('detects streak 7 (skips streak 3)', () => {
    const current = { ...basePrev, streak: 7 };
    const result = calculateCronXp(basePrev, current);
    expect(result.find((r) => r.action === 'play_streak_7')).toBeDefined();
    expect(result.find((r) => r.action === 'play_streak_3')).toBeUndefined();
  });

  it('handles null prev (first run)', () => {
    const current: CronStatsSnapshot = {
      totalGames: 25,
      streak: 5,
      rating: 3.5,
      hatTricks: 5,
      ton80: 1,
      threeInABlack: 0,
      nineMark: 0,
      lowTon: 10,
      highTon: 2,
      threeInABed: 0,
      whiteHorse: 0,
    };
    const result = calculateCronXp(null, current);
    expect(result.find((r) => r.action === 'games_10')).toBeDefined();
    expect(result.find((r) => r.action === 'award_hat_trick')).toBeDefined();
    expect(result.find((r) => r.action === 'play_streak_3')).toBeDefined();
  });
});
