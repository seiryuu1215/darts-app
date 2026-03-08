'use client';

import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';

export function TrendIcon({
  trend,
  goodDirection = 'up',
}: {
  trend: 'up' | 'down' | 'flat' | null;
  goodDirection?: 'up' | 'down';
}) {
  if (!trend || trend === 'flat')
    return <TrendingFlatIcon sx={{ fontSize: 14, color: '#71717a' }} />;
  const isGood = trend === goodDirection;
  const color = isGood ? '#22c55e' : '#ef4444';
  if (trend === 'up') return <TrendingUpIcon sx={{ fontSize: 14, color }} />;
  return <TrendingDownIcon sx={{ fontSize: 14, color }} />;
}
