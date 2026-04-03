import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminDb } from '@/lib/firebase-admin';
import { withAuth, withErrorHandler } from '@/lib/api-middleware';

const MarkReadSchema = z.object({
  ids: z.array(z.string()).min(1).max(500),
});

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
    const parsed = MarkReadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'IDが不正です' }, { status: 400 });
    }
    const { ids } = parsed.data;

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
