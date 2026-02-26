'use client';

import { Paper, Box, Typography, Alert } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { COLOR_01, COLOR_CRICKET, COLOR_COUNTUP } from '@/lib/dartslive-colors';

interface GameMixCardProps {
  games: { category: string; scores: number[] }[];
}

const MIN_GAMES = 10;
const COLOR_OTHER = '#9e9e9e';

interface CategoryGroup {
  name: string;
  color: string;
  count: number;
  percentage: number;
}

function classifyCategory(category: string): { name: string; color: string } {
  if (category === 'COUNT-UP') return { name: 'COUNT-UP', color: COLOR_COUNTUP };
  if (category.includes('ST01')) return { name: '01', color: COLOR_01 };
  if (category.includes('CRICKET')) return { name: 'Cricket', color: COLOR_CRICKET };
  return { name: 'その他', color: COLOR_OTHER };
}

export default function GameMixCard({ games }: GameMixCardProps) {
  if (!games || games.length === 0) return null;

  const totalGames = games.reduce((sum, g) => sum + g.scores.length, 0);
  if (totalGames < MIN_GAMES) return null;

  // カテゴリ別に集約
  const grouped: Record<string, { color: string; count: number }> = {};
  for (const game of games) {
    const { name, color } = classifyCategory(game.category);
    if (!grouped[name]) grouped[name] = { color, count: 0 };
    grouped[name].count += game.scores.length;
  }

  const chartData: CategoryGroup[] = Object.entries(grouped)
    .map(([name, { color, count }]) => ({
      name,
      color,
      count,
      percentage: Math.round((count / totalGames) * 1000) / 10,
    }))
    .sort((a, b) => b.count - a.count);

  // 偏りインサイト
  const maxCategory = chartData[0];
  const biased = maxCategory && maxCategory.percentage > 60;

  return (
    <Paper sx={{ p: 2, mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
          ゲームミックス分析
        </Typography>
        <Typography variant="caption" color="text.secondary">
          全{totalGames}ゲーム
        </Typography>
      </Box>

      <Box sx={{ width: '100%', height: 40 * chartData.length + 20 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
          >
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={70} />
            <Tooltip
              formatter={(v: number | undefined) => [`${v ?? 0}%`, '割合']}
              contentStyle={{ fontSize: 12 }}
            />
            <Bar dataKey="percentage" radius={[0, 4, 4, 0]}>
              {chartData.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Box>

      {biased && (
        <Alert severity="warning" sx={{ mt: 1.5 }}>
          {maxCategory.name}に偏りがあります（{maxCategory.percentage}
          %）。バランスよく練習しましょう
        </Alert>
      )}
    </Paper>
  );
}
