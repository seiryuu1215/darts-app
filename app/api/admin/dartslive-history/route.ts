import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { withAdmin, withErrorHandler } from '@/lib/api-middleware';

export const GET = withErrorHandler(
  withAdmin(async (_req: NextRequest, ctx) => {
    const userId = ctx.userId;

    // 日別スタッツを日付降順で取得
    const statsSnap = await adminDb
      .collection(`users/${userId}/dartsLiveStats`)
      .orderBy('date', 'desc')
      .limit(500)
      .get();

    const records = statsSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        date: doc.id,
        rating: data.rating ?? null,
        stats01Avg: data.stats01Avg ?? null,
        statsCriAvg: data.statsCriAvg ?? null,
        stats01Avg100: data.stats01Avg100 ?? null,
        statsCriAvg100: data.statsCriAvg100 ?? null,
        gamesPlayed: data.gamesPlayed ?? null,
        source: data.source ?? 'unknown',
      };
    });

    // enriched データ (dartsliveCache/latest から)
    const cacheDoc = await adminDb.doc(`users/${userId}/dartsliveCache/latest`).get();
    const cacheData = cacheDoc.exists ? cacheDoc.data() : null;

    let enriched = null;
    if (cacheData) {
      enriched = {
        maxRating: cacheData.maxRating ?? null,
        maxRatingDate: cacheData.maxRatingDate ?? null,
        stats01Detailed: cacheData.stats01Detailed ?? null,
        statsCricketDetailed: cacheData.statsCricketDetailed ?? null,
        bestRecords: cacheData.bestRecords ? JSON.parse(cacheData.bestRecords) : null,
        gameAverages: cacheData.gameAverages ? JSON.parse(cacheData.gameAverages) : null,
        totalAward: cacheData.totalAward ? JSON.parse(cacheData.totalAward) : null,
        apiSyncAt: cacheData.apiSyncAt?.toDate?.()?.toISOString() ?? null,
      };
    }

    // dartsliveApiCache/latest から追加データ取得
    const apiCacheDoc = await adminDb.doc(`users/${userId}/dartsliveApiCache/latest`).get();
    const apiCacheData = apiCacheDoc.exists ? apiCacheDoc.data() : null;
    let dartoutList = null;
    let awardList = null;
    let recentPlays = null;
    if (apiCacheData?.bundle) {
      const bundle = JSON.parse(apiCacheData.bundle);
      dartoutList = bundle.dartoutList ?? null;
      awardList = bundle.awardList ?? null;
    }
    if (apiCacheData?.recentPlays) {
      recentPlays = JSON.parse(apiCacheData.recentPlays);
    }

    // playLog/sensorData 付きのサンプルデータ（COUNT-UP分析用）
    let playLogSample = null;
    if (recentPlays) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const withLog = recentPlays.filter((p: any) => p.playLog || p.sensorData);
      playLogSample = withLog.slice(0, 3);
    }

    return NextResponse.json({
      records,
      enriched,
      dartoutList,
      awardList,
      recentPlays,
      playLogSample,
    });
  }),
  'DARTSLIVE API履歴取得エラー',
);
