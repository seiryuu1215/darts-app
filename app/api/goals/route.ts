import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { withAuth, withErrorHandler } from '@/lib/api-middleware';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

/**
 * GET /api/goals — ユーザーの目標一覧を取得
 */
export const GET = withErrorHandler(
  withAuth(async (_req: NextRequest, { userId }) => {
    const snapshot = await adminDb
      .collection(`users/${userId}/goals`)
      .orderBy('endDate', 'desc')
      .get();

    const goals = snapshot.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        type: d.type,
        period: d.period,
        target: d.target,
        current: d.current ?? 0,
        startDate: d.startDate?.toDate?.()?.toISOString() ?? '',
        endDate: d.endDate?.toDate?.()?.toISOString() ?? '',
        achievedAt: d.achievedAt?.toDate?.()?.toISOString() ?? null,
        xpAwarded: d.xpAwarded ?? false,
      };
    });

    return NextResponse.json({ goals });
  }),
  'Goals GET error',
);

/**
 * POST /api/goals — 目標を作成
 * Body: { type, period, target, startDate, endDate }
 */
export const POST = withErrorHandler(
  withAuth(async (req: NextRequest, { userId }) => {
    const body = await req.json();
    const { type, period, target, startDate, endDate } = body as {
      type: string;
      period: string;
      target: number;
      startDate: string;
      endDate: string;
    };

    if (!type || !period || !target || !startDate || !endDate) {
      return NextResponse.json({ error: '必須フィールドが不足しています' }, { status: 400 });
    }

    const docRef = await adminDb.collection(`users/${userId}/goals`).add({
      type,
      period,
      target,
      current: 0,
      startDate: Timestamp.fromDate(new Date(startDate)),
      endDate: Timestamp.fromDate(new Date(endDate)),
      achievedAt: null,
      xpAwarded: false,
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ id: docRef.id, success: true });
  }),
  'Goals POST error',
);

/**
 * DELETE /api/goals?id=xxx — 目標を削除
 */
export const DELETE = withErrorHandler(
  withAuth(async (req: NextRequest, { userId }) => {
    const goalId = req.nextUrl.searchParams.get('id');
    if (!goalId) {
      return NextResponse.json({ error: 'IDが必要です' }, { status: 400 });
    }

    await adminDb.doc(`users/${userId}/goals/${goalId}`).delete();

    return NextResponse.json({ success: true });
  }),
  'Goals DELETE error',
);
