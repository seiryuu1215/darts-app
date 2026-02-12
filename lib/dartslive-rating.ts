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
  if (mpr < 1.3) return 1;
  if (mpr < 3.5) return (mpr * 100 - 90) / 20;
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

export interface TargetStat {
  target: number; // 目標値
  gap: number; // 現在との差
  achieved: boolean; // 既に達成済み
}

export interface RatingTarget {
  currentRating: number;
  current01Rt: number;
  currentCriRt: number;
  nextRating: number;
  // 01だけで上げる場合
  ppd01Only: TargetStat;
  // Cricketだけで上げる場合
  mprCriOnly: TargetStat;
  // 均等に上げる場合（01Rt=CriRt=nextRatingになる値）
  ppdBalanced: TargetStat;
  mprBalanced: TargetStat;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function getRatingTarget(ppd: number, mpr: number): RatingTarget {
  const current01Rt = calc01Rating(ppd);
  const currentCriRt = calcCriRating(mpr);
  const currentRating = (current01Rt + currentCriRt) / 2;
  const nextRating = Math.floor(currentRating) + 1;

  // 01だけで上げる場合: new01Rt = nextRating*2 - currentCriRt
  const needed01Rt = nextRating * 2 - currentCriRt;
  const ppd01Target = round2(ppdForRating(needed01Rt));
  const ppd01Gap = round2(ppd01Target - ppd);

  // Cricketだけで上げる場合: newCriRt = nextRating*2 - current01Rt
  const neededCriRt = nextRating * 2 - current01Rt;
  const mprCriTarget = round2(mprForRating(neededCriRt));
  const mprCriGap = round2(mprCriTarget - mpr);

  // 均等に上げる場合: 01Rt = CriRt = nextRating
  const ppdBalTarget = round2(ppdForRating(nextRating));
  const ppdBalGap = round2(ppdBalTarget - ppd);
  const mprBalTarget = round2(mprForRating(nextRating));
  const mprBalGap = round2(mprBalTarget - mpr);

  return {
    currentRating,
    current01Rt,
    currentCriRt,
    nextRating,
    ppd01Only: { target: ppd01Target, gap: ppd01Gap, achieved: ppd01Gap <= 0 },
    mprCriOnly: { target: mprCriTarget, gap: mprCriGap, achieved: mprCriGap <= 0 },
    ppdBalanced: { target: ppdBalTarget, gap: ppdBalGap, achieved: ppdBalGap <= 0 },
    mprBalanced: { target: mprBalTarget, gap: mprBalGap, achieved: mprBalGap <= 0 },
  };
}
