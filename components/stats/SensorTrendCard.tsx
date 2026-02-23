'use client';

import { useMemo } from 'react';
import { Paper, Typography, Box, Chip } from '@mui/material';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import { analyzeSensor } from '@/lib/sensor-analysis';
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

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mt: 2.5, mb: 1, color: '#aaa' }}>
      {children}
    </Typography>
  );
}

export default function SensorTrendCard({ countupPlays }: SensorTrendCardProps) {
  const analysis = useMemo(() => analyzeSensor(countupPlays), [countupPlays]);

  if (!analysis) return null;

  const { trendPoints, speedBuckets, vectorDrift, overallStats } = analysis;

  const radiusData = trendPoints.filter((p) => p.radiusSma != null);

  // スイートスポット（最高平均スコアの速度帯）
  const sweetSpot =
    speedBuckets.length > 0
      ? speedBuckets.reduce((a, b) => (b.avgScore > a.avgScore ? b : a))
      : null;

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

      {/* 全体統計 */}
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
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            スピード
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            {overallStats.avgSpeed.toFixed(1)}km/h
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            速度-点数相関
          </Typography>
          <Typography
            variant="body1"
            sx={{
              fontWeight: 'bold',
              color: Math.abs(overallStats.speedScoreCorrelation) > 0.3 ? '#ff9800' : '#888',
            }}
          >
            {overallStats.speedScoreCorrelation.toFixed(3)}
          </Typography>
        </Box>
      </Box>

      {/* ベクトルscatter */}
      {trendPoints.length > 10 && (
        <>
          <SectionTitle>投げ位置分布 (ベクトル)</SectionTitle>
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

      {/* グルーピング半径の推移 */}
      {radiusData.length > 10 && (
        <>
          <SectionTitle>グルーピング半径の推移 (20G移動平均)</SectionTitle>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={radiusData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="index" fontSize={10} tick={{ fill: '#aaa' }} />
              <YAxis
                fontSize={11}
                tick={{ fill: '#aaa' }}
                domain={['dataMin - 2', 'dataMax + 2']}
              />
              <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={(idx) => `${idx}G目`} />
              <Line
                type="monotone"
                dataKey="radiusSma"
                stroke="#7B1FA2"
                strokeWidth={2}
                dot={false}
                name="Radius MA"
              />
            </LineChart>
          </ResponsiveContainer>
        </>
      )}

      {/* スピード帯別スコア */}
      {speedBuckets.length >= 3 && (
        <>
          <SectionTitle>スピード帯別平均スコア</SectionTitle>
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
          {sweetSpot && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 0.5, display: 'block', textAlign: 'center' }}
            >
              スイートスポット: {sweetSpot.speedRange}km/h (平均{sweetSpot.avgScore}点, n=
              {sweetSpot.count})
            </Typography>
          )}
        </>
      )}

      {/* ベクトルドリフト */}
      {vectorDrift && (
        <>
          <SectionTitle>投げ偏りの変化</SectionTitle>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 1,
              p: 1.5,
              borderRadius: 1,
              bgcolor: 'rgba(255,255,255,0.03)',
              border: '1px solid #333',
            }}
          >
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                初期偏り
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                ({vectorDrift.earlyAvgX}, {vectorDrift.earlyAvgY})
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                直近偏り
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                ({vectorDrift.recentAvgX}, {vectorDrift.recentAvgY})
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                変化量
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 'bold',
                  color: vectorDrift.improving ? '#4caf50' : '#ff9800',
                }}
              >
                {vectorDrift.driftMagnitude.toFixed(1)}mm
                {vectorDrift.improving ? ' (改善)' : ''}
              </Typography>
            </Box>
          </Box>
        </>
      )}
    </Paper>
  );
}
