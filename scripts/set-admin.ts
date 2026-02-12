/**
 * 管理者権限設定スクリプト
 * 指定メールアドレスのユーザにadmin権限を付与
 *
 * 使い方: npx tsx scripts/set-admin.ts
 */

import 'dotenv/config';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

import { config } from 'dotenv';
config({ path: '.env.local' });

const ADMIN_EMAIL = 'mt.oikawa@gmail.com';

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
if (!projectId) {
  console.error('NEXT_PUBLIC_FIREBASE_PROJECT_IDが設定されていません');
  process.exit(1);
}

let app;
if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  app = initializeApp({
    credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS),
  });
} else {
  app = initializeApp({ projectId });
}

const db = getFirestore(app);

async function setAdmin() {
  // emailでユーザを検索
  const snapshot = await db.collection('users').where('email', '==', ADMIN_EMAIL).get();

  if (snapshot.empty) {
    console.error(`ユーザが見つかりません: ${ADMIN_EMAIL}`);
    process.exit(1);
  }

  const userDoc = snapshot.docs[0];
  console.log(`ユーザ発見: ${userDoc.id} (${userDoc.data().displayName})`);

  await userDoc.ref.update({ role: 'admin' });
  console.log(`${ADMIN_EMAIL} を admin に設定しました`);
}

setAdmin().catch((err) => {
  console.error('エラー:', err);
  process.exit(1);
});
