'use client';

import { Box, Paper, Typography } from '@mui/material';
import { COLOR_01, COLOR_CRICKET, COLOR_COUNTUP } from '@/lib/dartslive-colors';
import { DiffLabel } from './RatingHeroCard';
import PercentileChip from './PercentileChip';

interface GameStatsCardsProps {
  stats01Avg: number | null;
  stats01Best: number | null;
  statsCriAvg: number | null;
  statsCriBest: number | null;
  statsPraAvg: number | null;
  statsPraBest: number | null;
  prev01Avg: number | null;
  prevCriAvg: number | null;
  prevPraAvg: number | null;
  expectedCountUp: number | null;
}

export default function GameStatsCards({
  stats01Avg,
  stats01Best,
  statsCriAvg,
  statsCriBest,
  statsPraAvg,
  statsPraBest,
  prev01Avg,
  prevCriAvg,
  prevPraAvg,
  expectedCountUp,
}: GameStatsCardsProps) {
  return (
    <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
      {/* 01 */}
      <Paper sx={{ flex: 1, p: 1.5, borderRadius: 2, borderTop: `3px solid ${COLOR_01}` }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" sx={{ color: COLOR_01, fontWeight: 'bold' }}>
            01 GAMES
          </Typography>
          {stats01Avg != null && <PercentileChip type="ppd" value={stats01Avg} />}
        </Box>
        <Typography variant="h5" sx={{ fontWeight: 'bold', mt: 0.5 }}>
          {stats01Avg?.toFixed(2) ?? '--'}
        </Typography>
        <DiffLabel current={stats01Avg} prev={prev01Avg} />
        {stats01Best != null && (
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
            BEST: {stats01Best.toFixed(2)}
          </Typography>
        )}
      </Paper>
      {/* Cricket */}
      <Paper sx={{ flex: 1, p: 1.5, borderRadius: 2, borderTop: `3px solid ${COLOR_CRICKET}` }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" sx={{ color: COLOR_CRICKET, fontWeight: 'bold' }}>
            CRICKET
          </Typography>
          {statsCriAvg != null && <PercentileChip type="mpr" value={statsCriAvg} />}
        </Box>
        <Typography variant="h5" sx={{ fontWeight: 'bold', mt: 0.5 }}>
          {statsCriAvg?.toFixed(2) ?? '--'}
        </Typography>
        <DiffLabel current={statsCriAvg} prev={prevCriAvg} />
        {statsCriBest != null && (
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
            BEST: {statsCriBest.toFixed(2)}
          </Typography>
        )}
      </Paper>
      {/* COUNT-UP */}
      <Paper sx={{ flex: 1, p: 1.5, borderRadius: 2, borderTop: `3px solid ${COLOR_COUNTUP}` }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" sx={{ color: COLOR_COUNTUP, fontWeight: 'bold' }}>
            COUNT-UP
          </Typography>
          {statsPraAvg != null && <PercentileChip type="countup" value={statsPraAvg} />}
        </Box>
        <Typography variant="h5" sx={{ fontWeight: 'bold', mt: 0.5 }}>
          {statsPraAvg?.toFixed(0) ?? '--'}
        </Typography>
        <DiffLabel current={statsPraAvg} prev={prevPraAvg} fixed={0} />
        {statsPraBest != null && (
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
            BEST: {statsPraBest.toFixed(0)}
          </Typography>
        )}
        {expectedCountUp != null && (
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
            期待値: {expectedCountUp}
          </Typography>
        )}
      </Paper>
    </Box>
  );
}
