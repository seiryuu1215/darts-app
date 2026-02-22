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
