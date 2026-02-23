'use client';

import {
  Paper,
  Box,
  Typography,
  Chip,
  LinearProgress,
  Avatar,
  IconButton,
  Tooltip,
  useTheme,
} from '@mui/material';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import AdjustIcon from '@mui/icons-material/Adjust';
import PlaceIcon from '@mui/icons-material/Place';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
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
  cardName?: string;
  cardImageUrl?: string;
  toorina?: string;
  homeShop?: string;
  myAward?: string;
  status?: string;
}

export default function RatingHeroCard({
  rating,
  ratingPrev,
  flight,
  flightColor,
  streak,
  showStreak,
  cardName,
  cardImageUrl,
  toorina,
  homeShop,
  myAward,
  status,
}: RatingHeroCardProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const mapUrl = homeShop
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(homeShop + ' ダーツ')}`
    : null;

  return (
    <Paper
      sx={{
        p: 2,
        mb: 2,
        borderRadius: 3,
        background: `linear-gradient(135deg, ${flightColor}22, ${flightColor}08)`,
        border: `1px solid ${flightColor}44`,
      }}
    >
      {/* プロフィール行 */}
      {cardName && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
          {cardImageUrl ? (
            <Avatar
              src={cardImageUrl}
              alt={cardName}
              sx={{ width: 44, height: 44, border: `2px solid ${flightColor}` }}
            />
          ) : (
            <Avatar sx={{ width: 44, height: 44, bgcolor: flightColor }}>
              <AdjustIcon sx={{ fontSize: 22 }} />
            </Avatar>
          )}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', lineHeight: 1.2 }} noWrap>
                {cardName}
              </Typography>
              {toorina && (
                <Typography variant="caption" sx={{ color: 'text.secondary' }} noWrap>
                  {toorina}
                </Typography>
              )}
              {status && (
                <Chip
                  label={status}
                  size="small"
                  variant="outlined"
                  sx={{ height: 18, fontSize: 10, ml: 0.5 }}
                />
              )}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.2 }}>
              {homeShop && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3, minWidth: 0 }}>
                  <PlaceIcon sx={{ fontSize: 13, color: 'text.secondary', flexShrink: 0 }} />
                  <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: 11 }}>
                    {homeShop}
                  </Typography>
                  {mapUrl && (
                    <Tooltip title="Google Maps で開く">
                      <IconButton
                        size="small"
                        component="a"
                        href={mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ p: 0, ml: -0.3 }}
                      >
                        <PlaceIcon sx={{ fontSize: 13, color: 'primary.main' }} />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              )}
              {myAward && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3, flexShrink: 0 }}>
                  <EmojiEventsIcon sx={{ fontSize: 13, color: '#ffc107' }} />
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>
                    {myAward}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      )}

      {/* フライト + ストリーク */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
        }}
      >
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
