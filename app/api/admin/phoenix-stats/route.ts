import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { withAdmin, withErrorHandler } from '@/lib/api-middleware';

export const GET = withErrorHandler(
  withAdmin(async (_req: NextRequest, ctx) => {
    const userId = ctx.userId;

    const cacheDoc = await adminDb.doc(`users/${userId}/phoenixCache/latest`).get();

    if (!cacheDoc.exists) {
      return NextResponse.json({ stats: null });
    }

    const data = cacheDoc.data()!;
    return NextResponse.json({
      stats: {
        rating: data.rating ?? null,
        ppd: data.ppd ?? null,
        mpr: data.mpr ?? null,
        className: data.className ?? null,
        countUpAvg: data.countUpAvg ?? null,
        isPayed: data.isPayed ?? false,
        syncAt: data.syncAt?.toDate?.()?.toISOString() ?? null,
      },
    });
  }),
  'PHOENIXスタッツ取得エラー',
);
