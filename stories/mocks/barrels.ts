import type { BarrelProduct, QuizAnswer } from '@/types';
import { daysAgo, placeholderImage } from './factories';

type MockBarrelProduct = Omit<BarrelProduct, 'scrapedAt'> & {
  id: string;
  scrapedAt: ReturnType<typeof daysAgo>;
};

export const MOCK_BARREL_PRODUCTS: MockBarrelProduct[] = [
  {
    id: 'bp_001',
    name: 'RISING SUN 6.0 No.5',
    brand: 'TARGET',
    weight: 20,
    maxDiameter: 6.35,
    length: 44,
    cut: 'リングカット',
    imageUrl: placeholderImage(300, 200),
    productUrl: 'https://example.com/rising-sun',
    source: 'dartshive',
    isDiscontinued: false,
    scrapedAt: daysAgo(7),
  },
  {
    id: 'bp_002',
    name: 'Solo G3',
    brand: 'TRiNiDAD',
    weight: 18,
    maxDiameter: 7.0,
    length: 42,
    cut: 'シャークカット+マイクロカット',
    imageUrl: placeholderImage(300, 200),
    productUrl: 'https://example.com/solo-g3',
    source: 'dartshive',
    isDiscontinued: false,
    scrapedAt: daysAgo(7),
  },
  {
    id: 'bp_003',
    name: 'PYRO',
    brand: 'MONSTER',
    weight: 19,
    maxDiameter: 7.0,
    length: 42,
    cut: 'シャークカット',
    imageUrl: placeholderImage(300, 200),
    productUrl: 'https://example.com/pyro',
    source: 'dartshive',
    isDiscontinued: false,
    scrapedAt: daysAgo(7),
  },
  {
    id: 'bp_004',
    name: 'RAPIER',
    brand: 'Samurai',
    weight: 21,
    maxDiameter: 7.2,
    length: 46,
    cut: 'マイクロカット',
    imageUrl: placeholderImage(300, 200),
    productUrl: 'https://example.com/rapier',
    source: 'dartshive',
    isDiscontinued: false,
    scrapedAt: daysAgo(7),
  },
  {
    id: 'bp_005',
    name: 'Asuka 3',
    brand: 'DYNASTY',
    weight: 22,
    maxDiameter: 6.8,
    length: 45,
    cut: 'リングカット+ナーリング',
    imageUrl: placeholderImage(300, 200),
    productUrl: 'https://example.com/asuka-3',
    source: 'dartshive',
    isDiscontinued: false,
    scrapedAt: daysAgo(7),
  },
  {
    id: 'bp_006',
    name: 'GOMEZ TYPE 11',
    brand: 'TRiNiDAD',
    weight: 18,
    maxDiameter: 6.5,
    length: 40,
    cut: 'リングカット',
    imageUrl: placeholderImage(300, 200),
    productUrl: 'https://example.com/gomez-11',
    source: 'dartshive',
    isDiscontinued: true,
    scrapedAt: daysAgo(30),
  },
  {
    id: 'bp_007',
    name: 'TARGET CHRIS DOBEY',
    brand: 'TARGET',
    weight: 23,
    maxDiameter: 6.4,
    length: 50,
    cut: 'ナーリング',
    imageUrl: placeholderImage(300, 200),
    productUrl: 'https://example.com/dobey',
    source: 'dartshive',
    isDiscontinued: false,
    scrapedAt: daysAgo(7),
  },
  {
    id: 'bp_008',
    name: 'Unicorn Phase 5',
    brand: 'Unicorn',
    weight: 24,
    maxDiameter: 6.6,
    length: 48,
    cut: 'リングカット+マイクロカット',
    imageUrl: placeholderImage(300, 200),
    productUrl: 'https://example.com/phase5',
    source: 'dartshive',
    isDiscontinued: false,
    scrapedAt: daysAgo(7),
  },
];

export const MOCK_QUIZ_ANSWER: QuizAnswer = {
  playStyle: 'intermediate',
  gripPosition: 'center',
  weightPreference: 'medium',
  lengthPreference: 'standard',
  cutPreference: ['リングカット', 'マイクロカット'],
};

export interface MockQuizResult {
  barrel: MockBarrelProduct;
  matchPercent: number;
  analysis?: string;
}

export const MOCK_QUIZ_RESULTS: MockQuizResult[] = [
  {
    barrel: MOCK_BARREL_PRODUCTS[0],
    matchPercent: 92,
    analysis: '重量・長さともに理想的。リングカットがグリップに合います。',
  },
  {
    barrel: MOCK_BARREL_PRODUCTS[1],
    matchPercent: 85,
    analysis: 'やや軽めですが、太めのバレルでグリップ感が良好。',
  },
  {
    barrel: MOCK_BARREL_PRODUCTS[3],
    matchPercent: 78,
    analysis: '重量は良いですが、やや長め。マイクロカットは好みに合います。',
  },
  {
    barrel: MOCK_BARREL_PRODUCTS[4],
    matchPercent: 72,
    analysis: '重量級のストレートバレル。パワースロー向け。',
  },
];

export const MOCK_BARREL_RANKING = {
  weekly: [MOCK_BARREL_PRODUCTS[0], MOCK_BARREL_PRODUCTS[1], MOCK_BARREL_PRODUCTS[2]],
  monthly: [MOCK_BARREL_PRODUCTS[1], MOCK_BARREL_PRODUCTS[0], MOCK_BARREL_PRODUCTS[3]],
};
