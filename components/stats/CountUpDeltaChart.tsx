'use client';

import { Paper, Box, Typography } from '@mui/material';
import { useChartTheme } from '@/lib/chart-theme';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell,
} from 'recharts';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function DeltaTooltipContent({ active, payload, tooltipBg, tooltipBorder, textColor }: any) {
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
        スコア: {data.prevScore} → {data.score}
      </Typography>
      <Typography
        variant="caption"
        display="block"
        sx={{
          color: data.delta > 0 ? '#4CAF50' : data.delta < 0 ? '#F44336' : '#9E9E9E',
          fontWeight: 'bold',
        }}
      >
        {data.delta > 0 ? '+' : ''}
        {data.delta}
      </Typography>
    </Box>
  );
}

interface CountUpDeltaChartProps {
  games: { category: string; scores: number[] }[];
  avgScore?: number | null;
}

export default function CountUpDeltaChart({ games, avgScore }: CountUpDeltaChartProps) {
  const ct = useChartTheme();

  const countUpGames = games.filter((g) => g.category === 'COUNT-UP').flatMap((g) => g.scores);

  if (countUpGames.length < 2) return null;

  const recent = countUpGames.slice(-31); // 直近31回取得で30個の差分を計算
  const chartData = recent.slice(1).map((score, i) => {
    const prevScore = recent[i];
    const delta = score - prevScore;
    return {
      index: i + 1,
      delta,
      score,
      prevScore,
    };
  });

  if (chartData.length === 0) return null;

  return (
    <Paper sx={{ p: 2, mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
      <Box
        sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 1.5 }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
          COUNT-UP ±差分
        </Typography>
        {avgScore != null && (
          <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#ff9800' }}>
            平均 {Math.round(avgScore)}点
          </Typography>
        )}
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
        直近{chartData.length}回のスコア変動（緑=UP, 赤=DOWN）
      </Typography>
      <Box sx={{ overflowX: 'auto' }}>
        <Box sx={{ minWidth: Math.max(280, chartData.length * 14) }}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} />
              <XAxis dataKey="index" fontSize={10} tick={{ fill: ct.text }} />
              <YAxis fontSize={10} tick={{ fill: ct.text }} />
              <Tooltip
                content={
                  <DeltaTooltipContent
                    tooltipBg={ct.tooltipStyle.backgroundColor}
                    tooltipBorder={ct.tooltipStyle.border}
                    textColor={ct.text}
                  />
                }
              />
              <ReferenceLine y={0} stroke={ct.text} strokeWidth={1.5} />
              <Bar dataKey="delta" radius={[2, 2, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.delta > 0 ? '#4CAF50' : entry.delta < 0 ? '#F44336' : '#9E9E9E'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Box>
    </Paper>
  );
}
