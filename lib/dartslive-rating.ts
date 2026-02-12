/**
 * DARTSLIVE レーティング計算ユーティリティ
 * 参考: https://yyengine.jp/dartslive-rating/
 *
 * 計算式:
 *   01レーティング:
 *     PPD < 40       → 1
 *     40 ≤ PPD < 95  → (PPD - 30) / 5
 *     PPD ≥ 95       → (PPD - 4) / 7
 *
 *   Cricketレーティング:
 *     MPR < 1.30     → 1
 *     1.30 ≤ MPR < 3.50 → (MPR×100 - 90) / 20
 *     MPR ≥ 3.50     → (MPR×100 - 25) / 25
 *
 *   総合レーティング = (01レーティング + Cricketレーティング) / 2
 */

/** PPDから01個別レーティング（連続値）を算出 */
export function calc01Rating(ppd: number): number {
  if (ppd < 40) return 1;
  if (ppd < 95) return (ppd - 30) / 5;
  return (ppd - 4) / 7;
}

/** MPRからCricket個別レーティング（連続値）を算出 */
export function calcCriRating(mpr: number): number {
  if (mpr < 1.30) return 1;
  if (mpr < 3.50) return (mpr * 100 - 90) / 20;
  return (mpr * 100 - 25) / 25;
}

/** PPD+MPRから総合レーティングを算出 */
export function calcRating(ppd: number, mpr: number): number {
  return (calc01Rating(ppd) + calcCriRating(mpr)) / 2;
}

/** 目標01レーティングに必要なPPDを逆算 */
export function ppdForRating(target01Rt: number): number {
  if (target01Rt <= 1) return 0;
  if (target01Rt <= 13) return target01Rt * 5 + 30; // (PPD - 30)/5 = Rt → PPD = Rt*5 + 30
  return target01Rt * 7 + 4; // (PPD - 4)/7 = Rt → PPD = Rt*7 + 4
}

/** 目標CricketレーティングにMPRを逆算 */
export function mprForRating(targetCriRt: number): number {
  if (targetCriRt <= 1) return 0;
  if (targetCriRt <= 13) return (targetCriRt * 20 + 90) / 100; // (MPR*100-90)/20 = Rt → MPR = (Rt*20+90)/100
  return (targetCriRt * 25 + 25) / 100; // (MPR*100-25)/25 = Rt → MPR = (Rt*25+25)/100
}

export interface RatingTarget {
  currentRating: number;
  current01Rt: number;
  currentCriRt: number;
  nextRating: number;
  // 01だけで上げる場合
  ppd01Only: number | null;
  ppdGap01Only: number | null;
  // Cricketだけで上げる場合
  mprCriOnly: number | null;
  mprGapCriOnly: number | null;
  // 均等に上げる場合
  ppdBalanced: number | null;
  ppdGapBalanced: number | null;
  mprBalanced: number | null;
  mprGapBalanced: number | null;
}

export function getRatingTarget(ppd: number, mpr: number): RatingTarget {
  const current01Rt = calc01Rating(ppd);
  const currentCriRt = calcCriRating(mpr);
  const currentRating = (current01Rt + currentCriRt) / 2;
  const nextRating = Math.floor(currentRating) + 1;

  // 01だけで次のレーティングに到達する場合
  // (new01Rt + currentCriRt) / 2 = nextRating
  // new01Rt = nextRating * 2 - currentCriRt
  const needed01Rt = nextRating * 2 - currentCriRt;
  let ppd01Only: number | null = null;
  let ppdGap01Only: number | null = null;
  if (needed01Rt <= 18) { // 01レーティング上限チェック（SA Flight最大付近）
    ppd01Only = Math.round(ppdForRating(needed01Rt) * 100) / 100;
    ppdGap01Only = Math.round((ppd01Only - ppd) * 100) / 100;
    if (ppdGap01Only <= 0) {
      ppd01Only = null;
      ppdGap01Only = null;
    }
  }

  // Cricketだけで次のレーティングに到達する場合
  const neededCriRt = nextRating * 2 - current01Rt;
  let mprCriOnly: number | null = null;
  let mprGapCriOnly: number | null = null;
  if (neededCriRt <= 18) {
    mprCriOnly = Math.round(mprForRating(neededCriRt) * 100) / 100;
    mprGapCriOnly = Math.round((mprCriOnly - mpr) * 100) / 100;
    if (mprGapCriOnly <= 0) {
      mprCriOnly = null;
      mprGapCriOnly = null;
    }
  }

  // 均等に上げる場合
  // 01Rt と CriRt をそれぞれ半分ずつ上げる
  const totalGap = nextRating * 2 - (current01Rt + currentCriRt);
  const halfGap = totalGap / 2;
  const balanced01Rt = current01Rt + halfGap;
  const balancedCriRt = currentCriRt + halfGap;
  let ppdBalanced: number | null = null;
  let ppdGapBalanced: number | null = null;
  let mprBalanced: number | null = null;
  let mprGapBalanced: number | null = null;
  if (balanced01Rt <= 18 && balancedCriRt <= 18 && totalGap > 0) {
    ppdBalanced = Math.round(ppdForRating(balanced01Rt) * 100) / 100;
    ppdGapBalanced = Math.round((ppdBalanced - ppd) * 100) / 100;
    mprBalanced = Math.round(mprForRating(balancedCriRt) * 100) / 100;
    mprGapBalanced = Math.round((mprBalanced - mpr) * 100) / 100;
  }

  return {
    currentRating,
    current01Rt,
    currentCriRt,
    nextRating,
    ppd01Only,
    ppdGap01Only,
    mprCriOnly,
    mprGapCriOnly,
    ppdBalanced,
    ppdGapBalanced,
    mprBalanced,
    mprGapBalanced,
  };
}
