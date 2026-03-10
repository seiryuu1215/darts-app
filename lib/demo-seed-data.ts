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
      xp: 2800,
      level: 14,
      rank: 'シルバー',
      achievements: ['first_rating'],
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
      xp: 5200,
      level: 22,
      rank: 'ゴールド',
      achievements: ['first_rating', 'weekly_active', 'monthly_active'],
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

/** デモ用ダーツセッティング (3件) */
export function generateDemoDarts(userId: string, userName: string): Record<string, unknown>[] {
  return [
    {
      userId,
      userName,
      userAvatarUrl: null,
      title: 'メインセッティング（ソフト）',
      barrel: {
        name: 'RISING SUN 6.0',
        brand: 'TARGET',
        weight: 20,
        maxDiameter: 7.2,
        length: 44,
        cut: 'マイクロ,リング',
      },
      tip: { name: 'Premium Lippoint', type: 'soft', lengthMm: 25, weightG: 0.3 },
      shaft: { name: 'CARBON Ti シャフト', lengthMm: 35.5, weightG: 1.0 },
      flight: {
        name: 'Fit Flight AIR スリム',
        shape: 'slim',
        weightG: 0.25,
        isCondorAxe: false,
      },
      imageUrls: [],
      description: '普段使い。安定感重視のセッティング。',
      likeCount: 3,
      isDraft: false,
      createdAt: makeTimestamp(),
      updatedAt: makeTimestamp(),
    },
    {
      userId,
      userName,
      userAvatarUrl: null,
      title: 'サブセッティング（ソフト）',
      barrel: {
        name: 'SOLO 24',
        brand: 'DYNASTY',
        weight: 22,
        maxDiameter: 7.4,
        length: 40,
        cut: 'シャーク',
      },
      tip: { name: 'Premium Lippoint', type: 'soft', lengthMm: 25, weightG: 0.3 },
      shaft: { name: 'Fit Shaft GEAR スリム 3', lengthMm: 24, weightG: 0.8 },
      flight: {
        name: 'Fit Flight スタンダード',
        shape: 'standard',
        weightG: 0.35,
        isCondorAxe: false,
      },
      imageUrls: [],
      description: '重めで飛ばしたいとき用。',
      likeCount: 1,
      isDraft: false,
      createdAt: makeTimestamp(),
      updatedAt: makeTimestamp(),
    },
    {
      userId,
      userName,
      userAvatarUrl: null,
      title: 'スティール用',
      barrel: {
        name: 'PYRO',
        brand: 'Unicorn',
        weight: 24,
        maxDiameter: 6.8,
        length: 50,
        cut: 'リング',
      },
      tip: { name: 'Storm Point', type: 'steel', lengthMm: 30, weightG: 1.5 },
      shaft: { name: 'Target Pro Grip Shaft', lengthMm: 34.5, weightG: 1.1 },
      flight: {
        name: 'Target Pro Ultra スタンダード',
        shape: 'standard',
        weightG: 0.3,
        isCondorAxe: false,
      },
      imageUrls: [],
      description: 'ハードダーツ練習用。',
      likeCount: 0,
      isDraft: false,
      createdAt: makeTimestamp(),
      updatedAt: makeTimestamp(),
    },
  ];
}

/** デモ用ゴール (2件) */
export function generateDemoGoals(): Record<string, unknown>[] {
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return [
    {
      type: 'rating',
      period: 'monthly',
      target: 9.0,
      current: 8.32,
      startDate: { _seconds: Math.floor(monthStart.getTime() / 1000), _nanoseconds: 0 },
      endDate: { _seconds: Math.floor(monthEnd.getTime() / 1000), _nanoseconds: 0 },
      achievedAt: null,
      xpAwarded: false,
      baseline: 8.0,
    },
    {
      type: 'hat_tricks',
      period: 'monthly',
      target: 10,
      current: 6,
      startDate: { _seconds: Math.floor(monthStart.getTime() / 1000), _nanoseconds: 0 },
      endDate: { _seconds: Math.floor(monthEnd.getTime() / 1000), _nanoseconds: 0 },
      achievedAt: null,
      xpAwarded: false,
      baseline: 0,
    },
  ];
}

/** デモ用XP履歴 (10件) */
export function generateDemoXpHistory(): Record<string, unknown>[] {
  const entries: Record<string, unknown>[] = [];
  const actions = [
    { action: 'stats_record', xp: 5, detail: 'スタッツ記録' },
    { action: 'award_hat_trick', xp: 8, detail: 'HAT TRICK 1回' },
    { action: 'condition_record', xp: 3, detail: 'コンディション記録' },
    { action: 'stats_record', xp: 5, detail: 'スタッツ記録' },
    { action: 'discussion_post', xp: 5, detail: 'ディスカッション投稿' },
    { action: 'weekly_active', xp: 30, detail: '週間アクティブ' },
    { action: 'stats_record', xp: 5, detail: 'スタッツ記録' },
    { action: 'award_low_ton', xp: 4, detail: 'LOW TON 1回' },
    { action: 'countup_highscore', xp: 15, detail: 'カウントアップ自己ベスト更新' },
    { action: 'first_rating', xp: 100, detail: '初レーティング達成' },
  ];
  for (let i = 0; i < actions.length; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - (actions.length - i));
    entries.push({
      ...actions[i],
      createdAt: { _seconds: Math.floor(d.getTime() / 1000), _nanoseconds: 0 },
    });
  }
  return entries;
}

/** デモ用意識ポイント (3件) */
export function generateDemoFocusPoints(): Record<string, unknown>[] {
  return [
    { text: 'テイクバックを安定させる', order: 0, createdAt: makeTimestamp() },
    { text: 'リリースポイントを一定に', order: 1, createdAt: makeTimestamp() },
    { text: 'フォロースルーを真っ直ぐ', order: 2, createdAt: makeTimestamp() },
  ];
}

/** デモ用バレルブックマーク (5件) */
export function generateDemoBarrelBookmarks(): Record<string, unknown>[] {
  const barrelIds = [
    'barrel-rising-sun-6',
    'barrel-solo-24',
    'barrel-pyro',
    'barrel-gomez-11',
    'barrel-jadeite-2',
  ];
  return barrelIds.map((barrelId) => ({
    id: barrelId,
    barrelId,
    createdAt: makeTimestamp(),
  }));
}

/** デモ用ショップブックマーク (2件) */
export function generateDemoShopBookmarks(): Record<string, unknown>[] {
  return [
    {
      name: 'Bee 渋谷道玄坂店',
      address: '東京都渋谷区道玄坂2-16-8',
      nearestStation: '渋谷',
      imageUrl: null,
      machineCount: { dl2: 4, dl3: 8 },
      tags: ['広い', '駅近'],
      lines: ['JR山手線', '東急東横線'],
      note: 'ホームショップ。火曜がハウストーナメント。',
      rating: 5,
      visitCount: 30,
      lastVisitedAt: makeTimestamp(),
      isFavorite: true,
      listIds: [],
      lat: 35.6581,
      lng: 139.6978,
      dartsliveSearchUrl: null,
      createdAt: makeTimestamp(),
      updatedAt: makeTimestamp(),
    },
    {
      name: 'ダーツショップ TiTO 新宿店',
      address: '東京都新宿区歌舞伎町1-12-4',
      nearestStation: '新宿',
      imageUrl: null,
      machineCount: { dl2: 2, dl3: 6 },
      tags: ['駅近', '禁煙エリアあり'],
      lines: ['JR山手線'],
      note: '',
      rating: 4,
      visitCount: 5,
      lastVisitedAt: null,
      isFavorite: false,
      listIds: [],
      lat: 35.6938,
      lng: 139.7034,
      dartsliveSearchUrl: null,
      createdAt: makeTimestamp(),
      updatedAt: makeTimestamp(),
    },
  ];
}

/** デモ用ディスカッション (2件 + 返信3件) */
export function generateDemoDiscussions(
  userId: string,
  userName: string,
): {
  discussions: Record<string, unknown>[];
  replies: { discussionIndex: number; data: Record<string, unknown> }[];
} {
  const d1 = new Date(now);
  d1.setDate(d1.getDate() - 5);
  const d2 = new Date(now);
  d2.setDate(d2.getDate() - 2);
  const r1 = new Date(now);
  r1.setDate(r1.getDate() - 4);
  const r2 = new Date(now);
  r2.setDate(r2.getDate() - 3);
  const r3 = new Date(now);
  r3.setDate(r3.getDate() - 1);

  const ts = (d: Date) => ({ _seconds: Math.floor(d.getTime() / 1000), _nanoseconds: 0 });

  const discussions = [
    {
      title: 'Rt8台でのおすすめセッティングを教えてください',
      content:
        '最近Rt8に上がったのですが、もう少し重めのバレルに変えようか迷っています。\n同じくらいのレーティングの方、どんなセッティングを使っていますか？',
      category: 'setting',
      userId,
      userName,
      userAvatarUrl: null,
      userRating: 8.32,
      userBarrelName: 'RISING SUN 6.0',
      isPinned: false,
      isLocked: false,
      replyCount: 2,
      lastRepliedAt: ts(r2),
      createdAt: ts(d1),
      updatedAt: ts(d1),
    },
    {
      title: 'カウントアップで安定して500出すコツ',
      content:
        'カウントアップで500を安定して出せるようになりたいです。\n練習方法やメンタル面でのアドバイスがあれば教えてください。',
      category: 'practice',
      userId,
      userName,
      userAvatarUrl: null,
      userRating: 8.32,
      userBarrelName: 'RISING SUN 6.0',
      isPinned: false,
      isLocked: false,
      replyCount: 1,
      lastRepliedAt: ts(r3),
      createdAt: ts(d2),
      updatedAt: ts(d2),
    },
  ];

  const replies = [
    {
      discussionIndex: 0,
      data: {
        userId: 'demo-reply-user-1',
        userName: 'ダーツ太郎',
        userAvatarUrl: null,
        userRating: 9.1,
        userBarrelName: 'SOLO 24',
        text: '自分はRt8台のときにDYNASTYのSOLO 24に変えて安定しました。22gで少し重めですがコントロールしやすいです！',
        createdAt: ts(r1),
      },
    },
    {
      discussionIndex: 0,
      data: {
        userId: 'demo-reply-user-2',
        userName: 'Bull子',
        userAvatarUrl: null,
        userRating: 8.5,
        userBarrelName: 'Gomez 11',
        text: '重さよりもグリップ位置が合っているかが大事だと思います。一度ショップで試投してみると良いですよ。',
        createdAt: ts(r2),
      },
    },
    {
      discussionIndex: 1,
      data: {
        userId: 'demo-reply-user-1',
        userName: 'ダーツ太郎',
        userAvatarUrl: null,
        userRating: 9.1,
        userBarrelName: 'SOLO 24',
        text: 'まずはBULLに5本連続入れる練習を繰り返すのが効果的でした。メンタルは「入れる」ではなく「投げる」に集中するとブレにくいです。',
        createdAt: ts(r3),
      },
    },
  ];

  return { discussions, replies };
}

/** デモ用記事 (3件) — トップレベル articles コレクションに投入 */
export function generateDemoArticles(userId: string, userName: string): Record<string, unknown>[] {
  const d1 = new Date(now);
  d1.setDate(d1.getDate() - 10);
  const d2 = new Date(now);
  d2.setDate(d2.getDate() - 6);
  const d3 = new Date(now);
  d3.setDate(d3.getDate() - 2);
  const ts = (d: Date) => ({ _seconds: Math.floor(d.getTime() / 1000), _nanoseconds: 0 });

  return [
    {
      slug: `demo-analytics-guide-${userId}`,
      title: 'DARTSLIVEスタッツ分析の活用ガイド',
      content: [
        '## スタッツ分析でレーティングを効率的に上げよう',
        '',
        'Darts Labのスタッツ分析機能を使えば、自分のプレイの傾向を客観的に把握できます。',
        '',
        '### 1. レーティング推移を確認する',
        '',
        'まず「スタッツ」ページでレーティングの推移グラフを確認しましょう。',
        '上昇トレンドが出ているか、停滞しているかを把握することが大切です。',
        '',
        '### 2. 01とCricketのバランス',
        '',
        '01のPPDとCricketのMPRのバランスを見ることで、自分の得意・不得意が分かります。',
        '',
        '- **PPDが高くMPRが低い** → ブル力はあるがマーク力が課題',
        '- **MPRが高くPPDが低い** → マーク力はあるがフィニッシュ力が課題',
        '',
        '### 3. コンディション相関',
        '',
        '睡眠時間やコンディション評価とスタッツの相関を分析すると、',
        '自分のベストコンディションのパターンが見えてきます。',
      ].join('\n'),
      coverImageUrl: null,
      tags: ['分析', 'スタッツ', 'レーティング'],
      isDraft: false,
      isFeatured: true,
      articleType: 'article',
      userId,
      userName,
      createdAt: ts(d1),
      updatedAt: ts(d1),
    },
    {
      slug: `demo-barrel-selection-${userId}`,
      title: '初めてのバレル選び — 体格とプレースタイルから考える',
      content: [
        '## バレル選びで迷ったら',
        '',
        'ダーツを始めて最初に悩むのがバレル選び。',
        '価格帯も種類も多く、どれを選べばいいか分からない方も多いはず。',
        '',
        '### 体格による選び方',
        '',
        '| 体格 | おすすめ重量 | おすすめ長さ |',
        '|------|------------|------------|',
        '| 小柄 | 18-20g | 40-44mm |',
        '| 中肉中背 | 20-22g | 42-46mm |',
        '| 大柄 | 22-26g | 44-50mm |',
        '',
        '### カットの種類',
        '',
        '- **マイクログルーヴ** — 繊細なグリップ感。指離れが良い',
        '- **シャークカット** — 強いグリップ力。しっかり握りたい方向け',
        '- **リングカット** — バランスの良い引っかかり。万能型',
        '',
        '### おすすめの試し方',
        '',
        'ダーツショップでの試投が一番確実です。',
        'Darts Labの「バレル検索」でスペックを比較してから、',
        'ショップで実際に投げてみましょう。',
      ].join('\n'),
      coverImageUrl: null,
      tags: ['バレル', '初心者', 'セッティング'],
      isDraft: false,
      isFeatured: false,
      articleType: 'article',
      userId,
      userName,
      createdAt: ts(d2),
      updatedAt: ts(d2),
    },
    {
      slug: `demo-practice-routine-${userId}`,
      title: 'Rt.10を目指す練習ルーティン',
      content: [
        '## 毎日30分でRt.10に到達するための練習メニュー',
        '',
        'Rt.8からRt.10への壁を突破するには、質の高い練習が必要です。',
        '',
        '### ウォームアップ (5分)',
        '',
        '1. ブルに向かって10スロー — フォームの確認',
        '2. 20トリプルに5スロー — 精度の確認',
        '',
        '### メイン練習 (20分)',
        '',
        '#### BULL練習 (10分)',
        '- 3本連続ブルを目標に、入るまで繰り返す',
        '- D-BULLに入ったら声に出してカウント',
        '',
        '#### カウントアップ (10分)',
        '- 目標500点以上を2回連続',
        '- 1ラウンドずつ集中。前のラウンドの結果は忘れる',
        '',
        '### クールダウン (5分)',
        '- 01を1ゲーム。アレンジを意識して',
        '- 今日の良かった点・改善点をメモ',
        '',
        '> 大事なのは毎日続けること。',
        '> 短い時間でも集中して投げれば、必ず結果はついてきます。',
      ].join('\n'),
      coverImageUrl: null,
      tags: ['練習', 'レーティング', '上達'],
      isDraft: false,
      isFeatured: false,
      articleType: 'article',
      userId,
      userName,
      createdAt: ts(d3),
      updatedAt: ts(d3),
    },
  ];
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
