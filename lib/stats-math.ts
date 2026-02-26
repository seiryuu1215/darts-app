/**
 * 共通統計ユーティリティ
 * CountUpAnalysisCard / ConsistencyCard / ZeroOne系カードで共有
 */

export function computeStats(scores: number[]): {
  avg: number;
  max: number;
  min: number;
  median: number;
} {
  const sorted = [...scores].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  const avg = sum / sorted.length;
  const max = sorted[sorted.length - 1];
  const min = sorted[0];
  const median =
    sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];
  return { avg, max, min, median };
}

export function buildHistogram(
  scores: number[],
  binSize: number,
): { range: string; count: number }[] {
  const bins: Record<number, number> = {};
  for (const s of scores) {
    const bin = Math.floor(s / binSize) * binSize;
    bins[bin] = (bins[bin] || 0) + 1;
  }
  const minBin = Math.min(...Object.keys(bins).map(Number));
  const maxBin = Math.max(...Object.keys(bins).map(Number));
  const data: { range: string; count: number }[] = [];
  for (let b = minBin; b <= maxBin; b += binSize) {
    data.push({ range: `${b}-${b + binSize - 1}`, count: bins[b] || 0 });
  }
  return data;
}

export function calculateConsistency(scores: number[]): {
  avg: number;
  stdDev: number;
  cv: number;
  score: number;
} | null {
  if (scores.length < 3) return null;

  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  if (avg === 0) return null;

  const variance = scores.reduce((sum, s) => sum + (s - avg) ** 2, 0) / scores.length;
  const stdDev = Math.sqrt(variance);
  const cv = (stdDev / avg) * 100;
  const score = Math.max(0, Math.min(100, Math.round(100 - cv)));

  return { avg, stdDev, cv, score };
}

export function getConsistencyLabel(score: number): { label: string; color: string } {
  if (score >= 90) return { label: '非常に安定', color: '#4caf50' };
  if (score >= 75) return { label: '安定', color: '#8bc34a' };
  if (score >= 60) return { label: '普通', color: '#ff9800' };
  if (score >= 40) return { label: 'ムラあり', color: '#f44336' };
  return { label: '不安定', color: '#d32f2f' };
}

export function buildScoreBands(
  scores: number[],
  bands: { label: string; min: number; max: number }[],
): { label: string; count: number; percentage: number }[] {
  const total = scores.length;
  if (total === 0) return [];
  return bands.map((band) => {
    const count = scores.filter((s) => s >= band.min && s <= band.max).length;
    return { label: band.label, count, percentage: Math.round((count / total) * 100) };
  });
}

// ─── ダーツボード方向分析 ────────────────────

/**
 * ダーツボードの数字配置（時計回り、12時=20）
 * 各セグメントは18°幅（360/20）
 */
const DARTBOARD_ORDER = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];

/** 各数字の角度（0°=上、時計回り） */
const DARTBOARD_ANGLES: Record<number, number> = {};
DARTBOARD_ORDER.forEach((num, i) => {
  DARTBOARD_ANGLES[num] = i * 18;
});

/** ダーツコードをパース */
export function parseDartCode(code: string): {
  number: number;
  area: 'doubleBull' | 'singleBull' | 'innerSingle' | 'outerSingle' | 'triple' | 'double' | 'out';
  isBull: boolean;
} | null {
  const c = code.trim();
  if (c === 'BB') return { number: 50, area: 'doubleBull', isBull: true };
  if (c === 'B') return { number: 25, area: 'singleBull', isBull: true };
  if (c === 'O' || c === 'PO') return { number: 0, area: 'out', isBull: false };
  const match = c.match(/^(I|S|T|D)(\d+)$/);
  if (!match) return null;
  const num = parseInt(match[2]);
  const prefix = match[1];
  return {
    number: num,
    area:
      prefix === 'T'
        ? 'triple'
        : prefix === 'D'
          ? 'double'
          : prefix === 'I'
            ? 'innerSingle'
            : 'outerSingle',
    isBull: false,
  };
}

/** 方向ラベル */
export type DirectionLabel = '上' | '右上' | '右' | '右下' | '下' | '左下' | '左' | '左上';

const DIRECTION_LABELS: { minAngle: number; maxAngle: number; label: DirectionLabel }[] = [
  { minAngle: 337.5, maxAngle: 360, label: '上' },
  { minAngle: 0, maxAngle: 22.5, label: '上' },
  { minAngle: 22.5, maxAngle: 67.5, label: '右上' },
  { minAngle: 67.5, maxAngle: 112.5, label: '右' },
  { minAngle: 112.5, maxAngle: 157.5, label: '右下' },
  { minAngle: 157.5, maxAngle: 202.5, label: '下' },
  { minAngle: 202.5, maxAngle: 247.5, label: '左下' },
  { minAngle: 247.5, maxAngle: 292.5, label: '左' },
  { minAngle: 292.5, maxAngle: 337.5, label: '左上' },
];

function angleToDirection(angleDeg: number): DirectionLabel {
  const a = ((angleDeg % 360) + 360) % 360;
  for (const d of DIRECTION_LABELS) {
    if (d.minAngle <= a && a < d.maxAngle) return d.label;
  }
  return '上';
}

/** 8方向の集計結果 */
export interface DirectionCount {
  label: DirectionLabel;
  count: number;
  percentage: number;
  numbers: { number: number; count: number }[];
}

/** ミス方向分析結果 */
export interface MissDirectionResult {
  totalDarts: number;
  bullCount: number;
  bullRate: number;
  doubleBullCount: number;
  doubleBullRate: number;
  missCount: number;
  outCount: number;
  /** 8方向のミス分布 */
  directions: DirectionCount[];
  /** 主傾向の方向 */
  primaryDirection: DirectionLabel;
  /** 主傾向の強さ (0-1、0=均等、1=一方向に集中) */
  directionStrength: number;
  /** 加重平均ベクトル (x: 右正, y: 下正) */
  avgVector: { x: number; y: number };
  /** ミスの多いナンバーTOP5 */
  topMissNumbers: { number: number; count: number; percentage: number }[];
}

/**
 * PLAY_LOGデータからミス方向を分析（対象: ブル狙い）
 * @param excludeOuterSingle true の場合、アウターシングル(Sxx)を分析対象から除外
 */
export function analyzeMissDirection(
  playLogs: string[],
  options?: { excludeOuterSingle?: boolean },
): MissDirectionResult | null {
  if (playLogs.length === 0) return null;
  const excludeOuter = options?.excludeOuterSingle ?? false;

  let totalDarts = 0;
  let bullCount = 0;
  let doubleBullCount = 0;
  let outCount = 0;
  const missNumbers: Record<number, number> = {};
  const directionCounts: Record<
    DirectionLabel,
    { count: number; numbers: Record<number, number> }
  > = {
    上: { count: 0, numbers: {} },
    右上: { count: 0, numbers: {} },
    右: { count: 0, numbers: {} },
    右下: { count: 0, numbers: {} },
    下: { count: 0, numbers: {} },
    左下: { count: 0, numbers: {} },
    左: { count: 0, numbers: {} },
    左上: { count: 0, numbers: {} },
  };

  // ベクトル集計用
  let sumX = 0;
  let sumY = 0;
  let missCount = 0;

  for (const log of playLogs) {
    const darts = log.split(',');
    for (const dartCode of darts) {
      const parsed = parseDartCode(dartCode);
      if (!parsed) continue;

      // アウターシングル除外モード
      if (excludeOuter && parsed.area === 'outerSingle') continue;

      totalDarts++;

      if (parsed.isBull) {
        bullCount++;
        if (parsed.area === 'doubleBull') doubleBullCount++;
        continue;
      }

      if (parsed.area === 'out') {
        outCount++;
        continue;
      }

      // ミス: 数字に対応する方向を計算
      missCount++;
      const num = parsed.number;
      missNumbers[num] = (missNumbers[num] || 0) + 1;

      const angleDeg = DARTBOARD_ANGLES[num];
      if (angleDeg == null) continue;

      const angleRad = (angleDeg * Math.PI) / 180;
      // x: sin(angle) → 右が正, y: -cos(angle) → 下が正
      sumX += Math.sin(angleRad);
      sumY += -Math.cos(angleRad);

      const dir = angleToDirection(angleDeg);
      directionCounts[dir].count++;
      directionCounts[dir].numbers[num] = (directionCounts[dir].numbers[num] || 0) + 1;
    }
  }

  if (totalDarts === 0) return null;

  // 8方向分布
  const directions: DirectionCount[] = (
    Object.entries(directionCounts) as [
      DirectionLabel,
      { count: number; numbers: Record<number, number> },
    ][]
  ).map(([label, data]) => ({
    label,
    count: data.count,
    percentage: missCount > 0 ? Math.round((data.count / missCount) * 1000) / 10 : 0,
    numbers: Object.entries(data.numbers)
      .map(([n, c]) => ({ number: Number(n), count: c }))
      .sort((a, b) => b.count - a.count),
  }));

  // 主傾向方向
  const avgX = missCount > 0 ? sumX / missCount : 0;
  const avgY = missCount > 0 ? sumY / missCount : 0;
  const strength = Math.sqrt(avgX * avgX + avgY * avgY);
  // atan2(x, -y) で0°=上の角度系に変換
  const avgAngle = ((Math.atan2(avgX, -avgY) * 180) / Math.PI + 360) % 360;
  const primaryDirection = angleToDirection(avgAngle);

  // TOP5 ミスナンバー
  const topMissNumbers = Object.entries(missNumbers)
    .map(([n, c]) => ({
      number: Number(n),
      count: c,
      percentage: Math.round((c / missCount) * 1000) / 10,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalDarts,
    bullCount,
    bullRate: Math.round((bullCount / totalDarts) * 1000) / 10,
    doubleBullCount,
    doubleBullRate: Math.round((doubleBullCount / totalDarts) * 1000) / 10,
    missCount,
    outCount,
    directions,
    primaryDirection,
    directionStrength: Math.min(strength, 1),
    avgVector: { x: avgX, y: avgY },
    topMissNumbers,
  };
}

/** DARTSLIVE API の TIME 文字列 ("YYYY-MM-DD HH:mm:ss" / "YYYY-MM-DD_HH:mm:ss") を安全にパース */
export function parsePlayTime(time: string): Date {
  return new Date(time.replace(/ |_/, 'T'));
}
