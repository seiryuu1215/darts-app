export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: 'first_stats',
    name: '初めてのスタッツ',
    description: '初めてスタッツを記録した',
    icon: '📝',
  },
  { id: 'games_100', name: '100ゲーム達成', description: '累計100ゲームプレイ', icon: '🎯' },
  { id: 'games_500', name: '500ゲーム達成', description: '累計500ゲームプレイ', icon: '🏆' },
  { id: 'streak_7', name: '1週間連続', description: '7日連続プレイ', icon: '🔥' },
  { id: 'streak_30', name: '1ヶ月連続', description: '30日連続プレイ', icon: '💪' },
  { id: 'rating_5', name: 'Rating 5.00', description: 'Rating 5.00に到達', icon: '⭐' },
  { id: 'rating_8', name: 'Rating 8.00', description: 'Rating 8.00に到達', icon: '🌟' },
  { id: 'hat_trick_50', name: 'HAT TRICKマスター', description: 'HAT TRICK累計50回', icon: '🎩' },
  { id: 'ton_80_10', name: 'TON 80マスター', description: 'TON 80累計10回', icon: '💯' },
  { id: 'bull_master', name: 'ブルマスター', description: 'D-BULL率50%以上', icon: '🎯' },
  { id: 'discussion_10', name: '議論好き', description: 'ディスカッション10件投稿', icon: '💬' },
  { id: 'level_10', name: 'レベル10', description: 'レベル10に到達', icon: '🏅' },
];

export const ACHIEVEMENT_MAP = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a])) as Record<
  string,
  AchievementDefinition
>;
