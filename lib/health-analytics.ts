import type {
  HealthMetric,
  HealthInsight,
  HealthDartsCorrelation,
  ConditionScore,
  PersonalBaseline,
  FatigueAlert,
  BestConditionProfile,
  PracticeTimingResult,
  MonthlyTrendData,
  SleepStageCorrelationResult,
} from '@/types';

// ==========================================
// ピアソン相関係数
// ==========================================
export function pearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  if (n < 3 || n !== y.length) return 0;

  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;

  let numerator = 0;
  let denomX = 0;
  let denomY = 0;

  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    numerator += dx * dy;
    denomX += dx * dx;
    denomY += dy * dy;
  }

  const denom = Math.sqrt(denomX * denomY);
  if (denom === 0) return 0;
  return numerator / denom;
}

// ==========================================
// 移動平均
// ==========================================
export function movingAverage(values: (number | null)[], window: number = 7): (number | null)[] {
  const result: (number | null)[] = [];
  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - window + 1);
    const slice = values.slice(start, i + 1).filter((v): v is number => v !== null);
    result.push(
      slice.length > 0
        ? Math.round((slice.reduce((a, b) => a + b, 0) / slice.length) * 10) / 10
        : null,
    );
  }
  return result;
}

// ==========================================
// ヘルスインサイト生成
// ==========================================
export function generateHealthInsights(metrics: HealthMetric[]): HealthInsight[] {
  const insights: HealthInsight[] = [];

  if (metrics.length === 0) {
    insights.push({
      type: 'trend',
      metric: 'general',
      messageJa: 'ヘルスデータを同期すると分析が始まります',
      severity: 'info',
    });
    return insights;
  }

  // --- 1日データのスナップショットインサイト ---
  if (metrics.length === 1) {
    const m = metrics[0];
    if (m.hrvSdnn !== null) {
      if (m.hrvSdnn < 20) {
        insights.push({
          type: 'warning',
          metric: 'hrv',
          severity: 'critical',
          messageJa: `HRVが${m.hrvSdnn}msと低い値です。強いストレスや疲労の可能性があります。`,
        });
      } else if (m.hrvSdnn < 30) {
        insights.push({
          type: 'warning',
          metric: 'hrv',
          severity: 'warning',
          messageJa: `HRVが${m.hrvSdnn}msとやや低めです。休養を意識してください。`,
        });
      } else if (m.hrvSdnn > 50) {
        insights.push({
          type: 'trend',
          metric: 'hrv',
          severity: 'info',
          messageJa: `HRVは${m.hrvSdnn}msで良好です。自律神経バランスが安定しています。`,
        });
      }
    }
    if (m.sleepDurationMinutes !== null) {
      const hours = Math.round((m.sleepDurationMinutes / 60) * 10) / 10;
      if (m.sleepDurationMinutes < 360) {
        insights.push({
          type: 'warning',
          metric: 'sleep',
          severity: 'warning',
          messageJa: `睡眠時間が${hours}時間です。6時間以上を目指しましょう。`,
        });
      } else if (m.sleepDurationMinutes >= 420) {
        insights.push({
          type: 'trend',
          metric: 'sleep',
          severity: 'info',
          messageJa: `睡眠時間${hours}時間。十分な睡眠が取れています。`,
        });
      }
    }
    if (m.restingHr !== null && m.restingHr > 80) {
      insights.push({
        type: 'warning',
        metric: 'resting_hr',
        severity: 'warning',
        messageJa: `安静時心拍が${m.restingHr}bpmと高めです。体調に注意してください。`,
      });
    }
    return insights;
  }

  // --- 2日以上: トレンド分析 ---

  // HRV急低下警告
  const recentHrv = metrics
    .slice(0, Math.min(3, metrics.length))
    .map((m) => m.hrvSdnn)
    .filter((v): v is number => v !== null);
  const olderHrv = metrics
    .slice(Math.min(3, metrics.length), 10)
    .map((m) => m.hrvSdnn)
    .filter((v): v is number => v !== null);

  if (recentHrv.length >= 1 && olderHrv.length >= 1) {
    const recentAvg = recentHrv.reduce((a, b) => a + b, 0) / recentHrv.length;
    const olderAvg = olderHrv.reduce((a, b) => a + b, 0) / olderHrv.length;
    const dropPct = ((olderAvg - recentAvg) / olderAvg) * 100;

    if (dropPct > 20) {
      insights.push({
        type: 'warning',
        metric: 'hrv',
        messageJa: `HRVが直近で${Math.round(dropPct)}%低下しています。休養を優先してください。`,
        severity: 'critical',
      });
    } else if (dropPct > 10) {
      insights.push({
        type: 'warning',
        metric: 'hrv',
        messageJa: `HRVがやや低下傾向(${Math.round(dropPct)}%)です。ストレスや疲労に注意してください。`,
        severity: 'warning',
      });
    }
  }

  // 安静時心拍上昇警告
  const recentRhr = metrics
    .slice(0, Math.min(3, metrics.length))
    .map((m) => m.restingHr)
    .filter((v): v is number => v !== null);
  const olderRhr = metrics
    .slice(Math.min(3, metrics.length), 10)
    .map((m) => m.restingHr)
    .filter((v): v is number => v !== null);

  if (recentRhr.length >= 1 && olderRhr.length >= 1) {
    const recentAvg = recentRhr.reduce((a, b) => a + b, 0) / recentRhr.length;
    const olderAvg = olderRhr.reduce((a, b) => a + b, 0) / olderRhr.length;
    const rise = recentAvg - olderAvg;

    if (rise > 5) {
      insights.push({
        type: 'warning',
        metric: 'resting_hr',
        messageJa: `安静時心拍が${Math.round(rise)}bpm上昇しています。体調不良のサインかもしれません。`,
        severity: 'warning',
      });
    }
  }

  // 睡眠時間低下
  const recentSleep = metrics
    .slice(0, Math.min(3, metrics.length))
    .map((m) => m.sleepDurationMinutes)
    .filter((v): v is number => v !== null);
  if (recentSleep.length >= 1) {
    const avgSleep = recentSleep.reduce((a, b) => a + b, 0) / recentSleep.length;
    if (avgSleep < 360) {
      insights.push({
        type: 'warning',
        metric: 'sleep',
        messageJa: `直近の平均睡眠時間が${Math.round((avgSleep / 60) * 10) / 10}時間です。6時間以上の睡眠を目指してください。`,
        severity: 'warning',
      });
    }
  }

  // ポジティブなインサイト
  if (insights.filter((i) => i.severity !== 'info').length === 0 && metrics.length >= 7) {
    const latestHrv = metrics[0]?.hrvSdnn;
    if (latestHrv !== null && latestHrv !== undefined && latestHrv > 40) {
      insights.push({
        type: 'trend',
        metric: 'hrv',
        messageJa: `HRVは良好な範囲(${latestHrv}ms)です。自律神経バランスは安定しています。`,
        severity: 'info',
      });
    }
  }

  return insights;
}

// ==========================================
// ダーツ × ヘルス相関分析
// ==========================================

interface DartsHealthCorrelationResult {
  metric: string;
  metricLabel: string;
  dartsMetric: 'countUpAvg';
  dartsLabel: string;
  r: number;
  n: number;
  aboveThresholdAvg: number;
  belowThresholdAvg: number;
  threshold: number;
  thresholdLabel: string;
  messageJa: string;
}

const HEALTH_DARTS_PAIRS: {
  metric: keyof HealthDartsCorrelation;
  label: string;
  threshold: number;
  thresholdLabel: string;
  above: boolean; // trueなら閾値以上が良好
}[] = [
  { metric: 'hrvSdnn', label: 'HRV', threshold: 40, thresholdLabel: '≥ 40ms', above: true },
  {
    metric: 'sleepDurationMinutes',
    label: '睡眠時間',
    threshold: 420,
    thresholdLabel: '≥ 7h',
    above: true,
  },
  {
    metric: 'restingHr',
    label: '安静時心拍',
    threshold: 70,
    thresholdLabel: '< 70bpm',
    above: false,
  },
  { metric: 'steps', label: '歩数', threshold: 8000, thresholdLabel: '≥ 8000', above: true },
  {
    metric: 'activeEnergyKcal',
    label: 'カロリー',
    threshold: 300,
    thresholdLabel: '≥ 300kcal',
    above: true,
  },
  {
    metric: 'exerciseMinutes',
    label: '運動時間',
    threshold: 30,
    thresholdLabel: '≥ 30min',
    above: true,
  },
];

export function analyzeDartsHealthCorrelations(
  data: HealthDartsCorrelation[],
): DartsHealthCorrelationResult[] {
  const results: DartsHealthCorrelationResult[] = [];

  for (const pair of HEALTH_DARTS_PAIRS) {
    for (const dartsMetric of ['countUpAvg'] as const) {
      const dartsLabel = 'CU平均';

      // 有効なデータのみフィルタ
      const valid = data.filter((d) => d[pair.metric] !== null && d[dartsMetric] !== null);
      if (valid.length < 5) continue;

      const healthValues = valid.map((d) => d[pair.metric] as number);
      const dartsValues = valid.map((d) => d[dartsMetric] as number);
      const r = pearsonCorrelation(healthValues, dartsValues);

      // 閾値以上/以下のグループ別平均を計算
      const aboveGroup = valid.filter((d) =>
        pair.above
          ? (d[pair.metric] as number) >= pair.threshold
          : (d[pair.metric] as number) < pair.threshold,
      );
      const belowGroup = valid.filter((d) =>
        pair.above
          ? (d[pair.metric] as number) < pair.threshold
          : (d[pair.metric] as number) >= pair.threshold,
      );

      if (aboveGroup.length === 0 || belowGroup.length === 0) continue;

      const aboveAvg =
        aboveGroup.reduce((sum, d) => sum + (d[dartsMetric] as number), 0) / aboveGroup.length;
      const belowAvg =
        belowGroup.reduce((sum, d) => sum + (d[dartsMetric] as number), 0) / belowGroup.length;
      const diff = aboveAvg - belowAvg;

      const messageJa =
        diff > 0
          ? `${pair.label} ${pair.thresholdLabel}の日は、${dartsLabel}が平均+${diff.toFixed(1)}高い傾向`
          : `${pair.label} ${pair.thresholdLabel}の日は、${dartsLabel}が平均${diff.toFixed(1)}低い傾向`;

      results.push({
        metric: pair.metric,
        metricLabel: pair.label,
        dartsMetric,
        dartsLabel,
        r,
        n: valid.length,
        aboveThresholdAvg: Math.round(aboveAvg * 10) / 10,
        belowThresholdAvg: Math.round(belowAvg * 10) / 10,
        threshold: pair.threshold,
        thresholdLabel: pair.thresholdLabel,
        messageJa,
      });
    }
  }

  // 相関の強さ(絶対値)でソート
  results.sort((a, b) => Math.abs(b.r) - Math.abs(a.r));

  return results;
}

// ==========================================
// パーソナルベースライン算出（過去30日平均）
// ==========================================
export function calculatePersonalBaseline(metrics: HealthMetric[]): PersonalBaseline | null {
  if (metrics.length < 3) return null;

  const hrvs = metrics.map((m) => m.hrvSdnn).filter((v): v is number => v !== null);
  const sleeps = metrics.map((m) => m.sleepDurationMinutes).filter((v): v is number => v !== null);
  const rhrs = metrics.map((m) => m.restingHr).filter((v): v is number => v !== null);
  const steps = metrics.map((m) => m.steps).filter((v): v is number => v !== null);

  const avg = (arr: number[]) => (arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

  // 睡眠品質 = 深い睡眠 + REM の割合
  const qualities = metrics
    .filter((m) => m.sleepDurationMinutes && m.sleepDurationMinutes > 0)
    .map((m) => {
      const deep = m.sleepDeepMinutes ?? 0;
      const rem = m.sleepRemMinutes ?? 0;
      const total = m.sleepDurationMinutes!;
      return ((deep + rem) / total) * 100;
    });

  return {
    avgHrv: avg(hrvs),
    avgSleep: avg(sleeps),
    avgRestingHr: avg(rhrs),
    avgSleepQuality: avg(qualities),
    avgSteps: avg(steps),
  };
}

// ==========================================
// コンディションスコア (0-100)
// HRV(30%) + 睡眠時間(25%) + 安静時心拍(20%) + 睡眠品質(15%) + 活動量(10%)
// ==========================================
export function calculateConditionScore(
  today: HealthMetric,
  baseline?: PersonalBaseline | null,
): ConditionScore {
  const bl = baseline ?? {
    avgHrv: 40,
    avgSleep: 420,
    avgRestingHr: 65,
    avgSleepQuality: 35,
    avgSteps: 8000,
  };

  // HRV: 高いほど良い → ratio capped at 1.5
  const hrvRatio = bl.avgHrv > 0 && today.hrvSdnn ? Math.min(today.hrvSdnn / bl.avgHrv, 1.5) : 0.5;
  const hrvScore = Math.round(hrvRatio * 66.7); // max 100

  // 睡眠時間: 7-9h最適
  const sleepMin = today.sleepDurationMinutes ?? 0;
  const sleepScore =
    sleepMin >= 420 && sleepMin <= 540
      ? 100
      : sleepMin >= 360
        ? Math.round(((sleepMin - 300) / 120) * 100)
        : Math.round((sleepMin / 360) * 60);

  // 安静時心拍: 低いほど良い → inverse ratio
  const rhrRatio =
    bl.avgRestingHr > 0 && today.restingHr ? Math.min(bl.avgRestingHr / today.restingHr, 1.3) : 0.5;
  const rhrScore = Math.round(rhrRatio * 76.9);

  // 睡眠品質: 深い睡眠+REMの割合
  const deep = today.sleepDeepMinutes ?? 0;
  const rem = today.sleepRemMinutes ?? 0;
  const totalSleep = today.sleepDurationMinutes ?? 1;
  const qualityPct = totalSleep > 0 ? ((deep + rem) / totalSleep) * 100 : 0;
  const qualityScore = Math.min(100, Math.round((qualityPct / 50) * 100));

  // 活動量
  const stepsRatio =
    bl.avgSteps > 0 && today.steps ? Math.min(today.steps / bl.avgSteps, 1.5) : 0.5;
  const activityScore = Math.round(stepsRatio * 66.7);

  const score = Math.min(
    100,
    Math.max(
      0,
      Math.round(
        hrvScore * 0.3 +
          sleepScore * 0.25 +
          rhrScore * 0.2 +
          qualityScore * 0.15 +
          activityScore * 0.1,
      ),
    ),
  );

  const label =
    score >= 80
      ? 'Excellent'
      : score >= 60
        ? 'Good'
        : score >= 40
          ? 'Fair'
          : score >= 20
            ? 'Poor'
            : 'Bad';

  const star: 1 | 2 | 3 | 4 | 5 =
    score >= 80 ? 5 : score >= 60 ? 4 : score >= 40 ? 3 : score >= 20 ? 2 : 1;

  return {
    score,
    factors: {
      hrv: Math.min(100, hrvScore),
      sleep: Math.min(100, sleepScore),
      restingHr: Math.min(100, rhrScore),
      sleepQuality: Math.min(100, qualityScore),
      activity: Math.min(100, activityScore),
    },
    label,
    star,
  };
}

// ==========================================
// コンディション → CU平均予測レンジ
// ==========================================
export function predictCuFromCondition(
  score: number,
  correlationData: HealthDartsCorrelation[],
): { low: number; expected: number; high: number } | null {
  const valid = correlationData.filter((d) => d.countUpAvg !== null && d.condition !== null);
  if (valid.length < 5) return null;

  const cuAvgs = valid.map((d) => d.countUpAvg!);
  const avg = cuAvgs.reduce((a, b) => a + b, 0) / cuAvgs.length;
  const std = Math.sqrt(cuAvgs.reduce((s, v) => s + (v - avg) ** 2, 0) / cuAvgs.length);

  // スコアベースの倍率
  const factor = (score - 50) / 100; // -0.5 to +0.5
  const expected = Math.round((avg + avg * factor * 0.15) * 10) / 10;
  const low = Math.round((expected - std * 0.8) * 10) / 10;
  const high = Math.round((expected + std * 0.8) * 10) / 10;

  return { low, expected, high };
}

// ==========================================
// 疲労アラート検出
// ==========================================
export function checkFatigueAlert(
  metrics: HealthMetric,
  baseline: PersonalBaseline,
): FatigueAlert | null {
  // HRV急落 (-20%)
  if (metrics.hrvSdnn !== null && baseline.avgHrv > 0) {
    const dropPct = ((baseline.avgHrv - metrics.hrvSdnn) / baseline.avgHrv) * 100;
    if (dropPct >= 20) {
      return {
        type: 'hrv_drop',
        severity: dropPct >= 30 ? 'critical' : 'warning',
        messageJa: `HRVがベースラインより${Math.round(dropPct)}%低下（${metrics.hrvSdnn}ms / 平均${Math.round(baseline.avgHrv)}ms）`,
        recommendation: '軽い練習に留め、十分な休養を取りましょう',
        value: metrics.hrvSdnn,
        baseline: baseline.avgHrv,
      };
    }
  }

  // 睡眠不足 (<5h)
  if (metrics.sleepDurationMinutes !== null && metrics.sleepDurationMinutes < 300) {
    return {
      type: 'sleep_deficit',
      severity: metrics.sleepDurationMinutes < 240 ? 'critical' : 'warning',
      messageJa: `睡眠${Math.round((metrics.sleepDurationMinutes / 60) * 10) / 10}時間 — 睡眠不足です`,
      recommendation: '今日は無理せず、早めに就寝しましょう',
      value: metrics.sleepDurationMinutes,
      baseline: baseline.avgSleep,
    };
  }

  // 安静時心拍急上昇 (+10%)
  if (metrics.restingHr !== null && baseline.avgRestingHr > 0) {
    const risePct = ((metrics.restingHr - baseline.avgRestingHr) / baseline.avgRestingHr) * 100;
    if (risePct >= 10) {
      return {
        type: 'hr_spike',
        severity: risePct >= 15 ? 'critical' : 'warning',
        messageJa: `安静時心拍がベースラインより${Math.round(risePct)}%上昇（${metrics.restingHr}bpm / 平均${Math.round(baseline.avgRestingHr)}bpm）`,
        recommendation: '体調不良のサインかもしれません。無理せず様子を見てください',
        value: metrics.restingHr,
        baseline: baseline.avgRestingHr,
      };
    }
  }

  return null;
}

// ==========================================
// ベストコンディション分析
// CU平均上位20%時のヘルスメトリクス範囲を算出
// ==========================================
export function analyzeBestConditionProfile(
  data: HealthDartsCorrelation[],
): BestConditionProfile | null {
  const valid = data.filter(
    (d) => d.countUpAvg !== null && d.hrvSdnn !== null && d.sleepDurationMinutes !== null,
  );
  if (valid.length < 10) return null;

  // CU平均で降順ソート → 上位20%
  const sorted = [...valid].sort((a, b) => (b.countUpAvg ?? 0) - (a.countUpAvg ?? 0));
  const topN = Math.max(3, Math.floor(sorted.length * 0.2));
  const top = sorted.slice(0, topN);

  const hrvs = top.map((d) => d.hrvSdnn!).sort((a, b) => a - b);
  const sleeps = top.map((d) => d.sleepDurationMinutes! / 60).sort((a, b) => a - b);
  const rhrs = top
    .map((d) => d.restingHr)
    .filter((v): v is number => v !== null)
    .sort((a, b) => a - b);
  const stps = top
    .map((d) => d.steps)
    .filter((v): v is number => v !== null)
    .sort((a, b) => a - b);

  const pct = (arr: number[], p: number) => arr[Math.floor(arr.length * p)] ?? 0;

  return {
    optimalHrv: [Math.round(pct(hrvs, 0.1)), Math.round(pct(hrvs, 0.9))],
    optimalSleep: [Math.round(pct(sleeps, 0.1) * 10) / 10, Math.round(pct(sleeps, 0.9) * 10) / 10],
    optimalRestingHr: [Math.round(pct(rhrs, 0.1)), Math.round(pct(rhrs, 0.9))],
    optimalSteps: [Math.round(pct(stps, 0.1)), Math.round(pct(stps, 0.9))],
    sampleSize: top.length,
  };
}

// ==========================================
// 練習タイミング分析（曜日別）
// ==========================================
const DAY_NAMES = ['日', '月', '火', '水', '木', '金', '土'];

export function analyzePracticeTimingPatterns(
  data: HealthDartsCorrelation[],
): PracticeTimingResult | null {
  if (data.length < 7) return null;

  const byDay: Record<number, { conditions: number[]; cuAvgs: number[] }> = {};
  for (let i = 0; i < 7; i++) byDay[i] = { conditions: [], cuAvgs: [] };

  for (const d of data) {
    const dow = new Date(d.date + 'T00:00:00').getDay();
    if (d.condition !== null) byDay[dow].conditions.push(d.condition);
    if (d.countUpAvg !== null) byDay[dow].cuAvgs.push(d.countUpAvg);
  }

  const dayOfWeek = DAY_NAMES.map((name, i) => {
    const conds = byDay[i].conditions;
    const cuAvgs = byDay[i].cuAvgs;
    return {
      day: name,
      avgCondition:
        conds.length > 0
          ? Math.round((conds.reduce((a, b) => a + b, 0) / conds.length) * 10) / 10
          : 0,
      avgCu:
        cuAvgs.length > 0
          ? Math.round((cuAvgs.reduce((a, b) => a + b, 0) / cuAvgs.length) * 10) / 10
          : 0,
      count: cuAvgs.length,
    };
  });

  const withData = dayOfWeek.filter((d) => d.count > 0);
  if (withData.length === 0) return null;

  const bestDay = withData.reduce((a, b) => (b.avgCu > a.avgCu ? b : a)).day;
  const worstDay = withData.reduce((a, b) => (b.avgCu < a.avgCu ? b : a)).day;

  return { dayOfWeek, bestDay, worstDay };
}

// ==========================================
// 月次トレンド集約
// ==========================================
export function aggregateMonthlyHealthDarts(data: HealthDartsCorrelation[]): MonthlyTrendData[] {
  if (data.length === 0) return [];

  const byMonth: Record<
    string,
    { cuAvgs: number[]; sleeps: number[]; hrvs: number[]; conditions: number[] }
  > = {};

  for (const d of data) {
    const month = d.date.slice(0, 7); // YYYY-MM
    if (!byMonth[month]) byMonth[month] = { cuAvgs: [], sleeps: [], hrvs: [], conditions: [] };
    if (d.countUpAvg !== null) byMonth[month].cuAvgs.push(d.countUpAvg);
    if (d.sleepDurationMinutes !== null) byMonth[month].sleeps.push(d.sleepDurationMinutes / 60);
    if (d.hrvSdnn !== null) byMonth[month].hrvs.push(d.hrvSdnn);
    if (d.condition !== null) byMonth[month].conditions.push(d.condition);
  }

  const avg = (arr: number[]) =>
    arr.length > 0 ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : null;

  return Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, vals]) => ({
      month,
      avgCondition: avg(vals.conditions),
      avgCu: avg(vals.cuAvgs),
      avgSleep: avg(vals.sleeps),
      avgHrv: avg(vals.hrvs),
      count: vals.cuAvgs.length,
    }));
}

// ==========================================
// 睡眠ステージ相関分析
// ==========================================
export function analyzeSleepStageCorrelations(
  data: HealthDartsCorrelation[],
): SleepStageCorrelationResult | null {
  const valid = data.filter(
    (d) =>
      d.countUpAvg !== null &&
      d.sleepDurationMinutes !== null &&
      d.sleepDurationMinutes > 0 &&
      d.sleepDeepMinutes !== null,
  );
  if (valid.length < 5) return null;

  const cuAvgs = valid.map((d) => d.countUpAvg!);
  const deepPcts = valid.map((d) => ((d.sleepDeepMinutes ?? 0) / d.sleepDurationMinutes!) * 100);
  const remPcts = valid.map((d) => ((d.sleepRemMinutes ?? 0) / d.sleepDurationMinutes!) * 100);
  const corePcts = valid.map((d) => ((d.sleepCoreMinutes ?? 0) / d.sleepDurationMinutes!) * 100);

  const avgPct = (arr: number[]) =>
    arr.length > 0 ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : 0;

  return {
    deepSleepR: Math.round(pearsonCorrelation(deepPcts, cuAvgs) * 100) / 100,
    remSleepR: Math.round(pearsonCorrelation(remPcts, cuAvgs) * 100) / 100,
    coreSleepR: Math.round(pearsonCorrelation(corePcts, cuAvgs) * 100) / 100,
    deepSleepPct: avgPct(deepPcts),
    remSleepPct: avgPct(remPcts),
    coreSleepPct: avgPct(corePcts),
    n: valid.length,
  };
}
