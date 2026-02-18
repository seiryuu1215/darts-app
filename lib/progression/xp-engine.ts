import { RANKS } from './ranks';

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

export interface UserStatsSnapshot {
  totalGames: number;
  streak: number;
  rating: number | null;
  hatTricks: number;
  ton80: number;
  dBullRate: number | null;
  discussionCount: number;
  statsCount: number;
  level: number;
}

/**
 * Cron用: 前回/今回のスタッツ差分からXPアクションを算出
 */
export interface CronStatsSnapshot {
  totalGames: number;
  streak: number;
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
    totalGames: 0,
    streak: 0,
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

  // games_10: 10ゲーム単位の差分
  const gamesDiff = Math.floor(current.totalGames / 10) - Math.floor(p.totalGames / 10);
  if (gamesDiff > 0) {
    actions.push({
      action: 'games_10',
      xp: 20 * gamesDiff,
      label: '累計ゲーム数10の倍数',
      count: gamesDiff,
    });
  }

  // rating_milestone: Rating整数到達
  if (current.rating != null) {
    const prevFloor = p.rating != null ? Math.floor(p.rating) : 0;
    const curFloor = Math.floor(current.rating);
    if (curFloor > prevFloor) {
      const milestones = curFloor - prevFloor;
      actions.push({
        action: 'rating_milestone',
        xp: 30 * milestones,
        label: 'Rating整数到達',
        count: milestones,
      });
    }
  }

  // Award diffs
  const awardDiffs: { key: keyof CronStatsSnapshot; action: string; xp: number; label: string }[] =
    [
      { key: 'hatTricks', action: 'award_hat_trick', xp: 5, label: 'HAT TRICK' },
      { key: 'ton80', action: 'award_ton_80', xp: 10, label: 'TON 80' },
      { key: 'threeInABlack', action: 'award_3_black', xp: 15, label: '3 IN A BLACK' },
      { key: 'nineMark', action: 'award_9_mark', xp: 10, label: '9マーク' },
      { key: 'lowTon', action: 'award_low_ton', xp: 3, label: 'LOW TON' },
      { key: 'highTon', action: 'award_high_ton', xp: 5, label: 'HIGH TON' },
      { key: 'threeInABed', action: 'award_3_bed', xp: 10, label: '3 IN A BED' },
      { key: 'whiteHorse', action: 'award_white_horse', xp: 15, label: 'WHITE HORSE' },
    ];

  for (const { key, action, xp, label } of awardDiffs) {
    const diff = (current[key] as number) - (p[key] as number);
    if (diff > 0) {
      actions.push({ action, xp: xp * diff, label, count: diff });
    }
  }

  // Streak rewards
  if (current.streak >= 30 && p.streak < 30) {
    actions.push({ action: 'play_streak_30', xp: 200, label: '30日連続プレイ', count: 1 });
  } else if (current.streak >= 7 && p.streak < 7) {
    actions.push({ action: 'play_streak_7', xp: 50, label: '7日連続プレイ', count: 1 });
  } else if (current.streak >= 3 && p.streak < 3) {
    actions.push({ action: 'play_streak_3', xp: 15, label: '3日連続プレイ', count: 1 });
  }

  return actions;
}

export function checkAchievements(stats: UserStatsSnapshot, existing: string[]): string[] {
  const newAchievements: string[] = [];
  const has = (id: string) => existing.includes(id);

  if (!has('first_stats') && stats.statsCount >= 1) newAchievements.push('first_stats');
  if (!has('games_100') && stats.totalGames >= 100) newAchievements.push('games_100');
  if (!has('games_500') && stats.totalGames >= 500) newAchievements.push('games_500');
  if (!has('streak_7') && stats.streak >= 7) newAchievements.push('streak_7');
  if (!has('streak_30') && stats.streak >= 30) newAchievements.push('streak_30');
  if (!has('rating_5') && stats.rating != null && stats.rating >= 5)
    newAchievements.push('rating_5');
  if (!has('rating_8') && stats.rating != null && stats.rating >= 8)
    newAchievements.push('rating_8');
  if (!has('hat_trick_50') && stats.hatTricks >= 50) newAchievements.push('hat_trick_50');
  if (!has('ton_80_10') && stats.ton80 >= 10) newAchievements.push('ton_80_10');
  if (!has('bull_master') && stats.dBullRate != null && stats.dBullRate >= 50)
    newAchievements.push('bull_master');
  if (!has('discussion_10') && stats.discussionCount >= 10) newAchievements.push('discussion_10');
  if (!has('level_10') && stats.level >= 10) newAchievements.push('level_10');

  return newAchievements;
}
