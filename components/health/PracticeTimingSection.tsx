'use client';

import { useMemo } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
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
import type { HealthDartsCorrelation } from '@/types';
import { analyzePracticeTimingPatterns } from '@/lib/health-analytics';
import { ChartTooltip } from './ChartTooltip';

export function PracticeTimingSection({
  correlationData,
}: {
  correlationData: HealthDartsCorrelation[];
}) {
  const result = useMemo(() => analyzePracticeTimingPatterns(correlationData), [correlationData]);

  if (!result) return null;

  const chartData = result.dayOfWeek.map((d) => ({
    day: d.day,
    cu: d.avgCu,
    condition: d.avgCondition,
  }));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 0.5 }}>
        <CalendarTodayIcon sx={{ fontSize: 16, color: '#3b82f6' }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          練習タイミング分析
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
          曜日別CU平均スコア
        </Typography>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 11, fill: '#a1a1aa' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#71717a' }}
              axisLine={false}
              tickLine={false}
              width={30}
            />
            <Tooltip content={<ChartTooltip unit="" />} />
            <Bar dataKey="cu" radius={[4, 4, 0, 0]} maxBarSize={28}>
              {chartData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={
                    entry.day === result.bestDay
                      ? '#22c55e'
                      : entry.day === result.worstDay
                        ? '#ef4444'
                        : '#3b82f6'
                  }
                  fillOpacity={0.7}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <Typography
          variant="caption"
          sx={{ fontSize: 11, color: '#22c55e', mt: 0.5, display: 'block' }}
        >
          {result.bestDay}曜日がベストコンディション
        </Typography>
      </Paper>
    </Box>
  );
}
