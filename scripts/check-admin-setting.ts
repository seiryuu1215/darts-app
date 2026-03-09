/**
 * 管理者の現在のセッティングの各パーツ長さを確認
 * npx tsx scripts/check-admin-setting.ts
 */
import 'dotenv/config';
import { config } from 'dotenv';
config({ path: '.env.local' });

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
if (!projectId) {
  console.error('NEXT_PUBLIC_FIREBASE_PROJECT_ID が設定されていません');
  process.exit(1);
}

let app;
if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  app = initializeApp({ credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS) });
} else {
  app = initializeApp({ projectId });
}
const db = getFirestore(app);

async function main() {
  const usersSnap = await db.collection('users').where('role', '==', 'admin').get();
  for (const userDoc of usersSnap.docs) {
    const userData = userDoc.data();
    if (userData.isDemo) continue;
    console.log(`\n=== 管理者: ${userData.displayName || userDoc.id} ===`);
    console.log(`activeSoftDartId: ${userData.activeSoftDartId}`);

    if (userData.activeSoftDartId) {
      const dartDoc = await db.collection('darts').doc(userData.activeSoftDartId).get();
      if (dartDoc.exists) {
        const d = dartDoc.data()!;
        console.log(`\nタイトル: ${d.title}`);
        console.log(`\n--- 各パーツの長さ ---`);
        console.log(`チップ: ${d.tip?.name} → ${d.tip?.lengthMm}mm (type: ${d.tip?.type})`);
        console.log(
          `バレル: ${d.barrel?.name} (${d.barrel?.brand}) → 全長 ${d.barrel?.length}mm, 重量 ${d.barrel?.weight}g`,
        );
        console.log(`シャフト: ${d.shaft?.name} → ${d.shaft?.lengthMm}mm`);
        if (d.flight?.isCondorAxe) {
          console.log(
            `フライト(CONDOR AXE): ${d.flight?.name} → シャフト長 ${d.flight?.condorAxeShaftLengthMm}mm`,
          );
        } else {
          console.log(`フライト: ${d.flight?.name}`);
        }

        const tipLen = d.tip?.lengthMm || 0;
        const barrelLen = d.barrel?.length || 0;
        const shaftLen = d.flight?.isCondorAxe
          ? d.flight?.condorAxeShaftLengthMm || 0
          : d.shaft?.lengthMm || 0;
        const total = tipLen + barrelLen + shaftLen;

        console.log(`\n--- 長さの比率 ---`);
        console.log(`チップ : バレル : シャフト = ${tipLen} : ${barrelLen} : ${shaftLen}`);
        console.log(`合計: ${total}mm`);
        if (total > 0) {
          console.log(`チップ  ${((tipLen / total) * 100).toFixed(1)}% (${tipLen}mm)`);
          console.log(`バレル  ${((barrelLen / total) * 100).toFixed(1)}% (${barrelLen}mm)`);
          console.log(`シャフト ${((shaftLen / total) * 100).toFixed(1)}% (${shaftLen}mm)`);
        }
      } else {
        console.log('アクティブダーツが見つかりません');
      }
    } else {
      console.log('アクティブなソフトダーツが設定されていません');

      // ユーザーの全ダーツを確認
      const dartsSnap = await db.collection('darts').where('userId', '==', userDoc.id).get();
      console.log(`\n登録セッティング数: ${dartsSnap.size}`);
      for (const dartDoc of dartsSnap.docs) {
        const d = dartDoc.data();
        const tipLen = d.tip?.lengthMm || 0;
        const barrelLen = d.barrel?.length || 0;
        const shaftLen = d.shaft?.lengthMm || 0;
        const total = tipLen + barrelLen + shaftLen;
        console.log(`\n[${d.title}]`);
        console.log(`  チップ: ${d.tip?.name} → ${tipLen}mm`);
        console.log(`  バレル: ${d.barrel?.name} (${d.barrel?.brand}) → ${barrelLen}mm`);
        console.log(`  シャフト: ${d.shaft?.name} → ${shaftLen}mm`);
        console.log(
          `  比率: チップ${tipLen} : バレル${barrelLen} : シャフト${shaftLen} = 合計${total}mm`,
        );
      }
    }
  }
  process.exit(0);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
