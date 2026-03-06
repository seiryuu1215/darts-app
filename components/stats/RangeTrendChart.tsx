'use client';

import { useMemo } from 'react';
import { Paper, Box, Typography } from '@mui/material';
import { useChartTheme } from '@/lib/chart-theme';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { getExpectedRange, getRatingFromPpd } from '@/lib/dartslive-reference';
import type { CountUpPlay } from './countup-deep-shared';

interface RangeTrendChartProps {
  countupPlays: CountUpPlay[];
  currentPpd?: number | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RangeTooltipContent({ active, payload, tooltipBg, tooltipBorder, textColor }: any) {
  if (!active || !payload?.[0]) return null;
  const data = payload[0].payload;
  return (
    <Box
      sx={{
        bgcolor: tooltipBg,
        border: tooltipBorder,
        borderRadius: 1.5,
        p: 1,
        fontSize: 12,
        color: textColor,
      }}
    >
      <Typography variant="caption" display="block" sx={{ fontWeight: 'bold' }}>
        #{data.index}: {data.range}mm
      </Typography>
    </Box>
  );
}

export default function RangeTrendChart({ countupPlays, currentPpd }: RangeTrendChartProps) {
  const ct = useChartTheme();

  const { chartData, avgRange, expectedRange, currentRating } = useMemo(() => {
    const dl3Plays = countupPlays.filter(
      (p) => p.dl3VectorX !== 0 || p.dl3VectorY !== 0 || p.dl3Radius !== 0 || p.dl3Speed !== 0,
    );
    const recent = dl3Plays.slice(-30);
    const data = recent.map((p, i) => ({
      index: i + 1,
      range: Math.round(p.dl3Radius * 10) / 10,
    }));
    const avg =
      data.length > 0
        ? Math.round((data.reduce((s, d) => s + d.range, 0) / data.length) * 10) / 10
        : 0;
    const expected = currentPpd != null ? getExpectedRange(currentPpd) : 0;
    const rating = currentPpd != null ? getRatingFromPpd(currentPpd) : null;
    return { chartData: data, avgRange: avg, expectedRange: expected, currentRating: rating };
  }, [countupPlays, currentPpd]);

  if (chartData.length < 2) return null;

  return (
    <Paper sx={{ p: 2, mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
      <Box
        sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 1.5 }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
          レンジ推移
        </Typography>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#ff9800' }}>
            平均 {avgRange}mm
          </Typography>
          {expectedRange > 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
              (Rt{currentRating}目安: {expectedRange}mm)
            </Typography>
          )}
        </Box>
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
        直近{chartData.length}G のグルーピング半径（小さいほど良い）
      </Typography>
      <Box sx={{ overflowX: 'auto' }}>
        <Box sx={{ minWidth: Math.max(280, chartData.length * 14) }}>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} />
              <XAxis dataKey="index" fontSize={10} tick={{ fill: ct.text }} />
              <YAxis fontSize={10} tick={{ fill: ct.text }} domain={['auto', 'auto']} />
              <Tooltip
                content={
                  <RangeTooltipContent
                    tooltipBg={ct.tooltipStyle.backgroundColor}
                    tooltipBorder={ct.tooltipStyle.border}
                    textColor={ct.text}
                  />
                }
              />
              {expectedRange > 0 && (
                <ReferenceLine
                  y={expectedRange}
                  stroke="#ff9800"
                  strokeDasharray="5 3"
                  strokeWidth={1.5}
                  label={{
                    value: `Rt${currentRating}: ${expectedRange}mm`,
                    position: 'right',
                    fill: '#ff9800',
                    fontSize: 10,
                  }}
                />
              )}
              <Line
                type="monotone"
                dataKey="range"
                stroke="#4CAF50"
                strokeWidth={2}
                dot={{ r: 2, fill: '#4CAF50' }}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </Box>
    </Paper>
  );
}
