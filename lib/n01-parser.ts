/**
 * n01 CSV パーサー（純粋関数）
 *
 * n01 のCSV出力フォーマット:
 * - タブ区切りまたはカンマ区切り
 * - ヘッダ行あり
 * - 各行: Date, Game, Round, Score/Point, ... (バリエーションあり)
 */

export interface N01Session {
  date: string; // YYYY-MM-DD
  gameType: string; // "501", "Cricket", etc.
  rounds: number;
  totalScore: number;
  avgPerRound: number;
}

export interface N01ParseResult {
  sessions: N01Session[];
  errors: string[];
  totalRows: number;
}

/**
 * n01 CSVテキストをパースしてセッション配列を返す
 */
export function parseN01Csv(csvText: string): N01ParseResult {
  const errors: string[] = [];
  const sessions: N01Session[] = [];

  const lines = csvText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .filter((l) => l.trim().length > 0);

  if (lines.length < 2) {
    return { sessions: [], errors: ['データが空または行数不足です'], totalRows: 0 };
  }

  // 区切り文字を自動検出
  const headerLine = lines[0];
  const separator = headerLine.includes('\t') ? '\t' : ',';
  const headers = headerLine.split(separator).map((h) => h.trim().toLowerCase());

  // カラムインデックス解決
  const dateIdx = headers.findIndex((h) => h === 'date' || h === '日付');
  const gameIdx = headers.findIndex(
    (h) => h === 'game' || h === 'game type' || h === 'ゲーム' || h === 'type',
  );
  const roundIdx = headers.findIndex((h) => h === 'round' || h === 'rounds' || h === 'ラウンド');
  const scoreIdx = headers.findIndex(
    (h) =>
      h === 'score' ||
      h === 'total' ||
      h === 'point' ||
      h === 'スコア' ||
      h === 'total score' ||
      h === 'avg',
  );

  if (dateIdx === -1) {
    errors.push('日付カラムが見つかりません');
    return { sessions: [], errors, totalRows: lines.length - 1 };
  }

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(separator).map((c) => c.trim());
    if (cols.length <= dateIdx) continue;

    try {
      const rawDate = cols[dateIdx];
      const date = normalizeDate(rawDate);
      if (!date) {
        errors.push(`行${i + 1}: 日付を解析できません: "${rawDate}"`);
        continue;
      }

      const gameType = gameIdx >= 0 && cols[gameIdx] ? cols[gameIdx] : 'Unknown';
      const rounds = roundIdx >= 0 && cols[roundIdx] ? parseInt(cols[roundIdx], 10) || 0 : 0;
      const totalScore = scoreIdx >= 0 && cols[scoreIdx] ? parseFloat(cols[scoreIdx]) || 0 : 0;
      const avgPerRound = rounds > 0 ? totalScore / rounds : 0;

      sessions.push({
        date,
        gameType,
        rounds,
        totalScore,
        avgPerRound: Math.round(avgPerRound * 100) / 100,
      });
    } catch {
      errors.push(`行${i + 1}: パースエラー`);
    }
  }

  return { sessions, errors, totalRows: lines.length - 1 };
}

/**
 * 様々な日付フォーマットを YYYY-MM-DD に正規化
 */
function normalizeDate(raw: string): string | null {
  // YYYY-MM-DD or YYYY/MM/DD
  const iso = raw.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  if (iso) {
    return `${iso[1]}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}`;
  }

  // MM/DD/YYYY
  const usFormat = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (usFormat) {
    return `${usFormat[3]}-${usFormat[1].padStart(2, '0')}-${usFormat[2].padStart(2, '0')}`;
  }

  // DD.MM.YYYY
  const euFormat = raw.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (euFormat) {
    return `${euFormat[3]}-${euFormat[2].padStart(2, '0')}-${euFormat[1].padStart(2, '0')}`;
  }

  return null;
}

/**
 * セッションを日付ごとに集約
 */
export function aggregateByDate(
  sessions: N01Session[],
): Map<string, { count: number; totalScore: number; avgScore: number }> {
  const map = new Map<string, { count: number; totalScore: number }>();

  for (const s of sessions) {
    const existing = map.get(s.date) ?? { count: 0, totalScore: 0 };
    existing.count++;
    existing.totalScore += s.totalScore;
    map.set(s.date, existing);
  }

  const result = new Map<string, { count: number; totalScore: number; avgScore: number }>();
  for (const [date, data] of map) {
    result.set(date, {
      ...data,
      avgScore: data.count > 0 ? Math.round(data.totalScore / data.count) : 0,
    });
  }

  return result;
}
