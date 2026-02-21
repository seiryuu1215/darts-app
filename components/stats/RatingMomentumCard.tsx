'use client';

import { Paper, Box, Typography, Chip } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import PauseIcon from '@mui/icons-material/Pause';

interface RatingMomentumCardProps {
  monthlyRatings: { month: string; value: number }[];
  currentRating: number | null;
}

type Momentum = 'rising' | 'stable' | 'declining' | 'stagnant';

function classifyMomentum(deltas: number[]): Momentum {
  if (deltas.length === 0) return 'stagnant';
  const avg = deltas.reduce((a, b) => a + b, 0) / deltas.length;
  const recentPositive = deltas.filter((d) => d > 0).length;

  if (avg > 0.1 && recentPositive >= deltas.length * 0.6) return 'rising';
  if (avg < -0.1 && recentPositive <= deltas.length * 0.4) return 'declining';
  if (Math.abs(avg) <= 0.1) return 'stable';
  return 'stagnant';
}

const MOMENTUM_DISPLAY: Record<
  Momentum,
  { label: string; color: 'success' | 'info' | 'error' | 'default'; icon: React.ReactNode }
> = {
  rising: { label: '上昇中', color: 'success', icon: <TrendingUpIcon sx={{ fontSize: 16 }} /> },
  stable: { label: '安定', color: 'info', icon: <TrendingFlatIcon sx={{ fontSize: 16 }} /> },
  declining: {
    label: '低下傾向',
    color: 'error',
    icon: <TrendingDownIcon sx={{ fontSize: 16 }} />,
  },
  stagnant: { label: '停滞', color: 'default', icon: <PauseIcon sx={{ fontSize: 16 }} /> },
};

export default function RatingMomentumCard({
  monthlyRatings,
  currentRating,
}: RatingMomentumCardProps) {
  if (!monthlyRatings || monthlyRatings.length < 2 || currentRating == null) return null;

  // 直近4ヶ月のデータ
  const recent = monthlyRatings.slice(-4);
  const deltas: number[] = [];
  for (let i = 1; i < recent.length; i++) {
    deltas.push(recent[i].value - recent[i - 1].value);
  }

  const momentum = classifyMomentum(deltas);
  const display = MOMENTUM_DISPLAY[momentum];
  const avgChange = deltas.length > 0 ? deltas.reduce((a, b) => a + b, 0) / deltas.length : 0;

  // 次の整数Rtまでの推定期間
  const nextIntRt = Math.ceil(currentRating);
  const gapToNext = nextIntRt - currentRating;
  let estimatedMonths: number | null = null;
  if (avgChange > 0.01 && gapToNext > 0) {
    estimatedMonths = Math.ceil(gapToNext / avgChange);
  }

  return (
    <Paper sx={{ p: 2, mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
          レーティングモメンタム
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
        <Paper variant="outlined" sx={{ flex: 1, minWidth: 100, p: 1.5, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            月平均変化
          </Typography>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 'bold',
              color: avgChange > 0 ? '#4caf50' : avgChange < 0 ? '#f44336' : 'text.primary',
            }}
          >
            {avgChange >= 0 ? '+' : ''}
            {avgChange.toFixed(2)}
          </Typography>
        </Paper>
        <Paper variant="outlined" sx={{ flex: 1, minWidth: 100, p: 1.5, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            直近{recent.length}ヶ月
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            {recent.length > 1
              ? `${recent[recent.length - 1].value - recent[0].value >= 0 ? '+' : ''}${(recent[recent.length - 1].value - recent[0].value).toFixed(2)}`
              : '--'}
          </Typography>
        </Paper>
        {estimatedMonths != null && estimatedMonths <= 24 && (
          <Paper variant="outlined" sx={{ flex: 1, minWidth: 100, p: 1.5, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Rt.{nextIntRt}まで
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
              {estimatedMonths <= 1 ? '1ヶ月以内' : `約${estimatedMonths}ヶ月`}
            </Typography>
          </Paper>
        )}
      </Box>
    </Paper>
  );
}
