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

export const XP_RULES: Record<string, XpRule> = {
  stats_record: { id: 'stats_record', xp: 10, label: 'スタッツ記録' },
  rating_milestone: { id: 'rating_milestone', xp: 30, label: 'Rating整数到達' },
  award_hat_trick: {
    id: 'award_hat_trick',
    xp: 5,
    label: 'HAT TRICK',
    diminishing: [
      { count: 100, multiplier: 0.5 },
      { count: 500, multiplier: 0.2 },
      { count: 2000, multiplier: 0 },
    ],
  },
  award_ton_80: {
    id: 'award_ton_80',
    xp: 10,
    label: 'TON 80',
    diminishing: [
      { count: 100, multiplier: 0.8 },
      { count: 500, multiplier: 0.5 },
      { count: 2000, multiplier: 0.2 },
    ],
  },
  award_3_black: {
    id: 'award_3_black',
    xp: 15,
    label: '3 IN A BLACK',
    diminishing: [
      { count: 100, multiplier: 0.8 },
      { count: 500, multiplier: 0.5 },
    ],
  },
  award_9_mark: {
    id: 'award_9_mark',
    xp: 10,
    label: '9マーク',
    diminishing: [
      { count: 100, multiplier: 0.8 },
      { count: 500, multiplier: 0.5 },
    ],
  },
  award_low_ton: {
    id: 'award_low_ton',
    xp: 3,
    label: 'LOW TON',
    diminishing: [
      { count: 100, multiplier: 0.5 },
      { count: 500, multiplier: 0 },
    ],
  },
  award_high_ton: {
    id: 'award_high_ton',
    xp: 5,
    label: 'HIGH TON',
    diminishing: [
      { count: 100, multiplier: 0.5 },
      { count: 500, multiplier: 0.2 },
      { count: 2000, multiplier: 0 },
    ],
  },
  award_3_bed: {
    id: 'award_3_bed',
    xp: 10,
    label: '3 IN A BED',
    diminishing: [
      { count: 100, multiplier: 0.5 },
      { count: 500, multiplier: 0.2 },
    ],
  },
  award_white_horse: {
    id: 'award_white_horse',
    xp: 15,
    label: 'WHITE HORSE',
    diminishing: [
      { count: 100, multiplier: 0.8 },
      { count: 500, multiplier: 0.5 },
    ],
  },
  discussion_post: { id: 'discussion_post', xp: 5, label: 'ディスカッション投稿' },
  condition_record: { id: 'condition_record', xp: 3, label: 'コンディション記録' },
  goal_achieved: { id: 'goal_achieved', xp: 50, label: '目標達成' },
  daily_goal_achieved: { id: 'daily_goal_achieved', xp: 10, label: 'デイリー目標達成' },
  weekly_active: { id: 'weekly_active', xp: 25, label: '週間アクティブボーナス' },
  monthly_active: { id: 'monthly_active', xp: 100, label: '月間アクティブボーナス' },
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
