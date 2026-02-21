import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { adminDb, adminStorage } from '@/lib/firebase-admin';
import { getStripe } from '@/lib/stripe';
import { withAuth, withErrorHandler } from '@/lib/api-middleware';

async function deleteSubcollection(parentPath: string, subcollection: string) {
  const snap = await adminDb.collection(`${parentPath}/${subcollection}`).listDocuments();
  const batch = adminDb.batch();
  for (const docRef of snap) {
    batch.delete(docRef);
  }
  if (snap.length > 0) await batch.commit();
}

export const DELETE = withErrorHandler(
  withAuth(async (_req, { userId }) => {
    // 1. ユーザードキュメント取得
    const userDoc = await adminDb.doc(`users/${userId}`).get();
    const userData = userDoc.data();

    // 2. Stripe サブスクリプションキャンセル
    if (userData?.subscriptionId) {
      try {
        const stripe = getStripe();
        await stripe.subscriptions.cancel(userData.subscriptionId);
      } catch (err) {
        console.warn('Stripe subscription cancel failed (may already be canceled):', err);
      }
    }

    // 3. ユーザーのサブコレクション削除
    const userSubcollections = [
      'dartsLiveStats',
      'dartsliveCache',
      'xpHistory',
      'goals',
      'notifications',
      'likes',
      'bookmarks',
      'barrelBookmarks',
      'settingHistory',
      'shopBookmarks',
      'shopLists',
    ];
    await Promise.all(userSubcollections.map((sub) => deleteSubcollection(`users/${userId}`, sub)));

    // 4. darts コレクション（コメント・メモサブコレクション含む）
    const dartsSnap = await adminDb.collection('darts').where('userId', '==', userId).get();
    for (const dartDoc of dartsSnap.docs) {
      await deleteSubcollection(`darts/${dartDoc.id}`, 'comments');
      await deleteSubcollection(`darts/${dartDoc.id}`, 'memos');
      await adminDb.doc(`darts/${dartDoc.id}`).delete();
    }

    // 5. discussions コレクション（返信サブコレクション含む）
    const discussionsSnap = await adminDb
      .collection('discussions')
      .where('userId', '==', userId)
      .get();
    for (const discDoc of discussionsSnap.docs) {
      await deleteSubcollection(`discussions/${discDoc.id}`, 'replies');
      await adminDb.doc(`discussions/${discDoc.id}`).delete();
    }

    // 6. lineConversations（lineUserIdで検索）
    if (userData?.lineUserId) {
      try {
        await adminDb.doc(`lineConversations/${userData.lineUserId}`).delete();
      } catch {
        // lineConversation が存在しない場合は無視
      }
    }

    // 7. Firebase Storage: アバター画像削除
    try {
      const bucket = adminStorage.bucket();
      const [files] = await bucket.getFiles({ prefix: `images/avatars/${userId}/` });
      await Promise.all(files.map((file) => file.delete()));
    } catch {
      // Storage ファイルが存在しない場合は無視
    }

    // 8. ユーザードキュメント本体を削除
    await adminDb.doc(`users/${userId}`).delete();

    // 9. Firebase Auth ユーザー削除
    try {
      await getAuth().deleteUser(userId);
    } catch {
      // Firebase Auth ユーザーが存在しない場合は無視
    }

    return NextResponse.json({ success: true });
  }),
  'Account delete error',
);
