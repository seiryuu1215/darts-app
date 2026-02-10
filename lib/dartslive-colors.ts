/**
 * DARTSLIVE アプリ準拠のフライトカラー & カテゴリカラー
 */

// フライト別カラー（DARTSLIVEアプリ準拠）
export const FLIGHT_COLORS: Record<string, string> = {
  N:  '#808080', // グレー
  C:  '#4CAF50', // グリーン
  CC: '#00ACC1', // シアン
  B:  '#1E88E5', // ブルー
  BB: '#7B1FA2', // パープル
  A:  '#E53935', // レッド
  AA: '#F4511E', // ディープオレンジ
  SA: '#F9A825', // ゴールド
};

export function getFlightColor(flight: string): string {
  return FLIGHT_COLORS[flight] || '#808080';
}

// ゲームカテゴリカラー
export const COLOR_01 = '#E53935';       // 01 - レッド
export const COLOR_CRICKET = '#1E88E5';  // Cricket - ブルー
export const COLOR_COUNTUP = '#43A047';  // COUNT-UP - グリーン
