/**
 * ダートアウトスコア → フィニッシュ方法ラベル変換
 */
export function getDartoutLabel(score: number): string {
  if (score === 50) return 'BULL';
  if (score >= 2 && score <= 40 && score % 2 === 0) return `D${score / 2}`;
  return '';
}
