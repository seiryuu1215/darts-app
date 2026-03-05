/**
 * テスト用: 管理者にフルカルーセル通知を送信
 *
 * 使い方:
 *   npx tsx scripts/test-line-notification.ts
 */

import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '..', '.env.local');
const envFallback = resolve(__dirname, '..', '.env');
dotenv.config({ path: existsSync(envPath) ? envPath : envFallback });

import { adminDb } from '../lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { decrypt } from '../lib/crypto';
import { buildDailyCarouselMessage } from '../lib/line';
import {
  buildRoleBasedDailyNotification,
  type DailyNotificationContext,
} from '../lib/line-notification-builder';
import { dlApiFullSync } from '../lib/dartslive-api';
import type { CountUpPlayData } from '../lib/dartslive-api';

async function main() {
  console.log('=== LINE テスト通知送信 ===\n');

  // 管理者ユーザーを取得
  const usersSnap = await adminDb.collection('users').where('role', '==', 'admin').limit(1).get();
  if (usersSnap.empty) {
    console.error('管理者ユーザーが見つかりません');
    return;
  }

  const userId = usersSnap.docs[0].id;
  const userData = usersSnap.docs[0].data();
  const lineUserId = userData.lineUserId;

  if (!lineUserId) {
    console.error('管理者のLINE連携がされていません');
    return;
  }

  console.log(`ユーザーID: ${userId}`);
  console.log(`LINE ユーザーID: ${lineUserId}`);

  // キャッシュからスタッツを取得
  const cacheDoc = await adminDb.doc(`users/${userId}/dartsliveCache/latest`).get();
  const cacheData = cacheDoc.exists ? cacheDoc.data() : null;

  if (!cacheData) {
    console.error('キャッシュデータがありません。先に「取得」を実行してください。');
    return;
  }

  console.log(`Rating: ${cacheData?.rating ?? 'N/A'}`);
  console.log(`PPD: ${cacheData?.stats01Avg ?? 'N/A'}`);
  console.log(`MPR: ${cacheData?.statsCriAvg ?? 'N/A'}`);

  // CUデータがなければAPI同期を実行
  let allCuPlays: CountUpPlayData[] = [];
  let yesterdayCuPlays: CountUpPlayData[] = [];

  // まずFirestoreキャッシュを確認
  try {
    const cuCacheDoc = await adminDb.doc(`users/${userId}/dartsliveApiCache/countupPlays`).get();
    if (cuCacheDoc.exists) {
      allCuPlays = JSON.parse(cuCacheDoc.data()?.data ?? '[]');
    }
  } catch {
    // ignore
  }

  // CUデータがなければAPI同期してから再取得
  if (allCuPlays.length === 0) {
    console.log('CUデータなし → API同期を実行...');

    const dlCreds = userData.dlCredentialsEncrypted;
    if (dlCreds?.email && dlCreds?.password) {
      try {
        const dlEmail = decrypt(dlCreds.email);
        const dlPassword = decrypt(dlCreds.password);

        // テスト用: 常にフル同期で全CUデータを取得
        console.log('フル同期を実行...');
        const apiResult = await dlApiFullSync(dlEmail, dlPassword);

        console.log(`API同期完了: CUプレイ ${apiResult.countupPlays.length}件`);

        if (apiResult.countupPlays.length > 0) {
          allCuPlays = apiResult.countupPlays.sort((a, b) => a.time.localeCompare(b.time));

          // キャッシュに保存
          await adminDb.doc(`users/${userId}/dartsliveApiCache/countupPlays`).set({
            data: JSON.stringify(allCuPlays),
            count: allCuPlays.length,
            updatedAt: FieldValue.serverTimestamp(),
          });

          // APIキャッシュも更新
          await adminDb.doc(`users/${userId}/dartsliveApiCache/latest`).set(
            {
              lastSyncAt: FieldValue.serverTimestamp(),
            },
            { merge: true },
          );
        }
      } catch (apiErr) {
        console.error('API同期エラー:', apiErr);
      }
    }
  }

  console.log(`CUプレイ総数: ${allCuPlays.length}`);

  if (allCuPlays.length > 0) {
    // 最新日のプレイを抽出
    const latestDate = allCuPlays[allCuPlays.length - 1].time.replace(/\//g, '-').split(/[T _]/)[0];
    yesterdayCuPlays = allCuPlays.filter((p) => {
      const ds = p.time.replace(/\//g, '-').split(/[T _]/)[0];
      return ds === latestDate;
    });
    console.log(`最新日(${latestDate})のCUプレイ: ${yesterdayCuPlays.length}`);
  }

  // テスト日付
  const now = new Date();
  now.setHours(now.getHours() + 9);
  const dateStr = `[TEST] ${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;

  // adminティアのフル分析カルーセルを構築
  const notifCtx: DailyNotificationContext = {
    userId,
    role: 'admin',
    stats: {
      rating: cacheData.rating ?? null,
      ppd: cacheData.stats01Avg ?? null,
      mpr: cacheData.statsCriAvg ?? null,
      prevRating: cacheData.prevRating ?? null,
      dateStr,
      awards: {
        dBull: cacheData.bullStats?.dBull ?? 0,
        sBull: cacheData.bullStats?.sBull ?? 0,
        hatTricks: cacheData.hatTricks ?? 0,
        ton80: cacheData.ton80 ?? 0,
        lowTon: cacheData.lowTon ?? 0,
        highTon: cacheData.highTon ?? 0,
        threeInABed: cacheData.threeInABed ?? 0,
        threeInABlack: cacheData.threeInABlack ?? 0,
        whiteHorse: cacheData.whiteHorse ?? 0,
      },
    },
    allCuPlays: allCuPlays.length > 0 ? allCuPlays : undefined,
    yesterdayCuPlays: yesterdayCuPlays.length > 0 ? yesterdayCuPlays : undefined,
  };

  console.log('\nカルーセル構築中...');
  const bubbles = await buildRoleBasedDailyNotification(notifCtx);
  console.log(`生成バブル数: ${bubbles.length}`);

  const carouselMsg = buildDailyCarouselMessage(bubbles);
  console.log('\nLINEに送信中...');

  // デバッグ用: LINE APIに直接リクエストしてエラー詳細を確認
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const payload = JSON.stringify({ to: lineUserId, messages: [carouselMsg] });
  console.log(`ペイロードサイズ: ${(payload.length / 1024).toFixed(1)} KB`);

  const res = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: payload,
  });

  if (res.ok) {
    console.log(`\n✅ テスト通知を送信しました！（${bubbles.length}バブル）`);
  } else {
    const errText = await res.text();
    console.error(`\n❌ 送信失敗 (${res.status}):`, errText);
  }
}

main().catch((err) => {
  console.error('エラー:', err);
  process.exit(1);
});
