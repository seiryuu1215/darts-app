/**
 * DL3センサートレンド分析ユーティリティ
 * ベクトル位置の推移、グルーピング半径の改善トレンド、スピード×スコア相関
 */

interface SensorPlay {
  time: string;
  score: number;
  dl3VectorX: number;
  dl3VectorY: number;
  dl3Radius: number;
  dl3Speed: number;
}

/** センサートレンドの移動平均ポイント */
export interface SensorTrendPoint {
  index: number;
  date: string;
  vectorX: number;
  vectorY: number;
  radius: number;
  speed: number;
  score: number;
  // 移動平均
  radiusSma: number | null;
  speedSma: number | null;
}

/** スピード帯別スコア分析 */
export interface SpeedBucket {
  speedRange: string;
  minSpeed: number;
  maxSpeed: number;
  avgScore: number;
  count: number;
  avgRadius: number;
}

/** ベクトルドリフト（投げ偏りの変化） */
export interface VectorDrift {
  earlyAvgX: number;
  earlyAvgY: number;
  recentAvgX: number;
  recentAvgY: number;
  driftX: number;
  driftY: number;
  driftMagnitude: number;
  improving: boolean; // 中心に近づいているか
}

/** センサー分析統合結果 */
export interface SensorAnalysis {
  trendPoints: SensorTrendPoint[];
  speedBuckets: SpeedBucket[];
  vectorDrift: VectorDrift | null;
  overallStats: {
    avgVectorX: number;
    avgVectorY: number;
    avgRadius: number;
    avgSpeed: number;
    radiusImprovement: number | null; // 初期と直近のradius差分（%）
    speedScoreCorrelation: number; // -1〜1
  };
}

/** DL3データのある有効なプレイのみフィルタ */
function filterValidSensorPlays(plays: SensorPlay[]): SensorPlay[] {
  return plays.filter(
    (p) => p.dl3VectorX !== 0 || p.dl3VectorY !== 0 || p.dl3Radius !== 0 || p.dl3Speed !== 0,
  );
}

/** センサートレンド計算 */
export function computeSensorTrends(plays: SensorPlay[]): SensorTrendPoint[] {
  const valid = filterValidSensorPlays(plays);
  if (valid.length === 0) return [];

  const sorted = [...valid].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

  const window = 20; // 20ゲーム移動平均

  return sorted.map((p, i) => {
    let radiusSma: number | null = null;
    let speedSma: number | null = null;

    if (i >= window - 1) {
      let rSum = 0;
      let sSum = 0;
      for (let j = i - window + 1; j <= i; j++) {
        rSum += sorted[j].dl3Radius;
        sSum += sorted[j].dl3Speed;
      }
      radiusSma = Math.round((rSum / window) * 100) / 100;
      speedSma = Math.round((sSum / window) * 100) / 100;
    }

    return {
      index: i + 1,
      date: p.time.split('T')[0] || p.time.split(' ')[0],
      vectorX: p.dl3VectorX,
      vectorY: p.dl3VectorY,
      radius: p.dl3Radius,
      speed: p.dl3Speed,
      score: p.score,
      radiusSma,
      speedSma,
    };
  });
}

/** スピード×スコア相関分析 */
export function correlateSpeedScore(plays: SensorPlay[]): {
  speedBuckets: SpeedBucket[];
  correlation: number;
} {
  const valid = filterValidSensorPlays(plays).filter((p) => p.dl3Speed > 0);
  if (valid.length < 5) return { speedBuckets: [], correlation: 0 };

  // スピード帯別集計（4km/h刻み）
  const bucketSize = 4;
  const minSpeed = Math.floor(Math.min(...valid.map((p) => p.dl3Speed)) / bucketSize) * bucketSize;
  const maxSpeed = Math.ceil(Math.max(...valid.map((p) => p.dl3Speed)) / bucketSize) * bucketSize;

  const buckets: SpeedBucket[] = [];
  for (let s = minSpeed; s < maxSpeed; s += bucketSize) {
    const inBucket = valid.filter((p) => p.dl3Speed >= s && p.dl3Speed < s + bucketSize);
    if (inBucket.length >= 2) {
      buckets.push({
        speedRange: `${s}-${s + bucketSize}`,
        minSpeed: s,
        maxSpeed: s + bucketSize,
        avgScore: Math.round(inBucket.reduce((a, p) => a + p.score, 0) / inBucket.length),
        count: inBucket.length,
        avgRadius:
          Math.round((inBucket.reduce((a, p) => a + p.dl3Radius, 0) / inBucket.length) * 10) / 10,
      });
    }
  }

  // ピアソン相関係数
  const n = valid.length;
  const speeds = valid.map((p) => p.dl3Speed);
  const scores = valid.map((p) => p.score);
  const avgSpd = speeds.reduce((a, b) => a + b, 0) / n;
  const avgScr = scores.reduce((a, b) => a + b, 0) / n;

  let numerator = 0;
  let denomSpd = 0;
  let denomScr = 0;
  for (let i = 0; i < n; i++) {
    const dx = speeds[i] - avgSpd;
    const dy = scores[i] - avgScr;
    numerator += dx * dy;
    denomSpd += dx * dx;
    denomScr += dy * dy;
  }

  const denom = Math.sqrt(denomSpd * denomScr);
  const correlation = denom > 0 ? Math.round((numerator / denom) * 1000) / 1000 : 0;

  return { speedBuckets: buckets, correlation };
}

/** ベクトルドリフト（投げ偏りの経時変化） */
export function computeVectorDrift(plays: SensorPlay[]): VectorDrift | null {
  const valid = filterValidSensorPlays(plays);
  if (valid.length < 20) return null;

  const sorted = [...valid].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

  const quarterLen = Math.floor(sorted.length / 4);
  const early = sorted.slice(0, quarterLen);
  const recent = sorted.slice(-quarterLen);

  const earlyAvgX = early.reduce((s, p) => s + p.dl3VectorX, 0) / early.length;
  const earlyAvgY = early.reduce((s, p) => s + p.dl3VectorY, 0) / early.length;
  const recentAvgX = recent.reduce((s, p) => s + p.dl3VectorX, 0) / recent.length;
  const recentAvgY = recent.reduce((s, p) => s + p.dl3VectorY, 0) / recent.length;

  const earlyDist = Math.sqrt(earlyAvgX ** 2 + earlyAvgY ** 2);
  const recentDist = Math.sqrt(recentAvgX ** 2 + recentAvgY ** 2);

  return {
    earlyAvgX: Math.round(earlyAvgX * 10) / 10,
    earlyAvgY: Math.round(earlyAvgY * 10) / 10,
    recentAvgX: Math.round(recentAvgX * 10) / 10,
    recentAvgY: Math.round(recentAvgY * 10) / 10,
    driftX: Math.round((recentAvgX - earlyAvgX) * 10) / 10,
    driftY: Math.round((recentAvgY - earlyAvgY) * 10) / 10,
    driftMagnitude:
      Math.round(Math.sqrt((recentAvgX - earlyAvgX) ** 2 + (recentAvgY - earlyAvgY) ** 2) * 10) /
      10,
    improving: recentDist < earlyDist,
  };
}

/** センサー分析統合実行 */
export function analyzeSensor(plays: SensorPlay[]): SensorAnalysis | null {
  const valid = filterValidSensorPlays(plays);
  if (valid.length < 10) return null;

  const trendPoints = computeSensorTrends(plays);
  const { speedBuckets, correlation } = correlateSpeedScore(plays);
  const vectorDrift = computeVectorDrift(plays);

  // 全体統計
  const avgVectorX =
    Math.round((valid.reduce((s, p) => s + p.dl3VectorX, 0) / valid.length) * 10) / 10;
  const avgVectorY =
    Math.round((valid.reduce((s, p) => s + p.dl3VectorY, 0) / valid.length) * 10) / 10;
  const avgRadius =
    Math.round((valid.reduce((s, p) => s + p.dl3Radius, 0) / valid.length) * 10) / 10;
  const avgSpeed = Math.round((valid.reduce((s, p) => s + p.dl3Speed, 0) / valid.length) * 10) / 10;

  // radius改善率
  let radiusImprovement: number | null = null;
  const sorted = [...valid].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
  if (sorted.length >= 20) {
    const quarterLen = Math.floor(sorted.length / 4);
    const earlyRadius =
      sorted.slice(0, quarterLen).reduce((s, p) => s + p.dl3Radius, 0) / quarterLen;
    const recentRadius =
      sorted.slice(-quarterLen).reduce((s, p) => s + p.dl3Radius, 0) / quarterLen;
    if (earlyRadius > 0) {
      radiusImprovement = Math.round(((recentRadius - earlyRadius) / earlyRadius) * 1000) / 10;
    }
  }

  return {
    trendPoints,
    speedBuckets,
    vectorDrift,
    overallStats: {
      avgVectorX,
      avgVectorY,
      avgRadius,
      avgSpeed,
      radiusImprovement,
      speedScoreCorrelation: correlation,
    },
  };
}
