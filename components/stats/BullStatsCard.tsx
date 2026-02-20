'use client';

import { Paper, Box, Typography } from '@mui/material';
import AdjustIcon from '@mui/icons-material/Adjust';
import PercentileChip from './PercentileChip';

interface BullStatsCardProps {
  awards: Record<string, { monthly: number; total: number }>;
}

export default function BullStatsCard({ awards }: BullStatsCardProps) {
  const dBull = awards['D-BULL'] ?? { monthly: 0, total: 0 };
  const sBull = awards['S-BULL'] ?? { monthly: 0, total: 0 };
  const totalBulls = dBull.total + sBull.total;

  if (totalBulls === 0) return null;

  const dBullRate = ((dBull.total / totalBulls) * 100).toFixed(1);

  const DBULL_COLOR = '#FFB300';
  const SBULL_COLOR = '#90A4AE';

  return (
    <Paper sx={{ p: 2, mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.5 }}>
        <AdjustIcon sx={{ fontSize: 18, color: DBULL_COLOR }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', flex: 1 }}>
          ブル統計
        </Typography>
        <PercentileChip type="bull" value={totalBulls} />
      </Box>

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Paper
          variant="outlined"
          sx={{ flex: '1 1 auto', minWidth: 90, p: 1.5, textAlign: 'center' }}
        >
          <Typography variant="caption" sx={{ color: DBULL_COLOR, fontWeight: 'bold' }}>
            D-BULL率
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            {dBullRate}%
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {dBull.total.toLocaleString()} / {totalBulls.toLocaleString()}
          </Typography>
        </Paper>
        <Paper
          variant="outlined"
          sx={{ flex: '1 1 auto', minWidth: 90, p: 1.5, textAlign: 'center' }}
        >
          <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
            累計ブル
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            {totalBulls.toLocaleString()}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            今月 {dBull.monthly + sBull.monthly}
          </Typography>
        </Paper>
        <Paper
          variant="outlined"
          sx={{ flex: '1 1 auto', minWidth: 90, p: 1.5, textAlign: 'center' }}
        >
          <Typography variant="caption" sx={{ color: SBULL_COLOR, fontWeight: 'bold' }}>
            S-BULL
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            {sBull.total.toLocaleString()}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            今月 {sBull.monthly}
          </Typography>
        </Paper>
      </Box>
    </Paper>
  );
}
