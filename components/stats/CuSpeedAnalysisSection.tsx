'use client';

import { useMemo } from 'react';
import { Typography, Box, Alert } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Cell,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { analyzeSpeedSegments } from '@/lib/sensor-analysis';
import { useChartTheme } from '@/lib/chart-theme';
import { SectionTitle, type CountUpPlay } from './countup-deep-shared';

function SpeedChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ payload: Record<string, unknown> }>;
  label?: string;
}) {
  const theme = useTheme();
  if (!active || !payload?.length) return null;
  const data = payload[0]?.payload;
  if (!data) return null;
  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'text.primary',
        borderRadius: 1,
        p: 1,
        minWidth: 120,
      }}
    >
      <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#fff', display: 'block' }}>
        {label} km/h (n={data.count as number})
      </Typography>
      <Typography variant="caption" sx={{ color: '#CE93D8', display: 'block' }}>
        スコア: {data.avgScore as number}点
      </Typography>
      <Typography variant="caption" sx={{ color: 'warning.main', display: 'block' }}>
        ブル率: {data.bullRate as number}%
      </Typography>
      {data.primaryMissDir !== '-' && (
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
          主ミス方向: {data.primaryMissDir as string}
        </Typography>
      )}
    </Box>
  );
}

interface CuSpeedAnalysisSectionProps {
  filtered: CountUpPlay[];
}

export default function CuSpeedAnalysisSection({ filtered }: CuSpeedAnalysisSectionProps) {
  const theme = useTheme();
  const ct = useChartTheme();
  const speedSegments = useMemo(() => analyzeSpeedSegments(filtered), [filtered]);

  if (!speedSegments) return null;

  return (
    <>
      <SectionTitle>スピード分析</SectionTitle>

      {/* サマリー（3列グリッド） */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 1,
          p: 1.5,
          borderRadius: 1,
          bgcolor: 'action.hover',
          border: 1,
          borderColor: 'divider',
          mb: 1.5,
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            ベスト速度帯
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'success.main' }}>
            {speedSegments.bestSegment?.label}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: 9 }}>
            km/h（スコア最高）
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            最高ブル率帯
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
            {speedSegments.bestBullSegment?.label}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: 9 }}>
            km/h（ブル率{speedSegments.bestBullSegment?.bullRate}%）
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            速度レンジ
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            {speedSegments.speedRange.min}-{speedSegments.speedRange.max}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: 9 }}>
            km/h
          </Typography>
        </Box>
      </Box>

      {/* スピード帯別チャート（複合バーチャート） */}
      {speedSegments.segments.length > 1 && (
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={speedSegments.segments}>
            <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} />
            <XAxis dataKey="label" fontSize={10} tick={{ fill: ct.text }} />
            <YAxis
              yAxisId="left"
              fontSize={11}
              tick={{ fill: ct.text }}
              domain={['dataMin - 30', 'dataMax + 30']}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              fontSize={11}
              tick={{ fill: ct.text }}
              unit="%"
            />
            <Tooltip content={<SpeedChartTooltip />} />
            <Bar yAxisId="left" dataKey="avgScore" name="平均スコア" radius={[4, 4, 0, 0]}>
              {speedSegments.segments.map((s, i) => (
                <Cell
                  key={i}
                  fill={
                    s.label === speedSegments.bestSegment?.label
                      ? theme.palette.success.main
                      : '#7B1FA2'
                  }
                />
              ))}
            </Bar>
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="bullRate"
              name="ブル率"
              stroke={theme.palette.warning.main}
              strokeWidth={2}
              dot={{ r: 3, fill: theme.palette.warning.main }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}

      {/* 遅い帯 vs 速い帯 比較テーブル */}
      {speedSegments.slowVsFast && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '80px 1fr 1fr',
            gap: 0.5,
            mt: 1.5,
            p: 1.5,
            borderRadius: 1,
            bgcolor: 'action.hover',
            border: 1,
            borderColor: 'divider',
            alignItems: 'center',
          }}
        >
          <Box />
          <Typography
            variant="caption"
            sx={{ textAlign: 'center', fontWeight: 'bold', color: 'info.light' }}
          >
            遅い帯({speedSegments.slowVsFast.slowLabel})
          </Typography>
          <Typography
            variant="caption"
            sx={{ textAlign: 'center', fontWeight: 'bold', color: 'error.light' }}
          >
            速い帯({speedSegments.slowVsFast.fastLabel})
          </Typography>

          <Typography variant="caption" color="text.secondary">
            スコア
          </Typography>
          <Typography variant="body2" sx={{ textAlign: 'center', fontWeight: 'bold' }}>
            {speedSegments.slowVsFast.slowAvgScore}
          </Typography>
          <Typography variant="body2" sx={{ textAlign: 'center', fontWeight: 'bold' }}>
            {speedSegments.slowVsFast.fastAvgScore}
          </Typography>

          <Typography variant="caption" color="text.secondary">
            ブル率
          </Typography>
          <Typography variant="body2" sx={{ textAlign: 'center', fontWeight: 'bold' }}>
            {speedSegments.slowVsFast.slowBullRate}%
          </Typography>
          <Typography variant="body2" sx={{ textAlign: 'center', fontWeight: 'bold' }}>
            {speedSegments.slowVsFast.fastBullRate}%
          </Typography>

          <Typography variant="caption" color="text.secondary">
            ミス傾向
          </Typography>
          <Typography variant="body2" sx={{ textAlign: 'center', fontWeight: 'bold' }}>
            {speedSegments.slowVsFast.slowMissDir}方向
          </Typography>
          <Typography variant="body2" sx={{ textAlign: 'center', fontWeight: 'bold' }}>
            {speedSegments.slowVsFast.fastMissDir}方向
          </Typography>
        </Box>
      )}

      {/* インサイト */}
      {speedSegments.insights.length > 0 && (
        <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {speedSegments.insights.map((insight, i) => (
            <Alert
              key={i}
              severity={
                i === 0
                  ? 'success'
                  : insight.includes('ミス') || insight.includes('偏る')
                    ? 'warning'
                    : 'info'
              }
              sx={{ py: 0, '& .MuiAlert-message': { fontSize: 12 } }}
            >
              {insight}
            </Alert>
          ))}
        </Box>
      )}
    </>
  );
}
