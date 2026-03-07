export interface MockWeeklyReport {
  periodLabel: string;
  playDays: number;
  totalGames: number;
  ratingChange: number | null;
  bestDay: { date: string; rating: number } | null;
  awardsHighlights: { label: string; count: number }[];
  goalsAchieved: number;
  xpGained: number;
}

export interface MockMonthlyReport {
  periodLabel: string;
  playDays: number;
  totalGames: number;
  ratingStart: number | null;
  ratingEnd: number | null;
  ratingChange: number | null;
  avgPpd: number | null;
  avgMpr: number | null;
  bestDay: { date: string; rating: number } | null;
  worstDay: { date: string; rating: number } | null;
  awardsHighlights: { label: string; count: number }[];
  goalsAchieved: number;
  goalsActive: number;
  xpGained: number;
}

export const MOCK_WEEKLY_REPORTS: MockWeeklyReport[] = [
  {
    periodLabel: '3/1 - 3/7',
    playDays: 4,
    totalGames: 32,
    ratingChange: 0.5,
    bestDay: { date: '3/5', rating: 8.5 },
    awardsHighlights: [
      { label: 'HAT TRICK', count: 3 },
      { label: 'TON80', count: 1 },
    ],
    goalsAchieved: 2,
    xpGained: 450,
  },
  {
    periodLabel: '2/22 - 2/28',
    playDays: 3,
    totalGames: 24,
    ratingChange: -0.2,
    bestDay: { date: '2/25', rating: 8.2 },
    awardsHighlights: [{ label: 'HAT TRICK', count: 2 }],
    goalsAchieved: 1,
    xpGained: 280,
  },
  {
    periodLabel: '2/15 - 2/21',
    playDays: 5,
    totalGames: 40,
    ratingChange: 1.0,
    bestDay: { date: '2/19', rating: 8.0 },
    awardsHighlights: [
      { label: 'HAT TRICK', count: 5 },
      { label: 'LOW TON', count: 8 },
    ],
    goalsAchieved: 3,
    xpGained: 620,
  },
  {
    periodLabel: '2/8 - 2/14',
    playDays: 2,
    totalGames: 16,
    ratingChange: null,
    bestDay: null,
    awardsHighlights: [],
    goalsAchieved: 0,
    xpGained: 120,
  },
];

export const MOCK_MONTHLY_REPORTS: MockMonthlyReport[] = [
  {
    periodLabel: '2025年3月',
    playDays: 12,
    totalGames: 96,
    ratingStart: 7.5,
    ratingEnd: 8.5,
    ratingChange: 1.0,
    avgPpd: 42.5,
    avgMpr: 2.1,
    bestDay: { date: '3/15', rating: 8.5 },
    worstDay: { date: '3/3', rating: 7.2 },
    awardsHighlights: [
      { label: 'HAT TRICK', count: 12 },
      { label: 'TON80', count: 3 },
      { label: 'LOW TON', count: 18 },
    ],
    goalsAchieved: 4,
    goalsActive: 2,
    xpGained: 1850,
  },
  {
    periodLabel: '2025年2月',
    playDays: 10,
    totalGames: 80,
    ratingStart: 7.0,
    ratingEnd: 7.5,
    ratingChange: 0.5,
    avgPpd: 40.2,
    avgMpr: 2.0,
    bestDay: { date: '2/19', rating: 8.0 },
    worstDay: { date: '2/5', rating: 6.8 },
    awardsHighlights: [
      { label: 'HAT TRICK', count: 8 },
      { label: 'LOW TON', count: 14 },
    ],
    goalsAchieved: 2,
    goalsActive: 3,
    xpGained: 1200,
  },
  {
    periodLabel: '2025年1月',
    playDays: 8,
    totalGames: 64,
    ratingStart: 7.0,
    ratingEnd: 7.0,
    ratingChange: 0,
    avgPpd: 38.5,
    avgMpr: 1.9,
    bestDay: { date: '1/20', rating: 7.5 },
    worstDay: { date: '1/8', rating: 6.5 },
    awardsHighlights: [{ label: 'HAT TRICK', count: 5 }],
    goalsAchieved: 1,
    goalsActive: 3,
    xpGained: 800,
  },
];
