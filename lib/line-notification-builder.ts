/**
 * ロール別 LINE 通知オーケストレーター
 * general / pro / admin に応じて異なるバブルセットを構築し、
 * 1カルーセルにまとめて返す
 */

import { adminDb } from '@/lib/firebase-admin';
import type { UserRole } from '@/types';
import type { CountUpPlayData } from '@/lib/dartslive-api';
import {
  buildStatsFlexMessage,
  buildCountUpFlexMessage,
  buildSessionComparisonFlexBubble,
  buildRecommendationsFlexBubble,
  buildTrendFlexBubble,
  buildSensorSummaryFlexBubble,
  extractBubble,
  type CuNotifyStats,
  type TrendBubbleInput,
} from '@/lib/line';
import { analyzeMissDirection, type MissDirectionResult } from '@/lib/stats-math';
import { computeSegmentFrequency } from '@/lib/heatmap-data';
import { analyzeRounds, type RoundAnalysis } from '@/lib/countup-round-analysis';
import { generateRecommendations, type RecommendationInput } from '@/lib/practice-recommendations';
import { computeSMA, detectCrosses, classifyTrend } from '@/lib/stats-trend';
import { compareLastTwoSessions } from '@/lib/countup-session-compare';
import { calculateConsistency } from '@/lib/stats-math';
import { generateSessionComparisonImage } from './session-comparison-image';
import { generateMissDirectionImage } from './miss-direction-image';
import { uploadLineImage } from './line-image-upload';

export interface DailyNotificationContext {
  userId: string;
  role: UserRole;
  stats: {
    rating: number | null;
    ppd: number | null;
    mpr: number | null;
    prevRating?: number | null;
    dateStr: string;
    gamesPlayed?: number | null;
    awards?: {
      dBull?: number;
      sBull?: number;
      hatTricks?: number;
      ton80?: number;
      lowTon?: number;
      highTon?: number;
      threeInABed?: number;
      threeInABlack?: number;
      whiteHorse?: number;
    };
    prevAwards?: {
      dBull?: number;
      sBull?: number;
      hatTricks?: number;
      ton80?: number;
      lowTon?: number;
      highTon?: number;
      threeInABed?: number;
      threeInABlack?: number;
      whiteHorse?: number;
    };
  };
  allCuPlays?: CountUpPlayData[];
  yesterdayCuPlays?: CountUpPlayData[];
}

/** ロール別デイリー通知の結果 */
export interface DailyNotificationResult {
  bubbles: object[];
  imageMessages?: object[];
}

/** ロール別デイリー通知のバブル配列を構築 */
export async function buildRoleBasedDailyNotification(
  ctx: DailyNotificationContext,
): Promise<DailyNotificationResult> {
  const bubbles: object[] = [];
  const imageMessages: object[] = [];

  // ── 全ロール共通: スタッツバブル ──
  const statsFlex = buildStatsFlexMessage({
    date: ctx.stats.dateStr,
    rating: ctx.stats.rating,
    ppd: ctx.stats.ppd,
    mpr: ctx.stats.mpr,
    prevRating: ctx.stats.prevRating,
    gamesPlayed: ctx.stats.gamesPlayed,
    awards: ctx.stats.awards,
    prevAwards: ctx.stats.prevAwards,
  });
  const statsBubble = extractBubble(statsFlex);
  if (statsBubble) bubbles.push(statsBubble);

  // ── 全ロール共通: COUNT-UPバブル ──
  const cuPlays = ctx.yesterdayCuPlays ?? [];
  const allPlays = ctx.allCuPlays ?? [];
  const playLogs = cuPlays.map((p) => p.playLog);

  // 共通分析結果を事前計算（重複計算を回避）
  const missResult = cuPlays.length > 0 ? analyzeMissDirection(playLogs) : null;
  const sessionComparison = allPlays.length > 0 ? compareLastTwoSessions(allPlays, 30) : null;
  const roundAnalysis = cuPlays.length >= 5 ? analyzeRounds(playLogs) : null;

  if (cuPlays.length > 0) {
    const cuScores = cuPlays.map((p) => p.score);
    const cuAvg = Math.round((cuScores.reduce((a, b) => a + b, 0) / cuScores.length) * 10) / 10;
    const cuMax = Math.max(...cuScores);
    const cuCon = calculateConsistency(cuScores);

    const cuStats: CuNotifyStats = {
      date: ctx.stats.dateStr,
      gameCount: cuPlays.length,
      avgScore: cuAvg,
      maxScore: cuMax,
      consistency: cuCon?.score ?? 0,
      bullRate: missResult?.bullRate ?? 0,
    };

    // 30G以上なら前回比較を追加（Pro/Adminは画像で比較データを送るのでスキップ）
    if (cuPlays.length >= 30 && sessionComparison && ctx.role !== 'pro' && ctx.role !== 'admin') {
      cuStats.prevAvgScore = sessionComparison.prev.avgScore;
      cuStats.prevConsistency = sessionComparison.prev.consistency;
      cuStats.prevBullRate = sessionComparison.prev.bullRate;
      cuStats.currentMissDir = sessionComparison.current.primaryMissDir;
      cuStats.prevMissDir = sessionComparison.prev.primaryMissDir;
      cuStats.vectorXChange = sessionComparison.deltas.vectorX;
      cuStats.vectorYChange = sessionComparison.deltas.vectorY;
      cuStats.radiusChange = sessionComparison.deltas.radius;
    }

    const cuFlex = buildCountUpFlexMessage(cuStats);
    const cuBubble = extractBubble(cuFlex);
    if (cuBubble) bubbles.push(cuBubble);
  }

  // ── Pro/Admin: セッション比較（画像 primary、失敗時 Flex fallback）──
  if ((ctx.role === 'pro' || ctx.role === 'admin') && sessionComparison) {
    try {
      const imageBuffer = await generateSessionComparisonImage(sessionComparison);
      const dateStr = sessionComparison.current.date;
      const imagePath = `images/line-session/${ctx.userId}/${dateStr}.png`;
      const imageUrl = await uploadLineImage(imageBuffer, imagePath);
      imageMessages.push({
        type: 'image',
        originalContentUrl: imageUrl,
        previewImageUrl: imageUrl,
      });
    } catch (e) {
      console.error('Session comparison image error, flex fallback:', e);
      try {
        bubbles.push(buildSessionComparisonFlexBubble(sessionComparison));
      } catch (e2) {
        console.error('Session comparison flex fallback error:', e2);
      }
    }
  }

  // ── Pro/Admin: ミス方向画像 ──
  if ((ctx.role === 'pro' || ctx.role === 'admin') && missResult) {
    try {
      const buf = await generateMissDirectionImage(missResult, ctx.stats.dateStr);
      // dateStr にスラッシュや特殊文字が含まれうるのでサニタイズ
      const safeDateStr = ctx.stats.dateStr.replace(/[[\]\s]/g, '').replace(/\//g, '-');
      const imagePath = `images/line-miss/${ctx.userId}/${safeDateStr}.png`;
      const imageUrl = await uploadLineImage(buf, imagePath);
      imageMessages.push({
        type: 'image',
        originalContentUrl: imageUrl,
        previewImageUrl: imageUrl,
      });
    } catch (e) {
      console.error('Miss direction image error:', e);
    }
  }

  // ── Pro/Admin: トレンド分析 ──
  if (ctx.role === 'pro' || ctx.role === 'admin') {
    try {
      const trendBubble = await buildTrendBubbleFromFirestore(ctx.userId, ctx.stats.rating);
      if (trendBubble) bubbles.push(trendBubble);
    } catch (e) {
      console.error('Trend analysis error:', e);
    }
  }

  // ── Pro/Admin: 練習レコメンド ──
  if (ctx.role === 'pro' || ctx.role === 'admin') {
    try {
      const recBubble = buildRecBubble(ctx, missResult, roundAnalysis);
      if (recBubble) bubbles.push(recBubble);
    } catch (e) {
      console.error('Recommendations error:', e);
    }
  }

  // ── Admin専用: センサー分析サマリー（ミス方向 + ヒートマップ + ラウンドパターンを1バブルに統合）──
  if (ctx.role === 'admin' && cuPlays.length > 0) {
    try {
      const heatmap = computeSegmentFrequency(playLogs);
      bubbles.push(
        buildSensorSummaryFlexBubble(
          missResult,
          heatmap.totalDarts > 0 ? heatmap : null,
          roundAnalysis,
        ),
      );
    } catch (e) {
      console.error('Sensor summary error:', e);
    }
  }

  return {
    bubbles,
    ...(imageMessages.length > 0 ? { imageMessages } : {}),
  };
}

/** Firestoreスタッツ履歴からトレンドバブルを構築 */
async function buildTrendBubbleFromFirestore(
  userId: string,
  currentRating: number | null,
): Promise<object | null> {
  if (currentRating == null) return null;

  const statsSnap = await adminDb
    .collection(`users/${userId}/dartsLiveStats`)
    .orderBy('date', 'desc')
    .limit(60)
    .get();

  if (statsSnap.size < 7) return null;

  const dataPoints = statsSnap.docs
    .map((doc) => {
      const d = doc.data();
      const dateVal = d.date?.toDate?.() ?? (d.date ? new Date(d.date) : null);
      return {
        date: dateVal ? dateVal.toISOString().split('T')[0] : doc.id,
        value: d.rating as number | null,
      };
    })
    .filter((d) => d.value != null)
    .reverse();

  if (dataPoints.length < 7) return null;

  const smaData = computeSMA(dataPoints);
  const crosses = detectCrosses(smaData);
  const trend = classifyTrend(smaData);

  const latest = smaData[smaData.length - 1];

  const input: TrendBubbleInput = {
    metric: 'Rating',
    currentValue: currentRating,
    trend,
    sma7: latest?.sma7 ?? null,
    sma30: latest?.sma30 ?? null,
    recentCrosses: crosses.slice(-2),
  };

  return buildTrendFlexBubble(input);
}

/** レコメンデーションバブルを構築 */
function buildRecBubble(
  ctx: DailyNotificationContext,
  missResult: MissDirectionResult | null,
  roundAnalysis: RoundAnalysis | null,
): object | null {
  const cuPlays = ctx.yesterdayCuPlays ?? [];
  if (cuPlays.length === 0) return null;

  const cuScores = cuPlays.map((p) => p.score);
  const cuCon = calculateConsistency(cuScores);

  // DL3 センサーデータ
  const dl3Plays = cuPlays.filter(
    (p) => p.dl3VectorX !== 0 || p.dl3VectorY !== 0 || p.dl3Radius !== 0,
  );
  const avgRadius =
    dl3Plays.length > 0 ? dl3Plays.reduce((s, p) => s + p.dl3Radius, 0) / dl3Plays.length : null;

  const recInput: RecommendationInput = {
    ppd: ctx.stats.ppd,
    bullRate: missResult?.bullRate ?? null,
    arrangeRate: null,
    avgBust: null,
    mpr: ctx.stats.mpr,
    tripleRate: null,
    openCloseRate: null,
    countupAvg: cuScores.reduce((a, b) => a + b, 0) / cuScores.length,
    countupConsistency: cuCon?.score ?? null,
    primaryMissDirection: missResult?.primaryDirection ?? null,
    directionStrength: missResult?.directionStrength ?? null,
    avgRadius,
    radiusImprovement: null,
    avgSpeed: null,
    optimalSessionLength: null,
    peakGameNumber: null,
    roundPattern: roundAnalysis?.pattern.pattern ?? null,
    worstRound: roundAnalysis?.worstRound ?? null,
  };

  const recs = generateRecommendations(recInput);
  if (recs.length === 0) return null;

  return buildRecommendationsFlexBubble(recs, 3);
}
