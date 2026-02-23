'use client';

import { useMemo } from 'react';
import { Paper, Typography, Box, Chip, Alert } from '@mui/material';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import { analyzeSensor, generateSensorInsights } from '@/lib/sensor-analysis';
import type { CountUpPlay } from './CountUpDeepAnalysisCard';

interface SensorTrendCardProps {
  countupPlays: CountUpPlay[];
}

const TOOLTIP_STYLE = {
  backgroundColor: '#1e1e1e',
  border: '1px solid #444',
  borderRadius: 6,
  color: '#ccc',
};

export default function SensorTrendCard({ countupPlays }: SensorTrendCardProps) {
  const analysis = useMemo(() => analyzeSensor(countupPlays), [countupPlays]);
  const insights = useMemo(() => (analysis ? generateSensorInsights(analysis) : []), [analysis]);

  if (!analysis) return null;

  const { trendPoints, overallStats } = analysis;

  return (
    <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
          DL3センサートレンド
        </Typography>
        <Chip
          label={`${trendPoints.length}件`}
          size="small"
          sx={{ fontSize: 10, height: 20, bgcolor: '#7B1FA2', color: '#fff' }}
        />
      </Box>

      {/* 全体統計 — スピードを先頭に強調 */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))',
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
            平均スピード
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#FF9800' }}>
            {overallStats.avgSpeed.toFixed(1)}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: 9 }}>
            km/h
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            偏り(X)
          </Typography>
          <Typography
            variant="body1"
            sx={{
              fontWeight: 'bold',
              color: Math.abs(overallStats.avgVectorX) > 5 ? '#ff9800' : '#4caf50',
            }}
          >
            {overallStats.avgVectorX > 0 ? '右' : '左'}{' '}
            {Math.abs(overallStats.avgVectorX).toFixed(1)}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            偏り(Y)
          </Typography>
          <Typography
            variant="body1"
            sx={{
              fontWeight: 'bold',
              color: Math.abs(overallStats.avgVectorY) > 5 ? '#ff9800' : '#4caf50',
            }}
          >
            {overallStats.avgVectorY > 0 ? '下' : '上'}{' '}
            {Math.abs(overallStats.avgVectorY).toFixed(1)}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            グルーピング
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            {overallStats.avgRadius.toFixed(1)}mm
          </Typography>
          {overallStats.radiusImprovement != null && (
            <Typography
              variant="caption"
              sx={{
                fontSize: 9,
                color: overallStats.radiusImprovement < 0 ? '#4caf50' : '#f44336',
                fontWeight: 'bold',
              }}
            >
              {overallStats.radiusImprovement > 0 ? '+' : ''}
              {overallStats.radiusImprovement}%
            </Typography>
          )}
        </Box>
      </Box>

      {/* インサイト */}
      {insights.length > 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 2 }}>
          {insights.map((insight, idx) => (
            <Alert key={idx} severity={insight.severity} variant="outlined" sx={{ py: 0.5 }}>
              {insight.message}
            </Alert>
          ))}
        </Box>
      )}

      {/* ベクトルscatter */}
      {trendPoints.length > 10 && (
        <>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: '#aaa' }}>
            投げ位置分布 (ベクトル)
          </Typography>
          <ResponsiveContainer width="100%" height={220}>
            <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis
                type="number"
                dataKey="vectorX"
                name="X"
                fontSize={10}
                tick={{ fill: '#aaa' }}
                label={{ value: '← 左　　右 →', position: 'bottom', fontSize: 10, fill: '#888' }}
              />
              <YAxis
                type="number"
                dataKey="vectorY"
                name="Y"
                fontSize={10}
                tick={{ fill: '#aaa' }}
                reversed
                label={{
                  value: '↑ 上　　下 ↓',
                  angle: -90,
                  position: 'insideLeft',
                  fontSize: 10,
                  fill: '#888',
                }}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(v: number | undefined) => [`${(v ?? 0).toFixed(1)}`, '']}
              />
              <Scatter data={trendPoints} fill="#7B1FA2" fillOpacity={0.4}>
                {trendPoints.map((_, idx) => (
                  <Cell
                    key={idx}
                    fill="#7B1FA2"
                    fillOpacity={0.15 + (idx / trendPoints.length) * 0.6}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </>
      )}
    </Paper>
  );
}
