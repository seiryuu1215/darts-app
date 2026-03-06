import type { HealthMetric, HealthInsight, HealthDartsCorrelation } from '@/types';

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
  dartsMetric: 'ppd' | 'mpr';
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
    for (const dartsMetric of ['ppd', 'mpr'] as const) {
      const dartsLabel = dartsMetric === 'ppd' ? 'PPD' : 'MPR';

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
