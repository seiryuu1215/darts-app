import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();

function initAdmin() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  // Vercel環境: FIREBASE_SERVICE_ACCOUNT_KEY (JSON文字列) を使用
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    return initializeApp({
      credential: cert(serviceAccount),
    });
  }

  // ローカル環境: サービスアカウントファイルパスを使用
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return initializeApp({
      credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS),
    });
  }

  // フォールバック: projectIdのみ (Firestoreアクセスが制限される可能性あり)
  return initializeApp({ projectId });
}

const app = initAdmin();
export const adminDb = getFirestore(app);
