/**
 * デモアカウント用シードデータ
 */

import { DEMO_ACCOUNTS } from '@/lib/demo';
import type { UserRole } from '@/types';

interface DemoUserData {
  uid: string;
  email: string;
  password: string;
  role: UserRole;
  firestoreDoc: Record<string, unknown>;
}

const now = new Date();

function makeTimestamp() {
  return { _seconds: Math.floor(now.getTime() / 1000), _nanoseconds: 0 };
}

const baseUser = {
  photoURL: null,
  avatarUrl: null,
  height: 170,
  fourStanceType: 'A1',
  throwingImage: '',
  dominantEye: 'right',
  gripType: '3フィンガー',
  twitterHandle: null,
  isProfilePublic: true,
  activeSoftDartId: null,
  activeSteelDartId: null,
  lineUserId: null,
  lineNotifyEnabled: false,
  dlCredentialsEncrypted: null,
  stripeCustomerId: null,
  subscriptionId: null,
  subscriptionStatus: null,
  subscriptionCurrentPeriodEnd: null,
  subscriptionTrialEnd: null,
  xp: 0,
  level: 1,
  rank: 'ビギナー',
  achievements: [],
  highestRating: null,
  dartsHistory: '3年',
  homeShop: 'Bee 渋谷道玄坂店',
  isDemo: true,
  createdAt: makeTimestamp(),
  updatedAt: makeTimestamp(),
};

export const DEMO_USERS: DemoUserData[] = [
  {
    ...DEMO_ACCOUNTS.general,
    firestoreDoc: {
      ...baseUser,
      displayName: 'デモ（General）',
      email: DEMO_ACCOUNTS.general.email,
      role: 'general',
    },
  },
  {
    ...DEMO_ACCOUNTS.pro,
    firestoreDoc: {
      ...baseUser,
      displayName: 'デモ（Pro）',
      email: DEMO_ACCOUNTS.pro.email,
      role: 'pro',
      subscriptionStatus: 'active',
      xp: 1250,
      level: 8,
      rank: 'ブロンズ',
      highestRating: 8.52,
    },
  },
  {
    ...DEMO_ACCOUNTS.admin,
    firestoreDoc: {
      ...baseUser,
      displayName: 'デモ（Admin）',
      email: DEMO_ACCOUNTS.admin.email,
      role: 'admin',
      xp: 3500,
      level: 15,
      rank: 'シルバー',
      highestRating: 10.15,
    },
  },
];

/** PRO/admin 用の DARTSLIVE スタッツ (30日分) */
export function generateDemoStats(): Record<string, unknown>[] {
  const stats: Record<string, unknown>[] = [];
  for (let i = 29; i >= 0; i--) {
    if (i % 3 === 1) continue; // 一部の日はスキップ（リアリティ）
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const baseRt = 8.0 + (30 - i) * 0.01 + Math.sin(i) * 0.2;
    const basePpd = 63 + Math.sin(i * 1.5) * 4;
    const baseMpr = 2.15 + Math.sin(i * 1.2) * 0.2;
    stats.push({
      date: { _seconds: Math.floor(d.getTime() / 1000), _nanoseconds: 0 },
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
      condition: ((i % 5) + 1) as 1 | 2 | 3 | 4 | 5,
      memo: '',
      challenge: '',
      id: dateStr,
      createdAt: makeTimestamp(),
      updatedAt: makeTimestamp(),
    });
  }
  return stats;
}

/** dartsliveCache/latest ドキュメント */
export function generateDemoCacheLatest(): Record<string, unknown> {
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
    fetchedAt: makeTimestamp(),
    updatedAt: makeTimestamp(),
  };
}
