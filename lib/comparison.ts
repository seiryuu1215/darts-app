/**
 * 2つの数値の差分に応じた色を返す。
 * 大きい方が赤、同値なら緑。
 */
export function getDiffColors(
  valueA: number | null | undefined,
  valueB: number | null | undefined,
  maxDiffPercent = 20
): { colorA: string; colorB: string } {
  const inherit = { colorA: 'inherit', colorB: 'inherit' };

  if (valueA == null || valueB == null) return inherit;

  // 同値 → 緑
  if (valueA === valueB) {
    const green = 'rgba(46, 125, 50, 0.85)';
    return { colorA: green, colorB: green };
  }

  const avg = (valueA + valueB) / 2;
  if (avg === 0) return inherit;

  const diffPercent = (Math.abs(valueA - valueB) / avg) * 100;
  // 0.3 〜 1.0 の範囲で不透明度を決定
  const alpha = Math.min(0.3 + (diffPercent / maxDiffPercent) * 0.7, 1.0);
  const red = `rgba(220, 0, 78, ${alpha.toFixed(2)})`;

  return {
    colorA: valueA > valueB ? red : 'inherit',
    colorB: valueB > valueA ? red : 'inherit',
  };
}
