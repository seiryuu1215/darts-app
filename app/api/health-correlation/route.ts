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

    const [healthSnap, statsSnap, countupDoc] = await Promise.all([
      adminDb.collection(`users/${userId}/healthMetrics`).where('metricDate', '>=', sinceStr).get(),
      adminDb.collection(`users/${userId}/dartsLiveStats`).where('date', '>=', sinceDate).get(),
      adminDb.doc(`users/${userId}/dartsliveApiCache/countupPlays`).get(),
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

    // カウントアップ日別平均を算出
    const countUpDailyAvg = new Map<string, number>();
    if (countupDoc.exists) {
      try {
        const plays: { time: string; score: number }[] = JSON.parse(
          countupDoc.data()?.data ?? '[]',
        );
        const byDate = new Map<string, number[]>();
        for (const p of plays) {
          // time例: "2025-01-15 20:30" → JST日付として扱う
          const dateStr = p.time.slice(0, 10);
          if (dateStr < sinceStr) continue;
          if (!byDate.has(dateStr)) byDate.set(dateStr, []);
          byDate.get(dateStr)!.push(p.score);
        }
        for (const [dateStr, scores] of byDate) {
          countUpDailyAvg.set(
            dateStr,
            Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10,
          );
        }
      } catch {
        // JSONパースエラーは無視
      }
    }

    // ヘルスデータ + (ダーツスタッツ or カウントアップ)がある日のみマージ
    const correlations: HealthDartsCorrelation[] = [];
    for (const [dateStr, health] of healthMap) {
      const stats = statsMap.get(dateStr);
      const cuAvg = countUpDailyAvg.get(dateStr) ?? null;

      // ダーツスタッツもカウントアップもない日はスキップ
      if (!stats && cuAvg === null) continue;

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
        rating: stats?.rating ?? null,
        countUpAvg: cuAvg,
        condition: stats?.condition ?? null,
        gamesPlayed: stats?.gamesPlayed ?? null,
      });
    }

    // 日付順でソート
    correlations.sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({ correlations });
  }),
  'Health correlation error',
);
