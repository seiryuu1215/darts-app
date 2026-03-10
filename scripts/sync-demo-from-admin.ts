/**
 * 管理者データ → デモアカウント同期スクリプト
 *
 * 実際の管理者ユーザのFirestoreデータをdemo-adminアカウントにコピーする。
 * スタッツ・dartsliveCache・ユーザー基本情報（XP/レベル/ランク/実績）を同期。
 * 機密情報（DL認証情報・Stripe情報・LINE連携）はコピーしない。
 *
 * Usage:
 *   npx tsx scripts/sync-demo-from-admin.ts <実際の管理者UID>
 *   npx tsx scripts/sync-demo-from-admin.ts <実際の管理者UID> --dry-run
 */

import 'dotenv/config';
import { config } from 'dotenv';
config({ path: '.env.local' });

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
if (!projectId) {
  console.error('NEXT_PUBLIC_FIREBASE_PROJECT_ID が設定されていません');
  process.exit(1);
}

const sourceUid = process.argv[2];
if (!sourceUid || sourceUid.startsWith('--')) {
  console.error('Usage: npx tsx scripts/sync-demo-from-admin.ts <管理者UID> [--dry-run]');
  process.exit(1);
}

const isDryRun = process.argv.includes('--dry-run');
const DEMO_ADMIN_UID = 'demo-admin';

let app;
if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  app = initializeApp({ credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS) });
} else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  app = initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)) });
} else {
  app = initializeApp({ projectId });
}

const db = getFirestore(app);

/** コピー対象外のフィールド（機密情報） */
const EXCLUDED_USER_FIELDS = [
  'dlCredentialsEncrypted',
  'pxCredentialsEncrypted',
  'stripeCustomerId',
  'subscriptionId',
  'subscriptionStatus',
  'subscriptionCurrentPeriodEnd',
  'subscriptionTrialEnd',
  'lineUserId',
  'lineNotifyEnabled',
  'email',
  'photoURL',
];

async function main() {
  console.log(`\n🔄 管理者データ同期`);
  console.log(`   ソース: ${sourceUid}`);
  console.log(`   ターゲット: ${DEMO_ADMIN_UID}`);
  if (isDryRun) console.log('   ⚠️  DRY RUN — 書き込みは行いません\n');
  else console.log('');

  // 1. ソースユーザーのドキュメントを読み取り
  const sourceDoc = await db.doc(`users/${sourceUid}`).get();
  if (!sourceDoc.exists) {
    console.error(`❌ ユーザー ${sourceUid} が見つかりません`);
    process.exit(1);
  }

  const sourceData = sourceDoc.data()!;
  console.log(
    `✅ ソースユーザー: ${sourceData.displayName} (Rt.${sourceData.highestRating ?? 'N/A'})`,
  );

  // 2. デモ用に安全なフィールドだけコピー
  const demoUserData: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(sourceData)) {
    if (!EXCLUDED_USER_FIELDS.includes(key)) {
      demoUserData[key] = value;
    }
  }

  // デモ固有のフィールドを上書き
  demoUserData.displayName = 'デモ（Admin）';
  demoUserData.email = 'demo-admin@darts-lab.example';
  demoUserData.role = 'admin';
  demoUserData.isDemo = true;
  demoUserData.avatarUrl = null;
  demoUserData.subscriptionStatus = null;
  demoUserData.updatedAt = FieldValue.serverTimestamp();

  console.log(
    `   XP: ${demoUserData.xp}, Level: ${demoUserData.level}, Rank: ${demoUserData.rank}`,
  );
  console.log(`   実績: ${(demoUserData.achievements as string[])?.length ?? 0}件`);

  // 3. dartsLiveStats をコピー
  const statsSnap = await db
    .collection(`users/${sourceUid}/dartsLiveStats`)
    .orderBy('date', 'desc')
    .limit(30)
    .get();
  console.log(`\n📊 スタッツ: ${statsSnap.size}件`);

  if (statsSnap.size > 0) {
    const first = statsSnap.docs[statsSnap.docs.length - 1].data();
    const last = statsSnap.docs[0].data();
    console.log(
      `   期間: ${first.date?.toDate?.()?.toISOString?.()?.split('T')[0] ?? '?'} ~ ${last.date?.toDate?.()?.toISOString?.()?.split('T')[0] ?? '?'}`,
    );
    console.log(`   最新Rt: ${last.rating}`);
  }

  // 4. dartsliveCache/latest をコピー
  const cacheDoc = await db.doc(`users/${sourceUid}/dartsliveCache/latest`).get();
  const cacheData = cacheDoc.exists ? cacheDoc.data()! : null;
  if (cacheData) {
    console.log(`\n🎯 キャッシュ: Rt.${cacheData.rating} (${cacheData.flight})`);
    console.log(
      `   01: ${cacheData.stats01Avg} / Cricket: ${cacheData.statsCriAvg} / CU: ${cacheData.statsPraAvg}`,
    );
    // 機密情報を除去
    delete cacheData.cardImageUrl; // DARTSLIVEカード画像は外部URL
  }

  if (isDryRun) {
    console.log('\n⚠️  DRY RUN 完了。実際に書き込むには --dry-run を外して実行してください。');
    return;
  }

  // 5. 書き込み
  console.log('\n📝 書き込み中...');

  // ユーザードキュメント
  await db.doc(`users/${DEMO_ADMIN_UID}`).set(demoUserData);
  console.log('  ✅ ユーザードキュメント');

  // 既存のスタッツを削除
  const existingStats = await db
    .collection(`users/${DEMO_ADMIN_UID}/dartsLiveStats`)
    .listDocuments();
  if (existingStats.length > 0) {
    const delBatch = db.batch();
    for (const ref of existingStats) delBatch.delete(ref);
    await delBatch.commit();
  }

  // スタッツをコピー
  if (statsSnap.size > 0) {
    const batch = db.batch();
    for (const doc of statsSnap.docs) {
      batch.set(db.doc(`users/${DEMO_ADMIN_UID}/dartsLiveStats/${doc.id}`), doc.data());
    }
    await batch.commit();
    console.log(`  ✅ dartsLiveStats ${statsSnap.size}件`);
  }

  // キャッシュをコピー
  if (cacheData) {
    cacheData.cardName = 'DEMO ADMIN';
    cacheData.toorina = 'demoadmin';
    cacheData.cardImageUrl = '';
    await db.doc(`users/${DEMO_ADMIN_UID}/dartsliveCache/latest`).set(cacheData);
    console.log('  ✅ dartsliveCache/latest');
  }

  console.log('\n🎉 同期完了！');
  console.log('   ⚠️  日次リセットCronが実行されると上書きされます。');
  console.log('   Cronのデータも更新するには reset-demo/route.ts の値も変更してください。');
}

main().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
