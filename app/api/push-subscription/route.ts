import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth, withErrorHandler, type AuthContext } from '@/lib/api-middleware';
import { canUsePushNotifications } from '@/lib/permissions';
import { adminDb } from '@/lib/firebase-admin';

const PushSubscriptionSchema = z.object({
  subscription: z.object({
    endpoint: z.string().url(),
    keys: z
      .object({
        p256dh: z.string(),
        auth: z.string(),
      })
      .optional(),
  }),
});

const PushUnsubscribeSchema = z.object({
  endpoint: z.string().min(1),
});

// POST: Push subscription を保存
async function handlePost(req: NextRequest, ctx: AuthContext) {
  if (!canUsePushNotifications(ctx.role)) {
    return NextResponse.json({ error: 'PRO限定機能です' }, { status: 403 });
  }

  const body = await req.json();
  const parsed = PushSubscriptionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'subscription が不正です' }, { status: 400 });
  }
  const { subscription } = parsed.data;

  const subRef = adminDb
    .collection('users')
    .doc(ctx.userId)
    .collection('pushSubscriptions')
    .doc(Buffer.from(subscription.endpoint).toString('base64url').slice(0, 128));

  await subRef.set({
    ...subscription,
    createdAt: new Date(),
  });

  return NextResponse.json({ ok: true });
}

// DELETE: Push subscription を削除
async function handleDelete(req: NextRequest, ctx: AuthContext) {
  const body = await req.json();
  const parsed = PushUnsubscribeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'endpoint が不正です' }, { status: 400 });
  }
  const { endpoint } = parsed.data;

  const docId = Buffer.from(endpoint).toString('base64url').slice(0, 128);
  await adminDb
    .collection('users')
    .doc(ctx.userId)
    .collection('pushSubscriptions')
    .doc(docId)
    .delete();

  return NextResponse.json({ ok: true });
}

export const POST = withErrorHandler(withAuth(handlePost), 'push-subscription:POST');
export const DELETE = withErrorHandler(withAuth(handleDelete), 'push-subscription:DELETE');
