'use client';

import { Paper, Box, Typography, Chip } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { COLOR_01 } from '@/lib/dartslive-colors';
import { computeStats, buildHistogram } from '@/lib/stats-math';

interface ZeroOneAnalysisCardProps {
  games: { category: string; scores: number[] }[];
}

const MAX_GAMES = 30;

function is01Category(cat: string): boolean {
  return /^\d{3}$/.test(cat) && cat.endsWith('01');
}

export default function ZeroOneAnalysisCard({ games }: ZeroOneAnalysisCardProps) {
  const zeroOneGames = games?.filter((g) => is01Category(g.category)) ?? [];
  if (zeroOneGames.length === 0) return null;

  // 全01バリアントのスコアを統合
  const allScores = zeroOneGames.flatMap((g) => g.scores);
  if (allScores.length < 3) return null;

  const recentScores = allScores.slice(-MAX_GAMES);
  const { avg, max, min, median } = computeStats(recentScores);
  const histogram = buildHistogram(recentScores, 50);

  // バリアント内訳
  const variantCounts = zeroOneGames.map((g) => ({
    category: g.category,
    count: g.scores.length,
  }));

  const summaryItems = [
    { label: '平均', value: Math.round(avg) },
    { label: '最高', value: max },
    { label: '最低', value: min },
    { label: '中央値', value: Math.round(median) },
  ];

  return (
    <Paper sx={{ p: 2, mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1.5 }}>
        01 統計分析
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

      {/* バリアント内訳 */}
      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1.5 }}>
        {variantCounts.map((v) => (
          <Chip
            key={v.category}
            label={`${v.category}: ${v.count}ゲーム`}
            size="small"
            sx={{ bgcolor: `${COLOR_01}18`, color: COLOR_01, fontWeight: 'bold', fontSize: 11 }}
          />
        ))}
      </Box>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
        スコア分布（直近{recentScores.length}ゲーム・50点刻み）
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
            <Bar dataKey="count" fill={COLOR_01} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
}
