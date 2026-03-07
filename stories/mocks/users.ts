import type { User } from '@/types';
import { daysAgo, now, placeholderAvatar } from './factories';

type MockUser = Omit<User, 'createdAt' | 'updatedAt'> & {
  id: string;
  createdAt: ReturnType<typeof now>;
  updatedAt: ReturnType<typeof now>;
};

export const MOCK_USER_GENERAL: MockUser = {
  id: 'user_001',
  displayName: 'ダーツ太郎',
  email: 'taro@example.com',
  photoURL: null,
  avatarUrl: placeholderAvatar('太'),
  height: 170,
  fourStanceType: 'A2',
  throwingImage: '',
  dominantEye: 'right',
  gripType: '3フィンガー',
  twitterHandle: 'darts_taro',
  isProfilePublic: true,
  role: 'general',
  activeSoftDartId: 'dart_001',
  activeSteelDartId: null,
  lineUserId: null,
  lineNotifyEnabled: false,
  dlCredentialsEncrypted: null,
  stripeCustomerId: null,
  subscriptionId: null,
  subscriptionStatus: null,
  subscriptionCurrentPeriodEnd: null,
  subscriptionTrialEnd: null,
  xp: 1250,
  level: 5,
  rank: 'シルバー',
  achievements: ['first_dart', 'cu_500', 'cu_600'],
  highestRating: 8,
  dartsHistory: '',
  homeShop: '',
  createdAt: daysAgo(90),
  updatedAt: daysAgo(1),
};

export const MOCK_USER_PRO: MockUser = {
  ...MOCK_USER_GENERAL,
  id: 'user_002',
  displayName: 'PROプレイヤー',
  email: 'pro@example.com',
  avatarUrl: placeholderAvatar('P'),
  role: 'pro',
  subscriptionStatus: 'active',
  subscriptionCurrentPeriodEnd: daysAgo(-30),
  xp: 5200,
  level: 12,
  rank: 'ゴールド',
  highestRating: 12,
};

export const MOCK_USER_ADMIN: MockUser = {
  ...MOCK_USER_GENERAL,
  id: 'admin_001',
  displayName: '管理者',
  email: 'admin@example.com',
  avatarUrl: placeholderAvatar('A'),
  role: 'admin',
  subscriptionStatus: 'active',
};

export const MOCK_USER_PRIVATE: MockUser = {
  ...MOCK_USER_GENERAL,
  id: 'user_003',
  displayName: '非公開ユーザー',
  isProfilePublic: false,
};

export const MOCK_USERS_LIST: MockUser[] = [
  MOCK_USER_ADMIN,
  MOCK_USER_PRO,
  MOCK_USER_GENERAL,
  MOCK_USER_PRIVATE,
];
