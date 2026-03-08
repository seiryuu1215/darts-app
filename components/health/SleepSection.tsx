'use client';

import { useMemo } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import BedtimeIcon from '@mui/icons-material/Bedtime';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { HealthMetric } from '@/types';
import { CATEGORY_COLORS } from './constants';
import { formatDate, formatMinutesToHM, getTrend } from './utils';
import { HealthCard } from './HealthCard';
import { ChartTooltip } from './ChartTooltip';
import { SleepStageBar } from './SleepStageBar';

export function SleepSection({
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
        hours: m.sleepDurationMinutes ? Math.round((m.sleepDurationMinutes / 60) * 10) / 10 : null,
      })),
    [metrics],
  );

  const color = CATEGORY_COLORS.sleep;
  const sleepHours = latest?.sleepDurationMinutes
    ? Math.round((latest.sleepDurationMinutes / 60) * 10) / 10
    : null;
  const prevSleepHours = previousLatest?.sleepDurationMinutes
    ? Math.round((previousLatest.sleepDurationMinutes / 60) * 10) / 10
    : null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 0.5 }}>
        <BedtimeIcon sx={{ fontSize: 16, color: color.primary }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          睡眠
        </Typography>
      </Box>

      <HealthCard
        icon={<BedtimeIcon sx={{ fontSize: 14, color: color.primary }} />}
        label="睡眠時間"
        value={sleepHours}
        unit="時間"
        trend={getTrend(sleepHours, prevSleepHours)}
        trendGoodDirection="up"
        color={color}
        subLabel={
          latest?.sleepDeepMinutes
            ? `深い睡眠 ${formatMinutesToHM(latest.sleepDeepMinutes)}`
            : undefined
        }
        onClick={() => onDetailOpen('sleep')}
      />

      {latest && (latest.sleepDeepMinutes || latest.sleepRemMinutes) && (
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
            睡眠ステージ
          </Typography>
          <SleepStageBar metric={latest} />
        </Paper>
      )}

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
            睡眠時間の推移
          </Typography>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: '#71717a' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 'dataMax + 1']}
                tick={{ fontSize: 10, fill: '#71717a' }}
                axisLine={false}
                tickLine={false}
                width={24}
              />
              <Tooltip content={<ChartTooltip unit="h" />} />
              <Bar dataKey="hours" radius={[4, 4, 0, 0]} maxBarSize={20}>
                {chartData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.hours !== null && entry.hours < 6 ? '#7c3aed' : '#a78bfa'}
                    fillOpacity={entry.hours !== null && entry.hours < 6 ? 1 : 0.7}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      )}
    </Box>
  );
}
