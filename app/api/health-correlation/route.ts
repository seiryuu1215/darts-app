import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { withErrorHandler, withAuth } from '@/lib/api-middleware';
import type { HealthDartsCorrelation } from '@/types';

export const GET = withErrorHandler(
  withAuth(async (req, { userId }) => {
    const days = Math.min(parseInt(req.nextUrl.searchParams.get('days') || '90', 10), 180);
    const sinceStr = new Date(Date.now() - days * 86_400_000).toISOString().split('T')[0];

    // JST日付でのFirestore Timestamp比較用
    const sinceDate = new Date(sinceStr + 'T00:00:00+09:00');

    const [healthSnap, statsSnap] = await Promise.all([
      adminDb.collection(`users/${userId}/healthMetrics`).where('metricDate', '>=', sinceStr).get(),
      adminDb.collection(`users/${userId}/dartsLiveStats`).where('date', '>=', sinceDate).get(),
    ]);

    // ヘルスデータをdate文字列でMap化
    const healthMap = new Map<string, FirebaseFirestore.DocumentData>();
    for (const doc of healthSnap.docs) {
      const data = doc.data();
      if (data.metricDate) {
        healthMap.set(data.metricDate, data);
      }
    }

    // ダーツデータをdate文字列でMap化
    const statsMap = new Map<string, FirebaseFirestore.DocumentData>();
    for (const doc of statsSnap.docs) {
      const data = doc.data();
      if (data.date) {
        // Firestore Timestamp → YYYY-MM-DD (JST)
        const d = data.date.toDate();
        const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
        const dateStr = jst.toISOString().split('T')[0];
        statsMap.set(dateStr, data);
      }
    }

    // 両方にデータがある日のみマージ
    const correlations: HealthDartsCorrelation[] = [];
    for (const [dateStr, health] of healthMap) {
      const stats = statsMap.get(dateStr);
      if (!stats) continue;

      correlations.push({
        date: dateStr,
        restingHr: health.restingHr ?? null,
        hrvSdnn: health.hrvSdnn ?? null,
        sleepDurationMinutes: health.sleepDurationMinutes ?? null,
        sleepDeepMinutes: health.sleepDeepMinutes ?? null,
        sleepRemMinutes: health.sleepRemMinutes ?? null,
        sleepCoreMinutes: health.sleepCoreMinutes ?? null,
        steps: health.steps ?? null,
        activeEnergyKcal: health.activeEnergyKcal ?? null,
        exerciseMinutes: health.exerciseMinutes ?? null,
        rating: stats.rating ?? null,
        ppd: stats.zeroOneStats?.ppd ?? null,
        mpr: stats.cricketStats?.mpr ?? null,
        condition: stats.condition ?? null,
        gamesPlayed: stats.gamesPlayed ?? null,
      });
    }

    // 日付順でソート
    correlations.sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({ correlations });
  }),
  'Health correlation error',
);
