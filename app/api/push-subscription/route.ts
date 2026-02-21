import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withErrorHandler, type AuthContext } from '@/lib/api-middleware';
import { canUsePushNotifications } from '@/lib/permissions';
import { adminDb } from '@/lib/firebase-admin';

// POST: Push subscription を保存
async function handlePost(req: NextRequest, ctx: AuthContext) {
  if (!canUsePushNotifications(ctx.role)) {
    return NextResponse.json({ error: 'PRO限定機能です' }, { status: 403 });
  }

  const body = await req.json();
  const { subscription } = body;

  if (!subscription?.endpoint) {
    return NextResponse.json({ error: 'subscription が不正です' }, { status: 400 });
  }

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
  const { endpoint } = body;

  if (!endpoint) {
    return NextResponse.json({ error: 'endpoint が必要です' }, { status: 400 });
  }

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
