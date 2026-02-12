import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { withAuth, withErrorHandler } from '@/lib/api-middleware';

export const POST = withErrorHandler(
  withAuth(async (_req, { userId }) => {
    const userRef = adminDb.doc(`users/${userId}`);

    await userRef.update({
      lineUserId: FieldValue.delete(),
      lineNotifyEnabled: false,
      dlCredentialsEncrypted: FieldValue.delete(),
    });

    // 会話状態もクリア
    const userSnap = await userRef.get();
    const lineUserId = userSnap.data()?.lineUserId;
    if (lineUserId) {
      await adminDb
        .doc(`lineConversations/${lineUserId}`)
        .delete()
        .catch(() => {});
    }

    return NextResponse.json({ success: true });
  }),
  'LINE unlink error',
);
