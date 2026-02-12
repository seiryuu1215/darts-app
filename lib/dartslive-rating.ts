/**
 * DARTSLIVE レーティング計算ユーティリティ
 * Rating = (01 Flight + Cricket Flight) / 2
 */

// 01 Flight: PPD下限値
const PPD_THRESHOLDS = [
  0, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100,
];

// Cricket Flight: MPR下限値
const MPR_THRESHOLDS = [
  0, 0.60, 0.80, 1.00, 1.25, 1.50, 1.75, 2.00, 2.25, 2.50, 2.75, 3.00, 3.25, 3.50, 3.75, 4.00, 4.25, 4.50,
];

/** PPDから01フライトレベル(1-18)を算出 */
export function get01Flight(ppd: number): number {
  for (let i = PPD_THRESHOLDS.length - 1; i >= 0; i--) {
    if (ppd >= PPD_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}

/** MPRからCricketフライトレベル(1-18)を算出 */
export function getCricketFlight(mpr: number): number {
  for (let i = MPR_THRESHOLDS.length - 1; i >= 0; i--) {
    if (mpr >= MPR_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}

/** 01フライト+Cricketフライトからレーティングを算出 */
export function calcRating(ppd: number, mpr: number): number {
  return (get01Flight(ppd) + getCricketFlight(mpr)) / 2;
}

export interface RatingTarget {
  currentRating: number;
  current01Flight: number;
  currentCriFlgiht: number;
  nextRating: number;
  // 次のレーティングに到達するために必要な数値
  // 01を上げるパターン
  next01Ppd: number | null;   // 次の01フライトに必要なPPD (null = 既にFl.18)
  ppdGap: number | null;      // 現在のPPDとの差
  // Cricketを上げるパターン
  nextCriMpr: number | null;  // 次のCriフライトに必要なMPR
  mprGap: number | null;      // 現在のMPRとの差
}

export function getRatingTarget(ppd: number, mpr: number): RatingTarget {
  const fl01 = get01Flight(ppd);
  const flCri = getCricketFlight(mpr);
  const currentRating = (fl01 + flCri) / 2;
  const nextRating = Math.ceil(currentRating) === currentRating
    ? currentRating + 0.5
    : Math.ceil(currentRating);

  // 次の01フライトに必要なPPD
  const next01Ppd = fl01 < 18 ? PPD_THRESHOLDS[fl01] : null;
  const ppdGap = next01Ppd !== null ? Math.round((next01Ppd - ppd) * 100) / 100 : null;

  // 次のCricketフライトに必要なMPR
  const nextCriMpr = flCri < 18 ? MPR_THRESHOLDS[flCri] : null;
  const mprGap = nextCriMpr !== null ? Math.round((nextCriMpr - mpr) * 100) / 100 : null;

  return {
    currentRating,
    current01Flight: fl01,
    currentCriFlgiht: flCri,
    nextRating,
    next01Ppd,
    ppdGap,
    nextCriMpr,
    mprGap,
  };
}
