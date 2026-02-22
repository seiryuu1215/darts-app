/**
 * マルチ路線ショップ一括登録スクリプト
 *
 * 16路線の駅周辺のダーツバーをスクレイピングし、Firestoreに保存する。
 * 既存データは非破壊的にmerge書き込みされる。
 *
 * 使い方:
 *   npx tsx scripts/add-multi-line-shops.ts              # 全路線
 *   npx tsx scripts/add-multi-line-shops.ts --dry-run    # 保存せず結果表示
 *   npx tsx scripts/add-multi-line-shops.ts --lines=東西線,山手線  # 特定路線のみ
 */

import 'dotenv/config';
import { config } from 'dotenv';
config({ path: '.env.local' });

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { LINE_STATIONS, STATION_TO_LINES, LINE_NAMES } from '../lib/line-stations';
import {
  sleep,
  searchShopsByStation,
  fetchShopDetails,
  isAllowedPrefecture,
  processInChunks,
} from '../lib/shop-import';

// --- CLI引数パース ---
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const linesArg = args.find((a) => a.startsWith('--lines='));
const targetLines: string[] = linesArg
  ? linesArg.replace('--lines=', '').split(',').filter(Boolean)
  : LINE_NAMES;

// --- Firebase初期化 ---
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
if (!projectId) {
  console.error('NEXT_PUBLIC_FIREBASE_PROJECT_IDが設定されていません');
  process.exit(1);
}

let app;
if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  app = initializeApp({ credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS) });
} else {
  app = initializeApp({ projectId });
}
const db = getFirestore(app);

// --- メイン処理 ---
async function main() {
  console.log('=== マルチ路線ショップスクレイピング ===');
  console.log(`対象路線: ${targetLines.join(', ')}`);
  console.log(`ドライラン: ${isDryRun ? 'はい' : 'いいえ'}`);
  console.log('');

  // adminユーザ検索
  let userId: string;
  if (!isDryRun) {
    const snapshot = await db.collection('users').where('role', '==', 'admin').limit(1).get();
    if (snapshot.empty) {
      console.error('adminユーザが見つかりません');
      process.exit(1);
    }
    userId = snapshot.docs[0].id;
    console.log(`ユーザ: ${userId} (${snapshot.docs[0].data().displayName})`);
  } else {
    userId = 'dry-run';
  }

  // Phase 1: 全路線の駅を検索し、shopEncId → Set<駅名> マッピング収集
  console.log('\n--- Phase 1: 駅検索 ---');
  const shopToStations = new Map<string, Set<string>>();

  // 路線を3つずつ並行処理
  const processLine = async (line: string) => {
    const stations = LINE_STATIONS[line];
    if (!stations) {
      console.log(`  [警告] 路線 "${line}" が見つかりません`);
      return;
    }
    console.log(`\n[${line}] ${stations.length}駅を検索中...`);

    for (const station of stations) {
      const ids = await searchShopsByStation(station);
      console.log(`  ${station}: ${ids.length}件`);
      for (const id of ids) {
        if (!shopToStations.has(id)) {
          shopToStations.set(id, new Set());
        }
        shopToStations.get(id)!.add(station);
      }
      await sleep(500);
    }
  };

  // 3路線ずつ並行
  for (let i = 0; i < targetLines.length; i += 3) {
    const chunk = targetLines.slice(i, i + 3);
    await Promise.all(chunk.map(processLine));
  }

  console.log(`\nユニーク店舗数: ${shopToStations.size}件`);

  // Phase 2: 駅名→路線の逆引きで shopEncId → lines[] を導出
  console.log('\n--- Phase 2: 路線マッピング ---');
  const shopToLines = new Map<string, string[]>();
  for (const [shopId, stations] of shopToStations) {
    const lineSet = new Set<string>();
    for (const station of stations) {
      const lines = STATION_TO_LINES[station];
      if (lines) {
        for (const line of lines) {
          // 対象路線に含まれている場合のみ
          if (targetLines.includes(line)) {
            lineSet.add(line);
          }
        }
      }
    }
    shopToLines.set(shopId, [...lineSet].sort());
  }

  // Phase 3: 各ショップの詳細取得（3件ずつ並行）
  console.log('\n--- Phase 3: 詳細取得 ---');
  const shopIds = [...shopToStations.keys()];
  const shopDetails = new Map<
    string,
    {
      name: string;
      address: string;
      nearestStation: string;
      imageUrl: string | null;
      machineCount: { dl2: number; dl3: number } | null;
      tags: string[];
      lines: string[];
    }
  >();

  let fetchCount = 0;
  const totalShops = shopIds.length;

  await processInChunks(shopIds, 3, 800, async (shopId) => {
    const details = await fetchShopDetails(shopId);
    fetchCount++;

    if (!details) {
      console.log(`  [${fetchCount}/${totalShops}] スキップ (取得失敗): ${shopId}`);
      return null;
    }

    const lines = shopToLines.get(shopId) ?? [];
    shopDetails.set(shopId, { ...details, lines });
    console.log(
      `  [${fetchCount}/${totalShops}] ${details.name} (${details.nearestStation}) [${lines.join(', ')}]`,
    );
    return details;
  });

  // Phase 4: 都道府県フィルター
  console.log('\n--- Phase 4: 都道府県フィルター ---');
  let filteredOut = 0;
  for (const [shopId, details] of shopDetails) {
    if (!isAllowedPrefecture(details.address)) {
      shopDetails.delete(shopId);
      filteredOut++;
      console.log(`  除外: ${details.name} (${details.address})`);
    }
  }
  console.log(`フィルター後: ${shopDetails.size}件 (${filteredOut}件除外)`);

  // Phase 5: Firestoreに保存
  console.log('\n--- Phase 5: 保存 ---');
  if (isDryRun) {
    console.log('[ドライラン] 以下のデータが保存されます:');
    let i = 0;
    for (const [, details] of shopDetails) {
      i++;
      console.log(
        `  ${i}. ${details.name} | ${details.nearestStation} | ${details.lines.join(', ')} | ${details.tags.slice(0, 3).join(', ')}`,
      );
    }
    console.log(`\n合計: ${shopDetails.size}件`);
    return;
  }

  let saved = 0;
  let errors = 0;
  const now = Timestamp.now();
  const bookmarksRef = db.collection('users').doc(userId).collection('shopBookmarks');

  for (const [shopEncId, details] of shopDetails) {
    try {
      const docId = `dl_${shopEncId}`;
      const docRef = bookmarksRef.doc(docId);
      const existing = await docRef.get();

      if (existing.exists) {
        // 既存ドキュメント: スクレイピングデータのみ更新（ユーザー編集フィールドは維持）
        await docRef.set(
          {
            name: details.name,
            address: details.address,
            nearestStation: details.nearestStation,
            imageUrl: details.imageUrl,
            machineCount: details.machineCount,
            tags: details.tags,
            lines: details.lines,
            updatedAt: now,
          },
          { merge: true },
        );
      } else {
        // 新規ドキュメント: 全フィールドを設定
        await docRef.set({
          name: details.name,
          address: details.address,
          nearestStation: details.nearestStation,
          imageUrl: details.imageUrl,
          machineCount: details.machineCount,
          tags: details.tags,
          lines: details.lines,
          note: '',
          rating: null,
          visitCount: 0,
          lastVisitedAt: null,
          isFavorite: false,
          listIds: [],
          createdAt: now,
          updatedAt: now,
        });
      }

      saved++;
    } catch (err) {
      errors++;
      console.error(`  保存エラー: ${details.name} — ${err}`);
    }
  }

  console.log(`\n=== 完了 ===`);
  console.log(`保存: ${saved}件, エラー: ${errors}件`);
}

main().catch((err) => {
  console.error('エラー:', err);
  process.exit(1);
});
