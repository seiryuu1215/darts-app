'use client';

import { useMemo } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import NightsStayIcon from '@mui/icons-material/NightsStay';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { HealthDartsCorrelation } from '@/types';
import { analyzeSleepStageCorrelations } from '@/lib/health-analytics';

export function SleepStageCorrelationSection({
  correlationData,
}: {
  correlationData: HealthDartsCorrelation[];
}) {
  const result = useMemo(() => analyzeSleepStageCorrelations(correlationData), [correlationData]);

  if (!result) return null;

  const stages = [
    { label: '深い睡眠', r: result.deepSleepR, pct: result.deepSleepPct, color: '#6d28d9' },
    { label: 'REM睡眠', r: result.remSleepR, pct: result.remSleepPct, color: '#a78bfa' },
    { label: 'コア睡眠', r: result.coreSleepR, pct: result.coreSleepPct, color: '#7c3aed' },
  ];

  const scatterData = correlationData
    .filter(
      (d) =>
        d.countUpAvg !== null &&
        d.sleepDurationMinutes !== null &&
        d.sleepDurationMinutes > 0 &&
        d.sleepDeepMinutes !== null,
    )
    .map((d) => ({
      x: Math.round(((d.sleepDeepMinutes ?? 0) / d.sleepDurationMinutes!) * 100),
      y: d.countUpAvg,
    }));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 0.5 }}>
        <NightsStayIcon sx={{ fontSize: 16, color: '#6d28d9' }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          睡眠ステージ × CU平均
        </Typography>
      </Box>

      <Paper
        sx={{
          p: 2,
          borderRadius: 2,
          border: '1px solid rgba(255,255,255,0.05)',
          bgcolor: 'rgba(24,24,27,0.8)',
        }}
      >
        <Typography
          variant="caption"
          sx={{ fontSize: 11, color: '#71717a', mb: 1, display: 'block' }}
        >
          睡眠ステージ別 CU平均相関 ({result.n}日分析)
        </Typography>

        {stages.map((s) => (
          <Box key={s.label} sx={{ mb: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
              <Typography variant="caption" sx={{ fontSize: 11, color: '#a1a1aa' }}>
                {s.label} (平均{s.pct}%)
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  fontSize: 11,
                  fontFamily: 'monospace',
                  color: Math.abs(s.r) >= 0.3 ? '#22c55e' : '#71717a',
                }}
              >
                r = {s.r > 0 ? '+' : ''}
                {s.r.toFixed(2)}
              </Typography>
            </Box>
            <Box
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: 'rgba(255,255,255,0.05)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  height: '100%',
                  borderRadius: 3,
                  bgcolor: s.color,
                  left: '50%',
                  width: `${Math.abs(s.r) * 50}%`,
                  transform: s.r < 0 ? 'translateX(-100%)' : 'none',
                }}
              />
            </Box>
          </Box>
        ))}

        {scatterData.length >= 5 && (
          <Box sx={{ mt: 2 }}>
            <Typography
              variant="caption"
              sx={{ fontSize: 10, color: '#71717a', display: 'block', mb: 0.5 }}
            >
              深い睡眠% × CU平均
            </Typography>
            <ResponsiveContainer width="100%" height={120}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis
                  dataKey="x"
                  name="深い睡眠%"
                  tick={{ fontSize: 9, fill: '#71717a' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  dataKey="y"
                  name="CU平均"
                  tick={{ fontSize: 9, fill: '#71717a' }}
                  axisLine={false}
                  tickLine={false}
                  width={30}
                />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter data={scatterData} fill="#6d28d9" fillOpacity={0.6} />
              </ScatterChart>
            </ResponsiveContainer>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
