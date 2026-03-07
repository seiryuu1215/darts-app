import type {
  HealthMetric,
  HealthInsight,
  ConditionScore,
  PersonalBaseline,
  HealthDartsCorrelation,
  MonthlyTrendData,
} from '@/types';

function makeMetric(date: string, overrides: Partial<HealthMetric> = {}): HealthMetric {
  return {
    metricDate: date,
    restingHr: 62,
    avgHr: 75,
    maxHr: 145,
    hrvSdnn: 45,
    sleepDurationMinutes: 420,
    sleepDeepMinutes: 90,
    sleepRemMinutes: 105,
    sleepCoreMinutes: 180,
    sleepAwakeMinutes: 45,
    timeInBedMinutes: 480,
    steps: 8500,
    activeEnergyKcal: 350,
    exerciseMinutes: 30,
    standHours: 10,
    respiratoryRate: 14,
    bloodOxygenPct: 98,
    ...overrides,
  };
}

export const MOCK_HEALTH_METRICS: HealthMetric[] = [
  makeMetric('2025-03-07', { hrvSdnn: 52, sleepDurationMinutes: 450, restingHr: 58, steps: 10200 }),
  makeMetric('2025-03-06', { hrvSdnn: 48, sleepDurationMinutes: 400, restingHr: 60, steps: 8800 }),
  makeMetric('2025-03-05', { hrvSdnn: 38, sleepDurationMinutes: 350, restingHr: 65, steps: 6500 }),
  makeMetric('2025-03-04', { hrvSdnn: 55, sleepDurationMinutes: 480, restingHr: 57, steps: 9200 }),
  makeMetric('2025-03-03', { hrvSdnn: 42, sleepDurationMinutes: 390, restingHr: 63, steps: 7800 }),
  makeMetric('2025-03-02', { hrvSdnn: 50, sleepDurationMinutes: 440, restingHr: 59, steps: 11000 }),
  makeMetric('2025-03-01', { hrvSdnn: 46, sleepDurationMinutes: 410, restingHr: 61, steps: 8200 }),
  makeMetric('2025-02-28', { hrvSdnn: 44, sleepDurationMinutes: 380, restingHr: 64, steps: 7500 }),
  makeMetric('2025-02-27', { hrvSdnn: 51, sleepDurationMinutes: 460, restingHr: 58, steps: 9500 }),
  makeMetric('2025-02-26', { hrvSdnn: 40, sleepDurationMinutes: 360, restingHr: 66, steps: 6000 }),
  makeMetric('2025-02-25', { hrvSdnn: 53, sleepDurationMinutes: 470, restingHr: 57, steps: 10500 }),
  makeMetric('2025-02-24', { hrvSdnn: 47, sleepDurationMinutes: 430, restingHr: 60, steps: 8700 }),
  makeMetric('2025-02-23', { hrvSdnn: 49, sleepDurationMinutes: 420, restingHr: 61, steps: 9000 }),
  makeMetric('2025-02-22', { hrvSdnn: 43, sleepDurationMinutes: 370, restingHr: 63, steps: 7200 }),
];

export const MOCK_HEALTH_INSIGHTS: HealthInsight[] = [
  {
    type: 'correlation',
    metric: 'HRV',
    messageJa: 'HRVが高い日（50ms以上）はPPDが平均+3.2ポイント高い傾向があります',
    severity: 'info',
  },
  {
    type: 'trend',
    metric: '睡眠',
    messageJa: '直近7日間の平均睡眠時間は7.2時間で、前週より30分増加しています',
    severity: 'info',
  },
  {
    type: 'warning',
    metric: '安静時心拍',
    messageJa: '昨日の安静時心拍が65bpmと通常より高めです。休息を取ることをおすすめします',
    severity: 'warning',
  },
];

export const MOCK_CONDITION_SCORE: ConditionScore = {
  score: 78,
  factors: {
    hrv: 85,
    sleep: 72,
    restingHr: 80,
    sleepQuality: 68,
    activity: 90,
  },
  label: 'Good',
  star: 4,
};

export const MOCK_PERSONAL_BASELINE: PersonalBaseline = {
  avgHrv: 47,
  avgSleep: 420,
  avgRestingHr: 61,
  avgSleepQuality: 0.75,
  avgSteps: 8500,
};

export const MOCK_HEALTH_DARTS_CORRELATIONS: HealthDartsCorrelation[] = [
  {
    date: '2025-03-07',
    restingHr: 58,
    hrvSdnn: 52,
    sleepDurationMinutes: 450,
    sleepDeepMinutes: 100,
    sleepRemMinutes: 110,
    sleepCoreMinutes: 190,
    steps: 10200,
    activeEnergyKcal: 400,
    exerciseMinutes: 45,
    rating: 8.5,
    countUpAvg: 680,
    condition: 5,
    gamesPlayed: 10,
  },
  {
    date: '2025-03-05',
    restingHr: 65,
    hrvSdnn: 38,
    sleepDurationMinutes: 350,
    sleepDeepMinutes: 70,
    sleepRemMinutes: 85,
    sleepCoreMinutes: 160,
    steps: 6500,
    activeEnergyKcal: 250,
    exerciseMinutes: 15,
    rating: 7.8,
    countUpAvg: 520,
    condition: 2,
    gamesPlayed: 8,
  },
  {
    date: '2025-03-03',
    restingHr: 63,
    hrvSdnn: 42,
    sleepDurationMinutes: 390,
    sleepDeepMinutes: 80,
    sleepRemMinutes: 95,
    sleepCoreMinutes: 170,
    steps: 7800,
    activeEnergyKcal: 300,
    exerciseMinutes: 25,
    rating: 8.0,
    countUpAvg: 590,
    condition: 3,
    gamesPlayed: 12,
  },
];

export const MOCK_MONTHLY_TRENDS: MonthlyTrendData[] = [
  { month: '2025-01', avgCondition: 3.2, avgCu: 38.5, avgSleep: 400, avgHrv: 44, count: 8 },
  { month: '2025-02', avgCondition: 3.5, avgCu: 40.2, avgSleep: 415, avgHrv: 46, count: 10 },
  { month: '2025-03', avgCondition: 3.8, avgCu: 42.5, avgSleep: 430, avgHrv: 48, count: 7 },
];
