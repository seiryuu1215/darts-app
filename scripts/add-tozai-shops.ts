/**
 * 東西線沿いのダーツバーを一括登録するスクリプト
 *
 * 使い方: npx tsx scripts/add-tozai-shops.ts
 */

import 'dotenv/config';
import { config } from 'dotenv';
config({ path: '.env.local' });

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

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

// 東京メトロ東西線 全駅
const TOZAI_STATIONS = [
  '中野駅',
  '落合駅',
  '高田馬場駅',
  '早稲田駅',
  '神楽坂駅',
  '飯田橋駅',
  '九段下駅',
  '竹橋駅',
  '大手町駅',
  '日本橋駅',
  '茅場町駅',
  '門前仲町駅',
  '木場駅',
  '東陽町駅',
  '南砂町駅',
  '西葛西駅',
  '葛西駅',
  '浦安駅',
  '南行徳駅',
  '行徳駅',
  '妙典駅',
  '原木中山駅',
  '西船橋駅',
];

async function searchShopsByStation(station: string): Promise<string[]> {
  const url = `https://search.dartslive.com/jp/shops/?freeword=${encodeURIComponent(station)}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DartsApp/1.0)' },
  });
  if (!res.ok) return [];
  const html = await res.text();
  const matches = html.matchAll(/href="\/jp\/shop\/([a-f0-9]+)"/g);
  const ids = new Set<string>();
  for (const m of matches) ids.add(m[1]);
  return [...ids];
}

async function fetchShopDetails(shopEncId: string) {
  const shopUrl = `https://search.dartslive.com/jp/shop/${shopEncId}`;

  // Fetch HTML
  const htmlRes = await fetch(shopUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DartsApp/1.0)', Accept: 'text/html' },
  });
  if (!htmlRes.ok) return null;
  const html = await htmlRes.text();

  // OGP
  const ogTitle =
    html.match(/<meta\s+property="og:title"\s+content="([^"]*)"/i)?.[1] ??
    html.match(/<meta\s+content="([^"]*)"\s+property="og:title"/i)?.[1] ??
    '';
  const ogImage =
    html.match(/<meta\s+property="og:image"\s+content="([^"]*)"/i)?.[1] ??
    html.match(/<meta\s+content="([^"]*)"\s+property="og:image"/i)?.[1] ??
    '';

  const titleParts = ogTitle.split('|').map((s: string) => s.trim());
  const name = titleParts[0] || '';
  if (!name) return null;

  // Address
  let address = '';
  const addressRegex = /<p[\s\S]*?class="[^"]*address[^"]*"[\s\S]*?>([^<]+)<\/p>/gi;
  let addrMatch;
  while ((addrMatch = addressRegex.exec(html)) !== null) {
    const val = addrMatch[1].trim();
    if (val) {
      address = val;
      break;
    }
  }

  // Station
  const stationMatch = html.match(/<label>最寄り駅<\/label>[\s\S]*?<p[^>]*>([^<]+)/i);
  const nearestStation = stationMatch?.[1]?.trim() ?? '';

  // Tags from const options
  const tags: string[] = [];
  try {
    const optionsMatch = html.match(/const\s+options\s*=\s*"(\{[\s\S]*?\})"/);
    if (optionsMatch) {
      const raw = optionsMatch[1]
        .replace(/\\u([0-9a-fA-F]{4})/g, (_: string, hex: string) =>
          String.fromCharCode(parseInt(hex, 16)),
        )
        .replace(/'/g, '"')
        .replace(/True/g, 'true')
        .replace(/False/g, 'false')
        .replace(/None/g, 'null');
      const options = JSON.parse(raw);
      const groups = options?.optionGroup?.optionGroupList;
      if (Array.isArray(groups)) {
        for (const group of groups) {
          if (Array.isArray(group?.optionList)) {
            for (const opt of group.optionList) {
              if (opt?.comment) tags.push(opt.comment);
            }
          }
        }
      }
    }
  } catch {
    /* ignore */
  }

  // Machine count from summary API
  let machineCount: { dl2: number; dl3: number } | null = null;
  let apiStationName = '';
  try {
    const summaryRes = await fetch(
      `https://search.dartslive.com/shop/shop-summery/?country_code=jp&shop_enc_id=${shopEncId}`,
      { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DartsApp/1.0)' } },
    );
    if (summaryRes.ok) {
      const summary = await summaryRes.json();
      const machine = summary?.shop?.busyMachine?.machine;
      if (machine) {
        machineCount = { dl2: machine.dl2num ?? 0, dl3: machine.dl3num ?? 0 };
      }
      if (summary?.shop?.nearestStation?.nearestStationName) {
        apiStationName = summary.shop.nearestStation.nearestStationName;
      }
    }
  } catch {
    /* ignore */
  }

  // Machine count is in the machineCount field — not duplicated in tags

  const imageUrl = ogImage ? `/api/proxy-image?url=${encodeURIComponent(ogImage)}` : null;

  return {
    name,
    address,
    nearestStation: nearestStation || apiStationName,
    imageUrl,
    machineCount,
    tags,
  };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  // Find admin user
  const snapshot = await db.collection('users').where('role', '==', 'admin').limit(1).get();
  if (snapshot.empty) {
    console.error('adminユーザが見つかりません');
    process.exit(1);
  }
  const userId = snapshot.docs[0].id;
  console.log(`ユーザ: ${userId} (${snapshot.docs[0].data().displayName})`);

  // Delete all existing bookmarks
  const existingSnap = await db.collection('users').doc(userId).collection('shopBookmarks').get();
  console.log(`既存ブックマーク削除中: ${existingSnap.size}件...`);
  const batch = db.batch();
  existingSnap.docs.forEach((d) => batch.delete(d.ref));
  if (existingSnap.size > 0) await batch.commit();
  console.log(`削除完了`);

  const existingNames = new Set<string>();

  // Collect all unique shop IDs across all stations
  const allShopIds = new Set<string>();
  for (const station of TOZAI_STATIONS) {
    console.log(`検索中: ${station}...`);
    const ids = await searchShopsByStation(station);
    console.log(`  → ${ids.length}件`);
    for (const id of ids) allShopIds.add(id);
    await sleep(500);
  }
  console.log(`\nユニーク店舗数: ${allShopIds.size}件`);

  // Fetch details and add
  let added = 0;
  let skipped = 0;
  for (const shopId of allShopIds) {
    const details = await fetchShopDetails(shopId);
    if (!details) {
      console.log(`  スキップ (取得失敗): ${shopId}`);
      skipped++;
      continue;
    }

    if (existingNames.has(details.name)) {
      console.log(`  スキップ (重複): ${details.name}`);
      skipped++;
      continue;
    }

    const now = Timestamp.now();
    await db.collection('users').doc(userId).collection('shopBookmarks').add({
      name: details.name,
      address: details.address,
      nearestStation: details.nearestStation,
      imageUrl: details.imageUrl,
      machineCount: details.machineCount,
      tags: details.tags,
      note: '',
      rating: null,
      visitCount: 0,
      lastVisitedAt: null,
      isFavorite: false,
      listIds: [],
      createdAt: now,
      updatedAt: now,
    });

    existingNames.add(details.name);
    added++;
    console.log(`  追加: ${details.name} (${details.nearestStation}) [${details.tags.join(', ')}]`);
    await sleep(800);
  }

  console.log(`\n完了: ${added}件追加, ${skipped}件スキップ`);
}

main().catch((err) => {
  console.error('エラー:', err);
  process.exit(1);
});
