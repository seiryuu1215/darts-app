'use client';

import { Paper, Box, Typography, Chip } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';

interface StatsHistoryRecord {
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

interface RatingTrendCardProps {
  periodRecords: StatsHistoryRecord[];
  currentRating: number | null;
}

const MIN_RECORDS = 7;
const SLOPE_THRESHOLD = 0.02;

type Trend = 'rising' | 'stable' | 'declining';

const TREND_DISPLAY: Record<
  Trend,
  { label: string; color: 'success' | 'info' | 'error'; icon: React.ReactNode }
> = {
  rising: { label: '上昇中', color: 'success', icon: <TrendingUpIcon sx={{ fontSize: 16 }} /> },
  stable: { label: '安定', color: 'info', icon: <TrendingFlatIcon sx={{ fontSize: 16 }} /> },
  declining: {
    label: '低下傾向',
    color: 'error',
    icon: <TrendingDownIcon sx={{ fontSize: 16 }} />,
  },
};

/**
 * 最小二乗法で線形回帰の傾きを算出
 * x: 0-indexed day, y: rating
 */
function linearSlope(points: { x: number; y: number }[]): number {
  const n = points.length;
  if (n < 2) return 0;
  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumX2 = points.reduce((s, p) => s + p.x * p.x, 0);
  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return 0;
  return (n * sumXY - sumX * sumY) / denom;
}

export default function RatingTrendCard({ periodRecords, currentRating }: RatingTrendCardProps) {
  if (currentRating == null) return null;

  const withRating = periodRecords.filter((r) => r.rating != null);
  if (withRating.length < MIN_RECORDS) return null;

  // 直近14件で日次線形回帰
  const recent = withRating.slice(-14);
  const baseDate = new Date(recent[0].date).getTime();
  const MS_PER_DAY = 86400000;

  const points = recent.map((r) => ({
    x: (new Date(r.date).getTime() - baseDate) / MS_PER_DAY,
    y: r.rating!,
  }));

  const slope = linearSlope(points);

  let trend: Trend;
  if (slope > SLOPE_THRESHOLD) trend = 'rising';
  else if (slope < -SLOPE_THRESHOLD) trend = 'declining';
  else trend = 'stable';

  const display = TREND_DISPLAY[trend];

  // 直近14件の変化量
  const totalChange = recent[recent.length - 1].rating! - recent[0].rating!;

  // 次の整数Rtまでの推定日数
  const nextIntRt = Math.ceil(currentRating);
  const gapToNext = nextIntRt - currentRating;
  let estimatedDays: number | null = null;
  if (slope > 0.005 && gapToNext > 0) {
    estimatedDays = Math.ceil(gapToNext / slope);
  }

  return (
    <Paper sx={{ p: 2, mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
          レーティングトレンド
        </Typography>
        <Chip
          icon={display.icon as React.ReactElement}
          label={display.label}
          color={display.color}
          size="small"
          variant="outlined"
        />
      </Box>

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Paper variant="outlined" sx={{ flex: 1, minWidth: 80, p: 1.5, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            日次変化量
          </Typography>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 'bold',
              color: slope > 0 ? '#4caf50' : slope < 0 ? '#f44336' : 'text.primary',
            }}
          >
            {slope >= 0 ? '+' : ''}
            {slope.toFixed(3)}/日
          </Typography>
        </Paper>
        <Paper variant="outlined" sx={{ flex: 1, minWidth: 80, p: 1.5, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            直近{recent.length}日間
          </Typography>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 'bold',
              color: totalChange > 0 ? '#4caf50' : totalChange < 0 ? '#f44336' : 'text.primary',
            }}
          >
            {totalChange >= 0 ? '+' : ''}
            {totalChange.toFixed(2)}
          </Typography>
        </Paper>
        {estimatedDays != null && estimatedDays <= 365 && (
          <Paper variant="outlined" sx={{ flex: 1, minWidth: 80, p: 1.5, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Rt.{nextIntRt}まで
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
              {estimatedDays <= 1 ? '1日以内' : `約${estimatedDays}日`}
            </Typography>
          </Paper>
        )}
      </Box>
    </Paper>
  );
}
