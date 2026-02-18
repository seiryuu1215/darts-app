import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getStatsRetentionDays } from '@/lib/permissions';
import { withAuth, withErrorHandler } from '@/lib/api-middleware';

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

    return NextResponse.json({
      year,
      month,
      records,
    });
  }),
  'Stats calendar error',
);
