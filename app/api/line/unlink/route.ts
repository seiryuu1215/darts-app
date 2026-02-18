import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { withAuth, withErrorHandler } from '@/lib/api-middleware';

export const POST = withErrorHandler(
  withAuth(async (_req, { userId }) => {
    const userRef = adminDb.doc(`users/${userId}`);

    // 削除前に lineUserId を取得（削除後は undefined になるため）
    const userSnap = await userRef.get();
    const lineUserId = userSnap.data()?.lineUserId;

    await userRef.update({
      lineUserId: FieldValue.delete(),
      lineNotifyEnabled: false,
      dlCredentialsEncrypted: FieldValue.delete(),
    });
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
