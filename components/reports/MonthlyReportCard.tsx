'use client';

import { Paper, Box, Typography, Chip } from '@mui/material';

interface MonthlyReportCardProps {
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

export default function MonthlyReportCard({
  periodLabel,
  playDays,
  totalGames,
  ratingChange,
  avgPpd,
  avgMpr,
  bestDay,
  worstDay,
  awardsHighlights,
  goalsAchieved,
  goalsActive,
  xpGained,
}: MonthlyReportCardProps) {
  return (
    <Paper sx={{ p: 2, mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
          {periodLabel}
        </Typography>
        <Chip
          label="Monthly"
          size="small"
          sx={{ bgcolor: '#E65100', color: '#fff', fontWeight: 'bold', fontSize: 11 }}
        />
      </Box>

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1.5 }}>
        <Paper variant="outlined" sx={{ flex: 1, minWidth: 70, p: 1, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">プレイ日数</Typography>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{playDays}日</Typography>
        </Paper>
        <Paper variant="outlined" sx={{ flex: 1, minWidth: 70, p: 1, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">ゲーム数</Typography>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{totalGames}</Typography>
        </Paper>
        {ratingChange != null && (
          <Paper variant="outlined" sx={{ flex: 1, minWidth: 70, p: 1, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">Rating変動</Typography>
            <Typography
              variant="body1"
              sx={{
                fontWeight: 'bold',
                color: ratingChange > 0 ? '#4caf50' : ratingChange < 0 ? '#e53935' : 'text.primary',
              }}
            >
              {ratingChange > 0 ? '+' : ''}{ratingChange.toFixed(2)}
            </Typography>
          </Paper>
        )}
      </Box>

      {/* PPD / MPR */}
      {(avgPpd != null || avgMpr != null) && (
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1.5 }}>
          {avgPpd != null && (
            <Paper variant="outlined" sx={{ flex: 1, minWidth: 80, p: 1, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">PPD</Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{avgPpd.toFixed(2)}</Typography>
            </Paper>
          )}
          {avgMpr != null && (
            <Paper variant="outlined" sx={{ flex: 1, minWidth: 80, p: 1, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">MPR</Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{avgMpr.toFixed(2)}</Typography>
            </Paper>
          )}
        </Box>
      )}

      {/* Best / Worst day */}
      {bestDay && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
          ベスト: {bestDay.date} (Rt.{bestDay.rating.toFixed(2)})
        </Typography>
      )}
      {worstDay && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          ワースト: {worstDay.date} (Rt.{worstDay.rating.toFixed(2)})
        </Typography>
      )}

      {/* Awards */}
      {awardsHighlights.length > 0 && (
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
          {awardsHighlights.map((a) => (
            <Chip
              key={a.label}
              label={`${a.label} +${a.count}`}
              size="small"
              variant="outlined"
              sx={{ fontSize: 11 }}
            />
          ))}
        </Box>
      )}

      {/* Goals & XP */}
      <Box sx={{ display: 'flex', gap: 2 }}>
        {(goalsAchieved > 0 || goalsActive > 0) && (
          <Typography variant="caption" color="text.secondary">
            目標: {goalsAchieved}達成 / {goalsActive}進行中
          </Typography>
        )}
        {xpGained > 0 && (
          <Typography variant="caption" sx={{ color: '#4caf50' }}>
            XP +{xpGained}
          </Typography>
        )}
      </Box>
    </Paper>
  );
}
