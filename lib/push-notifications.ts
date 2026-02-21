import webpush from 'web-push';
import { adminDb } from '@/lib/firebase-admin';

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_CONTACT = process.env.VAPID_CONTACT_EMAIL
  ? `mailto:${process.env.VAPID_CONTACT_EMAIL}`
  : '';

function isConfigured(): boolean {
  return Boolean(VAPID_PUBLIC && VAPID_PRIVATE && VAPID_CONTACT);
}

if (isConfigured()) {
  webpush.setVapidDetails(VAPID_CONTACT, VAPID_PUBLIC, VAPID_PRIVATE);
}

interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

/**
 * ユーザーの全Push subscriptionに通知を送信。
 * 410 Gone（失効）のsubscriptionは自動削除する。
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<number> {
  if (!isConfigured()) return 0;

  const subsSnap = await adminDb
    .collection('users')
    .doc(userId)
    .collection('pushSubscriptions')
    .get();

  if (subsSnap.empty) return 0;

  let sent = 0;
  const payloadStr = JSON.stringify(payload);

  for (const doc of subsSnap.docs) {
    const sub = doc.data();
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: sub.keys,
        },
        payloadStr,
      );
      sent++;
    } catch (error: unknown) {
      const statusCode = (error as { statusCode?: number })?.statusCode;
      if (statusCode === 410 || statusCode === 404) {
        await doc.ref.delete();
      } else {
        console.error(`Push送信失敗 (user=${userId}, sub=${doc.id}):`, error);
      }
    }
  }

  return sent;
}
