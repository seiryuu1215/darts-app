/**
 * ダーツパーツのマスターデータ
 * チップ・シャフト・フライトの主流製品スペック
 */

export interface TipSpec {
  name: string;
  type: 'soft' | 'steel';
  lengthMm: number;
  weightG: number;
}

export type PartsSystem = 'L-style' | 'COSMO' | 'standard' | 'harrows-clic';

export interface ShaftSpec {
  name: string;
  lengthMm: number;
  weightG: number;
  brand: string;
  system: PartsSystem;
}

export interface FlightSpec {
  name: string;
  shape: 'standard' | 'slim' | 'kite' | 'teardrop' | 'small';
  weightG: number;
  brand: string;
  system: PartsSystem;
}

// CONDOR AXEはシャフト+フライト一体型
export interface CondorAxeSpec {
  name: string;
  shape: string;
  shaftLengthLabel: string;
  shaftLengthMm: number;
  totalWeightG: number;
}

// --- チップ ---
export const TIPS: TipSpec[] = [
  // L-style
  { name: 'Premium Lippoint Short', type: 'soft', lengthMm: 21.3, weightG: 0.28 },
  { name: 'Lippoint USA', type: 'soft', lengthMm: 26.5, weightG: 0.27 },
  { name: 'Premium Lippoint 30 (Long)', type: 'soft', lengthMm: 30.0, weightG: 0.34 },
  // CONDOR
  { name: 'CONDOR TIP', type: 'soft', lengthMm: 24.5, weightG: 0.30 },
  { name: 'CONDOR TIP ULTIMATE', type: 'soft', lengthMm: 31.0, weightG: 0.35 },
  // Fit
  { name: 'Fit Point PLUS', type: 'soft', lengthMm: 25.0, weightG: 0.30 },
  // スティール
  { name: 'スティールポイント（標準）', type: 'steel', lengthMm: 32.0, weightG: 1.50 },
];

// --- シャフト ---
export const SHAFTS: ShaftSpec[] = [
  // L-style L-Shaft (ストレート)
  { name: 'L-Shaft 130 (Extra Short)', lengthMm: 13.0, weightG: 0.58, brand: 'L-style', system: 'L-style' },
  { name: 'L-Shaft 190 (Short)', lengthMm: 19.0, weightG: 0.70, brand: 'L-style', system: 'L-style' },
  { name: 'L-Shaft 260 (Medium)', lengthMm: 26.0, weightG: 0.85, brand: 'L-style', system: 'L-style' },
  { name: 'L-Shaft 330 (Long)', lengthMm: 33.0, weightG: 1.00, brand: 'L-style', system: 'L-style' },
  // L-style L-Shaft Silent Slim
  { name: 'L-Shaft Silent Slim 300 (Short)', lengthMm: 30.0, weightG: 0.73, brand: 'L-style', system: 'L-style' },
  { name: 'L-Shaft Silent Slim 370 (Medium)', lengthMm: 37.0, weightG: 0.85, brand: 'L-style', system: 'L-style' },
  { name: 'L-Shaft Silent Slim 440 (Long)', lengthMm: 44.0, weightG: 0.90, brand: 'L-style', system: 'L-style' },
  // L-style L-Shaft Lock Slim
  { name: 'L-Shaft Lock Slim 300 (Short)', lengthMm: 30.0, weightG: 0.78, brand: 'L-style', system: 'L-style' },
  { name: 'L-Shaft Lock Slim 370 (Medium)', lengthMm: 37.0, weightG: 0.90, brand: 'L-style', system: 'L-style' },
  { name: 'L-Shaft Lock Slim 440 (Long)', lengthMm: 44.0, weightG: 0.95, brand: 'L-style', system: 'L-style' },
  // COSMO Fit Shaft GEAR (Normal)
  { name: 'Fit Shaft GEAR Normal #1', lengthMm: 13.0, weightG: 0.52, brand: 'COSMO', system: 'COSMO' },
  { name: 'Fit Shaft GEAR Normal #2', lengthMm: 18.0, weightG: 0.61, brand: 'COSMO', system: 'COSMO' },
  { name: 'Fit Shaft GEAR Normal #3', lengthMm: 24.0, weightG: 0.75, brand: 'COSMO', system: 'COSMO' },
  { name: 'Fit Shaft GEAR Normal #4', lengthMm: 28.5, weightG: 0.84, brand: 'COSMO', system: 'COSMO' },
  { name: 'Fit Shaft GEAR Normal #5', lengthMm: 31.0, weightG: 0.89, brand: 'COSMO', system: 'COSMO' },
  { name: 'Fit Shaft GEAR Normal #6', lengthMm: 35.0, weightG: 0.97, brand: 'COSMO', system: 'COSMO' },
  { name: 'Fit Shaft GEAR Normal #7', lengthMm: 38.5, weightG: 1.04, brand: 'COSMO', system: 'COSMO' },
  { name: 'Fit Shaft GEAR Normal #8', lengthMm: 42.5, weightG: 1.13, brand: 'COSMO', system: 'COSMO' },
  // COSMO Fit Shaft GEAR (Slim)
  { name: 'Fit Shaft GEAR Slim #1', lengthMm: 13.0, weightG: 0.48, brand: 'COSMO', system: 'COSMO' },
  { name: 'Fit Shaft GEAR Slim #3', lengthMm: 24.0, weightG: 0.65, brand: 'COSMO', system: 'COSMO' },
  { name: 'Fit Shaft GEAR Slim #5', lengthMm: 31.0, weightG: 0.78, brand: 'COSMO', system: 'COSMO' },
  { name: 'Fit Shaft GEAR Slim #7', lengthMm: 38.5, weightG: 0.90, brand: 'COSMO', system: 'COSMO' },
  // COSMO Fit Shaft GEAR (Hybrid)
  { name: 'Fit Shaft GEAR Hybrid Locked #4', lengthMm: 28.5, weightG: 0.88, brand: 'COSMO', system: 'COSMO' },
  { name: 'Fit Shaft GEAR Hybrid Locked #6', lengthMm: 35.0, weightG: 1.02, brand: 'COSMO', system: 'COSMO' },
  // Target Pro Grip
  { name: 'Target Pro Grip Short', lengthMm: 34.0, weightG: 1.20, brand: 'Target', system: 'standard' },
  { name: 'Target Pro Grip Medium', lengthMm: 41.0, weightG: 1.40, brand: 'Target', system: 'standard' },
  { name: 'Target Pro Grip Intermediate', lengthMm: 48.0, weightG: 1.60, brand: 'Target', system: 'standard' },
  // Harrows Clic
  { name: 'Harrows Clic Short', lengthMm: 30.0, weightG: 1.10, brand: 'Harrows', system: 'harrows-clic' },
  { name: 'Harrows Clic Medium', lengthMm: 37.0, weightG: 1.30, brand: 'Harrows', system: 'harrows-clic' },
  // Joker Driver
  { name: 'Zero Shaft Short', lengthMm: 28.0, weightG: 0.65, brand: 'Joker Driver', system: 'standard' },
  { name: 'Zero Shaft Medium', lengthMm: 35.0, weightG: 0.80, brand: 'Joker Driver', system: 'standard' },
];

// --- フライト ---
export const FLIGHTS: FlightSpec[] = [
  // L-style L-Flight
  { name: 'L-Flight スタンダード', shape: 'standard', weightG: 0.65, brand: 'L-style', system: 'L-style' },
  { name: 'L-Flight シェイプ', shape: 'kite', weightG: 0.58, brand: 'L-style', system: 'L-style' },
  { name: 'L-Flight スモール', shape: 'small', weightG: 0.61, brand: 'L-style', system: 'L-style' },
  { name: 'L-Flight ティアドロップ', shape: 'teardrop', weightG: 0.55, brand: 'L-style', system: 'L-style' },
  { name: 'L-Flight スリム', shape: 'slim', weightG: 0.48, brand: 'L-style', system: 'L-style' },
  // L-style L-Flight PRO
  { name: 'L-Flight PRO スタンダード', shape: 'standard', weightG: 0.60, brand: 'L-style', system: 'L-style' },
  { name: 'L-Flight PRO スモール', shape: 'small', weightG: 0.55, brand: 'L-style', system: 'L-style' },
  { name: 'L-Flight PRO スリム', shape: 'slim', weightG: 0.43, brand: 'L-style', system: 'L-style' },
  // L-style L-Flight EZ
  { name: 'L-Flight EZ スタンダード', shape: 'standard', weightG: 0.62, brand: 'L-style', system: 'L-style' },
  { name: 'L-Flight EZ シェイプ', shape: 'kite', weightG: 0.55, brand: 'L-style', system: 'L-style' },
  { name: 'L-Flight EZ スリム', shape: 'slim', weightG: 0.45, brand: 'L-style', system: 'L-style' },
  // L-style L-Flight KAMI (和紙フライト)
  { name: 'L-Flight KAMI スタンダード', shape: 'standard', weightG: 0.63, brand: 'L-style', system: 'L-style' },
  { name: 'L-Flight KAMI スモール', shape: 'small', weightG: 0.57, brand: 'L-style', system: 'L-style' },
  // COSMO Fit Flight
  { name: 'Fit Flight スタンダード', shape: 'standard', weightG: 0.88, brand: 'COSMO', system: 'COSMO' },
  { name: 'Fit Flight シェイプ', shape: 'kite', weightG: 0.78, brand: 'COSMO', system: 'COSMO' },
  { name: 'Fit Flight スリム', shape: 'slim', weightG: 0.62, brand: 'COSMO', system: 'COSMO' },
  // COSMO Fit Flight AIR
  { name: 'Fit Flight AIR スタンダード', shape: 'standard', weightG: 0.64, brand: 'COSMO', system: 'COSMO' },
  { name: 'Fit Flight AIR シェイプ', shape: 'kite', weightG: 0.57, brand: 'COSMO', system: 'COSMO' },
  { name: 'Fit Flight AIR スリム', shape: 'slim', weightG: 0.45, brand: 'COSMO', system: 'COSMO' },
  // COSMO Fit Flight PRO
  { name: 'Fit Flight PRO スタンダード', shape: 'standard', weightG: 0.90, brand: 'COSMO', system: 'COSMO' },
  { name: 'Fit Flight PRO シェイプ', shape: 'kite', weightG: 0.80, brand: 'COSMO', system: 'COSMO' },
  { name: 'Fit Flight PRO スリム', shape: 'slim', weightG: 0.65, brand: 'COSMO', system: 'COSMO' },
  // Harrows Clic
  { name: 'Harrows Clic スタンダード', shape: 'standard', weightG: 0.80, brand: 'Harrows', system: 'harrows-clic' },
  { name: 'Harrows Clic シェイプ', shape: 'kite', weightG: 0.70, brand: 'Harrows', system: 'harrows-clic' },
  { name: 'Harrows Clic スリム', shape: 'slim', weightG: 0.55, brand: 'Harrows', system: 'harrows-clic' },
  // 標準フライト
  { name: '標準フライト スタンダード', shape: 'standard', weightG: 0.90, brand: '汎用', system: 'standard' },
  { name: '標準フライト シェイプ', shape: 'kite', weightG: 0.80, brand: '汎用', system: 'standard' },
  { name: '標準フライト スリム', shape: 'slim', weightG: 0.65, brand: '汎用', system: 'standard' },
  // 8Flight
  { name: '8Flight スタンダード', shape: 'standard', weightG: 0.85, brand: '8Flight', system: 'standard' },
  { name: '8Flight シェイプ', shape: 'kite', weightG: 0.75, brand: '8Flight', system: 'standard' },
  { name: '8Flight スリム', shape: 'slim', weightG: 0.60, brand: '8Flight', system: 'standard' },
];

// --- CONDOR AXE (シャフト+フライト一体型) ---
export const CONDOR_AXE: CondorAxeSpec[] = [
  // スタンダード
  { name: 'CONDOR AXE スタンダード', shape: 'standard', shaftLengthLabel: 'S (Short)', shaftLengthMm: 21.5, totalWeightG: 1.54 },
  { name: 'CONDOR AXE スタンダード', shape: 'standard', shaftLengthLabel: 'M (Medium)', shaftLengthMm: 27.5, totalWeightG: 1.61 },
  { name: 'CONDOR AXE スタンダード', shape: 'standard', shaftLengthLabel: 'L (Long)', shaftLengthMm: 33.5, totalWeightG: 1.72 },
  // スモール
  { name: 'CONDOR AXE スモール', shape: 'small', shaftLengthLabel: 'S (Short)', shaftLengthMm: 21.5, totalWeightG: 1.42 },
  { name: 'CONDOR AXE スモール', shape: 'small', shaftLengthLabel: 'M (Medium)', shaftLengthMm: 27.5, totalWeightG: 1.52 },
  { name: 'CONDOR AXE スモール', shape: 'small', shaftLengthLabel: 'L (Long)', shaftLengthMm: 33.5, totalWeightG: 1.61 },
  { name: 'CONDOR AXE スモール', shape: 'small', shaftLengthLabel: 'XL (Extra Long)', shaftLengthMm: 37.5, totalWeightG: 1.70 },
  // スリム
  { name: 'CONDOR AXE スリム', shape: 'slim', shaftLengthLabel: 'S (Short)', shaftLengthMm: 21.5, totalWeightG: 1.35 },
  { name: 'CONDOR AXE スリム', shape: 'slim', shaftLengthLabel: 'M (Medium)', shaftLengthMm: 27.5, totalWeightG: 1.45 },
  { name: 'CONDOR AXE スリム', shape: 'slim', shaftLengthLabel: 'L (Long)', shaftLengthMm: 33.5, totalWeightG: 1.55 },
];

// ユニークなシェイプ名の一覧
export const FLIGHT_SHAPES = ['standard', 'slim', 'kite', 'teardrop', 'small'] as const;
export type FlightShape = (typeof FLIGHT_SHAPES)[number];

export const FLIGHT_SHAPE_LABELS: Record<FlightShape, string> = {
  standard: 'スタンダード',
  slim: 'スリム',
  kite: 'シェイプ',
  teardrop: 'ティアドロップ',
  small: 'スモール',
};

// --- シャフト↔フライト互換性チェック ---
const SYSTEM_LABELS: Record<PartsSystem, string> = {
  'L-style': 'L-style',
  'COSMO': 'Fit Flight',
  'standard': '標準',
  'harrows-clic': 'Harrows Clic',
};

export function checkShaftFlightCompatibility(
  shaft: ShaftSpec | null,
  flight: FlightSpec | null,
): string | null {
  if (!shaft || !flight) return null;
  if (shaft.system === flight.system) return null;
  // standard shaft + standard flight (including 8Flight) = OK
  if (shaft.system === 'standard' && flight.system === 'standard') return null;
  return `${SYSTEM_LABELS[shaft.system]}のシャフトに${SYSTEM_LABELS[flight.system]}のフライトは装着できません`;
}

// --- バレルカット ---
export const BARREL_CUTS: string[] = [
  'リングカット',
  'マイクロリングカット',
  'シャークカット',
  'マイクログルーブ',
  'ピクセルカット',
  'ウィングカット',
  'トライアングルカット',
  'ダブルリングカット',
  'ナットカット',
  '縦カット',
  'サンドブラスト',
  'ノーグルーブ',
  'スパイラルカット',
  'ヘリカルカット',
  'ハニカムカット',
  'クロスカット',
  'Xカット',
  'ダイヤカット',
];
