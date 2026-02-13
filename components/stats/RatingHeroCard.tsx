'use client';

import { Paper, Box, Typography, Chip, LinearProgress, useTheme } from '@mui/material';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import PercentileChip from './PercentileChip';

interface DiffLabelProps {
  current: number | null | undefined;
  prev: number | null | undefined;
  fixed?: number;
}

function DiffLabel({ current, prev, fixed = 2 }: DiffLabelProps) {
  if (current == null || prev == null) return null;
  const diff = current - prev;
  if (diff === 0)
    return (
      <Typography component="span" variant="caption" sx={{ color: 'text.secondary', ml: 0.5 }}>
        ±0
      </Typography>
    );
  const color = diff > 0 ? '#4caf50' : '#f44336';
  return (
    <Typography component="span" variant="caption" sx={{ color, ml: 0.5, fontWeight: 'bold' }}>
      {diff > 0 ? '+' : ''}
      {diff.toFixed(fixed)}
    </Typography>
  );
}

export { DiffLabel };

interface RatingHeroCardProps {
  rating: number | null;
  ratingPrev: number | null;
  flight: string;
  flightColor: string;
  streak: number;
  showStreak: boolean;
}

export default function RatingHeroCard({
  rating,
  ratingPrev,
  flight,
  flightColor,
  streak,
  showStreak,
}: RatingHeroCardProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Paper
      sx={{
        p: 2.5,
        mb: 2,
        borderRadius: 3,
        background: `linear-gradient(135deg, ${flightColor}22, ${flightColor}08)`,
        border: `1px solid ${flightColor}44`,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            label={`FLIGHT ${flight}`}
            sx={{
              bgcolor: flightColor,
              color: '#fff',
              fontWeight: 'bold',
              fontSize: '0.9rem',
              height: 32,
            }}
          />
          {showStreak && streak > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
              <WhatshotIcon sx={{ fontSize: 16, color: '#ff6d00' }} />
              <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#ff6d00' }}>
                {streak}日連続
              </Typography>
            </Box>
          )}
        </Box>
        {rating != null && <PercentileChip type="rating" value={rating} />}
      </Box>

      {/* レーティング */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mt: 1 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
            <Typography variant="h3" sx={{ fontWeight: 'bold', color: flightColor, lineHeight: 1 }}>
              {rating?.toFixed(2) ?? '--'}
            </Typography>
            <DiffLabel current={rating} prev={ratingPrev} />
          </Box>
          <Typography variant="caption" color="text.secondary">
            RATING
          </Typography>
        </Box>
      </Box>

      {/* レーティング進捗バー */}
      {rating != null &&
        (() => {
          const currentRt = rating;
          const floorRt = Math.floor(currentRt);
          const nextRt = floorRt + 1;
          const progress = (currentRt - floorRt) * 100;
          return (
            <Box sx={{ mt: 1.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}>
                <Typography variant="caption" color="text.secondary">
                  Rt.{floorRt}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 'bold', color: flightColor }}>
                  {progress.toFixed(0)}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Rt.{nextRt}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                  '& .MuiLinearProgress-bar': { bgcolor: flightColor, borderRadius: 3 },
                }}
              />
            </Box>
          );
        })()}
    </Paper>
  );
}
