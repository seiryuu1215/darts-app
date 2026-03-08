'use client';

import { useMemo } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { HealthMetric } from '@/types';
import { CATEGORY_COLORS } from './constants';
import { formatDate, getTrend } from './utils';
import { HealthCard } from './HealthCard';
import { ChartTooltip } from './ChartTooltip';

export function HeartSection({
  metrics,
  latest,
  previousLatest,
  onDetailOpen,
}: {
  metrics: HealthMetric[];
  latest: HealthMetric | null;
  previousLatest: HealthMetric | null;
  onDetailOpen: (type: string) => void;
}) {
  const chartData = useMemo(
    () =>
      [...metrics].reverse().map((m) => ({
        date: formatDate(m.metricDate),
        rhr: m.restingHr,
        hrv: m.hrvSdnn,
      })),
    [metrics],
  );

  const color = CATEGORY_COLORS.heart;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 0.5 }}>
        <FavoriteIcon sx={{ fontSize: 16, color: color.primary }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          心臓
        </Typography>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
        <HealthCard
          icon={<FavoriteIcon sx={{ fontSize: 14, color: color.primary }} />}
          label="安静時心拍"
          value={latest?.restingHr ?? null}
          unit="bpm"
          trend={getTrend(latest?.restingHr ?? null, previousLatest?.restingHr ?? null)}
          trendGoodDirection="down"
          color={color}
          onClick={() => onDetailOpen('rhr')}
        />
        <HealthCard
          icon={<MonitorHeartIcon sx={{ fontSize: 14, color: color.primary }} />}
          label="HRV"
          value={latest?.hrvSdnn ?? null}
          unit="ms"
          trend={getTrend(latest?.hrvSdnn ?? null, previousLatest?.hrvSdnn ?? null)}
          trendGoodDirection="up"
          color={color}
          onClick={() => onDetailOpen('hrv')}
        />
      </Box>

      {chartData.length > 1 && (
        <Paper
          sx={{
            p: 1.5,
            borderRadius: 2,
            border: '1px solid rgba(255,255,255,0.05)',
            bgcolor: 'rgba(24,24,27,0.8)',
          }}
        >
          <Typography
            variant="caption"
            sx={{ fontSize: 11, color: '#71717a', mb: 1, display: 'block' }}
          >
            安静時心拍の推移
          </Typography>
          <ResponsiveContainer width="100%" height={120}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="rhrGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: '#71717a' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={['dataMin - 5', 'dataMax + 5']}
                tick={{ fontSize: 10, fill: '#71717a' }}
                axisLine={false}
                tickLine={false}
                width={30}
              />
              <Tooltip content={<ChartTooltip unit="bpm" />} />
              <Area
                type="monotone"
                dataKey="rhr"
                stroke="#ef4444"
                fill="url(#rhrGradient)"
                strokeWidth={2}
                dot={false}
                connectNulls
              />
            </AreaChart>
          </ResponsiveContainer>
        </Paper>
      )}
    </Box>
  );
}
