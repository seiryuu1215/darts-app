/**
 * ダートアウト分析ユーティリティ
 * フィニッシュスコア帯分布、ダブル使用傾向、クラッチ率分析
 */

import { getDartoutLabel } from '@/lib/dartout-labels';

interface DartoutItem {
  score: number;
  count: number;
}

/** フィニッシュスコア帯分類 */
export interface FinishRange {
  label: string;
  min: number;
  max: number;
  count: number;
  percentage: number;
}

/** ダブル使用傾向 */
export interface DoublePreference {
  label: string;
  score: number;
  count: number;
  percentage: number;
  isDouble: boolean;
}

/** ダートアウト分析結果 */
export interface DartoutAnalysis {
  finishRanges: FinishRange[];
  doublePreferences: DoublePreference[];
  clutchRatio: number; // 40+フィニッシュの割合
  lowFinishRatio: number; // 20以下のフィニッシュ割合
  bullFinishCount: number;
  bullFinishPercentage: number;
  totalFinishes: number;
  avgFinishScore: number;
  medianFinishScore: number;
}

const FINISH_RANGES = [
  { label: '2-10', min: 2, max: 10 },
  { label: '11-20', min: 11, max: 20 },
  { label: '21-30', min: 21, max: 30 },
  { label: '31-40', min: 31, max: 40 },
  { label: '41-50', min: 41, max: 50 },
  { label: '51+', min: 51, max: 999 },
];

/** フィニッシュスコアをスコア帯に分類 */
export function classifyFinishRange(dartoutList: DartoutItem[]): FinishRange[] {
  const total = dartoutList.reduce((sum, d) => sum + d.count, 0);
  if (total === 0) return [];

  return FINISH_RANGES.map((range) => {
    const count = dartoutList
      .filter((d) => d.score >= range.min && d.score <= range.max)
      .reduce((sum, d) => sum + d.count, 0);
    return {
      ...range,
      count,
      percentage: Math.round((count / total) * 1000) / 10,
    };
  });
}

/** ダブル使用傾向を分析 */
export function analyzeDoublePreference(dartoutList: DartoutItem[]): DoublePreference[] {
  const total = dartoutList.reduce((sum, d) => sum + d.count, 0);
  if (total === 0) return [];

  return dartoutList
    .map((d) => {
      const isDouble = (d.score >= 2 && d.score <= 40 && d.score % 2 === 0) || d.score === 50;
      const label = getDartoutLabel(d.score) || `${d.score}`;
      return {
        label,
        score: d.score,
        count: d.count,
        percentage: Math.round((d.count / total) * 1000) / 10,
        isDouble,
      };
    })
    .sort((a, b) => b.count - a.count);
}

/** クラッチ率（40+フィニッシュの割合）を算出 */
export function computeClutchRatio(dartoutList: DartoutItem[]): number {
  const total = dartoutList.reduce((sum, d) => sum + d.count, 0);
  if (total === 0) return 0;
  const clutchCount = dartoutList.filter((d) => d.score >= 40).reduce((sum, d) => sum + d.count, 0);
  return Math.round((clutchCount / total) * 1000) / 10;
}

/** ダートアウト統合分析 */
export function analyzeDartout(dartoutList: DartoutItem[]): DartoutAnalysis | null {
  if (!dartoutList || dartoutList.length === 0) return null;

  const totalFinishes = dartoutList.reduce((sum, d) => sum + d.count, 0);
  if (totalFinishes === 0) return null;

  const avgFinishScore = dartoutList.reduce((sum, d) => sum + d.score * d.count, 0) / totalFinishes;

  // 中央値算出
  const expanded: number[] = [];
  for (const d of dartoutList) {
    for (let i = 0; i < d.count; i++) expanded.push(d.score);
  }
  expanded.sort((a, b) => a - b);
  const medianFinishScore =
    expanded.length % 2 === 0
      ? (expanded[expanded.length / 2 - 1] + expanded[expanded.length / 2]) / 2
      : expanded[Math.floor(expanded.length / 2)];

  const bullItem = dartoutList.find((d) => d.score === 50);
  const bullFinishCount = bullItem?.count ?? 0;
  const bullFinishPercentage = Math.round((bullFinishCount / totalFinishes) * 1000) / 10;

  const lowFinishCount = dartoutList
    .filter((d) => d.score <= 20)
    .reduce((sum, d) => sum + d.count, 0);
  const lowFinishRatio = Math.round((lowFinishCount / totalFinishes) * 1000) / 10;

  return {
    finishRanges: classifyFinishRange(dartoutList),
    doublePreferences: analyzeDoublePreference(dartoutList),
    clutchRatio: computeClutchRatio(dartoutList),
    lowFinishRatio,
    bullFinishCount,
    bullFinishPercentage,
    totalFinishes,
    avgFinishScore,
    medianFinishScore,
  };
}
