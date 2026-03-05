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
  buildSensorSummaryFlexBubble,
  extractBubble,
  type CuNotifyStats,
} from '@/lib/line';
import { analyzeMissDirection } from '@/lib/stats-math';
import { computeSegmentFrequency } from '@/lib/heatmap-data';
import { analyzeRounds, analyzeRoundBulls } from '@/lib/countup-round-analysis';
import { compareLastTwoSessions } from '@/lib/countup-session-compare';
import { calcRating } from '@/lib/dartslive-rating';
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
    prevPpd?: number | null;
    prevMpr?: number | null;
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
  const isPro = ctx.role === 'pro' || ctx.role === 'admin';

  // レーティング小数を PPD+MPR から再計算（APIは整数しか返さない場合がある）
  const decimalRating =
    ctx.stats.ppd != null && ctx.stats.mpr != null
      ? Math.round(calcRating(ctx.stats.ppd, ctx.stats.mpr) * 100) / 100
      : ctx.stats.rating;
  const prevDecimalRating =
    ctx.stats.prevPpd != null && ctx.stats.prevMpr != null
      ? Math.round(calcRating(ctx.stats.prevPpd, ctx.stats.prevMpr) * 100) / 100
      : (ctx.stats.prevRating ?? null);

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
    const roundBulls = analyzeRoundBulls(playLogs);

    const cuStats: CuNotifyStats = {
      date: ctx.stats.dateStr,
      gameCount: cuPlays.length,
      avgScore: cuAvg,
      maxScore: cuMax,
      consistency: cuCon?.score ?? 0,
      bullRate: missResult?.bullRate ?? 0,
      bullCount: missResult?.bullCount ?? 0,
      totalDarts: missResult?.totalDarts ?? 0,
      lowTonCount: roundBulls.lowTonCount,
      lowTonRate: roundBulls.lowTonRate,
      hatTrickCount: roundBulls.hatTrickCount,
      hatTrickRate: roundBulls.hatTrickRate,
    };

    // 30G以上なら前回比較を追加（Pro/Adminは画像で比較データを送るのでスキップ）
    if (cuPlays.length >= 30 && sessionComparison && !isPro) {
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

  // ── Pro/Admin: センサー分析サマリー（バブル3番目に配置）──
  if (isPro && cuPlays.length > 0) {
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

  // ── Pro/Admin: セッション比較（画像 primary、失敗時 Flex fallback）──
  if (isPro && sessionComparison) {
    try {
      const imageBuffer = await generateSessionComparisonImage(sessionComparison, {
        rating: decimalRating,
        prevRating: prevDecimalRating,
      });
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
  if (isPro && missResult) {
    try {
      const heatmap = cuPlays.length > 0 ? computeSegmentFrequency(playLogs) : null;
      const buf = await generateMissDirectionImage(missResult, ctx.stats.dateStr, heatmap);
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

  return {
    bubbles,
    ...(imageMessages.length > 0 ? { imageMessages } : {}),
  };
}
