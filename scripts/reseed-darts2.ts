/**
 * バレルDBから実在バレルを選んでセッティングを再生成
 * 使い方: npx tsx scripts/reseed-darts2.ts
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
  app = initializeApp({
    credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS),
    storageBucket,
  });
} else {
  app = initializeApp({ projectId, storageBucket });
}
const db = getFirestore(app);
const bucket = getStorage(app).bucket();

interface BarrelRecord {
  id: string;
  name: string;
  brand: string;
  weight: number;
  maxDiameter: number | null;
  length: number | null;
  cut: string;
  imageUrl: string | null;
}

function downloadImage(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client
      .get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          return downloadImage(res.headers.location!).then(resolve).catch(reject);
        }
        const chunks: Buffer[] = [];
        res.on('data', (c: Buffer) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
        res.on('error', reject);
      })
      .on('error', reject);
  });
}

async function main() {
  // 1. バレルDBから画像付きバレルをロード
  const barrelSnap = await db.collection('barrels').get();
  const allBarrels: BarrelRecord[] = barrelSnap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as BarrelRecord)
    .filter((b) => b.imageUrl && b.weight > 0);
  console.log(`画像付きバレル: ${allBarrels.length}件\n`);

  // 2. 人気ブランドから6本選ぶ（検索キーワードで特定の実在バレルを取得）
  const picks = [
    { keyword: 'Gomez', user: 'takumi' },
    { keyword: 'RISING SUN', user: 'takumi' },
    { keyword: 'レイピア', user: 'takumi' },
    { keyword: 'PYRO', user: 'haruka' },
    { keyword: 'Jadeite', user: 'haruka' },
    { keyword: 'THE MIRACLE', user: 'haruka' },
  ];

  const selectedBarrels: { barrel: BarrelRecord; user: string }[] = [];
  for (const pick of picks) {
    const found = allBarrels.find((b) => b.name.includes(pick.keyword));
    if (found) {
      selectedBarrels.push({ barrel: found, user: pick.user });
      console.log(`選択: ${found.name} (${found.brand}) ${found.weight}g`);
    } else {
      console.log(`見つからず: ${pick.keyword}`);
    }
  }

  if (selectedBarrels.length === 0) {
    console.error('バレルが見つかりませんでした');
    process.exit(1);
  }

  // 3. 既存のダミーダーツを削除（dummy-user のもの）
  const dartsSnap = await db.collection('darts').get();
  let deleted = 0;
  for (const doc of dartsSnap.docs) {
    const d = doc.data();
    if (d.userId?.startsWith('dummy-user-')) {
      await doc.ref.delete();
      // Storage の画像も削除
      try {
        const [files] = await bucket.getFiles({ prefix: `images/darts/${doc.id}/` });
        for (const f of files) await f.delete();
      } catch {}
      deleted++;
    }
  }
  console.log(`\n${deleted}件の既存ダミーダーツを削除\n`);

  // 4. セッティングデータ定義（バレルはDBから取得した実データを使う）
  const tipOptions = [
    { name: 'Premium Lippoint Short', type: 'soft', lengthMm: 21.3, weightG: 0.28 },
    { name: 'Fit Point PLUS', type: 'soft', lengthMm: 25.0, weightG: 0.3 },
    { name: 'CONDOR TIP', type: 'soft', lengthMm: 24.5, weightG: 0.3 },
    { name: 'Premium Lippoint 30', type: 'soft', lengthMm: 30.0, weightG: 0.34 },
    { name: 'CONDOR TIP ULTIMATE', type: 'soft', lengthMm: 31.0, weightG: 0.35 },
    { name: 'L-style Lippoint NO.5', type: 'soft', lengthMm: 23.0, weightG: 0.12 },
  ];

  const shaftOptions = [
    { name: 'L-Shaft 190 (Short)', lengthMm: 19.0, weightG: 0.7 },
    { name: 'Fit Shaft GEAR #3', lengthMm: 24.0, weightG: 0.75 },
    { name: 'L-Shaft 260 (Medium)', lengthMm: 26.0, weightG: 0.85 },
    { name: 'Fit Shaft GEAR #4', lengthMm: 28.5, weightG: 0.84 },
    { name: 'L-Shaft Carbon 190', lengthMm: 19.0, weightG: 0.65 },
    { name: 'L-Shaft Silent Slim 300', lengthMm: 30.0, weightG: 0.73 },
  ];

  const flightOptions = [
    { name: 'L-Flight PRO スモール', shape: 'small', weightG: 0.55, isCondorAxe: false },
    { name: 'Fit Flight AIR シェイプ', shape: 'kite', weightG: 0.57, isCondorAxe: false },
    { name: 'L-Flight スタンダード', shape: 'standard', weightG: 0.65, isCondorAxe: false },
    { name: 'L-Flight PRO スリム', shape: 'slim', weightG: 0.43, isCondorAxe: false },
    { name: 'Fit Flight スタンダード', shape: 'standard', weightG: 0.88, isCondorAxe: false },
    {
      name: 'CONDOR AXE スモール S',
      shape: 'small',
      weightG: 1.42,
      isCondorAxe: true,
      condorAxeShaftLengthMm: 21.5,
    },
  ];

  const descriptions = [
    'メインセッティング。シャークカットの掛かりが気持ち良い。ショートシャフト＋スモールでまとまり重視。',
    'ピクセルグリップがクセになる。練習用に長めのバレルで安定感重視。',
    '軽めで飛ばしやすい。スタンダードフライトで安定した放物線。',
    '短めバレルで前重心。スリムフライトで鋭い飛び。大会用。',
    'CONDOR AXE一体型でセッティングの緩みゼロ。安定感抜群。',
    '友達から借りて投げたら意外と良かった。ダブルリングで程よくグリップ。',
  ];

  const userMap: Record<string, { userId: string; userName: string }> = {
    takumi: { userId: 'dummy-user-takumi', userName: 'タクミ' },
    haruka: { userId: 'dummy-user-haruka', userName: 'ハルカ' },
  };

  // 5. 作成
  for (let i = 0; i < selectedBarrels.length; i++) {
    const { barrel, user } = selectedBarrels[i];
    const { userId, userName } = userMap[user];
    const docRef = db.collection('darts').doc();
    const dartId = docRef.id;

    // バレル名を短縮（ブランド名や余計な括弧を除去）
    const shortName = barrel.name
      .replace(/^[A-Za-z]+\([^)]+\)\s*/, '') // ブランド(xxx)
      .replace(/\s*\([^)]*バレル[^)]*\)\s*$/, '') // (ダーツ バレル)
      .replace(/\s*\d+BA\s*$/, '') // 2BA
      .replace(/\s*\d+(\.\d+)?g\s*$/, '') // 重量
      .trim();

    // タイトルにバレル短縮名を使う
    const title = `${shortName} セッティング`;

    // 画像ダウンロード & アップロード
    let imageUrls: string[] = [];
    if (barrel.imageUrl) {
      try {
        const imgBuffer = await downloadImage(barrel.imageUrl);
        const ext = barrel.imageUrl.includes('.png') ? 'png' : 'jpg';
        const filePath = `images/darts/${dartId}/barrel.${ext}`;
        const file = bucket.file(filePath);
        await file.save(imgBuffer, {
          metadata: { contentType: `image/${ext === 'png' ? 'png' : 'jpeg'}` },
        });
        await file.makePublic();
        imageUrls = [`https://storage.googleapis.com/${storageBucket}/${filePath}`];
      } catch (err) {
        console.log(`  画像取得失敗: ${barrel.name}`);
      }
    }

    const isCondorAxe = flightOptions[i]?.isCondorAxe || false;

    await docRef.set({
      userId,
      userName,
      title,
      barrel: {
        name: barrel.name,
        brand: barrel.brand,
        weight: barrel.weight,
        maxDiameter: barrel.maxDiameter,
        length: barrel.length,
        cut: barrel.cut || '',
      },
      tip: tipOptions[i],
      shaft: isCondorAxe
        ? { name: 'CONDOR AXE スモール S (Short)', lengthMm: 21.5, weightG: null }
        : shaftOptions[i],
      flight: flightOptions[i],
      description: descriptions[i],
      imageUrls,
      likeCount: 0,
      isDraft: false,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    console.log(`✓ ${title} by ${userName} | ${barrel.brand} | imgs=${imageUrls.length}`);
  }

  console.log('\n完了！');
}

main().catch((err) => {
  console.error('エラー:', err);
  process.exit(1);
});
