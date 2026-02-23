export interface DiminishingTier {
  count: number;
  multiplier: number;
}

export interface XpRule {
  id: string;
  xp: number;
  label: string;
  diminishing?: DiminishingTier[];
}

/** 全アワード共通の逓減ティア（個別指定がない場合に使用） */
const STANDARD_DIMINISHING: DiminishingTier[] = [
  { count: 100, multiplier: 0.7 },
  { count: 500, multiplier: 0.4 },
  { count: 2000, multiplier: 0.15 },
  { count: 5000, multiplier: 0.05 },
  { count: 10000, multiplier: 0.02 },
];

export const XP_RULES: Record<string, XpRule> = {
  stats_record: { id: 'stats_record', xp: 5, label: 'スタッツ記録' },
  rating_milestone: { id: 'rating_milestone', xp: 50, label: 'Rating整数到達' },
  award_hat_trick: {
    id: 'award_hat_trick',
    xp: 8,
    label: 'HAT TRICK',
    diminishing: STANDARD_DIMINISHING,
  },
  award_ton_80: {
    id: 'award_ton_80',
    xp: 20,
    label: 'TON 80',
    diminishing: STANDARD_DIMINISHING,
  },
  award_3_black: {
    id: 'award_3_black',
    xp: 25,
    label: '3 IN A BLACK',
    diminishing: STANDARD_DIMINISHING,
  },
  award_9_mark: {
    id: 'award_9_mark',
    xp: 20,
    label: '9マーク',
    diminishing: STANDARD_DIMINISHING,
  },
  award_low_ton: {
    id: 'award_low_ton',
    xp: 4,
    label: 'LOW TON',
    diminishing: STANDARD_DIMINISHING,
  },
  award_high_ton: {
    id: 'award_high_ton',
    xp: 8,
    label: 'HIGH TON',
    diminishing: STANDARD_DIMINISHING,
  },
  award_3_bed: {
    id: 'award_3_bed',
    xp: 12,
    label: '3 IN A BED',
    diminishing: STANDARD_DIMINISHING,
  },
  award_white_horse: {
    id: 'award_white_horse',
    xp: 20,
    label: 'WHITE HORSE',
    diminishing: STANDARD_DIMINISHING,
  },
  award_bull: {
    id: 'award_bull',
    xp: 1,
    label: 'ブル',
    diminishing: [
      { count: 1000, multiplier: 0.5 },
      { count: 5000, multiplier: 0.2 },
      { count: 20000, multiplier: 0 },
    ],
  },
  countup_highscore: { id: 'countup_highscore', xp: 15, label: 'COUNT-UP自己ベスト更新' },
  win_streak_3: { id: 'win_streak_3', xp: 10, label: '3連勝ボーナス' },
  first_rating: { id: 'first_rating', xp: 100, label: '初Rating取得' },
  discussion_post: { id: 'discussion_post', xp: 5, label: 'ディスカッション投稿' },
  condition_record: { id: 'condition_record', xp: 3, label: 'コンディション記録' },
  goal_achieved: { id: 'goal_achieved', xp: 80, label: '目標達成' },
  daily_goal_achieved: { id: 'daily_goal_achieved', xp: 15, label: 'デイリー目標達成' },
  weekly_active: { id: 'weekly_active', xp: 30, label: '週間アクティブボーナス' },
  monthly_active: { id: 'monthly_active', xp: 150, label: '月間アクティブボーナス' },
  n01_import: { id: 'n01_import', xp: 5, label: 'n01データ取り込み' },
} as const;

/**
 * 逓減XP計算: 累計数に応じてXP倍率が下がる
 */
export function getEffectiveXp(rule: XpRule, cumulativeCount: number): number {
  if (!rule.diminishing || rule.diminishing.length === 0) {
    return rule.xp;
  }

  let multiplier = 1;
  for (const tier of rule.diminishing) {
    if (cumulativeCount >= tier.count) {
      multiplier = tier.multiplier;
    } else {
      break;
    }
  }

  return Math.round(rule.xp * multiplier);
}
