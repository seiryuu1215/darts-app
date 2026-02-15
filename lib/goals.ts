/**
 * 目標定義・進捗計算
 */
import type { GoalType, GoalPeriod } from '@/types';

export interface GoalTypeDef {
  type: GoalType;
  label: string;
  unit: string;
  defaultTargets: { monthly?: number; yearly?: number };
  periods: GoalPeriod[];
}

export const GOAL_TYPES: GoalTypeDef[] = [
  {
    type: 'bulls',
    label: 'ブル数',
    unit: '回',
    defaultTargets: { monthly: 5000 },
    periods: ['monthly'],
  },
  {
    type: 'games',
    label: 'ゲーム数',
    unit: 'ゲーム',
    defaultTargets: { monthly: 100 },
    periods: ['monthly'],
  },
  {
    type: 'rating',
    label: 'Rating',
    unit: '',
    defaultTargets: { yearly: 8.0 },
    periods: ['yearly'],
  },
  {
    type: 'cu_score',
    label: 'CU最高スコア',
    unit: '点',
    defaultTargets: { yearly: 1000 },
    periods: ['yearly'],
  },
  {
    type: 'play_days',
    label: 'プレイ日数',
    unit: '日',
    defaultTargets: { monthly: 20 },
    periods: ['monthly'],
  },
  {
    type: 'hat_tricks',
    label: 'HAT TRICK',
    unit: '回',
    defaultTargets: { monthly: 50 },
    periods: ['monthly'],
  },
];

export function getGoalTypeDef(type: GoalType): GoalTypeDef | undefined {
  return GOAL_TYPES.find((g) => g.type === type);
}

/**
 * 残り日数を計算
 */
export function getRemainingDays(endDate: Date): number {
  const now = new Date();
  const diff = endDate.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

/**
 * 日割りペースを計算
 */
export function getDailyPace(current: number, target: number, remainingDays: number): number {
  if (remainingDays <= 0) return 0;
  const remaining = target - current;
  if (remaining <= 0) return 0;
  return Math.ceil(remaining / remainingDays);
}

/**
 * 達成予測日数を計算（現在のペースに基づく）
 */
export function getEstimatedDays(
  current: number,
  target: number,
  startDate: Date,
): number | null {
  if (current <= 0) return null;
  const now = new Date();
  const daysSinceStart = Math.max(1, Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
  const dailyRate = current / daysSinceStart;
  if (dailyRate <= 0) return null;
  const remaining = target - current;
  if (remaining <= 0) return 0;
  return Math.ceil(remaining / dailyRate);
}

/**
 * 進捗率を計算
 */
export function getProgressPercent(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(100, Math.round((current / target) * 100));
}

/**
 * 月間目標の日付範囲を生成
 */
export function getMonthlyRange(): { startDate: Date; endDate: Date } {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { startDate, endDate };
}

/**
 * 年間目標の日付範囲を生成
 */
export function getYearlyRange(): { startDate: Date; endDate: Date } {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), 0, 1);
  const endDate = new Date(now.getFullYear(), 11, 31);
  return { startDate, endDate };
}
