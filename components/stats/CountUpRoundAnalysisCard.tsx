'use client';

import { useMemo } from 'react';
import { Paper, Typography, Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Cell,
} from 'recharts';
import { analyzeRounds } from '@/lib/countup-round-analysis';
import { COLOR_COUNTUP } from '@/lib/dartslive-colors';
import type { CountUpPlay } from './CountUpDeepAnalysisCard';
import { useChartTheme } from '@/lib/chart-theme';

interface CountUpRoundAnalysisCardProps {
  countupPlays: CountUpPlay[];
}

export default function CountUpRoundAnalysisCard({ countupPlays }: CountUpRoundAnalysisCardProps) {
  const ct = useChartTheme();
  const theme = useTheme();
  const analysis = useMemo(() => {
    const playLogs = countupPlays.map((p) => p.playLog).filter((l) => l && l.length > 0);
    return analyzeRounds(playLogs);
  }, [countupPlays]);

  if (!analysis) return null;

  const { rounds, pattern, bestRound, worstRound, maxSingleRound } = analysis;

  const overallAvg = rounds.reduce((s, r) => s + r.avgScore, 0) / rounds.length;

  const chartData = rounds.map((r) => ({
    name: `R${r.round}`,
    avgScore: r.avgScore,
    maxScore: r.maxScore,
    minScore: r.minScore,
    range: r.maxScore - r.minScore,
  }));

  return (
    <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
          COUNT-UP ラウンド別分析
        </Typography>
        <Box
          sx={{
            px: 1,
            py: 0.2,
            borderRadius: 1,
            bgcolor: `${pattern.color}22`,
            border: `1px solid ${pattern.color}`,
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 'bold', color: pattern.color }}>
            {pattern.label}
          </Typography>
        </Box>
      </Box>

      {/* サマリー */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))',
          gap: 1.5,
          p: 1.5,
          borderRadius: 1,
          bgcolor: 'action.hover',
          border: 1,
          borderColor: 'divider',
          mb: 2,
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            ベストR
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'success.main' }}>
            R{bestRound}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: 9 }}>
            平均{rounds[bestRound - 1].avgScore.toFixed(1)}点
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            ワーストR
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'error.main' }}>
            R{worstRound}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: 9 }}>
            平均{rounds[worstRound - 1].avgScore.toFixed(1)}点
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            R差
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            {(rounds[bestRound - 1].avgScore - rounds[worstRound - 1].avgScore).toFixed(1)}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            最高1R
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
            {maxSingleRound}
          </Typography>
        </Box>
      </Box>

      {/* ラウンド別平均スコア */}
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} />
          <XAxis dataKey="name" fontSize={11} tick={{ fill: ct.text }} />
          <YAxis fontSize={11} tick={{ fill: ct.text }} domain={[0, 'auto']} />
          <Tooltip
            contentStyle={ct.tooltipStyle}
            formatter={(v: number | undefined) => [`${(v ?? 0).toFixed(1)}`, '点']}
          />
          <ReferenceLine
            y={Math.round(overallAvg * 10) / 10}
            stroke={theme.palette.warning.main}
            strokeDasharray="5 5"
            label={{
              value: `全体平均 ${overallAvg.toFixed(1)}`,
              fill: theme.palette.warning.main,
              fontSize: 10,
            }}
          />
          <Bar dataKey="avgScore" name="avgScore" radius={[4, 4, 0, 0]}>
            {chartData.map((_, idx) => (
              <Cell
                key={idx}
                fill={
                  idx + 1 === bestRound
                    ? theme.palette.success.main
                    : idx + 1 === worstRound
                      ? theme.palette.error.main
                      : COLOR_COUNTUP
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* ラウンド推移（ライン） */}
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} />
          <XAxis dataKey="name" fontSize={11} tick={{ fill: ct.text }} />
          <YAxis fontSize={11} tick={{ fill: ct.text }} domain={[0, 'auto']} />
          <Tooltip contentStyle={ct.tooltipStyle} />
          <Line
            type="monotone"
            dataKey="maxScore"
            stroke={theme.palette.success.main}
            strokeWidth={1}
            strokeDasharray="4 4"
            dot={false}
            name="最高"
          />
          <Line
            type="monotone"
            dataKey="avgScore"
            stroke={COLOR_COUNTUP}
            strokeWidth={2.5}
            dot={{ r: 4, fill: COLOR_COUNTUP }}
            name="平均"
          />
          <Line
            type="monotone"
            dataKey="minScore"
            stroke={theme.palette.error.main}
            strokeWidth={1}
            strokeDasharray="4 4"
            dot={false}
            name="最低"
          />
        </LineChart>
      </ResponsiveContainer>

      {/* パターン説明 */}
      <Box
        sx={{
          mt: 1.5,
          p: 1.5,
          borderRadius: 1,
          bgcolor: 'action.hover',
          border: 1,
          borderColor: 'divider',
        }}
      >
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
          {pattern.description}
        </Typography>
      </Box>

      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        {countupPlays.length}件のプレイデータから分析
      </Typography>
    </Paper>
  );
}
