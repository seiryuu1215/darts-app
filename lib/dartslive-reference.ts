/**
 * DARTSLIVE公式ベンチマークデータ
 * 出典: https://www.dartslive.com/jp/news/118581/
 *
 * レーティング別の01スタッツ(PPD)境界値、1投ブル率、
 * 1ラウンドごとの確率（ノーブル率・ワンブル率・ロートン率・ハットトリック率）
 */

export interface RatingBenchmark {
  rating: number;
  flight: string;
  ppdMin: number;
  bullRatePerThrow: number;
  noBullRate: number;
  oneBullRate: number;
  lowTonRate: number;
  hatTrickRate: number;
  hatTrickFrequency: string;
}

/**
 * DARTSLIVE公式: レーティング別ベンチマークデータ
 *
 * 各確率は「1ラウンド(3投)ごと」の発生率
 * bullRatePerThrow は「1投ごと」のブル率
 * hatTrickFrequency は「何ラウンドに1回」ハットトリックが出るかの目安
 */
export const RATING_BENCHMARKS: RatingBenchmark[] = [
  {
    rating: 1,
    flight: 'N',
    ppdMin: 0,
    bullRatePerThrow: 0,
    noBullRate: 100,
    oneBullRate: 0,
    lowTonRate: 0,
    hatTrickRate: 0,
    hatTrickFrequency: '-',
  },
  {
    rating: 2,
    flight: 'C',
    ppdMin: 40,
    bullRatePerThrow: 8.33,
    noBullRate: 77.03,
    oneBullRate: 21.0,
    lowTonRate: 1.91,
    hatTrickRate: 0.06,
    hatTrickFrequency: '1/1667',
  },
  {
    rating: 3,
    flight: 'C',
    ppdMin: 45,
    bullRatePerThrow: 12.5,
    noBullRate: 66.99,
    oneBullRate: 28.71,
    lowTonRate: 4.1,
    hatTrickRate: 0.2,
    hatTrickFrequency: '1/500',
  },
  {
    rating: 4,
    flight: 'CC',
    ppdMin: 50,
    bullRatePerThrow: 16.67,
    noBullRate: 57.86,
    oneBullRate: 34.73,
    lowTonRate: 6.95,
    hatTrickRate: 0.46,
    hatTrickFrequency: '1/217',
  },
  {
    rating: 5,
    flight: 'CC',
    ppdMin: 55,
    bullRatePerThrow: 20.83,
    noBullRate: 49.62,
    oneBullRate: 39.17,
    lowTonRate: 10.31,
    hatTrickRate: 0.9,
    hatTrickFrequency: '1/111',
  },
  {
    rating: 6,
    flight: 'B',
    ppdMin: 60,
    bullRatePerThrow: 25.0,
    noBullRate: 42.19,
    oneBullRate: 42.19,
    lowTonRate: 14.06,
    hatTrickRate: 1.56,
    hatTrickFrequency: '1/64',
  },
  {
    rating: 7,
    flight: 'B',
    ppdMin: 65,
    bullRatePerThrow: 29.17,
    noBullRate: 35.53,
    oneBullRate: 43.9,
    lowTonRate: 18.08,
    hatTrickRate: 2.48,
    hatTrickFrequency: '1/40',
  },
  {
    rating: 8,
    flight: 'BB',
    ppdMin: 70,
    bullRatePerThrow: 33.33,
    noBullRate: 29.63,
    oneBullRate: 44.44,
    lowTonRate: 22.22,
    hatTrickRate: 3.7,
    hatTrickFrequency: '1/27',
  },
  {
    rating: 9,
    flight: 'BB',
    ppdMin: 75,
    bullRatePerThrow: 37.5,
    noBullRate: 24.41,
    oneBullRate: 43.95,
    lowTonRate: 26.37,
    hatTrickRate: 5.27,
    hatTrickFrequency: '1/19',
  },
  {
    rating: 10,
    flight: 'A',
    ppdMin: 80,
    bullRatePerThrow: 41.67,
    noBullRate: 19.85,
    oneBullRate: 42.53,
    lowTonRate: 30.39,
    hatTrickRate: 7.24,
    hatTrickFrequency: '1/14',
  },
  {
    rating: 11,
    flight: 'A',
    ppdMin: 85,
    bullRatePerThrow: 45.83,
    noBullRate: 15.9,
    oneBullRate: 40.34,
    lowTonRate: 34.13,
    hatTrickRate: 9.63,
    hatTrickFrequency: '1/10',
  },
  {
    rating: 12,
    flight: 'AA',
    ppdMin: 90,
    bullRatePerThrow: 50.0,
    noBullRate: 12.5,
    oneBullRate: 37.5,
    lowTonRate: 37.5,
    hatTrickRate: 12.5,
    hatTrickFrequency: '1/8',
  },
  {
    rating: 13,
    flight: 'AA',
    ppdMin: 95,
    bullRatePerThrow: 54.17,
    noBullRate: 9.63,
    oneBullRate: 34.13,
    lowTonRate: 40.34,
    hatTrickRate: 15.9,
    hatTrickFrequency: '1/6.3',
  },
  {
    rating: 14,
    flight: 'SA',
    ppdMin: 102,
    bullRatePerThrow: 60.0,
    noBullRate: 6.4,
    oneBullRate: 28.8,
    lowTonRate: 43.2,
    hatTrickRate: 21.6,
    hatTrickFrequency: '1/4.6',
  },
  {
    rating: 15,
    flight: 'SA',
    ppdMin: 109,
    bullRatePerThrow: 65.83,
    noBullRate: 3.99,
    oneBullRate: 23.06,
    lowTonRate: 44.42,
    hatTrickRate: 28.53,
    hatTrickFrequency: '1/3.5',
  },
  {
    rating: 16,
    flight: 'SA',
    ppdMin: 116,
    bullRatePerThrow: 71.67,
    noBullRate: 2.27,
    oneBullRate: 17.26,
    lowTonRate: 43.66,
    hatTrickRate: 36.81,
    hatTrickFrequency: '1/2.7',
  },
  {
    rating: 17,
    flight: 'SA',
    ppdMin: 123,
    bullRatePerThrow: 77.5,
    noBullRate: 1.14,
    oneBullRate: 11.77,
    lowTonRate: 40.54,
    hatTrickRate: 46.55,
    hatTrickFrequency: '1/2.2',
  },
  {
    rating: 18,
    flight: 'SA',
    ppdMin: 130,
    bullRatePerThrow: 83.33,
    noBullRate: 0.46,
    oneBullRate: 6.95,
    lowTonRate: 34.73,
    hatTrickRate: 57.86,
    hatTrickFrequency: '1/1.7',
  },
];

/** PPDからレーティングレベルを推定 */
export function getRatingFromPpd(ppd: number): number {
  for (let i = RATING_BENCHMARKS.length - 1; i >= 0; i--) {
    if (ppd >= RATING_BENCHMARKS[i].ppdMin) return RATING_BENCHMARKS[i].rating;
  }
  return 1;
}

/** PPDから期待ブル率を取得 */
export function getExpectedBullRate(ppd: number): number {
  const rating = getRatingFromPpd(ppd);
  return RATING_BENCHMARKS.find((b) => b.rating === rating)?.bullRatePerThrow ?? 0;
}

/** レーティングからベンチマークを取得 */
export function getBenchmarkByRating(rating: number): RatingBenchmark | null {
  const rounded = Math.min(18, Math.max(1, Math.round(rating)));
  return RATING_BENCHMARKS.find((b) => b.rating === rounded) ?? null;
}

/** ブル率を期待値と比較して評価 */
export function evaluateBullRate(
  ppd: number,
  actualBullRate: number,
): { expected: number; diff: number; evaluation: string } {
  const expected = getExpectedBullRate(ppd);
  const diff = actualBullRate - expected;

  let evaluation: string;
  if (diff >= 5) evaluation = '期待値を大きく上回る';
  else if (diff >= 1) evaluation = '期待値以上';
  else if (diff >= -2) evaluation = '期待値通り';
  else if (diff >= -5) evaluation = 'やや低め';
  else evaluation = '改善の余地あり';

  return { expected, diff, evaluation };
}
