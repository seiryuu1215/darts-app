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
  shape: 'standard' | 'slim' | 'kite' | 'teardrop' | 'small' | 'rocket' | 'z' | 'astra' | 'bullet';
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
  // === L-style ポリカーボネート ===
  // L-Shaft Lock Straight (PC, ロック/固定, ストレート)
  { name: 'L-Shaft Lock Straight 130 (Extra Short)', lengthMm: 13.0, weightG: 0.57, brand: 'L-style', system: 'L-style' },
  { name: 'L-Shaft Lock Straight 190 (Short)', lengthMm: 19.0, weightG: 0.72, brand: 'L-style', system: 'L-style' },
  { name: 'L-Shaft Lock Straight 260 (InBetween)', lengthMm: 26.0, weightG: 0.87, brand: 'L-style', system: 'L-style' },
  { name: 'L-Shaft Lock Straight 330 (Medium)', lengthMm: 33.0, weightG: 1.03, brand: 'L-style', system: 'L-style' },
  // L-Shaft Silent Straight (PC, サイレント/回転, ストレート)
  { name: 'L-Shaft Silent Straight 130 (Extra Short)', lengthMm: 13.0, weightG: 0.53, brand: 'L-style', system: 'L-style' },
  { name: 'L-Shaft Silent Straight 190 (Short)', lengthMm: 19.0, weightG: 0.67, brand: 'L-style', system: 'L-style' },
  { name: 'L-Shaft Silent Straight 260 (InBetween)', lengthMm: 26.0, weightG: 0.84, brand: 'L-style', system: 'L-style' },
  { name: 'L-Shaft Silent Straight 330 (Medium)', lengthMm: 33.0, weightG: 0.99, brand: 'L-style', system: 'L-style' },
  // L-Shaft Lock Slim (PC, ロック/固定, スリム)
  { name: 'L-Shaft Lock Slim 300 (Short)', lengthMm: 30.0, weightG: 0.71, brand: 'L-style', system: 'L-style' },
  { name: 'L-Shaft Lock Slim 370 (Medium)', lengthMm: 37.0, weightG: 0.78, brand: 'L-style', system: 'L-style' },
  { name: 'L-Shaft Lock Slim 440 (Long)', lengthMm: 44.0, weightG: 0.86, brand: 'L-style', system: 'L-style' },
  // L-Shaft Silent Slim (PC, サイレント/回転, スリム)
  { name: 'L-Shaft Silent Slim 300 (Short)', lengthMm: 30.0, weightG: 0.77, brand: 'L-style', system: 'L-style' },
  { name: 'L-Shaft Silent Slim 370 (Medium)', lengthMm: 37.0, weightG: 0.84, brand: 'L-style', system: 'L-style' },
  { name: 'L-Shaft Silent Slim 440 (Long)', lengthMm: 44.0, weightG: 0.93, brand: 'L-style', system: 'L-style' },
  // === L-style カーボン ===
  // L-Shaft Carbon Lock Straight (カーボン, ロック/固定, ストレート)
  { name: 'L-Shaft Carbon Lock Straight 130 (Extra Short)', lengthMm: 13.0, weightG: 0.63, brand: 'L-style', system: 'L-style' },
  { name: 'L-Shaft Carbon Lock Straight 190 (Short)', lengthMm: 19.0, weightG: 0.76, brand: 'L-style', system: 'L-style' },
  { name: 'L-Shaft Carbon Lock Straight 225 (Short+)', lengthMm: 22.5, weightG: 0.85, brand: 'L-style', system: 'L-style' },
  { name: 'L-Shaft Carbon Lock Straight 260 (InBetween)', lengthMm: 26.0, weightG: 0.95, brand: 'L-style', system: 'L-style' },
  { name: 'L-Shaft Carbon Lock Straight 295 (InBetween+)', lengthMm: 29.5, weightG: 1.00, brand: 'L-style', system: 'L-style' },
  { name: 'L-Shaft Carbon Lock Straight 330 (Medium)', lengthMm: 33.0, weightG: 1.10, brand: 'L-style', system: 'L-style' },
  // L-Shaft Carbon Silent Straight (カーボン, サイレント/回転, ストレート)
  { name: 'L-Shaft Carbon Silent Straight 130 (Extra Short)', lengthMm: 13.0, weightG: 0.55, brand: 'L-style', system: 'L-style' },
  { name: 'L-Shaft Carbon Silent Straight 190 (Short)', lengthMm: 19.0, weightG: 0.69, brand: 'L-style', system: 'L-style' },
  { name: 'L-Shaft Carbon Silent Straight 260 (InBetween)', lengthMm: 26.0, weightG: 0.86, brand: 'L-style', system: 'L-style' },
  { name: 'L-Shaft Carbon Silent Straight 330 (Medium)', lengthMm: 33.0, weightG: 1.00, brand: 'L-style', system: 'L-style' },
  // L-Shaft Carbon Lock Slim (カーボン, ロック/固定, スリム)
  { name: 'L-Shaft Carbon Lock Slim 300 (Short)', lengthMm: 30.0, weightG: 0.77, brand: 'L-style', system: 'L-style' },
  { name: 'L-Shaft Carbon Lock Slim 370 (Medium)', lengthMm: 37.0, weightG: 0.85, brand: 'L-style', system: 'L-style' },
  { name: 'L-Shaft Carbon Lock Slim 440 (Long)', lengthMm: 44.0, weightG: 0.93, brand: 'L-style', system: 'L-style' },
  // L-Shaft Carbon Silent Slim (カーボン, サイレント/回転, スリム)
  { name: 'L-Shaft Carbon Silent Slim 300 (Short)', lengthMm: 30.0, weightG: 0.78, brand: 'L-style', system: 'L-style' },
  { name: 'L-Shaft Carbon Silent Slim 370 (Medium)', lengthMm: 37.0, weightG: 0.87, brand: 'L-style', system: 'L-style' },
  { name: 'L-Shaft Carbon Silent Slim 440 (Long)', lengthMm: 44.0, weightG: 0.95, brand: 'L-style', system: 'L-style' },
  // === L-style プレミアムカーボン ===
  // L-Shaft Premium Carbon Lock Straight (カーボン+金属芯, ロック/固定)
  { name: 'L-Shaft Premium Carbon 190 (Short)', lengthMm: 19.0, weightG: 0.90, brand: 'L-style', system: 'L-style' },
  { name: 'L-Shaft Premium Carbon 225 (Short+)', lengthMm: 22.5, weightG: 0.99, brand: 'L-style', system: 'L-style' },
  { name: 'L-Shaft Premium Carbon 260 (InBetween)', lengthMm: 26.0, weightG: 1.08, brand: 'L-style', system: 'L-style' },
  { name: 'L-Shaft Premium Carbon 295 (InBetween+)', lengthMm: 29.5, weightG: 1.15, brand: 'L-style', system: 'L-style' },
  { name: 'L-Shaft Premium Carbon 330 (Medium)', lengthMm: 33.0, weightG: 1.24, brand: 'L-style', system: 'L-style' },
  // === COSMO ===
  // Fit Shaft GEAR Normal
  { name: 'Fit Shaft GEAR Normal #1', lengthMm: 13.0, weightG: 0.52, brand: 'COSMO', system: 'COSMO' },
  { name: 'Fit Shaft GEAR Normal #2', lengthMm: 18.0, weightG: 0.61, brand: 'COSMO', system: 'COSMO' },
  { name: 'Fit Shaft GEAR Normal #3', lengthMm: 24.0, weightG: 0.75, brand: 'COSMO', system: 'COSMO' },
  { name: 'Fit Shaft GEAR Normal #4', lengthMm: 28.5, weightG: 0.84, brand: 'COSMO', system: 'COSMO' },
  { name: 'Fit Shaft GEAR Normal #5', lengthMm: 31.0, weightG: 0.89, brand: 'COSMO', system: 'COSMO' },
  { name: 'Fit Shaft GEAR Normal #6', lengthMm: 35.0, weightG: 0.97, brand: 'COSMO', system: 'COSMO' },
  { name: 'Fit Shaft GEAR Normal #7', lengthMm: 38.5, weightG: 1.04, brand: 'COSMO', system: 'COSMO' },
  { name: 'Fit Shaft GEAR Normal #8', lengthMm: 42.5, weightG: 1.13, brand: 'COSMO', system: 'COSMO' },
  // Fit Shaft GEAR Slim
  { name: 'Fit Shaft GEAR Slim #1', lengthMm: 13.0, weightG: 0.48, brand: 'COSMO', system: 'COSMO' },
  { name: 'Fit Shaft GEAR Slim #3', lengthMm: 24.0, weightG: 0.65, brand: 'COSMO', system: 'COSMO' },
  { name: 'Fit Shaft GEAR Slim #5', lengthMm: 31.0, weightG: 0.78, brand: 'COSMO', system: 'COSMO' },
  { name: 'Fit Shaft GEAR Slim #7', lengthMm: 38.5, weightG: 0.90, brand: 'COSMO', system: 'COSMO' },
  // Fit Shaft GEAR Hybrid Locked
  { name: 'Fit Shaft GEAR Hybrid Locked #4', lengthMm: 28.5, weightG: 0.88, brand: 'COSMO', system: 'COSMO' },
  { name: 'Fit Shaft GEAR Hybrid Locked #6', lengthMm: 35.0, weightG: 1.02, brand: 'COSMO', system: 'COSMO' },
  // === Target ===
  { name: 'Target Pro Grip Short', lengthMm: 34.0, weightG: 1.20, brand: 'Target', system: 'standard' },
  { name: 'Target Pro Grip Medium', lengthMm: 41.0, weightG: 1.40, brand: 'Target', system: 'standard' },
  { name: 'Target Pro Grip Intermediate', lengthMm: 48.0, weightG: 1.60, brand: 'Target', system: 'standard' },
  // === Harrows ===
  { name: 'Harrows Clic Short', lengthMm: 30.0, weightG: 1.10, brand: 'Harrows', system: 'harrows-clic' },
  { name: 'Harrows Clic Medium', lengthMm: 37.0, weightG: 1.30, brand: 'Harrows', system: 'harrows-clic' },
  // === Joker Driver ===
  { name: 'Zero Shaft Short', lengthMm: 28.0, weightG: 0.65, brand: 'Joker Driver', system: 'standard' },
  { name: 'Zero Shaft Medium', lengthMm: 35.0, weightG: 0.80, brand: 'Joker Driver', system: 'standard' },
];

// --- フライト ---
export const FLIGHTS: FlightSpec[] = [
  // === L-style L-Flight PRO (チャンパンリング別, 全9形状) ===
  { name: 'L-Flight PRO L1 スタンダード', shape: 'standard', weightG: 0.65, brand: 'L-style', system: 'L-style' },
  { name: 'L-Flight PRO L3 シェイプ', shape: 'small', weightG: 0.61, brand: 'L-style', system: 'L-style' },
  { name: 'L-Flight PRO L2 ティアドロップ', shape: 'teardrop', weightG: 0.55, brand: 'L-style', system: 'L-style' },
  { name: 'L-Flight PRO L4 カイト', shape: 'kite', weightG: 0.54, brand: 'L-style', system: 'L-style' },
  { name: 'L-Flight PRO L5 ロケット', shape: 'rocket', weightG: 0.55, brand: 'L-style', system: 'L-style' },
  { name: 'L-Flight PRO L6 スリム', shape: 'slim', weightG: 0.48, brand: 'L-style', system: 'L-style' },
  { name: 'L-Flight PRO L7 アストラ', shape: 'astra', weightG: 0.48, brand: 'L-style', system: 'L-style' },
  { name: 'L-Flight PRO L8 バレット', shape: 'bullet', weightG: 0.44, brand: 'L-style', system: 'L-style' },
  { name: 'L-Flight PRO L9 Z', shape: 'z', weightG: 0.60, brand: 'L-style', system: 'L-style' },
  // === L-style L-Flight EZ (チャンパンリング一体型, L1/L3/L6のみ) ===
  { name: 'L-Flight EZ L1 スタンダード', shape: 'standard', weightG: 0.65, brand: 'L-style', system: 'L-style' },
  { name: 'L-Flight EZ L3 シェイプ', shape: 'small', weightG: 0.61, brand: 'L-style', system: 'L-style' },
  { name: 'L-Flight EZ L6 スリム', shape: 'slim', weightG: 0.48, brand: 'L-style', system: 'L-style' },
  // === L-style L-Flight PRO KAMI (しなやか/紙フライト風, L1k/L3kのみ) ===
  { name: 'L-Flight PRO KAMI L1k スタンダード', shape: 'standard', weightG: 0.62, brand: 'L-style', system: 'L-style' },
  { name: 'L-Flight PRO KAMI L3k シェイプ', shape: 'small', weightG: 0.62, brand: 'L-style', system: 'L-style' },
  // === L-style L-Flight PRO dimple (ディンプル加工, L1d/L3d/L6d/L9d) ===
  { name: 'L-Flight PRO dimple L1d スタンダード', shape: 'standard', weightG: 0.65, brand: 'L-style', system: 'L-style' },
  { name: 'L-Flight PRO dimple L3d シェイプ', shape: 'small', weightG: 0.61, brand: 'L-style', system: 'L-style' },
  { name: 'L-Flight PRO dimple L6d スリム', shape: 'slim', weightG: 0.48, brand: 'L-style', system: 'L-style' },
  { name: 'L-Flight PRO dimple L9d Z', shape: 'z', weightG: 0.60, brand: 'L-style', system: 'L-style' },
  // === L-style L-Flight FANTOM (最硬・最重・EZ型一体, L1/L3のみ) ===
  { name: 'L-Flight FANTOM L1 スタンダード', shape: 'standard', weightG: 1.02, brand: 'L-style', system: 'L-style' },
  { name: 'L-Flight FANTOM L3 シェイプ', shape: 'small', weightG: 1.02, brand: 'L-style', system: 'L-style' },
  // === COSMO ===
  // Fit Flight
  { name: 'Fit Flight スタンダード', shape: 'standard', weightG: 0.88, brand: 'COSMO', system: 'COSMO' },
  { name: 'Fit Flight シェイプ', shape: 'kite', weightG: 0.78, brand: 'COSMO', system: 'COSMO' },
  { name: 'Fit Flight スリム', shape: 'slim', weightG: 0.62, brand: 'COSMO', system: 'COSMO' },
  // Fit Flight AIR
  { name: 'Fit Flight AIR スタンダード', shape: 'standard', weightG: 0.64, brand: 'COSMO', system: 'COSMO' },
  { name: 'Fit Flight AIR シェイプ', shape: 'kite', weightG: 0.57, brand: 'COSMO', system: 'COSMO' },
  { name: 'Fit Flight AIR スリム', shape: 'slim', weightG: 0.45, brand: 'COSMO', system: 'COSMO' },
  // Fit Flight PRO
  { name: 'Fit Flight PRO スタンダード', shape: 'standard', weightG: 0.90, brand: 'COSMO', system: 'COSMO' },
  { name: 'Fit Flight PRO シェイプ', shape: 'kite', weightG: 0.80, brand: 'COSMO', system: 'COSMO' },
  { name: 'Fit Flight PRO スリム', shape: 'slim', weightG: 0.65, brand: 'COSMO', system: 'COSMO' },
  // === Harrows ===
  { name: 'Harrows Clic スタンダード', shape: 'standard', weightG: 0.80, brand: 'Harrows', system: 'harrows-clic' },
  { name: 'Harrows Clic シェイプ', shape: 'kite', weightG: 0.70, brand: 'Harrows', system: 'harrows-clic' },
  { name: 'Harrows Clic スリム', shape: 'slim', weightG: 0.55, brand: 'Harrows', system: 'harrows-clic' },
  // === 8Flight ===
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
export const FLIGHT_SHAPES = ['standard', 'slim', 'kite', 'teardrop', 'small', 'rocket', 'z', 'astra', 'bullet'] as const;
export type FlightShape = (typeof FLIGHT_SHAPES)[number];

export const FLIGHT_SHAPE_LABELS: Record<FlightShape, string> = {
  standard: 'スタンダード',
  slim: 'スリム',
  kite: 'シェイプ',
  teardrop: 'ティアドロップ',
  small: 'スモール',
  rocket: 'ロケット',
  z: 'Z',
  astra: 'アストラ',
  bullet: 'バレット',
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
