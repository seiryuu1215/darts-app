/**
 * ダートアウトスコア → フィニッシュ方法ラベル変換
 *
 * 01ゲームの残りスコア(DART_OUT_LIST の SCORE)に対して、
 * フィニッシュ方法を表すラベルを返す。
 *
 * ダブルアウト: D1-D20, BULL(50)
 * シングルアウト: S1-S20 (ストレートアウト)
 * トリプルアウト: T1-T20 (マスターアウト, 51-60)
 */
export function getDartoutLabel(score: number): string {
  // BULL (50)
  if (score === 50) return 'BULL';

  // ダブル: 偶数 2-40 → D1-D20
  if (score >= 2 && score <= 40 && score % 2 === 0) return `D${score / 2}`;

  // シングル: 奇数 1-20 → S1-S20
  if (score >= 1 && score <= 20 && score % 2 === 1) return `S${score}`;

  // 25 (シングルブル/アウターブル)
  if (score === 25) return 'S-BULL';

  // トリプル: 3の倍数 51-60 → T17-T20 (マスターアウト)
  if (score >= 51 && score <= 60 && score % 3 === 0) return `T${score / 3}`;

  // その他の高スコア: 41-60の非ダブル非トリプル
  if (score >= 41 && score <= 60) {
    // ダブル部分 (42,44,46,48,52,54,56,58,60 は偶数)
    if (score % 2 === 0) return `D${score / 2}`;
    // 残りの奇数 (41,43,45,47,49,51,53,55,57,59)
    // トリプルで上がれるもの: 51=T17, 54=T18, 57=T19 — 既に上でカバー済み
    // それ以外はコンビネーション
    return `${score}`;
  }

  // 61以上: ダブルブル(50)以外の高残りフィニッシュは稀
  return `${score}`;
}
