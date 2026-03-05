/**
 * ダーツボードSVG共通ユーティリティ
 * DartboardHeatmap / MiniDartboardSvg で共有する定数と関数
 */

/** ダーツボードの数字配置（12時=20、時計回り） */
export const BOARD_ORDER = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];

/** 基準サイズ (スケーリングの基準) */
export const BASE_SIZE = 300;

// 半径定義（ダーツボードの各リング）— BASE_SIZE=300 基準
export const R_DOUBLE_OUTER = 140;
export const R_DOUBLE_INNER = 130;
export const R_OUTER_SINGLE_INNER = 82;
export const R_TRIPLE_OUTER = 82;
export const R_TRIPLE_INNER = 72;
export const R_INNER_SINGLE_INNER = 18;
export const R_BULL = 18;
export const R_DBULL = 8;

/** 扇形のSVGパスを生成 */
export function arcPath(
  cx: number,
  cy: number,
  innerR: number,
  outerR: number,
  startAngle: number,
  endAngle: number,
): string {
  const toRad = (deg: number) => ((deg - 90) * Math.PI) / 180;
  const sa = toRad(startAngle);
  const ea = toRad(endAngle);

  const x1 = cx + innerR * Math.cos(sa);
  const y1 = cy + innerR * Math.sin(sa);
  const x2 = cx + outerR * Math.cos(sa);
  const y2 = cy + outerR * Math.sin(sa);
  const x3 = cx + outerR * Math.cos(ea);
  const y3 = cy + outerR * Math.sin(ea);
  const x4 = cx + innerR * Math.cos(ea);
  const y4 = cy + innerR * Math.sin(ea);

  return [
    `M ${x1} ${y1}`,
    `L ${x2} ${y2}`,
    `A ${outerR} ${outerR} 0 0 1 ${x3} ${y3}`,
    `L ${x4} ${y4}`,
    `A ${innerR} ${innerR} 0 0 0 ${x1} ${y1}`,
    'Z',
  ].join(' ');
}

/** ヒートマップ色（青→黄→赤 グラデーション） */
export function heatColor(intensity: number): string {
  if (intensity <= 0) return 'transparent';
  if (intensity < 0.33) {
    const t = intensity / 0.33;
    const r = Math.round(30 + t * 50);
    const g = Math.round(80 + t * 120);
    const b = Math.round(180 - t * 80);
    return `rgb(${r},${g},${b})`;
  }
  if (intensity < 0.66) {
    const t = (intensity - 0.33) / 0.33;
    const r = Math.round(80 + t * 175);
    const g = Math.round(200 - t * 50);
    const b = Math.round(100 - t * 80);
    return `rgb(${r},${g},${b})`;
  }
  const t = (intensity - 0.66) / 0.34;
  const r = Math.round(255);
  const g = Math.round(150 - t * 120);
  const b = Math.round(20 - t * 20);
  return `rgb(${r},${g},${b})`;
}
