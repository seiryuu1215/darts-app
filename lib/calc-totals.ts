import type { Dart } from '@/types';

export interface DartTotals {
  totalLength: number | null;
  totalWeight: number | null;
}

/** 全パーツの数値スペックが揃っており、セッティング込み表示が可能か */
export function hasCompleteSpecs(dart: Dart): boolean {
  const hasTipSpecs = !!(dart.tip.lengthMm && dart.tip.weightG);
  if (dart.flight.isCondorAxe) {
    return hasTipSpecs && !!(dart.flight.condorAxeShaftLengthMm && dart.flight.weightG);
  }
  const hasShaftSpecs = !!(dart.shaft.lengthMm && dart.shaft.weightG);
  const hasFlightSpecs = !!dart.flight.weightG;
  return hasTipSpecs && hasShaftSpecs && hasFlightSpecs;
}

export function calcDartTotals(dart: Dart): DartTotals {
  const bLength = dart.barrel.length || 0;
  const bWeight = dart.barrel.weight || 0;

  const tipLen = dart.tip.lengthMm || 0;
  // スティールはバレル重量にポイント重量が含まれるため加算しない
  const tipW = dart.tip.type === 'steel' ? 0 : dart.tip.weightG || 0;

  let shaftLen = 0;
  let shaftW = 0;
  let flightW = 0;

  if (dart.flight.isCondorAxe) {
    // CONDOR AXE: 一体型 - シャフト長はflight側に記録
    shaftLen = dart.flight.condorAxeShaftLengthMm || dart.shaft.lengthMm || 0;
    flightW = dart.flight.weightG || 0;
    // shaftW = 0 (一体型のためフライト重量に含む)
  } else {
    shaftLen = dart.shaft.lengthMm || 0;
    shaftW = dart.shaft.weightG || 0;
    flightW = dart.flight.weightG || 0;
  }

  const totalLength = tipLen + bLength + shaftLen;
  const totalWeight = bWeight + tipW + shaftW + flightW;

  return {
    totalLength: totalLength > 0 ? totalLength : null,
    totalWeight: totalWeight > 0 ? totalWeight : null,
  };
}
