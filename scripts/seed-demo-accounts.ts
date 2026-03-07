/**
 * デモアカウント作成スクリプト
 *
 * Firebase Auth + Firestore にデモアカウントを作成し、
 * PRO/admin にはDARTSLIVEスタッツデータを投入する。
 *
 * 使い方: npx tsx scripts/seed-demo-accounts.ts
 */

import 'dotenv/config';
import { config } from 'dotenv';
config({ path: '.env.local' });

import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

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
const auth = getAuth(app);

// --- シードデータ（直接定義: lib/ の@/エイリアスがスクリプトで使えないため） ---

const DEMO_ACCOUNTS = [
  {
    uid: 'demo-general',
    email: 'demo-general@darts-lab.example',
    password: 'demo1234',
    role: 'general',
    displayName: 'デモ（General）',
    hasStats: false,
  },
  {
    uid: 'demo-pro',
    email: 'demo-pro@darts-lab.example',
    password: 'demo1234',
    role: 'pro',
    displayName: 'デモ（Pro）',
    hasStats: true,
  },
  {
    uid: 'demo-admin',
    email: 'demo-admin@darts-lab.example',
    password: 'demo1234',
    role: 'admin',
    displayName: 'デモ（Admin）',
    hasStats: true,
  },
];

function makeFirestoreDoc(account: (typeof DEMO_ACCOUNTS)[number]) {
  const now = FieldValue.serverTimestamp();
  return {
    displayName: account.displayName,
    email: account.email,
    photoURL: null,
    avatarUrl: null,
    height: 170,
    fourStanceType: 'A1',
    throwingImage: '',
    dominantEye: 'right',
    gripType: '3フィンガー',
    twitterHandle: null,
    isProfilePublic: true,
    role: account.role,
    activeSoftDartId: null,
    activeSteelDartId: null,
    lineUserId: null,
    lineNotifyEnabled: false,
    dlCredentialsEncrypted: null,
    stripeCustomerId: null,
    subscriptionId: null,
    subscriptionStatus: account.role === 'pro' ? 'active' : null,
    subscriptionCurrentPeriodEnd: null,
    subscriptionTrialEnd: null,
    xp: account.role === 'admin' ? 3500 : account.role === 'pro' ? 1250 : 0,
    level: account.role === 'admin' ? 15 : account.role === 'pro' ? 8 : 1,
    rank: account.role === 'admin' ? 'シルバー' : account.role === 'pro' ? 'ブロンズ' : 'ビギナー',
    achievements: [],
    highestRating: account.role === 'admin' ? 10.15 : account.role === 'pro' ? 8.52 : null,
    dartsHistory: '3年',
    homeShop: 'Bee 渋谷道玄坂店',
    isDemo: true,
    createdAt: now,
    updatedAt: now,
  };
}

function generateStats() {
  const now = new Date();
  const stats: { id: string; data: Record<string, unknown> }[] = [];
  for (let i = 29; i >= 0; i--) {
    if (i % 3 === 1) continue;
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const baseRt = 8.0 + (30 - i) * 0.01 + Math.sin(i) * 0.2;
    const basePpd = 63 + Math.sin(i * 1.5) * 4;
    const baseMpr = 2.15 + Math.sin(i * 1.2) * 0.2;
    stats.push({
      id: dateStr,
      data: {
        date: new Date(d.toISOString().split('T')[0] + 'T00:00:00Z'),
        rating: +baseRt.toFixed(2),
        gamesPlayed: 5 + (i % 7),
        zeroOneStats: {
          ppd: +basePpd.toFixed(2),
          avg: +(basePpd - 2).toFixed(2),
          highOff: 120 + (i % 5) * 10,
        },
        cricketStats: {
          mpr: +baseMpr.toFixed(2),
          highScore: 180 + (i % 4) * 15,
        },
        bullRate: 38 + (i % 10),
        hatTricks: i % 4 === 0 ? 1 : 0,
        bullStats: { dBull: 5 + (i % 8), sBull: 3 + (i % 6) },
        ton80: i % 15 === 0 ? 1 : 0,
        lowTon: i % 3 === 0 ? 1 : 0,
        highTon: 0,
        threeInABed: 0,
        threeInABlack: 0,
        whiteHorse: 0,
        condition: (i % 5) + 1,
        memo: '',
        challenge: '',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
    });
  }
  return stats;
}

function getCacheLatest() {
  return {
    cardName: 'DEMO PLAYER',
    toorina: 'demoplayer',
    cardImageUrl: '',
    rating: 8.32,
    ratingInt: 8,
    flight: 'BB',
    stats01Avg: 65.21,
    statsCriAvg: 2.31,
    statsPraAvg: 521,
    stats01Best: 72.45,
    statsCriBest: 2.89,
    statsPraBest: 612,
    awards: {
      'D-BULL': { monthly: 87, total: 2341 },
      'S-BULL': { monthly: 52, total: 1456 },
      'LOW TON': { monthly: 14, total: 389 },
      'HIGH TON': { monthly: 3, total: 78 },
      'HAT TRICK': { monthly: 8, total: 215 },
      'TON 80': { monthly: 1, total: 12 },
    },
    homeShop: 'Bee 渋谷道玄坂店',
    fetchedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
}

async function seed() {
  for (const account of DEMO_ACCOUNTS) {
    console.log(`\n--- ${account.displayName} (${account.email}) ---`);

    // 1. Firebase Auth ユーザー作成
    try {
      await auth.createUser({
        uid: account.uid,
        email: account.email,
        password: account.password,
        displayName: account.displayName,
      });
      console.log('  Auth ユーザー作成完了');
    } catch (err: unknown) {
      if ((err as { code?: string }).code === 'auth/uid-already-exists') {
        console.log('  Auth ユーザーは既に存在 → スキップ');
      } else {
        throw err;
      }
    }

    // 2. Firestore ユーザードキュメント作成
    await db.doc(`users/${account.uid}`).set(makeFirestoreDoc(account));
    console.log('  Firestore ドキュメント作成完了');

    // 3. PRO/admin: DARTSLIVE スタッツ投入
    if (account.hasStats) {
      const stats = generateStats();
      const batch = db.batch();
      for (const s of stats) {
        batch.set(db.doc(`users/${account.uid}/dartsLiveStats/${s.id}`), s.data);
      }
      await batch.commit();
      console.log(`  dartsLiveStats ${stats.length}件 投入完了`);

      // dartsliveCache/latest
      await db.doc(`users/${account.uid}/dartsliveCache/latest`).set(getCacheLatest());
      console.log('  dartsliveCache/latest 作成完了');
    }
  }

  console.log('\nデモアカウント作成完了!');
}

seed().catch((err) => {
  console.error('エラー:', err);
  process.exit(1);
});
