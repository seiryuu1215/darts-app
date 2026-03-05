'use client';

import { Paper, Box, Typography } from '@mui/material';
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { COLOR_CRICKET } from '@/lib/dartslive-colors';
import { computeStats, buildRatingBands } from '@/lib/stats-math';
import { calcCriRating } from '@/lib/dartslive-rating';
import { useChartTheme } from '@/lib/chart-theme';

interface CricketAnalysisCardProps {
  games: { category: string; scores: number[] }[];
  currentRating?: number | null;
}

const MAX_GAMES = 30;
const COLOR_CURRENT = '#FF9800';

function isCricketCategory(cat: string): boolean {
  return cat === 'STANDARD CRICKET';
}

export default function CricketAnalysisCard({ games, currentRating }: CricketAnalysisCardProps) {
  const ct = useChartTheme();
  const cricketGames = games?.filter((g) => isCricketCategory(g.category)) ?? [];
  if (cricketGames.length === 0) return null;

  const allScores = cricketGames.flatMap((g) => g.scores);
  if (allScores.length < 3) return null;

  const recentScores = allScores.slice(-MAX_GAMES);
  const { avg, max, min, median } = computeStats(recentScores);

  // レーティングバンド（MPRベース）
  const centerRt = currentRating ?? calcCriRating(avg);
  const bands = buildRatingBands(recentScores, centerRt, (s) => s, calcCriRating);

  const summaryItems = [
    { label: '平均MPR', value: avg.toFixed(2) },
    { label: '最高', value: max.toFixed(2) },
    { label: '最低', value: min.toFixed(2) },
    { label: '中央値', value: median.toFixed(2) },
  ];

  return (
    <Paper sx={{ p: 2, mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1.5 }}>
        Cricket 統計分析
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

      {bands.length > 0 && (
        <>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            レーティング別分布（直近{recentScores.length}ゲーム）
          </Typography>
          <Box sx={{ width: '100%', height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bands} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={ct.grid} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: ct.text }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: ct.text }} />
                <Tooltip
                  formatter={(value) => [`${value}ゲーム`, '回数']}
                  contentStyle={{ ...ct.tooltipStyle, fontSize: 12 }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {bands.map((b, i) => (
                    <Cell key={i} fill={b.isCurrent ? COLOR_CURRENT : COLOR_CRICKET} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </>
      )}
    </Paper>
  );
}
