/**
 * Storybook用モックデータ
 * Rt.8 (BB Flight) 中級者プレイヤーを想定
 */

// DartsliveData型と同じ構造（page.tsxからexportされていないためインライン定義）
export interface DartsliveData {
  current: {
    cardName: string;
    toorina: string;
    cardImageUrl: string;
    rating: number | null;
    ratingInt: number | null;
    flight: string;
    stats01Avg: number | null;
    statsCriAvg: number | null;
    statsPraAvg: number | null;
    stats01Best: number | null;
    statsCriBest: number | null;
    statsPraBest: number | null;
    awards: Record<string, { monthly: number; total: number }>;
    homeShop?: string;
    status?: string;
    myAward?: string;
  };
  monthly: Record<string, { month: string; value: number }[]>;
  recentGames: {
    dayStats: {
      best01: number | null;
      bestCri: number | null;
      bestCountUp: number | null;
      avg01: number | null;
      avgCri: number | null;
      avgCountUp: number | null;
    };
    games: { category: string; scores: number[] }[];
    shops: string[];
  };
  prev: {
    rating: number | null;
    stats01Avg: number | null;
    statsCriAvg: number | null;
    statsPraAvg: number | null;
  } | null;
}

export interface StatsHistorySummary {
  avgRating: number | null;
  avgPpd: number | null;
  avgMpr: number | null;
  avgCondition: number | null;
  totalGames: number;
  playDays: number;
  ratingChange: number | null;
  bestRating: number | null;
  bestPpd: number | null;
  bestMpr: number | null;
  streak: number;
}

export interface StatsHistoryRecord {
  id: string;
  date: string;
  rating: number | null;
  ppd: number | null;
  mpr: number | null;
  gamesPlayed: number;
  condition: number | null;
  memo: string;
  dBull: number | null;
  sBull: number | null;
}

// --- COUNT-UP scores (30+ games, Rt.8 level: ~500-560 range) ---
const countUpScores = [
  501, 482, 537, 519, 545, 498, 521, 560, 478, 534, 512, 489, 553, 507, 541, 468, 525, 548, 493,
  531, 516, 504, 562, 488, 539, 510, 527, 495, 543, 518, 502, 556, 483, 529,
];

// --- 01 scores (PPD range for Rt.8: ~60-72) ---
const zeroOne501Scores = [
  63.21, 67.45, 61.38, 69.72, 64.89, 66.13, 62.57, 70.34, 65.82, 68.91, 63.75, 67.28, 61.94, 69.15,
  64.47, 66.83, 63.09, 68.26, 65.51, 67.93,
];

const zeroOne701Scores = [64.78, 66.32, 62.41, 68.55, 65.17, 67.89];

// --- Cricket scores (MPR range for Rt.8: ~2.0-2.7) ---
const cricketScores = [
  2.15, 2.43, 2.08, 2.61, 2.31, 2.48, 2.19, 2.55, 2.37, 2.22, 2.51, 2.09, 2.44, 2.33, 2.58,
];

// --- Monthly data (12 months) ---
function generateMonthlyData(
  baseValue: number,
  variance: number,
  growth: number,
): { month: string; value: number }[] {
  const months = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    const value = +(baseValue + growth * (11 - i) + Math.sin(i * 1.3) * variance).toFixed(2);
    months.push({ month, value });
  }
  return months;
}

export const MOCK_DARTSLIVE_DATA: DartsliveData = {
  current: {
    cardName: 'MOCK PLAYER',
    toorina: 'mockplayer',
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
      '3 IN A BED': { monthly: 2, total: 45 },
      '3 - BLACK': { monthly: 0, total: 3 },
      'WHITE HRS': { monthly: 0, total: 1 },
      '9 COUNT': { monthly: 5, total: 134 },
      '8 COUNT': { monthly: 3, total: 89 },
      '7 COUNT': { monthly: 7, total: 198 },
      '6 COUNT': { monthly: 12, total: 312 },
      '5 COUNT': { monthly: 18, total: 456 },
    },
    homeShop: 'Bee 渋谷道玄坂店',
    status: 'レーティングUP中',
    myAward: 'HAT TRICK',
  },
  monthly: {
    rating: generateMonthlyData(7.5, 0.3, 0.07),
    zeroOne: generateMonthlyData(62.0, 2.0, 0.27),
    cricket: generateMonthlyData(2.1, 0.1, 0.018),
    countUp: generateMonthlyData(490, 15, 2.6),
  },
  recentGames: {
    dayStats: {
      best01: 70.34,
      bestCri: 2.61,
      bestCountUp: 562,
      avg01: 65.82,
      avgCri: 2.37,
      avgCountUp: 521,
    },
    games: [
      { category: 'COUNT-UP', scores: countUpScores },
      { category: '501', scores: zeroOne501Scores },
      { category: '701', scores: zeroOne701Scores },
      { category: 'STANDARD CRICKET', scores: cricketScores },
    ],
    shops: ['Bee 渋谷道玄坂店', 'ダーツハイブ新宿店'],
  },
  prev: {
    rating: 8.15,
    stats01Avg: 64.38,
    statsCriAvg: 2.24,
    statsPraAvg: 512,
  },
};

// --- Period Summary (cumulative) ---
export const MOCK_PERIOD_SUMMARY: StatsHistorySummary = {
  avgRating: 8.18,
  avgPpd: 64.89,
  avgMpr: 2.28,
  avgCondition: 3.4,
  totalGames: 247,
  playDays: 38,
  ratingChange: 0.17,
  bestRating: 8.52,
  bestPpd: 70.34,
  bestMpr: 2.61,
  streak: 5,
};

// --- Period Records (30 days) ---
function generateRecords(): StatsHistoryRecord[] {
  const records: StatsHistoryRecord[] = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    // Skip some days to make it realistic
    if (i % 3 === 1 || i % 5 === 0) continue;
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const baseRt = 8.0 + (30 - i) * 0.01 + (Math.random() - 0.5) * 0.3;
    const basePpd = 63 + (Math.random() - 0.3) * 5;
    const baseMpr = 2.15 + (Math.random() - 0.3) * 0.3;
    records.push({
      id: `rec_${i}`,
      date: dateStr,
      rating: +baseRt.toFixed(2),
      ppd: +basePpd.toFixed(2),
      mpr: +baseMpr.toFixed(2),
      gamesPlayed: Math.floor(4 + Math.random() * 8),
      condition: Math.floor(2 + Math.random() * 4),
      memo: i === 0 ? '調子良かった' : '',
      dBull: Math.floor(5 + Math.random() * 15),
      sBull: Math.floor(3 + Math.random() * 10),
    });
  }
  return records;
}

export const MOCK_PERIOD_RECORDS: StatsHistoryRecord[] = generateRecords();

// --- Flight Variants ---
export const MOCK_SA_FLIGHT_DATA: DartsliveData = {
  ...MOCK_DARTSLIVE_DATA,
  current: {
    ...MOCK_DARTSLIVE_DATA.current,
    cardName: 'SA PLAYER',
    rating: 14.21,
    ratingInt: 14,
    flight: 'SA',
    stats01Avg: 89.45,
    statsCriAvg: 3.82,
    statsPraAvg: 715,
    stats01Best: 96.12,
    statsCriBest: 4.35,
    statsPraBest: 842,
  },
  prev: {
    rating: 14.05,
    stats01Avg: 88.91,
    statsCriAvg: 3.78,
    statsPraAvg: 710,
  },
};

export const MOCK_C_FLIGHT_DATA: DartsliveData = {
  ...MOCK_DARTSLIVE_DATA,
  current: {
    ...MOCK_DARTSLIVE_DATA.current,
    cardName: 'BEGINNER',
    rating: 3.45,
    ratingInt: 3,
    flight: 'C',
    stats01Avg: 42.18,
    statsCriAvg: 1.45,
    statsPraAvg: 320,
    stats01Best: 51.23,
    statsCriBest: 1.89,
    statsPraBest: 421,
  },
  prev: {
    rating: 3.21,
    stats01Avg: 41.05,
    statsCriAvg: 1.38,
    statsPraAvg: 305,
  },
};

// --- High / Low Consistency game data ---
export const MOCK_HIGH_CONSISTENCY_GAMES = [
  {
    category: 'COUNT-UP',
    scores: [
      518, 522, 515, 525, 520, 517, 523, 519, 521, 516, 524, 518, 522, 520, 517, 523, 519, 521, 516,
      524, 518, 522, 515, 525, 520, 517, 523, 519, 521, 516,
    ],
  },
];

export const MOCK_LOW_CONSISTENCY_GAMES = [
  {
    category: 'COUNT-UP',
    scores: [
      612, 321, 545, 278, 489, 601, 356, 534, 267, 578, 412, 621, 345, 289, 501, 632, 312, 567, 245,
      598, 389, 612, 301, 545, 278, 489, 601, 356, 534, 267,
    ],
  },
];

export const MOCK_FEW_GAMES = [{ category: 'COUNT-UP', scores: [512, 498, 534] }];

// --- Trending up / down COUNT-UP data ---
export const MOCK_TRENDING_UP_GAMES = [
  {
    category: 'COUNT-UP',
    scores: [
      480, 485, 492, 498, 505, 510, 515, 520, 528, 535, 540, 545, 548, 555, 558, 562, 568, 572, 578,
      582, 585, 588, 592, 595, 598, 601, 605, 608, 612, 618,
    ],
  },
];

export const MOCK_TRENDING_DOWN_GAMES = [
  {
    category: 'COUNT-UP',
    scores: [
      618, 612, 608, 601, 595, 588, 582, 578, 572, 565, 558, 552, 545, 540, 535, 528, 522, 515, 510,
      505, 498, 492, 488, 482, 478, 472, 468, 462, 458, 452,
    ],
  },
];

// --- Progression Mock Data ---
export const MOCK_ACHIEVEMENT_SNAPSHOT = {
  highestRating: 8.52,
  hatTricksTotal: 215,
  ton80: 12,
  dBullTotal: 2341,
  sBullTotal: 1456,
  lowTon: 389,
  highTon: 78,
  threeInABed: 45,
  whiteHorse: 1,
  level: 12,
};

export const MOCK_UNLOCKED_ACHIEVEMENTS = [
  'rating_3',
  'rating_4',
  'rating_5',
  'rating_6',
  'rating_7',
  'rating_8',
  'hat_trick_10',
  'hat_trick_50',
  'hat_trick_100',
  'ton80_5',
  'ton80_10',
  'bulls_100',
  'bulls_500',
  'bulls_1000',
  'bulls_2000',
  'bulls_3000',
  'low_ton_50',
  'low_ton_100',
  'high_ton_10',
  'high_ton_50',
  'three_bed_10',
  'level_5',
  'level_10',
];

// --- EnrichedData（PerformanceInsightsCard, StatsPageContent用） ---
export interface EnrichedData {
  maxRating: number | null;
  maxRatingDate: string | null;
  stats01Detailed: {
    avg: number | null;
    best: number | null;
    winRate: number | null;
    bullRate: number | null;
    arrangeRate: number | null;
    avgBust: number | null;
    avg100: number | null;
  } | null;
  statsCricketDetailed: {
    avg: number | null;
    best: number | null;
    winRate: number | null;
    tripleRate: number | null;
    openCloseRate: number | null;
    avg100: number | null;
  } | null;
  bestRecords:
    | { gameId: string; gameName: string; bestScore: number; bestDate: string | null }[]
    | null;
}

export const MOCK_ENRICHED_DATA: EnrichedData = {
  maxRating: 8.52,
  maxRatingDate: '2025-12-15',
  stats01Detailed: {
    avg: 65.21,
    best: 72.45,
    winRate: 58,
    bullRate: 42,
    arrangeRate: 35,
    avgBust: 2.1,
    avg100: 63.8,
  },
  statsCricketDetailed: {
    avg: 2.31,
    best: 2.89,
    winRate: 52,
    tripleRate: 38,
    openCloseRate: 65,
    avg100: 2.25,
  },
  bestRecords: [
    { gameId: 'COUNTUP', gameName: 'COUNT-UP', bestScore: 612, bestDate: '2025-12-10' },
    { gameId: '501', gameName: '501', bestScore: 72.45, bestDate: '2025-11-28' },
  ],
};

export const MOCK_SA_ENRICHED_DATA: EnrichedData = {
  maxRating: 14.55,
  maxRatingDate: '2025-11-20',
  stats01Detailed: {
    avg: 89.45,
    best: 96.12,
    winRate: 72,
    bullRate: 58,
    arrangeRate: 48,
    avgBust: 1.2,
    avg100: 87.3,
  },
  statsCricketDetailed: {
    avg: 3.82,
    best: 4.35,
    winRate: 68,
    tripleRate: 52,
    openCloseRate: 78,
    avg100: 3.75,
  },
  bestRecords: [
    { gameId: 'COUNTUP', gameName: 'COUNT-UP', bestScore: 842, bestDate: '2025-11-15' },
    { gameId: '501', gameName: '501', bestScore: 96.12, bestDate: '2025-11-20' },
  ],
};

// --- RecommendationInput（PracticeRecommendationsCard用） ---
export interface RecommendationInput {
  ppd: number | null;
  bullRate: number | null;
  arrangeRate: number | null;
  avgBust: number | null;
  mpr: number | null;
  tripleRate: number | null;
  openCloseRate: number | null;
  countupAvg: number | null;
  countupConsistency: number | null;
  primaryMissDirection: string | null;
  directionStrength: number | null;
  avgRadius: number | null;
  radiusImprovement: number | null;
  avgSpeed: number | null;
  optimalSessionLength: number | null;
  peakGameNumber: number | null;
  roundPattern: string | null;
  worstRound: number | null;
}

export const MOCK_REC_INPUT: RecommendationInput = {
  ppd: 65.21,
  bullRate: 42,
  arrangeRate: 35,
  avgBust: 2.1,
  mpr: 2.31,
  tripleRate: 38,
  openCloseRate: 65,
  countupAvg: 521,
  countupConsistency: 72,
  primaryMissDirection: '右下',
  directionStrength: 0.45,
  avgRadius: 28.5,
  radiusImprovement: -8,
  avgSpeed: 12.3,
  optimalSessionLength: 18,
  peakGameNumber: 6,
  roundPattern: 'slow_start',
  worstRound: 1,
};

export const MOCK_REC_INPUT_LITE: RecommendationInput = {
  ppd: 65.21,
  bullRate: 42,
  arrangeRate: 35,
  avgBust: 2.1,
  mpr: 2.31,
  tripleRate: 38,
  openCloseRate: 65,
  countupAvg: null,
  countupConsistency: null,
  primaryMissDirection: null,
  directionStrength: null,
  avgRadius: null,
  radiusImprovement: null,
  avgSpeed: null,
  optimalSessionLength: null,
  peakGameNumber: null,
  roundPattern: null,
  worstRound: null,
};

// --- CountUpPlay[]（SensorTrendCard用、20件、DL3センサー値付き） ---
export interface CountUpPlay {
  time: string;
  score: number;
  playLog: string;
  dl3VectorX: number;
  dl3VectorY: number;
  dl3Radius: number;
  dl3Speed: number;
}

/** seeded pseudo-random（Storybook再現性のため） */
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

/** ダーツコード形式のplayLogを生成（24本カンマ区切り） */
function generatePlayLog(rand: () => number): { log: string; score: number } {
  const dartCodes: string[] = [];
  const numbers = [20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
  let score = 0;

  for (let i = 0; i < 24; i++) {
    const r = rand();
    let code: string;
    let pts: number;

    if (r < 0.08) {
      // ダブルブル 8%
      code = 'BB';
      pts = 50;
    } else if (r < 0.2) {
      // シングルブル 12%
      code = 'B';
      pts = 25;
    } else if (r < 0.25) {
      // アウト 5%
      code = 'O';
      pts = 0;
    } else if (r < 0.35) {
      // トリプル 10%
      const n = numbers[Math.floor(rand() * 20)];
      code = `T${n}`;
      pts = n * 3;
    } else if (r < 0.42) {
      // ダブル 7%
      const n = numbers[Math.floor(rand() * 20)];
      code = `D${n}`;
      pts = n * 2;
    } else if (r < 0.65) {
      // アウターシングル 23%
      const n = numbers[Math.floor(rand() * 20)];
      code = `S${n}`;
      pts = n;
    } else {
      // インナーシングル 35%
      const n = numbers[Math.floor(rand() * 20)];
      code = `I${n}`;
      pts = n;
    }

    dartCodes.push(code);
    score += pts;
  }

  return { log: dartCodes.join(','), score };
}

/** 2日分×35ゲーム = 70件のCountUpPlayを生成（SessionCompareCard対応） */
function generateCountUpPlays(): CountUpPlay[] {
  const plays: CountUpPlay[] = [];
  const rand = seededRandom(42);
  const days = ['2025-12-01', '2025-12-05'];

  for (const day of days) {
    for (let i = 0; i < 35; i++) {
      const hour = 18 + Math.floor(i / 8);
      const min = (i % 8) * 7;
      const { log, score } = generatePlayLog(rand);
      plays.push({
        time: `${day} ${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}:00`,
        score,
        playLog: log,
        dl3VectorX: +(rand() * 20 - 10).toFixed(1),
        dl3VectorY: +(rand() * 16 - 6).toFixed(1),
        dl3Radius: +(20 + rand() * 25).toFixed(1),
        dl3Speed: +(10 + rand() * 6).toFixed(1),
      });
    }
  }

  return plays;
}

export const MOCK_COUNTUP_PLAYS: CountUpPlay[] = generateCountUpPlays();

export const MOCK_XP_HISTORY = [
  {
    id: 'xp_1',
    action: 'daily_play',
    xp: 50,
    detail: 'デイリープレイボーナス',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: 'xp_2',
    action: 'hat_trick',
    xp: 30,
    detail: 'HAT TRICK達成',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: 'xp_3',
    action: 'rating_up',
    xp: 100,
    detail: 'レーティングUP (+0.17)',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: 'xp_4',
    action: 'daily_play',
    xp: 50,
    detail: 'デイリープレイボーナス',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: 'xp_5',
    action: 'streak',
    xp: 75,
    detail: '5日連続プレイ',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
  {
    id: 'xp_6',
    action: 'ton80',
    xp: 80,
    detail: 'TON 80達成',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
  },
];
