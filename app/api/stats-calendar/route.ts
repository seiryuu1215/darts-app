import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getStatsRetentionDays } from '@/lib/permissions';
import { withAuth, withErrorHandler } from '@/lib/api-middleware';
import { FieldValue } from 'firebase-admin/firestore';

export const GET = withErrorHandler(
  withAuth(async (request: NextRequest, { userId, role }) => {
    const yearParam = request.nextUrl.searchParams.get('year');
    const monthParam = request.nextUrl.searchParams.get('month');

    if (!yearParam || !monthParam) {
      return NextResponse.json({ error: 'year and month are required' }, { status: 400 });
    }

    const year = parseInt(yearParam, 10);
    const month = parseInt(monthParam, 10);

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return NextResponse.json({ error: 'Invalid year or month' }, { status: 400 });
    }

    // JST基準で月の start/end を計算
    const start = new Date(Date.UTC(year, month - 1, 1, -9, 0, 0, 0));
    const end = new Date(Date.UTC(year, month, 1, -9, 0, 0, 0));

    // retention 制限適用（Free: 30日）
    const retentionDays = getStatsRetentionDays(role);
    let effectiveStart = start;
    if (retentionDays !== null) {
      const retentionStart = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
      if (effectiveStart < retentionStart) {
        effectiveStart = retentionStart;
      }
    }

    // dartsLiveStats を取得
    const colRef = adminDb.collection(`users/${userId}/dartsLiveStats`);
    const query = colRef
      .orderBy('date', 'asc')
      .where('date', '>=', effectiveStart)
      .where('date', '<', end);

    const snapshot = await query.get();
    const records: Array<{
      id: string;
      date: string;
      rating: number | null;
      ppd: number | null;
      mpr: number | null;
      gamesPlayed: number;
      condition: number | null;
      memo: string;
      challenge: string;
      dBull: number | null;
      sBull: number | null;
    }> = [];

    snapshot.forEach((doc) => {
      const d = doc.data();
      const dateVal = d.date?.toDate?.() ?? (d.date ? new Date(d.date) : null);
      records.push({
        id: doc.id,
        date: dateVal ? dateVal.toISOString() : '',
        rating: d.rating ?? null,
        ppd: d.zeroOneStats?.ppd ?? null,
        mpr: d.cricketStats?.mpr ?? null,
        gamesPlayed: d.gamesPlayed ?? 0,
        condition: d.condition ?? null,
        memo: d.memo ?? '',
        challenge: d.challenge ?? '',
        dBull: d.bullStats?.dBull ?? null,
        sBull: d.bullStats?.sBull ?? null,
      });
    });

    // 集計
    const totalGames = records.reduce((sum, r) => sum + (r.gamesPlayed || 0), 0);
    const playDays = new Set(records.map((r) => r.date.slice(0, 10))).size;

    const validRatings = records.filter((r) => r.rating != null);
    const validPpd = records.filter((r) => r.ppd != null);
    const validMpr = records.filter((r) => r.mpr != null);
    const validCondition = records.filter((r) => r.condition != null);

    const avgRating =
      validRatings.length > 0
        ? validRatings.reduce((sum, r) => sum + r.rating!, 0) / validRatings.length
        : null;
    const avgPpd =
      validPpd.length > 0 ? validPpd.reduce((sum, r) => sum + r.ppd!, 0) / validPpd.length : null;
    const avgMpr =
      validMpr.length > 0 ? validMpr.reduce((sum, r) => sum + r.mpr!, 0) / validMpr.length : null;
    const avgCondition =
      validCondition.length > 0
        ? validCondition.reduce((sum, r) => sum + r.condition!, 0) / validCondition.length
        : null;

    const ratingChange =
      validRatings.length >= 2
        ? validRatings[validRatings.length - 1].rating! - validRatings[0].rating!
        : null;

    // monthlyReview を取得
    const yearMonth = `${year}-${String(month).padStart(2, '0')}`;
    const reviewDoc = await adminDb.doc(`users/${userId}/monthlyReviews/${yearMonth}`).get();
    const reviewData = reviewDoc.exists ? reviewDoc.data() : null;
    const review = reviewData ? { good: reviewData.good ?? '', bad: reviewData.bad ?? '' } : null;

    return NextResponse.json({
      year,
      month,
      summary: {
        avgRating,
        avgPpd,
        avgMpr,
        avgCondition,
        totalGames,
        playDays,
        ratingChange,
      },
      records,
      review,
    });
  }),
  'Stats calendar error',
);

export const POST = withErrorHandler(
  withAuth(async (request: NextRequest, { userId }) => {
    const body = await request.json();
    const { yearMonth, good, bad } = body;

    if (!yearMonth || typeof yearMonth !== 'string' || !/^\d{4}-\d{2}$/.test(yearMonth)) {
      return NextResponse.json({ error: 'Invalid yearMonth format' }, { status: 400 });
    }

    const docRef = adminDb.doc(`users/${userId}/monthlyReviews/${yearMonth}`);
    const existing = await docRef.get();

    if (existing.exists) {
      await docRef.update({
        good: good ?? '',
        bad: bad ?? '',
        updatedAt: FieldValue.serverTimestamp(),
      });
    } else {
      await docRef.set({
        yearMonth,
        good: good ?? '',
        bad: bad ?? '',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    return NextResponse.json({ success: true });
  }),
  'Stats calendar review save error',
);
