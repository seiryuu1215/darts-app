'use client';

import { useMemo } from 'react';
import { Paper, Typography, Box, Chip } from '@mui/material';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import { correlateSpeedScore } from '@/lib/sensor-analysis';
import type { CountUpPlay } from './CountUpDeepAnalysisCard';

interface SpeedAccuracyCardProps {
  countupPlays: CountUpPlay[];
}

const TOOLTIP_STYLE = {
  backgroundColor: '#1e1e1e',
  border: '1px solid #444',
  borderRadius: 6,
  color: '#ccc',
};

export default function SpeedAccuracyCard({ countupPlays }: SpeedAccuracyCardProps) {
  const { scatterData, speedBuckets, correlation, sweetSpot, validCount } = useMemo(() => {
    const validPlays = countupPlays.filter((p) => p.dl3Speed > 0);
    if (validPlays.length < 10)
      return { scatterData: [], speedBuckets: [], correlation: 0, sweetSpot: null, validCount: 0 };

    const { speedBuckets: buckets, correlation: corr } = correlateSpeedScore(countupPlays);

    const scatter = validPlays.map((p) => ({
      speed: Math.round(p.dl3Speed * 10) / 10,
      score: p.score,
    }));

    const sweet =
      buckets.length > 0 ? buckets.reduce((a, b) => (b.avgScore > a.avgScore ? b : a)) : null;

    return {
      scatterData: scatter,
      speedBuckets: buckets,
      correlation: corr,
      sweetSpot: sweet,
      validCount: validPlays.length,
    };
  }, [countupPlays]);

  if (scatterData.length < 10) return null;

  const corrLabel =
    Math.abs(correlation) > 0.5
      ? '強い相関'
      : Math.abs(correlation) > 0.3
        ? '中程度の相関'
        : Math.abs(correlation) > 0.1
          ? '弱い相関'
          : 'ほぼ無相関';

  return (
    <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
          スピード × 精度
        </Typography>
        <Chip
          label={`${validCount}件`}
          size="small"
          sx={{ fontSize: 10, height: 20, bgcolor: '#7B1FA2', color: '#fff' }}
        />
      </Box>

      {/* サマリー */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: 1.5,
          p: 1.5,
          borderRadius: 1,
          bgcolor: 'rgba(255,255,255,0.03)',
          border: '1px solid #333',
          mb: 2,
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            速度-点数相関
          </Typography>
          <Typography
            variant="body1"
            sx={{
              fontWeight: 'bold',
              color: Math.abs(correlation) > 0.3 ? '#FF9800' : '#888',
            }}
          >
            {correlation.toFixed(3)}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: 9 }}>
            {corrLabel}
          </Typography>
        </Box>
        {sweetSpot && (
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              スイートスポット
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
              {sweetSpot.speedRange}km/h
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: 9 }}>
              平均{sweetSpot.avgScore}点 (n={sweetSpot.count})
            </Typography>
          </Box>
        )}
      </Box>

      {/* Scatter plot */}
      <ResponsiveContainer width="100%" height={220}>
        <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis
            type="number"
            dataKey="speed"
            name="速度"
            fontSize={10}
            tick={{ fill: '#aaa' }}
            label={{
              value: 'km/h',
              position: 'insideBottomRight',
              offset: -5,
              fontSize: 10,
              fill: '#888',
            }}
          />
          <YAxis
            type="number"
            dataKey="score"
            name="スコア"
            fontSize={10}
            tick={{ fill: '#aaa' }}
            domain={['dataMin - 50', 'dataMax + 50']}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(v: number | undefined) => [`${(v ?? 0).toFixed(1)}`, '']}
          />
          <Scatter data={scatterData} fill="#7B1FA2" fillOpacity={0.5} />
        </ScatterChart>
      </ResponsiveContainer>

      {/* 速度帯別平均 */}
      {speedBuckets.length >= 3 && (
        <>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mt: 2, mb: 1, color: '#aaa' }}>
            速度帯別平均スコア
          </Typography>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={speedBuckets}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="speedRange" fontSize={10} tick={{ fill: '#aaa' }} />
              <YAxis
                fontSize={11}
                tick={{ fill: '#aaa' }}
                domain={['dataMin - 30', 'dataMax + 30']}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(v: number | undefined) => [`${v ?? 0}`, '平均スコア']}
                labelFormatter={(label) => `${label} km/h`}
              />
              <Bar dataKey="avgScore" name="avgScore" radius={[4, 4, 0, 0]}>
                {speedBuckets.map((bucket, idx) => (
                  <Cell
                    key={idx}
                    fill={
                      sweetSpot && bucket.speedRange === sweetSpot.speedRange
                        ? '#4caf50'
                        : '#7B1FA2'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </>
      )}
    </Paper>
  );
}
