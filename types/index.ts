import { Timestamp } from 'firebase/firestore';

export type UserRole = 'admin' | 'pro' | 'general';

export type StripeSubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled';

export interface User {
  displayName: string;
  email: string;
  photoURL: string | null;
  avatarUrl: string | null;
  height: number | null;
  fourStanceType: 'A1' | 'A2' | 'B1' | 'B2' | null;
  throwingImage: string;
  dominantEye: 'right' | 'left' | null;
  gripType: string;
  twitterHandle: string | null;
  isProfilePublic: boolean;
  role: UserRole;
  activeSoftDartId?: string | null;
  activeSteelDartId?: string | null;
  lineUserId?: string | null;
  lineNotifyEnabled?: boolean;
  dlCredentialsEncrypted?: {
    email: string; // AES-256-GCM encrypted
    password: string; // AES-256-GCM encrypted
  } | null;
  stripeCustomerId?: string | null;
  subscriptionId?: string | null;
  subscriptionStatus?: StripeSubscriptionStatus | null;
  subscriptionCurrentPeriodEnd?: Timestamp | null;
  subscriptionTrialEnd?: Timestamp | null;
  xp?: number;
  level?: number;
  rank?: string;
  achievements?: string[];
  highestRating?: number | null;
  dartsHistory: string;
  homeShop: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Barrel {
  name: string;
  brand: string;
  weight: number;
  maxDiameter: number | null;
  length: number | null;
  cut: string;
}

export interface Tip {
  name: string;
  type: 'soft' | 'steel';
  lengthMm: number | null;
  weightG: number | null;
}

export interface Shaft {
  name: string;
  lengthMm: number | null;
  weightG: number | null;
}

export interface Flight {
  name: string;
  shape: string;
  weightG: number | null;
  isCondorAxe?: boolean;
  condorAxeShaftLengthMm?: number | null;
}

export interface Dart {
  id?: string;
  userId: string;
  userName?: string;
  userAvatarUrl?: string | null;
  title: string;
  barrel: Barrel;
  tip: Tip;
  shaft: Shaft;
  flight: Flight;
  imageUrls: string[];
  description: string;
  likeCount: number;
  isDraft?: boolean;
  sourceBarrelId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Comment {
  id?: string;
  userId: string;
  userName: string;
  userAvatarUrl?: string | null;
  text: string;
  createdAt: Timestamp;
}

export interface Like {
  dartId: string;
  createdAt: Timestamp;
}

export interface Bookmark {
  dartId: string;
  createdAt: Timestamp;
}

export interface BarrelSearchResult {
  name: string;
  brand: string;
  weight: number | null;
  maxDiameter: number | null;
  length: number | null;
  cut: string;
  imageUrl?: string;
}

export interface BarrelProduct {
  id?: string;
  name: string;
  brand: string;
  weight: number;
  maxDiameter: number | null;
  length: number | null;
  cut: string;
  imageUrl: string | null;
  productUrl: string;
  source: 'dartshive';
  isDiscontinued?: boolean;
  scrapedAt: Timestamp;
}

export interface BarrelBookmark {
  barrelId: string;
  createdAt: Timestamp;
}

export interface Memo {
  id?: string;
  userId: string;
  text: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface SettingHistory {
  id?: string;
  dartId: string;
  dartType: 'soft' | 'steel';
  dartTitle: string;
  barrel: Barrel;
  tip: Tip;
  shaft: Shaft;
  flight: Flight;
  imageUrl: string | null;
  startedAt: Timestamp;
  endedAt: Timestamp | null;
  changeType: 'initial' | 'barrel' | 'minor';
  changedParts: string[];
  memo: string;
  createdAt: Timestamp;
}

export interface DartsLiveStats {
  id?: string;
  date: Timestamp;
  rating: number;
  gamesPlayed: number;
  zeroOneStats: {
    ppd: number;
    avg: number | null;
    highOff: number | null;
  };
  cricketStats: {
    mpr: number;
    highScore: number | null;
  };
  bullRate: number | null;
  hatTricks: number | null;
  bullStats?: { dBull: number; sBull: number } | null;
  ton80?: number;
  lowTon?: number;
  highTon?: number;
  threeInABed?: number;
  threeInABlack?: number;
  whiteHorse?: number;
  condition: 1 | 2 | 3 | 4 | 5;
  memo: string;
  challenge: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type ArticleType = 'article' | 'page';

export interface Article {
  id?: string;
  slug: string;
  title: string;
  content: string;
  coverImageUrl?: string | null;
  tags: string[];
  isDraft: boolean;
  isFeatured?: boolean;
  articleType?: ArticleType;
  userId: string;
  userName?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Ranking
export type RankingPeriod = 'weekly' | 'monthly' | 'all';

// Barrel Quiz
export interface QuizAnswer {
  playStyle: 'beginner' | 'intermediate' | 'advanced';
  gripPosition: 'front' | 'center' | 'rear';
  weightPreference: 'light' | 'medium' | 'heavy';
  lengthPreference: 'short' | 'standard' | 'long';
  cutPreference: string[];
}

// Discussion
export const DISCUSSION_CATEGORIES = [
  'setting',
  'rating',
  'barrel',
  'practice',
  'gear',
  'general',
] as const;

export type DiscussionCategory = (typeof DISCUSSION_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<DiscussionCategory, string> = {
  setting: 'セッティング相談',
  rating: 'レーティング・上達',
  barrel: 'バレル選び',
  practice: '練習法',
  gear: 'シャフト・フライト・チップ',
  general: '雑談',
};

export interface Discussion {
  id?: string;
  title: string;
  content: string;
  category: DiscussionCategory;
  userId: string;
  userName: string;
  userAvatarUrl: string | null;
  userRating: number | null;
  userBarrelName: string | null;
  isPinned: boolean;
  isLocked: boolean;
  replyCount: number;
  lastRepliedAt: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface DiscussionReply {
  id?: string;
  userId: string;
  userName: string;
  userAvatarUrl: string | null;
  userRating: number | null;
  userBarrelName: string | null;
  text: string;
  createdAt: Timestamp;
}

// XP History
export interface XpHistoryEntry {
  id?: string;
  action: string;
  xp: number;
  detail: string;
  createdAt: Timestamp;
}

// Inventory (shop items)
export interface UserInventory {
  streak_freeze?: number;
  double_xp?: number;
  streak_revive?: number;
}

// Goals
export type GoalType = 'bulls' | 'games' | 'rating' | 'cu_score' | 'play_days' | 'hat_tricks';
export type GoalPeriod = 'monthly' | 'yearly' | 'daily';

export interface Goal {
  id?: string;
  type: GoalType;
  period: GoalPeriod;
  target: number;
  current: number;
  startDate: Timestamp;
  endDate: Timestamp;
  achievedAt: Timestamp | null;
  xpAwarded: boolean;
  baseline?: number | null;
}

export const GOAL_TYPE_LABELS: Record<GoalType, string> = {
  bulls: 'ブル数',
  games: 'ゲーム数',
  rating: 'Rating',
  cu_score: 'CU最高スコア',
  play_days: 'プレイ日数',
  hat_tricks: 'HAT TRICK',
};

// Affiliate
export type ShopType = 'dartshive' | 'sdarts' | 'maxim' | 'tito' | 'rakuten' | 'amazon';

export interface ShopLink {
  shop: ShopType;
  label: string;
  url: string;
}
