import { Timestamp } from 'firebase/firestore';

export type UserRole = 'admin' | 'pro' | 'general';

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
  condition: 1 | 2 | 3 | 4 | 5;
  memo: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Article {
  id?: string;
  slug: string;
  title: string;
  content: string;
  coverImageUrl?: string | null;
  tags: string[];
  isDraft: boolean;
  isFeatured?: boolean;
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

// Barrel Contour (extracted from product image)
export interface BarrelContour {
  upperProfile: [number, number][];  // [x_mm, radius_mm][]
  lowerProfile: [number, number][];
}

// Affiliate
export type ShopType = 'dartshive' | 'rakuten' | 'amazon';

export interface ShopLink {
  shop: ShopType;
  label: string;
  url: string;
}
