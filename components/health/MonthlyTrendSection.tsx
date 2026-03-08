'use client';

import { useMemo } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { HealthDartsCorrelation } from '@/types';
import { aggregateMonthlyHealthDarts } from '@/lib/health-analytics';

export function MonthlyTrendSection({
  correlationData,
}: {
  correlationData: HealthDartsCorrelation[];
}) {
  const trendData = useMemo(() => aggregateMonthlyHealthDarts(correlationData), [correlationData]);

  if (trendData.length < 2) return null;

  const chartData = trendData.map((d) => ({
    month: d.month.slice(5),
    cu: d.avgCu,
    condition: d.avgCondition,
  }));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 0.5 }}>
        <TrendingUpIcon sx={{ fontSize: 16, color: '#8b5cf6' }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          月次トレンド
        </Typography>
      </Box>

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
          コンディション vs CU平均 (月別)
        </Typography>
        <ResponsiveContainer width="100%" height={160}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 10, fill: '#71717a' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 10, fill: '#71717a' }}
              axisLine={false}
              tickLine={false}
              width={30}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 10, fill: '#71717a' }}
              axisLine={false}
              tickLine={false}
              width={30}
            />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Bar
              yAxisId="left"
              dataKey="condition"
              name="コンディション"
              fill="#8b5cf6"
              fillOpacity={0.5}
              radius={[4, 4, 0, 0]}
              maxBarSize={20}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="cu"
              name="CU平均"
              stroke="#22c55e"
              strokeWidth={2}
              dot={{ r: 3 }}
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
      </Paper>
    </Box>
  );
}
