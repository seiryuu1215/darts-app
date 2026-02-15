export interface XpRule {
  id: string;
  xp: number;
  label: string;
}

export const XP_RULES: Record<string, XpRule> = {
  stats_record: { id: 'stats_record', xp: 10, label: 'スタッツ記録' },
  games_10: { id: 'games_10', xp: 20, label: '累計ゲーム数10の倍数' },
  play_streak_3: { id: 'play_streak_3', xp: 15, label: '3日連続プレイ' },
  play_streak_7: { id: 'play_streak_7', xp: 50, label: '7日連続プレイ' },
  play_streak_30: { id: 'play_streak_30', xp: 200, label: '30日連続プレイ' },
  rating_milestone: { id: 'rating_milestone', xp: 30, label: 'Rating整数到達' },
  award_hat_trick: { id: 'award_hat_trick', xp: 5, label: 'HAT TRICK' },
  award_ton_80: { id: 'award_ton_80', xp: 10, label: 'TON 80' },
  award_3_black: { id: 'award_3_black', xp: 15, label: '3 IN A BLACK' },
  discussion_post: { id: 'discussion_post', xp: 5, label: 'ディスカッション投稿' },
  condition_record: { id: 'condition_record', xp: 3, label: 'コンディション記録' },
  goal_achieved: { id: 'goal_achieved', xp: 50, label: '目標達成' },
} as const;
