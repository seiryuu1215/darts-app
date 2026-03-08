'use client';

import { useMemo } from 'react';
import { Box, Paper, Typography, Drawer, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
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
import { formatDate } from './utils';
import { ChartTooltip } from './ChartTooltip';

export function DetailDrawer({
  open,
  onClose,
  type,
  metrics,
}: {
  open: boolean;
  onClose: () => void;
  type: string;
  metrics: HealthMetric[];
}) {
  const config = useMemo(() => {
    switch (type) {
      case 'rhr':
        return {
          title: '安静時心拍',
          color: '#ef4444',
          unit: 'bpm',
          getValue: (m: HealthMetric) => m.restingHr,
        };
      case 'hrv':
        return {
          title: 'HRV (SDNN)',
          color: '#ef4444',
          unit: 'ms',
          getValue: (m: HealthMetric) => m.hrvSdnn,
        };
      case 'sleep':
        return {
          title: '睡眠時間',
          color: '#a78bfa',
          unit: 'h',
          getValue: (m: HealthMetric) =>
            m.sleepDurationMinutes ? Math.round((m.sleepDurationMinutes / 60) * 10) / 10 : null,
        };
      case 'steps':
        return {
          title: '歩数',
          color: '#22c55e',
          unit: '歩',
          getValue: (m: HealthMetric) => m.steps,
        };
      case 'calories':
        return {
          title: 'アクティブカロリー',
          color: '#22c55e',
          unit: 'kcal',
          getValue: (m: HealthMetric) =>
            m.activeEnergyKcal ? Math.round(m.activeEnergyKcal) : null,
        };
      default:
        return { title: '', color: '#fff', unit: '', getValue: () => null };
    }
  }, [type]);

  const chartData = useMemo(
    () =>
      [...metrics]
        .reverse()
        .map((m) => ({ date: formatDate(m.metricDate), value: config.getValue(m) })),
    [metrics, config],
  );

  const values = chartData.map((d) => d.value).filter((v): v is number => v !== null);
  const avg =
    values.length > 0
      ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10
      : null;
  const min = values.length > 0 ? Math.min(...values) : null;
  const max = values.length > 0 ? Math.max(...values) : null;

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '80vh' } }}
    >
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            {config.title}
          </Typography>
          <IconButton size="small" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          {[
            { label: '平均', value: avg },
            { label: '最小', value: min },
            { label: '最大', value: max },
          ].map((stat) => (
            <Paper key={stat.label} variant="outlined" sx={{ flex: 1, p: 1, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                {stat.label}
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                {stat.value !== null ? stat.value.toLocaleString() : '--'}
              </Typography>
            </Paper>
          ))}
        </Box>

        {chartData.length > 0 && (
          <Box sx={{ width: '100%', height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="detailGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={config.color} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={config.color} stopOpacity={0} />
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
                  tick={{ fontSize: 10, fill: '#71717a' }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                />
                <Tooltip content={<ChartTooltip unit={config.unit} />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={config.color}
                  fill="url(#detailGradient)"
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        )}
      </Box>
    </Drawer>
  );
}
