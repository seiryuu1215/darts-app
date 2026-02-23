'use client';

import { useMemo, useState } from 'react';
import { Paper, Typography, Box, ToggleButton, ToggleButtonGroup } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';

interface DailyRecord {
  date: string;
  rating: number | null;
  stats01Avg: number | null;
  statsCriAvg: number | null;
}

interface PeriodComparisonCardProps {
  dailyHistory: DailyRecord[];
}

type ComparisonMode = 'week' | 'month' | 'first_recent';

const MODES: { key: ComparisonMode; label: string }[] = [
  { key: 'week', label: '先週 vs 今週' },
  { key: 'month', label: '先月 vs 今月' },
  { key: 'first_recent', label: '初期 vs 直近' },
];

interface PeriodStats {
  label: string;
  days: number;
  avgRating: number | null;
  avg01: number | null;
  avgCri: number | null;
}

interface ComparisonResult {
  period1: PeriodStats;
  period2: PeriodStats;
  deltas: {
    label: string;
    value1: number | null;
    value2: number | null;
    delta: number | null;
    suffix: string;
    higherIsBetter: boolean;
  }[];
}

function computePeriodStats(records: DailyRecord[], label: string): PeriodStats {
  const ratings = records.map((r) => r.rating).filter((v): v is number => v != null);
  const o1Avgs = records.map((r) => r.stats01Avg).filter((v): v is number => v != null);
  const criAvgs = records.map((r) => r.statsCriAvg).filter((v): v is number => v != null);

  return {
    label,
    days: records.length,
    avgRating: ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null,
    avg01: o1Avgs.length > 0 ? o1Avgs.reduce((a, b) => a + b, 0) / o1Avgs.length : null,
    avgCri: criAvgs.length > 0 ? criAvgs.reduce((a, b) => a + b, 0) / criAvgs.length : null,
  };
}

function computeComparison(records: DailyRecord[], mode: ComparisonMode): ComparisonResult | null {
  const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));
  if (sorted.length < 4) return null;

  let records1: DailyRecord[];
  let records2: DailyRecord[];
  let label1: string;
  let label2: string;

  const now = new Date();

  switch (mode) {
    case 'week': {
      const thisWeekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const lastWeekStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      const thisWeekStr = thisWeekStart.toISOString().split('T')[0];
      const lastWeekStr = lastWeekStart.toISOString().split('T')[0];
      records1 = sorted.filter((r) => r.date >= lastWeekStr && r.date < thisWeekStr);
      records2 = sorted.filter((r) => r.date >= thisWeekStr);
      label1 = '先週';
      label2 = '今週';
      break;
    }
    case 'month': {
      const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonth = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;
      records1 = sorted.filter((r) => r.date.startsWith(lastMonth));
      records2 = sorted.filter((r) => r.date.startsWith(thisMonth));
      label1 = '先月';
      label2 = '今月';
      break;
    }
    case 'first_recent': {
      const quarter = Math.floor(sorted.length / 4);
      if (quarter < 2) return null;
      records1 = sorted.slice(0, quarter);
      records2 = sorted.slice(-quarter);
      label1 = `初期${quarter}日`;
      label2 = `直近${quarter}日`;
      break;
    }
  }

  if (records1.length === 0 || records2.length === 0) return null;

  const period1 = computePeriodStats(records1, label1);
  const period2 = computePeriodStats(records2, label2);

  const deltas = [
    {
      label: 'Rating',
      value1: period1.avgRating,
      value2: period2.avgRating,
      delta:
        period1.avgRating != null && period2.avgRating != null
          ? period2.avgRating - period1.avgRating
          : null,
      suffix: '',
      higherIsBetter: true,
    },
    {
      label: '01 Avg',
      value1: period1.avg01,
      value2: period2.avg01,
      delta: period1.avg01 != null && period2.avg01 != null ? period2.avg01 - period1.avg01 : null,
      suffix: ' PPD',
      higherIsBetter: true,
    },
    {
      label: 'Cri Avg',
      value1: period1.avgCri,
      value2: period2.avgCri,
      delta:
        period1.avgCri != null && period2.avgCri != null ? period2.avgCri - period1.avgCri : null,
      suffix: ' MPR',
      higherIsBetter: true,
    },
  ];

  return { period1, period2, deltas };
}

function DeltaIndicator({
  delta,
  suffix,
  higherIsBetter,
}: {
  delta: number | null;
  suffix: string;
  higherIsBetter: boolean;
}) {
  if (delta == null)
    return (
      <Typography variant="body2" color="text.secondary">
        --
      </Typography>
    );

  const positive = higherIsBetter ? delta > 0 : delta < 0;
  const color = Math.abs(delta) < 0.01 ? '#888' : positive ? '#4caf50' : '#f44336';
  const Icon = delta > 0.01 ? TrendingUpIcon : delta < -0.01 ? TrendingDownIcon : TrendingFlatIcon;

  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.3, color }}>
      <Icon sx={{ fontSize: 16 }} />
      <Typography variant="body2" sx={{ fontWeight: 'bold', color }}>
        {delta > 0 ? '+' : ''}
        {delta.toFixed(2)}
        {suffix}
      </Typography>
    </Box>
  );
}

export default function PeriodComparisonCard({ dailyHistory }: PeriodComparisonCardProps) {
  const [mode, setMode] = useState<ComparisonMode>('week');

  const comparison = useMemo(() => computeComparison(dailyHistory, mode), [dailyHistory, mode]);

  if (!comparison && mode !== 'week') return null;

  return (
    <Paper sx={{ p: 2, borderRadius: 2, flex: 1, minWidth: 0 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
        期間対比
      </Typography>

      <ToggleButtonGroup
        value={mode}
        exclusive
        onChange={(_, v) => v && setMode(v as ComparisonMode)}
        size="small"
        sx={{ mb: 1.5, flexWrap: 'wrap' }}
      >
        {MODES.map((m) => (
          <ToggleButton
            key={m.key}
            value={m.key}
            sx={{ fontSize: 11, px: 1.2, py: 0.4, textTransform: 'none' }}
          >
            {m.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      {comparison ? (
        <Box>
          {/* ヘッダー行 */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '80px 1fr 1fr 1fr',
              gap: 1,
              mb: 0.5,
            }}
          >
            <Box />
            <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
              {comparison.period1.label} ({comparison.period1.days}日)
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
              {comparison.period2.label} ({comparison.period2.days}日)
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
              変化
            </Typography>
          </Box>

          {/* データ行 */}
          {comparison.deltas.map((d) => (
            <Box
              key={d.label}
              sx={{
                display: 'grid',
                gridTemplateColumns: '80px 1fr 1fr 1fr',
                gap: 1,
                py: 0.8,
                borderTop: '1px solid #222',
                alignItems: 'center',
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                {d.label}
              </Typography>
              <Typography variant="body2" sx={{ textAlign: 'center' }}>
                {d.value1 != null ? d.value1.toFixed(2) : '--'}
              </Typography>
              <Typography variant="body2" sx={{ textAlign: 'center' }}>
                {d.value2 != null ? d.value2.toFixed(2) : '--'}
              </Typography>
              <Box sx={{ textAlign: 'center' }}>
                <DeltaIndicator
                  delta={d.delta}
                  suffix={d.suffix}
                  higherIsBetter={d.higherIsBetter}
                />
              </Box>
            </Box>
          ))}
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
          この期間のデータが不足しています
        </Typography>
      )}
    </Paper>
  );
}
