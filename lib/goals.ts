/**
 * 目標定義・進捗計算
 */
import type { GoalType, GoalPeriod } from '@/types';

/**
 * dartsLiveStats レコードの最小インターフェース（進捗計算用）
 */
export interface StatsRecord {
  date: string; // ISO string
  rating: number | null;
  gamesPlayed: number;
  dBull: number | null;
  sBull: number | null;
  hatTricks: number | null;
}

export interface GoalTypeDef {
  type: GoalType;
  label: string;
  unit: string;
  defaultTargets: { monthly?: number; yearly?: number; daily?: number };
  periods: GoalPeriod[];
}

export const GOAL_TYPES: GoalTypeDef[] = [
  {
    type: 'bulls',
    label: 'ブル数',
    unit: '回',
    defaultTargets: { monthly: 5000, daily: 300 },
    periods: ['monthly', 'daily'],
  },
  {
    type: 'games',
    label: 'ゲーム数',
    unit: 'ゲーム',
    defaultTargets: { monthly: 100, daily: 30 },
    periods: ['monthly', 'daily'],
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
    defaultTargets: { monthly: 50, daily: 5 },
    periods: ['monthly', 'daily'],
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
export function getEstimatedDays(current: number, target: number, startDate: Date): number | null {
  if (current <= 0) return null;
  const now = new Date();
  const daysSinceStart = Math.max(
    1,
    Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
  );
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

/**
 * デイリー目標の日付範囲を生成（今日の0:00〜23:59 JST）
 */
export function getDailyRange(): { startDate: Date; endDate: Date } {
  const now = new Date();
  const jstOffset = 9 * 60 * 60 * 1000;
  const jstNow = new Date(now.getTime() + jstOffset);
  const jstToday = new Date(Date.UTC(jstNow.getUTCFullYear(), jstNow.getUTCMonth(), jstNow.getUTCDate()));
  const startDate = new Date(jstToday.getTime() - jstOffset);
  const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000 - 1);
  return { startDate, endDate };
}

/**
 * 目標タイプに応じた current 値を dartsLiveStats レコードから計算する。
 *
 * @param type - 目標タイプ
 * @param records - 目標期間内の dartsLiveStats レコード（date 昇順）
 * @param baselineRecord - 期間開始前の最新レコード（累計値の差分計算用）
 */
export function calculateGoalCurrent(
  type: GoalType,
  records: StatsRecord[],
  baselineRecord?: StatsRecord,
): number {
  if (records.length === 0) return 0;

  switch (type) {
    case 'bulls': {
      const first = baselineRecord ?? records[0];
      const last = records[records.length - 1];
      const firstBulls = (first.dBull ?? 0) + (first.sBull ?? 0);
      const lastBulls = (last.dBull ?? 0) + (last.sBull ?? 0);
      return Math.max(0, lastBulls - firstBulls);
    }
    case 'games':
      return records.reduce((sum, r) => sum + (r.gamesPlayed || 0), 0);
    case 'rating': {
      const last = records[records.length - 1];
      return last.rating ?? 0;
    }
    case 'cu_score':
      // COUNT-UP 最高スコアは dartsLiveStats に未格納のためスキップ
      return 0;
    case 'play_days': {
      const uniqueDates = new Set(records.map((r) => r.date.slice(0, 10)));
      return uniqueDates.size;
    }
    case 'hat_tricks': {
      const first = baselineRecord ?? records[0];
      const last = records[records.length - 1];
      return Math.max(0, (last.hatTricks ?? 0) - (first.hatTricks ?? 0));
    }
    default:
      return 0;
  }
}
