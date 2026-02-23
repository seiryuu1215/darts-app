import { RANKS } from './ranks';
import { ACHIEVEMENTS } from './achievements';
import type { AchievementCategory } from './achievements';
import { XP_RULES, getEffectiveXp } from './xp-rules';

export interface LevelInfo {
  level: number;
  rank: string;
  currentXp: number;
  currentLevelXp: number;
  nextLevelXp: number | null;
}

export function calculateLevel(xp: number): LevelInfo {
  let current = RANKS[0];
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (xp >= RANKS[i].requiredXp) {
      current = RANKS[i];
      break;
    }
  }

  const next = RANKS.find((r) => r.level === current.level + 1) ?? null;

  return {
    level: current.level,
    rank: current.name,
    currentXp: xp,
    currentLevelXp: current.requiredXp,
    nextLevelXp: next?.requiredXp ?? null,
  };
}

export function getRankVisual(level: number): { icon: string; color: string } {
  const rank = RANKS.find((r) => r.level === level) ?? RANKS[0];
  return { icon: rank.icon, color: rank.color };
}

export interface AchievementSnapshot {
  highestRating: number | null;
  hatTricksTotal: number;
  ton80: number;
  dBullTotal: number;
  sBullTotal: number;
  lowTon: number;
  highTon: number;
  threeInABed: number;
  whiteHorse: number;
  level: number;
  countupBest: number;
  nineMark: number;
  threeInABlack: number;
}

/**
 * Cron用: 前回/今回のスタッツ差分からXPアクションを算出
 */
export interface CronStatsSnapshot {
  rating: number | null;
  hatTricks: number;
  ton80: number;
  threeInABlack: number;
  nineMark: number;
  lowTon: number;
  highTon: number;
  threeInABed: number;
  whiteHorse: number;
}

export interface CronXpAction {
  action: string;
  xp: number;
  label: string;
  count: number;
}

export function calculateCronXp(
  prev: CronStatsSnapshot | null,
  current: CronStatsSnapshot,
): CronXpAction[] {
  const actions: CronXpAction[] = [];
  const p = prev ?? {
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

  // rating_milestone: Rating整数到達
  if (current.rating != null) {
    const prevFloor = p.rating != null ? Math.floor(p.rating) : 0;
    const curFloor = Math.floor(current.rating);
    if (curFloor > prevFloor) {
      const milestones = curFloor - prevFloor;
      const rule = XP_RULES.rating_milestone;
      actions.push({
        action: 'rating_milestone',
        xp: rule.xp * milestones,
        label: rule.label,
        count: milestones,
      });
    }
  }

  // Award diffs with diminishing returns
  const awardDiffs: {
    key: keyof CronStatsSnapshot;
    ruleId: string;
  }[] = [
    { key: 'hatTricks', ruleId: 'award_hat_trick' },
    { key: 'ton80', ruleId: 'award_ton_80' },
    { key: 'threeInABlack', ruleId: 'award_3_black' },
    { key: 'nineMark', ruleId: 'award_9_mark' },
    { key: 'lowTon', ruleId: 'award_low_ton' },
    { key: 'highTon', ruleId: 'award_high_ton' },
    { key: 'threeInABed', ruleId: 'award_3_bed' },
    { key: 'whiteHorse', ruleId: 'award_white_horse' },
  ];

  for (const { key, ruleId } of awardDiffs) {
    const diff = (current[key] as number) - (p[key] as number);
    if (diff > 0) {
      const rule = XP_RULES[ruleId];
      const cumulativeCount = current[key] as number;
      const effectiveXp = getEffectiveXp(rule, cumulativeCount);
      if (effectiveXp > 0) {
        actions.push({
          action: ruleId,
          xp: effectiveXp * diff,
          label: rule.label,
          count: diff,
        });
      }
    }
  }

  return actions;
}

export function checkAchievements(snapshot: AchievementSnapshot, existingIds: string[]): string[] {
  const newIds: string[] = [];

  for (const achievement of ACHIEVEMENTS) {
    if (existingIds.includes(achievement.id)) continue;

    let value: number | null = null;
    switch (achievement.category as AchievementCategory) {
      case 'rating':
        value = snapshot.highestRating;
        break;
      case 'hat_trick':
        value = snapshot.hatTricksTotal;
        break;
      case 'ton80':
        value = snapshot.ton80;
        break;
      case 'bulls':
        value = snapshot.dBullTotal + snapshot.sBullTotal;
        break;
      case 'low_ton':
        value = snapshot.lowTon;
        break;
      case 'high_ton':
        value = snapshot.highTon;
        break;
      case 'three_bed':
        value = snapshot.threeInABed;
        break;
      case 'white_horse':
        value = snapshot.whiteHorse;
        break;
      case 'level':
        value = snapshot.level;
        break;
      case 'countup':
        value = snapshot.countupBest;
        break;
      case 'nine_mark':
        value = snapshot.nineMark;
        break;
      case 'three_in_a_black':
        value = snapshot.threeInABlack;
        break;
    }

    if (value != null && value >= achievement.threshold) {
      newIds.push(achievement.id);
    }
  }

  return newIds;
}
