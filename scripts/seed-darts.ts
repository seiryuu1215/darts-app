/**
 * ダミーユーザ＆セッティングシードスクリプト
 *
 * 使い方: npx tsx scripts/seed-darts.ts
 */

import 'dotenv/config';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { config } from 'dotenv';
config({ path: '.env.local' });

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

// --- ダミーユーザ ---
const users = [
  {
    id: 'dummy-user-takumi',
    displayName: 'タクミ',
    email: 'takumi@example.com',
    photoURL: null,
    avatarUrl: null,
    role: 'general',
  },
  {
    id: 'dummy-user-haruka',
    displayName: 'ハルカ',
    email: 'haruka@example.com',
    photoURL: null,
    avatarUrl: null,
    role: 'general',
  },
];

// --- セッティングデータ ---
const darts = [
  // ===== タクミのセッティング =====
  {
    userId: 'dummy-user-takumi',
    userName: 'タクミ',
    title: 'Gomez Type11 メインセッティング',
    barrel: {
      name: 'Gomez Type11',
      brand: 'TRINIDAD',
      weight: 20.0,
      maxDiameter: 7.2,
      length: 42.0,
      cut: 'シャークカット + リングカット',
    },
    tip: { name: 'Premium Lippoint Short', type: 'soft', lengthMm: 21.3, weightG: 0.28 },
    shaft: { name: 'L-Shaft 190 (Short)', lengthMm: 19.0, weightG: 0.70 },
    flight: { name: 'L-Flight PRO スモール', shape: 'small', weightG: 0.55, isCondorAxe: false },
    description: 'メインで使ってるセッティング。シャークカットの掛かりが気持ち良い。ショートシャフト＋スモールでまとまり重視。',
    imageUrls: [],
  },
  {
    userId: 'dummy-user-takumi',
    userName: 'タクミ',
    title: 'RISING SUN 6.0 練習用',
    barrel: {
      name: 'RISING SUN 6.0',
      brand: 'TARGET',
      weight: 21.5,
      maxDiameter: 7.4,
      length: 44.0,
      cut: 'ピクセルグリップ',
    },
    tip: { name: 'Fit Point PLUS', type: 'soft', lengthMm: 25.0, weightG: 0.30 },
    shaft: { name: 'Fit Shaft GEAR #3', lengthMm: 24.0, weightG: 0.75 },
    flight: { name: 'Fit Flight AIR シェイプ', shape: 'kite', weightG: 0.57, isCondorAxe: false },
    description: '村松治樹モデル。ピクセルグリップがクセになる。練習用に長めのバレルで安定感重視。',
    imageUrls: [],
  },
  {
    userId: 'dummy-user-takumi',
    userName: 'タクミ',
    title: 'SOLO G4 サブセッティング',
    barrel: {
      name: 'SOLO G4',
      brand: 'TARGET',
      weight: 18.0,
      maxDiameter: 6.8,
      length: 40.0,
      cut: 'マイクログルーブ',
    },
    tip: { name: 'Premium Lippoint 30 (Long)', type: 'soft', lengthMm: 30.0, weightG: 0.34 },
    shaft: { name: 'L-Shaft 260 (Medium)', lengthMm: 26.0, weightG: 0.85 },
    flight: { name: 'L-Flight スタンダード', shape: 'standard', weightG: 0.65, isCondorAxe: false },
    description: '軽めで飛ばしやすい。スタンダードフライトで安定した放物線。気分転換に。',
    imageUrls: [],
  },

  // ===== ハルカのセッティング =====
  {
    userId: 'dummy-user-haruka',
    userName: 'ハルカ',
    title: 'PYRO 坂口優希恵モデル 本気セッティング',
    barrel: {
      name: 'PYRO Blazin\'',
      brand: 'Dynamite',
      weight: 20.0,
      maxDiameter: 7.0,
      length: 38.5,
      cut: 'ウィングカット + リングカット',
    },
    tip: { name: 'CONDOR TIP', type: 'soft', lengthMm: 24.5, weightG: 0.30 },
    shaft: { name: 'L-Shaft Silent Slim 300 (Short)', lengthMm: 30.0, weightG: 0.73 },
    flight: { name: 'L-Flight PRO スリム', shape: 'slim', weightG: 0.43, isCondorAxe: false },
    description: '短めバレルで前重心。スリムフライトで鋭い飛び。大会用のメインセッティング。',
    imageUrls: [],
  },
  {
    userId: 'dummy-user-haruka',
    userName: 'ハルカ',
    title: 'Jadeite 2 CONDOR AXEセッティング',
    barrel: {
      name: 'Jadeite 2',
      brand: 'COSMO',
      weight: 20.0,
      maxDiameter: 7.0,
      length: 40.0,
      cut: 'サンドブラスト + リングカット',
    },
    tip: { name: 'CONDOR TIP ULTIMATE', type: 'soft', lengthMm: 31.0, weightG: 0.35 },
    shaft: { name: 'CONDOR AXE スモール S (Short)', lengthMm: 21.5, weightG: null },
    flight: {
      name: 'CONDOR AXE スモール S (Short)',
      shape: 'small',
      weightG: 1.42,
      isCondorAxe: true,
      condorAxeShaftLengthMm: 21.5,
    },
    description: 'CONDOR AXE一体型でセッティングの緩みゼロ。ロングチップと合わせて全長を確保。',
    imageUrls: [],
  },
  {
    userId: 'dummy-user-haruka',
    userName: 'ハルカ',
    title: 'THE MIRACLE G4 お試し',
    barrel: {
      name: 'THE MIRACLE G4',
      brand: 'MONSTER',
      weight: 18.5,
      maxDiameter: 6.7,
      length: 39.0,
      cut: 'ダブルリングカット',
    },
    tip: { name: 'Premium Lippoint Short', type: 'soft', lengthMm: 21.3, weightG: 0.28 },
    shaft: { name: 'Fit Shaft GEAR #4', lengthMm: 28.5, weightG: 0.84 },
    flight: { name: 'Fit Flight スタンダード', shape: 'standard', weightG: 0.88, isCondorAxe: false },
    description: '友達から借りて投げたら意外と良かったので登録。軽めだけどダブルリングで程よくグリップ。',
    imageUrls: [],
  },
];

async function seed() {
  // ユーザ作成
  for (const user of users) {
    const { id, ...userData } = user;
    await db.collection('users').doc(id).set({
      ...userData,
      height: null,
      fourStanceType: null,
      throwingImage: '',
      dominantEye: null,
      gripType: '',
      activeSoftDartId: null,
      activeSteelDartId: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    console.log(`ユーザ作成: ${user.displayName} (${id})`);
  }

  // セッティング作成
  for (const dart of darts) {
    const docRef = db.collection('darts').doc();
    await docRef.set({
      ...dart,
      likeCount: 0,
      isDraft: true,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    console.log(`セッティング作成: ${dart.title} (${docRef.id}) by ${dart.userName}`);
  }

  console.log('\n完了！ 2ユーザ × 3セッティング = 6件をドラフトで登録しました。');
}

seed().catch((err) => {
  console.error('エラー:', err);
  process.exit(1);
});
