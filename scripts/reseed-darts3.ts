/**
 * タイトル整理版：バレルDBから実在バレルを選んでセッティング再生成
 * 使い方: npx tsx scripts/reseed-darts3.ts
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

// 手動で定義：バレルDB検索キー → 表示用タイトル & セッティング詳細
const dartDefs = [
  {
    search: 'Gomez Type16',
    title: 'Gomez Type16 メインセッティング',
    user: 'takumi',
    tip: { name: 'Premium Lippoint Short', type: 'soft', lengthMm: 21.3, weightG: 0.28 },
    shaft: { name: 'L-Shaft 190 (Short)', lengthMm: 19.0, weightG: 0.7 },
    flight: { name: 'L-Flight PRO スモール', shape: 'small', weightG: 0.55, isCondorAxe: false },
    description:
      'メインで使ってるセッティング。シャークカットの掛かりが気持ち良い。ショートシャフト＋スモールでまとまり重視。',
  },
  {
    search: 'RISING SUN G10',
    title: 'RISING SUN G10 練習用セッティング',
    user: 'takumi',
    tip: { name: 'Fit Point PLUS', type: 'soft', lengthMm: 25.0, weightG: 0.3 },
    shaft: { name: 'Fit Shaft GEAR #3', lengthMm: 24.0, weightG: 0.75 },
    flight: { name: 'Fit Flight AIR シェイプ', shape: 'kite', weightG: 0.57, isCondorAxe: false },
    description: '村松治樹モデル。ピクセルグリップがクセになる。練習用に長めのバレルで安定感重視。',
  },
  {
    search: 'RAPIER',
    title: 'RAPIER 軽量セッティング',
    user: 'takumi',
    tip: { name: 'Premium Lippoint 30', type: 'soft', lengthMm: 30.0, weightG: 0.34 },
    shaft: { name: 'L-Shaft 260 (Medium)', lengthMm: 26.0, weightG: 0.85 },
    flight: { name: 'L-Flight スタンダード', shape: 'standard', weightG: 0.65, isCondorAxe: false },
    description: '軽めで飛ばしやすい。スタンダードフライトで安定した放物線。気分転換に。',
  },
  {
    search: 'PYRO G9',
    title: 'PYRO G9 大会用セッティング',
    user: 'haruka',
    tip: { name: 'CONDOR TIP', type: 'soft', lengthMm: 24.5, weightG: 0.3 },
    shaft: { name: 'L-Shaft Silent Slim 300', lengthMm: 30.0, weightG: 0.73 },
    flight: { name: 'L-Flight PRO スリム', shape: 'slim', weightG: 0.43, isCondorAxe: false },
    description: '星野光正モデル。短めバレルで前重心。スリムフライトで鋭い飛び。大会用。',
  },
  {
    search: 'THE MIRACLE',
    title: 'THE MIRACLE サブセッティング',
    user: 'haruka',
    tip: { name: 'Premium Lippoint Short', type: 'soft', lengthMm: 21.3, weightG: 0.28 },
    shaft: { name: 'Fit Shaft GEAR #4', lengthMm: 28.5, weightG: 0.84 },
    flight: {
      name: 'Fit Flight スタンダード',
      shape: 'standard',
      weightG: 0.88,
      isCondorAxe: false,
    },
    description: '鈴木未来モデル。ダブルリングで程よくグリップ。安定感があって投げやすい。',
  },
  {
    search: 'SOLO',
    title: 'SOLO お試しセッティング',
    user: 'haruka',
    tip: { name: 'L-style Lippoint NO.5', type: 'soft', lengthMm: 23.0, weightG: 0.12 },
    shaft: { name: 'L-Shaft Carbon 190', lengthMm: 19.0, weightG: 0.65 },
    flight: { name: 'L-Flight PRO スモール', shape: 'small', weightG: 0.55, isCondorAxe: false },
    description: '友達から借りて投げたら意外と良かったので登録。マイクログルーブが手に馴染む。',
  },
];

const userMap: Record<string, { userId: string; userName: string }> = {
  takumi: { userId: 'dummy-user-takumi', userName: 'タクミ' },
  haruka: { userId: 'dummy-user-haruka', userName: 'ハルカ' },
};

const userProfiles: Record<string, Record<string, unknown>> = {
  takumi: {
    height: 175,
    fourStanceType: 'A1',
    dominantEye: 'right',
    gripType: '3フィンガー',
    throwingImage: 'プッシュ',
    twitterHandle: '@takumi_darts',
    dartsHistory: '5年',
    homeShop: 'ダーツハイブ渋谷',
    isProfilePublic: true,
    role: 'pro',
  },
  haruka: {
    height: 162,
    fourStanceType: 'B2',
    dominantEye: 'left',
    gripType: '4フィンガー',
    throwingImage: 'スイング',
    twitterHandle: '@haruka_arrows',
    dartsHistory: '2年',
    homeShop: 'Bee新宿',
    isProfilePublic: true,
    role: 'general',
  },
};

async function main() {
  // バレルDBロード
  const barrelSnap = await db.collection('barrels').get();
  const allBarrels: BarrelRecord[] = barrelSnap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as BarrelRecord)
    .filter((b) => b.imageUrl && b.weight > 0);
  console.log(`画像付きバレル: ${allBarrels.length}件\n`);

  // 既存ダミーダーツ削除
  const dartsSnap = await db.collection('darts').get();
  let deleted = 0;
  for (const doc of dartsSnap.docs) {
    if (doc.data().userId?.startsWith('dummy-user-')) {
      try {
        const [files] = await bucket.getFiles({ prefix: `images/darts/${doc.id}/` });
        for (const f of files) await f.delete();
      } catch {}
      await doc.ref.delete();
      deleted++;
    }
  }
  console.log(`${deleted}件削除\n`);

  // テストユーザープロフィール更新
  for (const [key, { userId, userName }] of Object.entries(userMap)) {
    const profile = userProfiles[key];
    if (!profile) continue;
    await db
      .collection('users')
      .doc(userId)
      .set(
        {
          displayName: userName,
          email: `${key}@example.com`,
          photoURL: null,
          avatarUrl: null,
          ...profile,
          updatedAt: FieldValue.serverTimestamp(),
          createdAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    console.log(`✓ プロフィール更新: ${userName} (${userId})`);
  }
  console.log('');

  // 作成
  for (const def of dartDefs) {
    const barrel = allBarrels.find((b) => b.name.includes(def.search));
    if (!barrel) {
      console.log(`✗ 見つからず: ${def.search}`);
      continue;
    }

    const { userId, userName } = userMap[def.user];
    const docRef = db.collection('darts').doc();
    const dartId = docRef.id;

    // 画像
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
      } catch {
        console.log(`  画像取得失敗: ${barrel.name}`);
      }
    }

    await docRef.set({
      userId,
      userName,
      title: def.title,
      barrel: {
        name: barrel.name,
        brand: barrel.brand,
        weight: barrel.weight,
        maxDiameter: barrel.maxDiameter,
        length: barrel.length,
        cut: barrel.cut || '',
      },
      tip: def.tip,
      shaft: def.shaft,
      flight: def.flight,
      description: def.description,
      imageUrls,
      likeCount: 0,
      isDraft: false,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    console.log(`✓ ${def.title} by ${userName} | ${barrel.brand} | imgs=${imageUrls.length}`);
  }

  console.log('\n完了！');
}

main().catch((err) => {
  console.error('エラー:', err);
  process.exit(1);
});
