export type AchievementCategory =
  | 'games'
  | 'streak'
  | 'rating'
  | 'hat_trick'
  | 'ton80'
  | 'bulls'
  | 'low_ton'
  | 'high_ton'
  | 'three_bed'
  | 'white_horse'
  | 'level';

export interface AchievementDefinition {
  id: string;
  category: AchievementCategory;
  name: string;
  description: string;
  icon: string;
  threshold: number;
}

export const CATEGORY_META: Record<AchievementCategory, { label: string; icon: string }> = {
  games: { label: 'ゲーム数', icon: '🎯' },
  streak: { label: '連続プレイ', icon: '🔥' },
  rating: { label: 'Rating', icon: '⭐' },
  hat_trick: { label: 'HAT TRICK', icon: '🎩' },
  ton80: { label: 'TON 80', icon: '💯' },
  bulls: { label: 'ブル (D+S)', icon: '🎯' },
  low_ton: { label: 'LOW TON', icon: '📊' },
  high_ton: { label: 'HIGH TON', icon: '📈' },
  three_bed: { label: '3 IN A BED', icon: '🛏️' },
  white_horse: { label: 'WHITE HORSE', icon: '🐴' },
  level: { label: 'レベル', icon: '🏅' },
};

function generateAchievements(
  category: AchievementCategory,
  thresholds: number[],
  idPrefix: string,
  nameTemplate: (n: number) => string,
  descTemplate: (n: number) => string,
  icon: string,
): AchievementDefinition[] {
  return thresholds.map((t) => ({
    id: `${idPrefix}_${t}`,
    category,
    name: nameTemplate(t),
    description: descTemplate(t),
    icon,
    threshold: t,
  }));
}

export const ACHIEVEMENTS: AchievementDefinition[] = [
  // ゲーム数
  ...generateAchievements(
    'games',
    [50, 100, 300, 500, 1000, 3000, 5000, 10000],
    'games',
    (n) => `${n}ゲーム達成`,
    (n) => `累計${n}ゲームプレイ`,
    '🎯',
  ),
  // 連続プレイ
  ...generateAchievements(
    'streak',
    [3, 7, 14, 30, 60, 100],
    'streak',
    (n) => `${n}日連続プレイ`,
    (n) => `${n}日連続プレイ達成`,
    '🔥',
  ),
  // Rating (3〜18, 1刻み)
  ...generateAchievements(
    'rating',
    Array.from({ length: 16 }, (_, i) => i + 3),
    'rating',
    (n) => `Rt.${n} 到達`,
    (n) => `最高Rating ${n} に到達`,
    '⭐',
  ),
  // HAT TRICK
  ...generateAchievements(
    'hat_trick',
    [10, 50, 100, 300, 500, 1000, 3000, 5000],
    'hat_trick',
    (n) => `HAT TRICK ${n}回`,
    (n) => `HAT TRICK累計${n}回達成`,
    '🎩',
  ),
  // TON 80
  ...generateAchievements(
    'ton80',
    [5, 10, 30, 50, 100, 300, 500],
    'ton80',
    (n) => `TON 80 ${n}回`,
    (n) => `TON 80累計${n}回達成`,
    '💯',
  ),
  // ブル (D+S)
  ...generateAchievements(
    'bulls',
    [100, 500, 1000, 2000, 3000, 5000, 10000, 20000, 50000, 100000],
    'bulls',
    (n) => `ブル ${n.toLocaleString()}回`,
    (n) => `ブル(D+S)累計${n.toLocaleString()}回達成`,
    '🎯',
  ),
  // LOW TON
  ...generateAchievements(
    'low_ton',
    [50, 100, 500, 1000],
    'low_ton',
    (n) => `LOW TON ${n}回`,
    (n) => `LOW TON累計${n}回達成`,
    '📊',
  ),
  // HIGH TON
  ...generateAchievements(
    'high_ton',
    [10, 50, 100, 500],
    'high_ton',
    (n) => `HIGH TON ${n}回`,
    (n) => `HIGH TON累計${n}回達成`,
    '📈',
  ),
  // 3 IN A BED
  ...generateAchievements(
    'three_bed',
    [10, 50, 100],
    'three_bed',
    (n) => `3 IN A BED ${n}回`,
    (n) => `3 IN A BED累計${n}回達成`,
    '🛏️',
  ),
  // WHITE HORSE
  ...generateAchievements(
    'white_horse',
    [5, 10, 50],
    'white_horse',
    (n) => `WHITE HORSE ${n}回`,
    (n) => `WHITE HORSE累計${n}回達成`,
    '🐴',
  ),
  // レベル
  ...generateAchievements(
    'level',
    [5, 10, 15, 20],
    'level',
    (n) => `レベル${n}`,
    (n) => `レベル${n}に到達`,
    '🏅',
  ),
];

export const ACHIEVEMENT_MAP = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a])) as Record<
  string,
  AchievementDefinition
>;

export function getAchievementsByCategory(): Map<AchievementCategory, AchievementDefinition[]> {
  const map = new Map<AchievementCategory, AchievementDefinition[]>();
  for (const a of ACHIEVEMENTS) {
    const list = map.get(a.category) || [];
    list.push(a);
    map.set(a.category, list);
  }
  return map;
}
