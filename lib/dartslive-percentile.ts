/**
 * DARTSLIVE パーセンタイル分布ユーティリティ
 * DARTSLIVE公式分布(2024)を参考
 * https://www.dartslive.com/jp/news/119869/ (Rating分布)
 * https://www.dartslive.com/jp/news/118581/ (PPD↔Rating境界、ブル率)
 */

// Rating 分布 (DARTSLIVE公式: 2024年版)
export const RATING_DISTRIBUTION = [
  { rating: 1, flight: 'N', percentage: 1.01 },
  { rating: 2, flight: 'C', percentage: 12.07 },
  { rating: 3, flight: 'C', percentage: 19.99 },
  { rating: 4, flight: 'CC', percentage: 16.03 },
  { rating: 5, flight: 'CC', percentage: 13.66 },
  { rating: 6, flight: 'B', percentage: 10.46 },
  { rating: 7, flight: 'B', percentage: 7.93 },
  { rating: 8, flight: 'BB', percentage: 5.89 },
  { rating: 9, flight: 'BB', percentage: 4.36 },
  { rating: 10, flight: 'A', percentage: 3.18 },
  { rating: 11, flight: 'A', percentage: 2.11 },
  { rating: 12, flight: 'AA', percentage: 1.42 },
  { rating: 13, flight: 'AA', percentage: 0.85 },
  { rating: 14, flight: 'SA', percentage: 0.51 },
  { rating: 15, flight: 'SA', percentage: 0.27 },
  { rating: 16, flight: 'SA', percentage: 0.14 },
  { rating: 17, flight: 'SA', percentage: 0.07 },
  { rating: 18, flight: 'SA', percentage: 0.05 },
];

// PPD 分布 (公式PPD↔Rating境界 × Rating分布から算出)
// https://www.dartslive.com/jp/news/118581/
const PPD_THRESHOLDS = [
  { value: 20, percentile: 99.5 },
  { value: 30, percentile: 99.2 },
  { value: 40, percentile: 98.99 }, // Rt.2
  { value: 45, percentile: 86.92 }, // Rt.3
  { value: 50, percentile: 66.93 }, // Rt.4
  { value: 55, percentile: 50.9 }, // Rt.5
  { value: 60, percentile: 37.24 }, // Rt.6
  { value: 65, percentile: 26.78 }, // Rt.7
  { value: 70, percentile: 18.85 }, // Rt.8
  { value: 75, percentile: 12.96 }, // Rt.9
  { value: 80, percentile: 8.6 }, // Rt.10
  { value: 85, percentile: 5.42 }, // Rt.11
  { value: 90, percentile: 3.31 }, // Rt.12
  { value: 95, percentile: 1.89 }, // Rt.13
  { value: 102, percentile: 1.04 }, // Rt.14
  { value: 109, percentile: 0.53 }, // Rt.15
  { value: 116, percentile: 0.26 }, // Rt.16
  { value: 123, percentile: 0.12 }, // Rt.17
  { value: 130, percentile: 0.05 }, // Rt.18
];

// MPR 分布 (同様に逆算)
const MPR_THRESHOLDS = [
  { value: 0.5, percentile: 95 },
  { value: 0.8, percentile: 87 },
  { value: 1.0, percentile: 80 },
  { value: 1.3, percentile: 70 },
  { value: 1.5, percentile: 60 },
  { value: 1.7, percentile: 51 }, // Rt.2 相当
  { value: 1.9, percentile: 40 }, // Rt.3 相当
  { value: 2.1, percentile: 33 }, // Rt.4 相当
  { value: 2.3, percentile: 26 },
  { value: 2.5, percentile: 20 }, // Rt.6 相当
  { value: 2.7, percentile: 15 },
  { value: 3.0, percentile: 11 }, // Rt.8 相当
  { value: 3.3, percentile: 8 },
  { value: 3.5, percentile: 5 }, // Rt.10 相当
  { value: 4.0, percentile: 3 },
  { value: 4.5, percentile: 1.5 },
  { value: 5.0, percentile: 0.5 },
];

// COUNT-UP 分布 (Rating × 期待値から推定)
const COUNTUP_THRESHOLDS = [
  { value: 200, percentile: 90 },
  { value: 250, percentile: 80 },
  { value: 300, percentile: 67 },
  { value: 350, percentile: 53 },
  { value: 400, percentile: 40 }, // Rt.4 相当 (PPD50×8)
  { value: 450, percentile: 30 },
  { value: 500, percentile: 22 }, // Rt.6-7 相当
  { value: 550, percentile: 15 },
  { value: 600, percentile: 10 }, // Rt.8-9 相当
  { value: 650, percentile: 6 },
  { value: 700, percentile: 3 }, // Rt.11-12 相当
  { value: 800, percentile: 1 },
  { value: 900, percentile: 0.3 },
];

// ブル累計 分布 (Rating帯 × 平均プレイ期間から推定)
const BULL_THRESHOLDS = [
  { value: 50, percentile: 85 },
  { value: 100, percentile: 75 },
  { value: 200, percentile: 60 },
  { value: 500, percentile: 40 },
  { value: 1000, percentile: 25 },
  { value: 2000, percentile: 15 },
  { value: 3000, percentile: 10 },
  { value: 5000, percentile: 5 },
  { value: 10000, percentile: 2 },
  { value: 20000, percentile: 0.5 },
];

type PercentileType = 'rating' | 'ppd' | 'mpr' | 'countup' | 'bull';

function interpolatePercentile(
  thresholds: { value: number; percentile: number }[],
  value: number,
): number {
  if (value <= thresholds[0].value) return thresholds[0].percentile;
  if (value >= thresholds[thresholds.length - 1].value)
    return thresholds[thresholds.length - 1].percentile;

  for (let i = 0; i < thresholds.length - 1; i++) {
    const curr = thresholds[i];
    const next = thresholds[i + 1];
    if (value >= curr.value && value < next.value) {
      const ratio = (value - curr.value) / (next.value - curr.value);
      return curr.percentile + (next.percentile - curr.percentile) * ratio;
    }
  }
  return thresholds[thresholds.length - 1].percentile;
}

/** パーセンタイル（上位X%）を取得 */
export function getPercentile(type: PercentileType, value: number): number {
  if (type === 'rating') {
    // Rating は分布データから累計を計算
    let cumulative = 0;
    for (let i = RATING_DISTRIBUTION.length - 1; i >= 0; i--) {
      cumulative += RATING_DISTRIBUTION[i].percentage;
      if (value >= RATING_DISTRIBUTION[i].rating) {
        // 小数部分を考慮して補間
        if (i < RATING_DISTRIBUTION.length - 1) {
          const frac = value - RATING_DISTRIBUTION[i].rating;
          const nextPct = RATING_DISTRIBUTION[i].percentage;
          return Math.max(0.1, Math.round((cumulative - nextPct * frac) * 10) / 10);
        }
        return Math.max(0.1, Math.round(cumulative * 10) / 10);
      }
    }
    return 99;
  }

  const thresholds =
    type === 'ppd'
      ? PPD_THRESHOLDS
      : type === 'mpr'
        ? MPR_THRESHOLDS
        : type === 'bull'
          ? BULL_THRESHOLDS
          : COUNTUP_THRESHOLDS;
  return Math.max(0.1, Math.round(interpolatePercentile(thresholds, value) * 10) / 10);
}

/** パーセンタイルに応じた色を返す（DARTSLIVEフライトカラー準拠） */
export function getPercentileColor(percentile: number): string {
  if (percentile <= 1) return '#FDD835'; // SA — イエロー
  if (percentile <= 5) return '#E65100'; // AA — 濃いオレンジ
  if (percentile <= 10) return '#FF9800'; // A — オレンジ
  if (percentile <= 20) return '#7B1FA2'; // BB — パープル
  if (percentile <= 35) return '#1E88E5'; // B — ブルー
  if (percentile <= 55) return '#00ACC1'; // CC — シアン
  if (percentile <= 75) return '#4CAF50'; // C — グリーン
  return '#808080'; // N — グレー
}

/** パーセンタイルに応じたラベルを返す */
export function getPercentileLabel(percentile: number): string {
  if (percentile <= 1) return 'トップ級';
  if (percentile <= 5) return '上級者';
  if (percentile <= 15) return '中上級';
  if (percentile <= 30) return '中級者';
  if (percentile <= 50) return '平均以上';
  return 'アベレージ';
}
