import { describe, it, expect } from 'vitest';
import { XP_RULES, getEffectiveXp } from '../xp-rules';

describe('XP_RULES', () => {
  it('has all expected rule keys', () => {
    expect(XP_RULES.stats_record).toBeDefined();
    expect(XP_RULES.rating_milestone).toBeDefined();
    expect(XP_RULES.award_hat_trick).toBeDefined();
    expect(XP_RULES.award_ton_80).toBeDefined();
    expect(XP_RULES.award_bull).toBeDefined();
    expect(XP_RULES.countup_highscore).toBeDefined();
    expect(XP_RULES.goal_achieved).toBeDefined();
  });

  it('each rule has id, xp, and label', () => {
    for (const [key, rule] of Object.entries(XP_RULES)) {
      expect(rule.id).toBe(key);
      expect(rule.xp).toBeGreaterThan(0);
      expect(rule.label.length).toBeGreaterThan(0);
    }
  });
});

describe('getEffectiveXp', () => {
  it('returns base XP for rules without diminishing', () => {
    expect(getEffectiveXp(XP_RULES.stats_record, 0)).toBe(5);
    expect(getEffectiveXp(XP_RULES.stats_record, 9999)).toBe(5);
  });

  it('returns base XP when cumulative count is below first tier', () => {
    expect(getEffectiveXp(XP_RULES.award_hat_trick, 50)).toBe(8);
  });

  it('applies 0.7x multiplier at 100+ count', () => {
    const xp = getEffectiveXp(XP_RULES.award_hat_trick, 100);
    expect(xp).toBe(Math.round(8 * 0.7)); // 6
  });

  it('applies 0.4x multiplier at 500+ count', () => {
    const xp = getEffectiveXp(XP_RULES.award_hat_trick, 500);
    expect(xp).toBe(Math.round(8 * 0.4)); // 3
  });

  it('applies 0.15x multiplier at 2000+ count', () => {
    const xp = getEffectiveXp(XP_RULES.award_hat_trick, 2000);
    expect(xp).toBe(Math.round(8 * 0.15)); // 1
  });

  it('applies 0.02x multiplier at 10000+ count', () => {
    const xp = getEffectiveXp(XP_RULES.award_hat_trick, 10000);
    expect(xp).toBe(Math.round(8 * 0.02)); // 0
  });

  it('uses custom diminishing tiers for bull', () => {
    // Bull: 1xp, tiers at 1000(0.5), 5000(0.2), 20000(0)
    expect(getEffectiveXp(XP_RULES.award_bull, 500)).toBe(1);
    expect(getEffectiveXp(XP_RULES.award_bull, 1000)).toBe(Math.round(1 * 0.5)); // 1
    expect(getEffectiveXp(XP_RULES.award_bull, 5000)).toBe(Math.round(1 * 0.2)); // 0
    expect(getEffectiveXp(XP_RULES.award_bull, 20000)).toBe(0);
  });
});
