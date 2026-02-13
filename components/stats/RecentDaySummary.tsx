'use client';

import { Paper, Box, Typography } from '@mui/material';
import { COLOR_01, COLOR_CRICKET, COLOR_COUNTUP } from '@/lib/dartslive-colors';

interface DayStats {
  best01: number | null;
  bestCri: number | null;
  bestCountUp: number | null;
  avg01: number | null;
  avgCri: number | null;
  avgCountUp: number | null;
}

interface RecentDaySummaryProps {
  dayStats: DayStats;
  shops: string[];
}

export default function RecentDaySummary({ dayStats, shops }: RecentDaySummaryProps) {
  if (dayStats.avg01 === null) return null;

  return (
    <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
        直近プレイ日
      </Typography>
      {shops.length > 0 && (
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
          {shops.join(' → ')}
        </Typography>
      )}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="caption" sx={{ color: COLOR_01 }}>
            01 AVG / BEST
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            {dayStats.avg01?.toFixed(2)} / {dayStats.best01?.toFixed(2)}
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption" sx={{ color: COLOR_CRICKET }}>
            Cricket AVG / BEST
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            {dayStats.avgCri?.toFixed(2)} / {dayStats.bestCri?.toFixed(2)}
          </Typography>
        </Box>
        {dayStats.avgCountUp !== null && (
          <Box>
            <Typography variant="caption" sx={{ color: COLOR_COUNTUP }}>
              COUNT-UP AVG / BEST
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
              {dayStats.avgCountUp?.toFixed(0)} / {dayStats.bestCountUp}
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
}
