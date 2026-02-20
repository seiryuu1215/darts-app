import { describe, it, expect } from 'vitest';
import {
  calculateLevel,
  calculateCronXp,
  checkAchievements,
  type AchievementSnapshot,
  type CronStatsSnapshot,
} from '../xp-engine';
import { RANKS } from '../ranks';
import { getEffectiveXp, XP_RULES } from '../xp-rules';

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

  it('returns level 30 for 500,000+ XP', () => {
    const info = calculateLevel(500000);
    expect(info.level).toBe(30);
    expect(info.rank).toBe('BEYOND GOD');
  });

  it('returns level 25 for 190,000 XP', () => {
    const info = calculateLevel(190000);
    expect(info.level).toBe(25);
    expect(info.rank).toBe('ETHEREAL');
  });
});

describe('checkAchievements', () => {
  const baseSnapshot: AchievementSnapshot = {
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

  it('detects extended bulls achievements', () => {
    const result = checkAchievements(
      { ...baseSnapshot, dBullTotal: 100000, sBullTotal: 100000 },
      [],
    );
    expect(result).toContain('bulls_150000');
    expect(result).toContain('bulls_200000');
    expect(result).not.toContain('bulls_500000');
  });

  it('detects hat_trick achievement', () => {
    const result = checkAchievements({ ...baseSnapshot, hatTricksTotal: 50 }, []);
    expect(result).toContain('hat_trick_10');
    expect(result).toContain('hat_trick_50');
    expect(result).not.toContain('hat_trick_100');
  });

  it('detects level achievement including extended levels', () => {
    const result = checkAchievements({ ...baseSnapshot, level: 25 }, []);
    expect(result).toContain('level_5');
    expect(result).toContain('level_10');
    expect(result).toContain('level_15');
    expect(result).toContain('level_20');
    expect(result).toContain('level_25');
    expect(result).not.toContain('level_30');
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
  it('has 30 ranks', () => {
    expect(RANKS).toHaveLength(30);
  });

  it('ranks are in ascending XP order', () => {
    for (let i = 1; i < RANKS.length; i++) {
      expect(RANKS[i].requiredXp).toBeGreaterThan(RANKS[i - 1].requiredXp);
    }
  });

  it('max rank is BEYOND GOD at 500,000 XP', () => {
    const maxRank = RANKS[RANKS.length - 1];
    expect(maxRank.name).toBe('BEYOND GOD');
    expect(maxRank.requiredXp).toBe(500000);
    expect(maxRank.level).toBe(30);
  });
});

describe('getEffectiveXp', () => {
  it('returns base XP when no diminishing defined', () => {
    const xp = getEffectiveXp(XP_RULES.stats_record, 999);
    expect(xp).toBe(10);
  });

  it('returns base XP below first threshold', () => {
    const xp = getEffectiveXp(XP_RULES.award_hat_trick, 50);
    expect(xp).toBe(5);
  });

  it('returns diminished XP at 100 cumulative count for hat_trick', () => {
    const xp = getEffectiveXp(XP_RULES.award_hat_trick, 100);
    expect(xp).toBe(3); // 5 * 0.5 = 2.5, rounded to 3
  });

  it('returns diminished XP at 500 cumulative count for hat_trick', () => {
    const xp = getEffectiveXp(XP_RULES.award_hat_trick, 500);
    expect(xp).toBe(1); // 5 * 0.2 = 1
  });

  it('returns 0 XP at 2000 cumulative count for hat_trick', () => {
    const xp = getEffectiveXp(XP_RULES.award_hat_trick, 2000);
    expect(xp).toBe(0); // 5 * 0 = 0
  });

  it('returns diminished XP for ton_80', () => {
    expect(getEffectiveXp(XP_RULES.award_ton_80, 100)).toBe(8); // 10 * 0.8
    expect(getEffectiveXp(XP_RULES.award_ton_80, 500)).toBe(5); // 10 * 0.5
    expect(getEffectiveXp(XP_RULES.award_ton_80, 2000)).toBe(2); // 10 * 0.2
  });

  it('returns diminished XP for low_ton', () => {
    expect(getEffectiveXp(XP_RULES.award_low_ton, 50)).toBe(3);
    expect(getEffectiveXp(XP_RULES.award_low_ton, 100)).toBe(2); // 3 * 0.5 = 1.5, rounded to 2
    expect(getEffectiveXp(XP_RULES.award_low_ton, 500)).toBe(0); // 3 * 0 = 0
  });
});

describe('calculateCronXp awards', () => {
  const baseSnapshot: CronStatsSnapshot = {
    rating: null,
    hatTricks: 0,
    ton80: 0,
    threeInABlack: 0,
    nineMark: 0,
    lowTon: 0,
    highTon: 0,
    threeInABed: 0,
    whiteHorse: 0,
  };

  it('applies diminishing returns to awards', () => {
    const prev = { ...baseSnapshot, hatTricks: 499 };
    const curr = { ...baseSnapshot, hatTricks: 501 };
    const actions = calculateCronXp(prev, curr);
    const hatTrickAction = actions.find((a) => a.action === 'award_hat_trick');
    expect(hatTrickAction).toBeDefined();
    // At cumulative 501, multiplier is 0.2 -> 5 * 0.2 = 1 per trick, 2 tricks = 2
    expect(hatTrickAction!.xp).toBe(2);
  });
});
