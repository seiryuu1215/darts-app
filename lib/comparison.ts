/**
 * 2つの数値を比較し、大きい方を緑で表示する。
 * 同値の場合は色なし（inherit）。
 */
export function getDiffColors(
  valueA: number | null | undefined,
  valueB: number | null | undefined,
): { colorA: string; colorB: string } {
  const inherit = { colorA: 'inherit', colorB: 'inherit' };
  if (valueA == null || valueB == null) return inherit;
  if (valueA === valueB) return inherit;

  const green = '#4caf50';
  return {
    colorA: valueA > valueB ? green : 'inherit',
    colorB: valueB > valueA ? green : 'inherit',
  };
}
