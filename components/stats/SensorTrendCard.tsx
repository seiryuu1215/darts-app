'use client';

import { useState, useMemo } from 'react';
import { Paper, Typography, Box, Chip, Alert, Collapse, IconButton, Divider } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
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
import { analyzeSensor, generateSensorInsights, correlateSpeedScore } from '@/lib/sensor-analysis';
import type { SensorInsight } from '@/lib/sensor-analysis';
import type { CountUpPlay } from './CountUpDeepAnalysisCard';
import { useChartTheme } from '@/lib/chart-theme';

interface SensorTrendCardProps {
  countupPlays: CountUpPlay[];
}

export default function SensorTrendCard({ countupPlays }: SensorTrendCardProps) {
  const ct = useChartTheme();
  const analysis = useMemo(() => analyzeSensor(countupPlays), [countupPlays]);
  const insights = useMemo(() => (analysis ? generateSensorInsights(analysis) : []), [analysis]);
  const [speedOpen, setSpeedOpen] = useState(false);

  // スピード×精度相関分析
  const speedAnalysis = useMemo(() => {
    const validPlays = countupPlays.filter((p) => p.dl3Speed > 0);
    if (validPlays.length < 10) return null;

    const { speedBuckets, correlation } = correlateSpeedScore(countupPlays);
    const scatter = validPlays.map((p) => ({
      speed: Math.round(p.dl3Speed * 10) / 10,
      score: p.score,
    }));
    const sweetSpot =
      speedBuckets.length > 0
        ? speedBuckets.reduce((a, b) => (b.avgScore > a.avgScore ? b : a))
        : null;

    const ins: SensorInsight[] = [];
    if (correlation > 0.3) {
      ins.push({
        message:
          'スピードが速いほどスコアが高い傾向です。テンポを意識した投げ方が合っているかもしれません。',
        severity: 'info',
      });
    } else if (correlation < -0.3) {
      ins.push({
        message:
          'スピードを抑えた方がスコアが安定する傾向です。丁寧なリリースを意識してみましょう。',
        severity: 'info',
      });
    } else if (Math.abs(correlation) <= 0.1) {
      ins.push({
        message: 'スピードとスコアにほぼ相関がありません。スピードより精度重視で問題ないでしょう。',
        severity: 'info',
      });
    }
    if (sweetSpot) {
      ins.push({
        message: `${sweetSpot.speedRange}km/hがあなたのスイートスポットです。この速度帯で最もスコアが安定しています。`,
        severity: 'success',
      });
    }

    const corrLabel =
      Math.abs(correlation) > 0.5
        ? '強い相関'
        : Math.abs(correlation) > 0.3
          ? '中程度の相関'
          : Math.abs(correlation) > 0.1
            ? '弱い相関'
            : 'ほぼ無相関';

    return { scatter, correlation, sweetSpot, validCount: validPlays.length, ins, corrLabel };
  }, [countupPlays]);

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
              <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} />
              <XAxis
                type="number"
                dataKey="vectorX"
                name="X"
                fontSize={10}
                tick={{ fill: ct.text }}
                label={{ value: '← 左　　右 →', position: 'bottom', fontSize: 10, fill: '#888' }}
              />
              <YAxis
                type="number"
                dataKey="vectorY"
                name="Y"
                fontSize={10}
                tick={{ fill: ct.text }}
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
                contentStyle={ct.tooltipStyle}
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

      {/* スピード×精度 (折りたたみ) */}
      {speedAnalysis && (
        <>
          <Divider sx={{ my: 2 }} />
          <Box
            onClick={() => setSpeedOpen(!speedOpen)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              cursor: 'pointer',
              '&:hover .speed-label': { color: 'text.primary' },
            }}
          >
            <Typography
              className="speed-label"
              variant="subtitle2"
              color="text.secondary"
              sx={{ fontWeight: 'bold', transition: 'color 0.2s' }}
            >
              スピード × 精度
            </Typography>
            <Chip
              label={`${speedAnalysis.validCount}件`}
              size="small"
              sx={{ fontSize: 10, height: 20, bgcolor: '#7B1FA2', color: '#fff' }}
            />
            <IconButton
              size="small"
              sx={{
                p: 0,
                ml: 'auto',
                transition: 'transform 0.2s',
                transform: speedOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
              }}
            >
              <ExpandMoreIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
            </IconButton>
          </Box>
          <Collapse in={speedOpen}>
            <Box sx={{ mt: 1.5 }}>
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
                      color: Math.abs(speedAnalysis.correlation) > 0.3 ? '#FF9800' : '#888',
                    }}
                  >
                    {speedAnalysis.correlation.toFixed(3)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: 9 }}>
                    {speedAnalysis.corrLabel}
                  </Typography>
                </Box>
                {speedAnalysis.sweetSpot && (
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      スイートスポット
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                      {speedAnalysis.sweetSpot.speedRange}km/h
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: 9 }}>
                      平均{speedAnalysis.sweetSpot.avgScore}点 (n={speedAnalysis.sweetSpot.count})
                    </Typography>
                  </Box>
                )}
              </Box>

              {speedAnalysis.ins.length > 0 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 2 }}>
                  {speedAnalysis.ins.map((insight, idx) => (
                    <Alert
                      key={idx}
                      severity={insight.severity}
                      variant="outlined"
                      sx={{ py: 0.5 }}
                    >
                      {insight.message}
                    </Alert>
                  ))}
                </Box>
              )}

              <ResponsiveContainer width="100%" height={220}>
                <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} />
                  <XAxis
                    type="number"
                    dataKey="speed"
                    name="速度"
                    fontSize={10}
                    tick={{ fill: ct.text }}
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
                    tick={{ fill: ct.text }}
                    domain={['dataMin - 50', 'dataMax + 50']}
                  />
                  <Tooltip
                    contentStyle={ct.tooltipStyle}
                    formatter={(v: number | undefined) => [`${(v ?? 0).toFixed(1)}`, '']}
                  />
                  <Scatter data={speedAnalysis.scatter} fill="#7B1FA2" fillOpacity={0.5} />
                </ScatterChart>
              </ResponsiveContainer>
            </Box>
          </Collapse>
        </>
      )}
    </Paper>
  );
}
