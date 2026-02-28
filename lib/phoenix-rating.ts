/**
 * PHOENIX レーティング換算ユーティリティ
 *
 * DARTSLIVE 100%スタッツ（PPD/MPR）はPHOENIXと同じ1本あたりの単位なので、
 * そのままPHOENIXのレーティングテーブルに当てはめて換算できる。
 *
 * 参考: https://01dart.com/dart39-02.html
 */

export type PhoenixClass =
  | 'N'
  | 'C'
  | 'CC'
  | 'CCC'
  | 'B'
  | 'BB'
  | 'BBB'
  | 'A'
  | 'AA'
  | 'AAA'
  | 'MASTER'
  | 'GRAND MASTER';

interface RatingEntry {
  rating: number;
  class: PhoenixClass;
  ppdMin: number;
  mprMin: number;
}

/** PHOENIXレーティングテーブル（Rt.1〜30） — ppdMin/mprMin はそのRtの下限値 */
const TABLE: RatingEntry[] = [
  { rating: 1, class: 'N', ppdMin: 0, mprMin: 0 },
  { rating: 2, class: 'C', ppdMin: 10.65, mprMin: 1.10 },
  { rating: 3, class: 'C', ppdMin: 11.90, mprMin: 1.20 },
  { rating: 4, class: 'CC', ppdMin: 13.15, mprMin: 1.31 },
  { rating: 5, class: 'CC', ppdMin: 14.40, mprMin: 1.46 },
  { rating: 6, class: 'CCC', ppdMin: 15.65, mprMin: 1.61 },
  { rating: 7, class: 'CCC', ppdMin: 16.90, mprMin: 1.76 },
  { rating: 8, class: 'B', ppdMin: 18.15, mprMin: 1.91 },
  { rating: 9, class: 'B', ppdMin: 19.45, mprMin: 2.06 },
  { rating: 10, class: 'BB', ppdMin: 20.75, mprMin: 2.21 },
  { rating: 11, class: 'BB', ppdMin: 22.05, mprMin: 2.36 },
  { rating: 12, class: 'BBB', ppdMin: 23.35, mprMin: 2.51 },
  { rating: 13, class: 'BBB', ppdMin: 24.65, mprMin: 2.66 },
  { rating: 14, class: 'A', ppdMin: 25.95, mprMin: 2.81 },
  { rating: 15, class: 'A', ppdMin: 27.30, mprMin: 2.96 },
  { rating: 16, class: 'A', ppdMin: 28.65, mprMin: 3.11 },
  { rating: 17, class: 'AA', ppdMin: 30.00, mprMin: 3.26 },
  { rating: 18, class: 'AA', ppdMin: 31.35, mprMin: 3.41 },
  { rating: 19, class: 'AA', ppdMin: 32.70, mprMin: 3.56 },
  { rating: 20, class: 'AA', ppdMin: 34.05, mprMin: 3.71 },
  { rating: 21, class: 'AAA', ppdMin: 35.40, mprMin: 3.86 },
  { rating: 22, class: 'AAA', ppdMin: 36.80, mprMin: 4.07 },
  { rating: 23, class: 'AAA', ppdMin: 38.20, mprMin: 4.28 },
  { rating: 24, class: 'AAA', ppdMin: 39.60, mprMin: 4.49 },
  { rating: 25, class: 'MASTER', ppdMin: 41.00, mprMin: 4.70 },
  { rating: 26, class: 'MASTER', ppdMin: 42.40, mprMin: 4.96 },
  { rating: 27, class: 'MASTER', ppdMin: 43.80, mprMin: 5.22 },
  { rating: 28, class: 'GRAND MASTER', ppdMin: 45.20, mprMin: 5.48 },
  { rating: 29, class: 'GRAND MASTER', ppdMin: 46.60, mprMin: 5.74 },
  { rating: 30, class: 'GRAND MASTER', ppdMin: 48.00, mprMin: 6.00 },
];

/** PPDからPHOENIX 01レーティングをルックアップ */
export function phoenixRatingFromPpd(ppd: number): { rating: number; class: PhoenixClass } {
  let matched = TABLE[0];
  for (const entry of TABLE) {
    if (ppd >= entry.ppdMin) matched = entry;
    else break;
  }
  return { rating: matched.rating, class: matched.class };
}

/** MPRからPHOENIX Cricketレーティングをルックアップ */
export function phoenixRatingFromMpr(mpr: number): { rating: number; class: PhoenixClass } {
  let matched = TABLE[0];
  for (const entry of TABLE) {
    if (mpr >= entry.mprMin) matched = entry;
    else break;
  }
  return { rating: matched.rating, class: matched.class };
}

export interface PhoenixConversion {
  zeroOne: { rating: number; class: PhoenixClass };
  cricket: { rating: number; class: PhoenixClass };
  overall: { rating: number; class: PhoenixClass };
  ppd100: number;
  mpr100: number;
}

/** DARTSLIVE 100%スタッツからPHOENIX換算結果を算出 */
export function convertToPhoenix(ppd100: number, mpr100: number): PhoenixConversion {
  const zeroOne = phoenixRatingFromPpd(ppd100);
  const cricket = phoenixRatingFromMpr(mpr100);
  const overallRt = (zeroOne.rating + cricket.rating) / 2;
  const overallRtRounded = Math.round(overallRt * 10) / 10;

  // 総合Rtに最も近い整数Rtのクラスを採用
  const overallInt = Math.round(overallRt);
  const clamped = Math.max(1, Math.min(30, overallInt));
  const overallClass = TABLE[clamped - 1].class;

  return {
    zeroOne,
    cricket,
    overall: { rating: overallRtRounded, class: overallClass },
    ppd100,
    mpr100,
  };
}
