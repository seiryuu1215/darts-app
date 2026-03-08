'use client';

import { Box, Paper, Typography } from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { TrendIcon } from './TrendIcon';

export function HealthCard({
  icon,
  label,
  value,
  unit,
  trend,
  trendGoodDirection = 'up',
  color,
  subLabel,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number | null;
  unit: string;
  trend?: 'up' | 'down' | 'flat' | null;
  trendGoodDirection?: 'up' | 'down';
  color: { primary: string; bg: string };
  subLabel?: string;
  onClick?: () => void;
}) {
  return (
    <Paper
      onClick={onClick}
      sx={{
        p: 1.5,
        borderRadius: 2,
        border: '1px solid',
        borderColor: `${color.primary}20`,
        bgcolor: 'rgba(24,24,27,0.8)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.1s',
        '&:active': onClick ? { transform: 'scale(0.98)' } : {},
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Box
            sx={{
              borderRadius: 1,
              p: 0.5,
              bgcolor: color.bg,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {icon}
          </Box>
          <Typography variant="caption" sx={{ fontSize: 11, color: '#a1a1aa', fontWeight: 500 }}>
            {label}
          </Typography>
        </Box>
        {trend && <TrendIcon trend={trend} goodDirection={trendGoodDirection} />}
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, color: '#fafafa' }}>
          {value ?? '--'}
        </Typography>
        <Typography variant="caption" sx={{ color: '#71717a' }}>
          {unit}
        </Typography>
      </Box>
      {subLabel && (
        <Typography variant="caption" sx={{ fontSize: 11, color: '#71717a', mt: 0.25 }}>
          {subLabel}
        </Typography>
      )}
      {onClick && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5 }}>
          <ChevronRightIcon sx={{ fontSize: 14, color: '#52525b' }} />
        </Box>
      )}
    </Paper>
  );
}
