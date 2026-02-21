'use client';

import { Paper, Box, Typography } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { COLOR_COUNTUP } from '@/lib/dartslive-colors';
import { computeStats, buildHistogram } from '@/lib/stats-math';

interface CountUpAnalysisCardProps {
  games: { category: string; scores: number[] }[];
}

const MAX_GAMES = 30;

export default function CountUpAnalysisCard({ games }: CountUpAnalysisCardProps) {
  const countUpGame = games?.find((g) => g.category === 'COUNT-UP');
  if (!countUpGame || countUpGame.scores.length < 3) return null;

  const recentScores = countUpGame.scores.slice(-MAX_GAMES);
  const { avg, max, min, median } = computeStats(recentScores);
  const histogram = buildHistogram(recentScores, 100);

  const summaryItems = [
    { label: '平均', value: Math.round(avg) },
    { label: '最高', value: max },
    { label: '最低', value: min },
    { label: '中央値', value: Math.round(median) },
  ];

  return (
    <Paper sx={{ p: 2, mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1.5 }}>
        COUNT-UP 統計分析
      </Typography>

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
        {summaryItems.map((item) => (
          <Paper
            key={item.label}
            variant="outlined"
            sx={{ flex: 1, minWidth: 70, p: 1, textAlign: 'center' }}
          >
            <Typography variant="caption" color="text.secondary">
              {item.label}
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
              {item.value}
            </Typography>
          </Paper>
        ))}
      </Box>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
        スコア分布（直近{recentScores.length}ゲーム・100点刻み）
      </Typography>
      <Box sx={{ width: '100%', height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={histogram} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="range" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip
              formatter={(value) => [`${value}ゲーム`, '回数']}
              contentStyle={{ fontSize: 12 }}
            />
            <Bar dataKey="count" fill={COLOR_COUNTUP} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
}
