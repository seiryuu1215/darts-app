/**
 * 画像なしダーツを削除 → バレルDBの画像付きで再生成
 * 使い方: npx tsx scripts/reseed-darts.ts
 */

import 'dotenv/config';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { config } from 'dotenv';
import https from 'https';
import http from 'http';

config({ path: '.env.local' });

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
let app;
if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  app = initializeApp({ credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS), storageBucket });
} else {
  app = initializeApp({ projectId, storageBucket });
}
const db = getFirestore(app);
const bucket = getStorage(app).bucket();

// バレルDBから名前で画像URLを検索するためにキャッシュ
let barrelCache: { name: string; brand: string; imageUrl: string | null }[] = [];

async function loadBarrels() {
  const snapshot = await db.collection('barrels').get();
  barrelCache = snapshot.docs.map((d) => {
    const data = d.data();
    return { name: data.name || '', brand: data.brand || '', imageUrl: data.imageUrl || null };
  });
  console.log(`バレルDB: ${barrelCache.length}件ロード`);
}

function findBarrelImage(barrelName: string, brand: string): string | null {
  // まず完全一致
  const exact = barrelCache.find(
    (b) => b.imageUrl && b.name.toLowerCase().includes(barrelName.toLowerCase())
  );
  if (exact?.imageUrl) return exact.imageUrl;

  // ブランドで部分一致
  const byBrand = barrelCache.find(
    (b) => b.imageUrl && b.brand.toLowerCase().includes(brand.toLowerCase())
  );
  if (byBrand?.imageUrl) return byBrand.imageUrl;

  return null;
}

function downloadImage(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return downloadImage(res.headers.location!).then(resolve).catch(reject);
      }
      const chunks: Buffer[] = [];
      res.on('data', (c: Buffer) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

// --- 新しいセッティングデータ（画像をバレルDBから取得） ---
const darts = [
  // タクミ
  {
    userId: 'dummy-user-takumi',
    userName: 'タクミ',
    title: 'Gomez Type11 メインセッティング',
    barrel: { name: 'Gomez Type11', brand: 'TRINIDAD', weight: 20.0, maxDiameter: 7.2, length: 42.0, cut: 'シャークカット,リングカット' },
    tip: { name: 'Premium Lippoint Short', type: 'soft', lengthMm: 21.3, weightG: 0.28 },
    shaft: { name: 'L-Shaft 190 (Short)', lengthMm: 19.0, weightG: 0.70 },
    flight: { name: 'L-Flight PRO スモール', shape: 'small', weightG: 0.55, isCondorAxe: false },
    description: 'メインで使ってるセッティング。シャークカットの掛かりが気持ち良い。ショートシャフト＋スモールでまとまり重視。',
    barrelSearch: 'Gomez',
  },
  {
    userId: 'dummy-user-takumi',
    userName: 'タクミ',
    title: 'RISING SUN 6.0 練習用',
    barrel: { name: 'RISING SUN 6.0', brand: 'TARGET', weight: 21.5, maxDiameter: 7.4, length: 44.0, cut: 'ピクセルグリップ' },
    tip: { name: 'Fit Point PLUS', type: 'soft', lengthMm: 25.0, weightG: 0.30 },
    shaft: { name: 'Fit Shaft GEAR #3', lengthMm: 24.0, weightG: 0.75 },
    flight: { name: 'Fit Flight AIR シェイプ', shape: 'kite', weightG: 0.57, isCondorAxe: false },
    description: '村松治樹モデル。ピクセルグリップがクセになる。練習用に長めのバレルで安定感重視。',
    barrelSearch: 'RISING SUN',
  },
  {
    userId: 'dummy-user-takumi',
    userName: 'タクミ',
    title: 'SOLO G4 サブセッティング',
    barrel: { name: 'SOLO G4', brand: 'TARGET', weight: 18.0, maxDiameter: 6.8, length: 40.0, cut: 'マイクログルーブ' },
    tip: { name: 'Premium Lippoint 30 (Long)', type: 'soft', lengthMm: 30.0, weightG: 0.34 },
    shaft: { name: 'L-Shaft 260 (Medium)', lengthMm: 26.0, weightG: 0.85 },
    flight: { name: 'L-Flight スタンダード', shape: 'standard', weightG: 0.65, isCondorAxe: false },
    description: '軽めで飛ばしやすい。スタンダードフライトで安定した放物線。気分転換に。',
    barrelSearch: 'SOLO',
  },
  // ハルカ
  {
    userId: 'dummy-user-haruka',
    userName: 'ハルカ',
    title: 'PYRO 坂口優希恵モデル 本気セッティング',
    barrel: { name: "PYRO Blazin'", brand: 'Dynamite', weight: 20.0, maxDiameter: 7.0, length: 38.5, cut: 'ウィングカット,リングカット' },
    tip: { name: 'CONDOR TIP', type: 'soft', lengthMm: 24.5, weightG: 0.30 },
    shaft: { name: 'L-Shaft Silent Slim 300 (Short)', lengthMm: 30.0, weightG: 0.73 },
    flight: { name: 'L-Flight PRO スリム', shape: 'slim', weightG: 0.43, isCondorAxe: false },
    description: '短めバレルで前重心。スリムフライトで鋭い飛び。大会用のメインセッティング。',
    barrelSearch: 'PYRO',
  },
  {
    userId: 'dummy-user-haruka',
    userName: 'ハルカ',
    title: 'Jadeite 2 CONDOR AXEセッティング',
    barrel: { name: 'Jadeite 2', brand: 'COSMO', weight: 20.0, maxDiameter: 7.0, length: 40.0, cut: 'サンドブラスト,リングカット' },
    tip: { name: 'CONDOR TIP ULTIMATE', type: 'soft', lengthMm: 31.0, weightG: 0.35 },
    shaft: { name: 'CONDOR AXE スモール S (Short)', lengthMm: 21.5, weightG: null },
    flight: { name: 'CONDOR AXE スモール S (Short)', shape: 'small', weightG: 1.42, isCondorAxe: true, condorAxeShaftLengthMm: 21.5 },
    description: 'CONDOR AXE一体型でセッティングの緩みゼロ。ロングチップと合わせて全長を確保。',
    barrelSearch: 'Jadeite',
  },
  {
    userId: 'dummy-user-haruka',
    userName: 'ハルカ',
    title: 'THE MIRACLE G4 お試し',
    barrel: { name: 'THE MIRACLE G4', brand: 'MONSTER', weight: 18.5, maxDiameter: 6.7, length: 39.0, cut: 'ダブルリングカット' },
    tip: { name: 'Premium Lippoint Short', type: 'soft', lengthMm: 21.3, weightG: 0.28 },
    shaft: { name: 'Fit Shaft GEAR #4', lengthMm: 28.5, weightG: 0.84 },
    flight: { name: 'Fit Flight スタンダード', shape: 'standard', weightG: 0.88, isCondorAxe: false },
    description: '友達から借りて投げたら意外と良かったので登録。軽めだけどダブルリングで程よくグリップ。',
    barrelSearch: 'MIRACLE',
  },
];

async function main() {
  await loadBarrels();

  // 1. 画像なしダーツを削除
  const snapshot = await db.collection('darts').get();
  let deleted = 0;
  for (const doc of snapshot.docs) {
    const d = doc.data();
    if (!d.imageUrls || d.imageUrls.length === 0) {
      await doc.ref.delete();
      console.log(`削除: ${d.title} (${doc.id})`);
      deleted++;
    }
  }
  console.log(`\n${deleted}件削除\n`);

  // 2. 画像付きで再作成
  for (const dart of darts) {
    const { barrelSearch, ...dartData } = dart;
    const docRef = db.collection('darts').doc();
    const dartId = docRef.id;

    // バレルDBから画像を探す
    const imageUrl = findBarrelImage(barrelSearch, dart.barrel.brand);
    let imageUrls: string[] = [];

    if (imageUrl) {
      try {
        const imgBuffer = await downloadImage(imageUrl);
        const ext = imageUrl.includes('.png') ? 'png' : 'jpg';
        const filePath = `images/darts/${dartId}/barrel.${ext}`;
        const file = bucket.file(filePath);
        await file.save(imgBuffer, { metadata: { contentType: `image/${ext === 'png' ? 'png' : 'jpeg'}` } });
        await file.makePublic();
        const uploadedUrl = `https://storage.googleapis.com/${storageBucket}/${filePath}`;
        imageUrls = [uploadedUrl];
        console.log(`  画像取得OK: ${barrelSearch}`);
      } catch (err) {
        console.log(`  画像取得失敗: ${barrelSearch} (${err})`);
      }
    } else {
      console.log(`  画像なし: ${barrelSearch} (バレルDBにマッチなし)`);
    }

    await docRef.set({
      ...dartData,
      imageUrls,
      likeCount: 0,
      isDraft: false,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    console.log(`作成: ${dart.title} (${dartId}) imgs=${imageUrls.length}`);
  }

  console.log('\n完了！');
}

main().catch((err) => {
  console.error('エラー:', err);
  process.exit(1);
});
