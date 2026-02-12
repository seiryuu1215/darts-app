import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未ログインです' }, { status: 401 });
  }

  const userRef = adminDb.doc(`users/${session.user.id}`);

  await userRef.update({
    lineUserId: FieldValue.delete(),
    lineNotifyEnabled: false,
    dlCredentialsEncrypted: FieldValue.delete(),
  });

  // 会話状態もクリア
  const userSnap = await userRef.get();
  const lineUserId = userSnap.data()?.lineUserId;
  if (lineUserId) {
    await adminDb.doc(`lineConversations/${lineUserId}`).delete().catch(() => {});
  }

  return NextResponse.json({ success: true });
}
