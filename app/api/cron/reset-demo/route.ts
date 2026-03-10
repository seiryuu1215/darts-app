import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { DEMO_ACCOUNTS } from '@/lib/demo';
import {
  generateDemoGoals,
  generateDemoFocusPoints,
  generateDemoXpHistory,
  generateDemoBarrelBookmarks,
  generateDemoShopBookmarks,
  generateDemoDarts,
  generateDemoDiscussions,
  generateDemoArticles,
} from '@/lib/demo-seed-data';

export const maxDuration = 60;

const DEMO_ACCOUNT_LIST = Object.values(DEMO_ACCOUNTS);

const USER_SUBCOLLECTIONS = [
  'dartsLiveStats',
  'dartsliveCache',
  'xpHistory',
  'goals',
  'notifications',
  'likes',
  'bookmarks',
  'barrelBookmarks',
  'settingHistory',
  'shopBookmarks',
  'shopLists',
  'pushSubscriptions',
  'focusPoints',
  'healthMetrics',
];

async function deleteSubcollection(parentPath: string, subcollection: string) {
  const snap = await adminDb.collection(`${parentPath}/${subcollection}`).listDocuments();
  const batch = adminDb.batch();
  for (const docRef of snap) {
    batch.delete(docRef);
  }
  if (snap.length > 0) await batch.commit();
}

async function deleteUserCreatedDocs(userId: string) {
  // darts（コメント・メモサブコレクション含む）
  const dartsSnap = await adminDb.collection('darts').where('userId', '==', userId).get();
  for (const dartDoc of dartsSnap.docs) {
    await deleteSubcollection(`darts/${dartDoc.id}`, 'comments');
    await deleteSubcollection(`darts/${dartDoc.id}`, 'memos');
    await adminDb.doc(`darts/${dartDoc.id}`).delete();
  }

  // discussions（返信サブコレクション含む）
  const discussionsSnap = await adminDb
    .collection('discussions')
    .where('userId', '==', userId)
    .get();
  for (const discDoc of discussionsSnap.docs) {
    await deleteSubcollection(`discussions/${discDoc.id}`, 'replies');
    await adminDb.doc(`discussions/${discDoc.id}`).delete();
  }

  // articles
  const articlesSnap = await adminDb.collection('articles').where('userId', '==', userId).get();
  for (const artDoc of articlesSnap.docs) {
    await adminDb.doc(`articles/${artDoc.id}`).delete();
  }
}

function makeUserDoc(account: (typeof DEMO_ACCOUNT_LIST)[number]) {
  const now = FieldValue.serverTimestamp();
  return {
    displayName:
      account.role === 'admin'
        ? 'デモ（Admin）'
        : account.role === 'pro'
          ? 'デモ（Pro）'
          : 'デモ（General）',
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
    xp: account.role === 'admin' ? 5200 : account.role === 'pro' ? 2800 : 0,
    level: account.role === 'admin' ? 22 : account.role === 'pro' ? 14 : 1,
    rank: account.role === 'admin' ? 'ゴールド' : account.role === 'pro' ? 'シルバー' : 'ビギナー',
    achievements:
      account.role === 'admin'
        ? ['first_rating', 'weekly_active', 'monthly_active']
        : account.role === 'pro'
          ? ['first_rating']
          : [],
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
        date: new Date(dateStr + 'T00:00:00Z'),
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

/** バレルコレクションから画像付きバレルを取得（ダーツ画像・ブックマーク用） */
async function fetchRealBarrels(limit: number) {
  const snap = await adminDb.collection('barrels').where('imageUrl', '!=', null).limit(limit).get();
  return snap.docs.map((d) => ({
    id: d.id,
    imageUrl: d.data().imageUrl as string,
    name: (d.data().name as string) || '',
    brand: (d.data().brand as string) || '',
  }));
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 実在するバレル画像を事前取得
  const realBarrels = await fetchRealBarrels(8);

  const results: { uid: string; status: string }[] = [];

  for (const account of DEMO_ACCOUNT_LIST) {
    try {
      // 1. サブコレクション全削除
      await Promise.all(
        USER_SUBCOLLECTIONS.map((sub) => deleteSubcollection(`users/${account.uid}`, sub)),
      );

      // 2. デモユーザーが作成した darts / discussions 削除
      await deleteUserCreatedDocs(account.uid);

      // 3. ユーザードキュメントをリセット
      await adminDb.doc(`users/${account.uid}`).set(makeUserDoc(account));

      // 4. PRO/admin: DARTSLIVE データ再投入
      if (account.role !== 'general') {
        const stats = generateStats();
        const batch = adminDb.batch();
        for (const s of stats) {
          batch.set(adminDb.doc(`users/${account.uid}/dartsLiveStats/${s.id}`), s.data);
        }
        await batch.commit();
        await adminDb.doc(`users/${account.uid}/dartsliveCache/latest`).set(getCacheLatest());
      }

      // 5. 全アカウント共通: goals, focusPoints 投入
      {
        const goalsBatch = adminDb.batch();
        for (const goal of generateDemoGoals()) {
          const ref = adminDb.collection(`users/${account.uid}/goals`).doc();
          goalsBatch.set(ref, goal);
        }
        for (const fp of generateDemoFocusPoints()) {
          const ref = adminDb.collection(`users/${account.uid}/focusPoints`).doc();
          goalsBatch.set(ref, fp);
        }
        await goalsBatch.commit();
      }

      // 6. PRO/admin: xpHistory
      if (account.role !== 'general') {
        const xpBatch = adminDb.batch();
        for (const xp of generateDemoXpHistory()) {
          const ref = adminDb.collection(`users/${account.uid}/xpHistory`).doc();
          xpBatch.set(ref, xp);
        }
        await xpBatch.commit();
      }

      // 7-11. 全アカウント共通: barrelBookmarks, shopBookmarks, darts, discussions, articles
      {
        const seedBatch = adminDb.batch();
        // バレルブックマーク: 実在するバレルIDを使用
        for (const rb of realBarrels.slice(0, 5)) {
          const ref = adminDb.doc(`users/${account.uid}/barrelBookmarks/${rb.id}`);
          seedBatch.set(ref, {
            barrelId: rb.id,
            createdAt: FieldValue.serverTimestamp(),
          });
        }
        for (const sb of generateDemoShopBookmarks()) {
          const ref = adminDb.collection(`users/${account.uid}/shopBookmarks`).doc();
          seedBatch.set(ref, sb);
        }
        await seedBatch.commit();

        // darts（トップレベルコレクション）— 実バレル画像を付与
        const displayName =
          account.role === 'admin'
            ? 'デモ（Admin）'
            : account.role === 'pro'
              ? 'デモ（Pro）'
              : 'デモ（General）';
        const dartsBatch = adminDb.batch();
        const demoDarts = generateDemoDarts(account.uid, displayName);
        for (let i = 0; i < demoDarts.length; i++) {
          const dart = demoDarts[i];
          if (realBarrels[i]?.imageUrl) {
            dart.imageUrls = [realBarrels[i].imageUrl];
          }
          const ref = adminDb.collection('darts').doc();
          dartsBatch.set(ref, dart);
        }
        await dartsBatch.commit();

        // discussions + replies（トップレベルコレクション）
        const { discussions, replies } = generateDemoDiscussions(account.uid, displayName);
        const discIds: string[] = [];
        for (const disc of discussions) {
          const ref = adminDb.collection('discussions').doc();
          await ref.set(disc);
          discIds.push(ref.id);
        }
        const replyBatch = adminDb.batch();
        for (const r of replies) {
          const discId = discIds[r.discussionIndex];
          const ref = adminDb.collection(`discussions/${discId}/replies`).doc();
          replyBatch.set(ref, r.data);
        }
        await replyBatch.commit();

        // articles（トップレベルコレクション）
        const articlesBatch = adminDb.batch();
        for (const article of generateDemoArticles(account.uid, displayName)) {
          const ref = adminDb.collection('articles').doc();
          articlesBatch.set(ref, article);
        }
        await articlesBatch.commit();
      }

      results.push({ uid: account.uid, status: 'reset' });
    } catch (err) {
      console.error(`reset-demo error for ${account.uid}:`, err);
      results.push({ uid: account.uid, status: 'error' });
    }
  }

  return NextResponse.json({ results });
}
