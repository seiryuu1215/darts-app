import type { Dart } from '@/types';
import { daysAgo, placeholderImage } from './factories';

type MockDart = Omit<Dart, 'createdAt' | 'updatedAt'> & {
  id: string;
  createdAt: ReturnType<typeof daysAgo>;
  updatedAt: ReturnType<typeof daysAgo>;
};

export const MOCK_DART_COMPLETE: MockDart = {
  id: 'dart_001',
  userId: 'user_001',
  userName: 'ダーツ太郎',
  userAvatarUrl: null,
  title: 'メインセッティング 2025',
  barrel: {
    name: 'RISING SUN 6.0 No.5',
    brand: 'TARGET',
    weight: 20,
    maxDiameter: 6.35,
    length: 44,
    cut: 'リングカット',
  },
  tip: { name: 'Premium Lippoint No.5', type: 'soft', lengthMm: 25, weightG: 0.3 },
  shaft: { name: 'L-Shaft Silent Slim 260', lengthMm: 26, weightG: 0.9 },
  flight: { name: 'L-Flight PRO Kite', shape: 'カイト', weightG: 0.2 },
  imageUrls: [placeholderImage(400, 300)],
  description: '現在のメインセッティングです。バランスが良く安定して投げられます。',
  likeCount: 12,
  isDraft: false,
  createdAt: daysAgo(30),
  updatedAt: daysAgo(2),
};

export const MOCK_DART_STEEL: MockDart = {
  id: 'dart_002',
  userId: 'user_001',
  userName: 'ダーツ太郎',
  userAvatarUrl: null,
  title: 'ハードダーツ用',
  barrel: {
    name: 'Solus 23g',
    brand: 'Unicorn',
    weight: 23,
    maxDiameter: 6.8,
    length: 50,
    cut: 'ナーリング',
  },
  tip: { name: 'Storm Point', type: 'steel', lengthMm: 26, weightG: 1.5 },
  shaft: { name: 'Cosmo Fit Carbon Slim', lengthMm: 31, weightG: 0.86 },
  flight: { name: 'Fit Flight Standard', shape: 'スタンダード', weightG: 0.3 },
  imageUrls: [placeholderImage(400, 300)],
  description: 'ハードダーツ練習用のセッティング。',
  likeCount: 3,
  isDraft: false,
  createdAt: daysAgo(60),
  updatedAt: daysAgo(15),
};

export const MOCK_DART_MINIMAL: MockDart = {
  id: 'dart_003',
  userId: 'user_002',
  userName: 'PROプレイヤー',
  userAvatarUrl: null,
  title: 'お試しセッティング',
  barrel: {
    name: 'ゴメスタイプ11',
    brand: 'TRiNiDAD',
    weight: 18,
    maxDiameter: null,
    length: null,
    cut: '',
  },
  tip: { name: '', type: 'soft', lengthMm: null, weightG: null },
  shaft: { name: '', lengthMm: null, weightG: null },
  flight: { name: '', shape: '', weightG: null },
  imageUrls: [],
  description: '',
  likeCount: 0,
  isDraft: false,
  createdAt: daysAgo(10),
  updatedAt: daysAgo(10),
};

export const MOCK_DART_DRAFT: MockDart = {
  id: 'dart_004',
  userId: 'user_001',
  userName: 'ダーツ太郎',
  userAvatarUrl: null,
  title: '下書きダーツ',
  barrel: {
    name: 'PYRO',
    brand: 'MONSTER',
    weight: 19,
    maxDiameter: 7.0,
    length: 42,
    cut: 'シャークカット',
  },
  tip: { name: 'Condor Tip Ultimate', type: 'soft', lengthMm: 25, weightG: 0.35 },
  shaft: { name: '', lengthMm: null, weightG: null },
  flight: { name: '', shape: '', weightG: null },
  imageUrls: [],
  description: '',
  likeCount: 0,
  isDraft: true,
  createdAt: daysAgo(3),
  updatedAt: daysAgo(3),
};

export const MOCK_DART_OTHER_USER: MockDart = {
  id: 'dart_005',
  userId: 'user_099',
  userName: 'ブル職人',
  userAvatarUrl: null,
  title: 'フロント重心セッティング',
  barrel: {
    name: 'RAPIER',
    brand: 'Samurai',
    weight: 21,
    maxDiameter: 7.2,
    length: 46,
    cut: 'マイクロカット',
  },
  tip: { name: 'Premium Lippoint', type: 'soft', lengthMm: 25, weightG: 0.3 },
  shaft: { name: 'L-Shaft Lock Slim', lengthMm: 22.5, weightG: 0.82 },
  flight: { name: 'Condor AXE Small', shape: 'スモール', weightG: 0.4, isCondorAxe: true },
  imageUrls: [placeholderImage(400, 300), placeholderImage(400, 300)],
  description: 'フロント重心で飛びが安定。ストレートバレルが好きな人向け。',
  likeCount: 28,
  isDraft: false,
  createdAt: daysAgo(45),
  updatedAt: daysAgo(5),
};

export const MOCK_DARTS_LIST: MockDart[] = [
  MOCK_DART_COMPLETE,
  MOCK_DART_STEEL,
  MOCK_DART_MINIMAL,
  MOCK_DART_OTHER_USER,
  {
    ...MOCK_DART_COMPLETE,
    id: 'dart_006',
    title: 'サブセッティング',
    userId: 'user_002',
    userName: 'PROプレイヤー',
    barrel: { ...MOCK_DART_COMPLETE.barrel, name: 'Solo G3', brand: 'TRiNiDAD' },
    likeCount: 7,
    createdAt: daysAgo(20),
    updatedAt: daysAgo(8),
  },
  {
    ...MOCK_DART_STEEL,
    id: 'dart_007',
    title: 'スティール練習用セッティング',
    userId: 'user_003',
    userName: 'CU700',
    likeCount: 5,
    createdAt: daysAgo(14),
    updatedAt: daysAgo(14),
  },
];
