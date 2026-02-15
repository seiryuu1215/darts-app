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
