'use client';

import {
  Paper,
  Box,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  Chip,
  useTheme,
} from '@mui/material';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Cell,
} from 'recharts';
import { COLOR_01, COLOR_CRICKET, COLOR_COUNTUP } from '@/lib/dartslive-colors';

interface RecentGamesChartProps {
  games: { category: string; scores: number[] }[];
  gameChartCategory: string;
  onCategoryChange: (cat: string) => void;
  expectedCountUp: number | null;
  dangerCountUp: number | null;
  excellentCountUp: number | null;
}

function getGameColor(cat: string): string {
  if (cat.includes('CRICKET') && !cat.includes('COUNT')) return COLOR_CRICKET;
  if (cat.includes('COUNT')) return COLOR_COUNTUP;
  return COLOR_01;
}

export default function RecentGamesChart({
  games,
  gameChartCategory,
  onCategoryChange,
  expectedCountUp,
  dangerCountUp,
  excellentCountUp,
}: RecentGamesChartProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const chartGrid = isDark ? '#333' : '#ddd';
  const chartText = isDark ? '#ccc' : '#666';
  const chartTooltipBg = isDark ? '#1e1e1e' : '#fff';
  const chartTooltipBorder = isDark ? '#444' : '#ddd';
  const chartAvgLine = isDark ? '#90caf9' : '#1565c0';

  const playableGames = games.filter((g) => g.scores.length >= 5);

  if (playableGames.length === 0) return null;

  const selectedGame = playableGames.find((g) => g.category === gameChartCategory)
    || playableGames[0];
  const activeCat = selectedGame?.category ?? gameChartCategory;
  const isCountUpCategory = activeCat.includes('COUNT');
  const gameChartData =
    selectedGame?.scores.map((score, i) => {
      const avg = selectedGame.scores.slice(0, i + 1).reduce((a, b) => a + b, 0) / (i + 1);
      return { game: i + 1, score, avg: Math.round(avg * 100) / 100 };
    }) || [];

  const gameAvg = selectedGame
    ? selectedGame.scores.reduce((a, b) => a + b, 0) / selectedGame.scores.length
    : 0;
  const baseColor = getGameColor(activeCat);
  const threshold = isCountUpCategory && expectedCountUp != null ? expectedCountUp : gameAvg;
  const dangerThreshold = isCountUpCategory ? dangerCountUp : null;
  const excellentThreshold = isCountUpCategory ? excellentCountUp : null;

  const getBarColor = (score: number) => {
    if (excellentThreshold != null && score >= excellentThreshold) return '#2e7d32';
    if (score >= threshold) return '#4caf50';
    if (dangerThreshold != null && score <= dangerThreshold) return '#f44336';
    return `${baseColor}66`;
  };

  return (
    <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
          直近ゲーム結果
        </Typography>
        <ToggleButtonGroup
          value={gameChartCategory}
          exclusive
          onChange={(_, v) => {
            if (v) onCategoryChange(v);
          }}
          size="small"
        >
          {playableGames.map((g) => (
            <ToggleButton
              key={g.category}
              value={g.category}
              sx={{ '&.Mui-selected': { color: getGameColor(g.category) } }}
            >
              {g.category === 'STANDARD CRICKET'
                ? 'Cricket'
                : g.category === 'COUNT-UP'
                  ? 'CU'
                  : g.category === 'CRICKET COUNT-UP'
                    ? 'CCU'
                    : g.category}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>
      {gameChartData.length > 0 && (
        <ResponsiveContainer width="100%" height={230}>
          <ComposedChart data={gameChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
            <XAxis dataKey="game" fontSize={11} tick={{ fill: chartText }} />
            <YAxis domain={['auto', 'auto']} fontSize={11} tick={{ fill: chartText }} />
            <Tooltip
              contentStyle={{
                backgroundColor: chartTooltipBg,
                border: `1px solid ${chartTooltipBorder}`,
                borderRadius: 6,
                color: chartText,
              }}
              labelFormatter={(v) => `Game ${v}`}
            />
            <Legend iconType="plainline" wrapperStyle={{ fontSize: 11, paddingTop: 4 }} />
            <Bar dataKey="score" name="スコア" opacity={0.8} radius={[2, 2, 0, 0]}>
              {gameChartData.map((entry, i) => (
                <Cell key={i} fill={getBarColor(entry.score)} />
              ))}
            </Bar>
            <Line
              type="monotone"
              dataKey="avg"
              name="累計平均"
              stroke={chartAvgLine}
              strokeWidth={2}
              dot={false}
            />
            {isCountUpCategory && expectedCountUp != null && (
              <ReferenceLine
                y={expectedCountUp}
                stroke="#ff9800"
                strokeDasharray="6 3"
                label={{
                  value: `Rt期待値 ${expectedCountUp}`,
                  position: 'right',
                  fill: '#ff9800',
                  fontSize: 10,
                }}
              />
            )}
            <ReferenceLine
              y={gameAvg}
              stroke={baseColor}
              strokeDasharray="4 4"
              strokeOpacity={0.6}
              label={{
                value: `平均 ${isCountUpCategory ? Math.round(gameAvg) : gameAvg.toFixed(2)}`,
                position: 'left',
                fill: baseColor,
                fontSize: 10,
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}
      {/* 色凡例 */}
      {isCountUpCategory && expectedCountUp != null && (
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mt: 1, mb: 0.5 }}>
          {excellentCountUp != null && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#2e7d32' }} />
              <Typography variant="caption" color="text.secondary">
                Rt+2以上 ({excellentCountUp}+)
              </Typography>
            </Box>
          )}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#4caf50' }} />
            <Typography variant="caption" color="text.secondary">
              期待値以上 ({expectedCountUp}+)
            </Typography>
          </Box>
          {dangerCountUp != null && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#f44336' }} />
              <Typography variant="caption" color="text.secondary">
                Rt-2以下 ({dangerCountUp}以下)
              </Typography>
            </Box>
          )}
        </Box>
      )}
      {/* Scores chips */}
      {selectedGame && (
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 1 }}>
          {selectedGame.scores.map((s, i) => {
            const chipExcellent = isCountUpCategory ? excellentCountUp : null;
            const chipDanger = isCountUpCategory ? dangerCountUp : null;
            const isExcellent = chipExcellent != null && s >= chipExcellent;
            const isGood = !isExcellent && s >= threshold;
            const isDanger = chipDanger != null && s <= chipDanger;
            const chipColor = isExcellent
              ? '#2e7d32'
              : isGood
                ? '#4caf50'
                : isDanger
                  ? '#f44336'
                  : undefined;
            return (
              <Chip
                key={i}
                label={
                  activeCat.includes('CRICKET') && !activeCat.includes('COUNT')
                    ? s.toFixed(2)
                    : s
                }
                size="small"
                variant={chipColor ? 'filled' : 'outlined'}
                sx={{
                  bgcolor: chipColor ? `${chipColor}22` : undefined,
                  borderColor: chipColor ?? 'divider',
                  color: chipColor ?? 'text.secondary',
                  fontWeight: chipColor ? 'bold' : 'normal',
                }}
              />
            );
          })}
        </Box>
      )}
    </Paper>
  );
}
