import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { withAuth, withErrorHandler } from '@/lib/api-middleware';

/**
 * GET /api/notifications — 未読通知を取得
 */
export const GET = withErrorHandler(
  withAuth(async (_req: NextRequest, { userId }) => {
    const snapshot = await adminDb
      .collection(`users/${userId}/notifications`)
      .where('read', '==', false)
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    const notifications = snapshot.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        type: d.type,
        title: d.title,
        details: d.details || [],
        totalXp: d.totalXp ?? 0,
        read: d.read,
        createdAt: d.createdAt?.toDate?.()?.toISOString() ?? '',
      };
    });

    return NextResponse.json({ notifications });
  }),
  'Notifications GET error',
);

/**
 * PATCH /api/notifications — 通知を既読にする
 * Body: { ids: string[] }
 */
export const PATCH = withErrorHandler(
  withAuth(async (req: NextRequest, { userId }) => {
    const body = await req.json();
    const { ids } = body as { ids: string[] };

    if (!ids || ids.length === 0) {
      return NextResponse.json({ error: 'IDが必要です' }, { status: 400 });
    }

    const batch = adminDb.batch();
    for (const id of ids) {
      const ref = adminDb.doc(`users/${userId}/notifications/${id}`);
      batch.update(ref, { read: true });
    }
    await batch.commit();

    return NextResponse.json({ success: true });
  }),
  'Notifications PATCH error',
);
