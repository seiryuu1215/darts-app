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

/** 偏りの大きさを日本語で表現 */
function biasLabel(value: number): string {
  const abs = Math.abs(value);
  if (abs < 2) return 'ほぼ中央';
  if (abs < 5) return 'わずかにズレ';
  if (abs < 10) return 'ややズレあり';
  return '大きくズレ';
}

/** グルーピングの評価 */
function groupingLabel(radius: number): string {
  if (radius < 15) return '非常にまとまっている';
  if (radius < 25) return 'まとまっている';
  if (radius < 35) return '普通';
  return 'バラつきあり';
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

    return { scatter, correlation, sweetSpot, validCount: validPlays.length, ins };
  }, [countupPlays]);

  if (!analysis) return null;

  const { trendPoints, overallStats } = analysis;

  const xBias = overallStats.avgVectorX;
  const yBias = overallStats.avgVectorY;

  return (
    <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
          DL3センサー分析
        </Typography>
        <Chip
          label={`${trendPoints.length}件`}
          size="small"
          color="secondary"
          sx={{ fontSize: 10, height: 20 }}
        />
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
        DARTSLIVE3のセンサーデータから、投げ方のクセや傾向を分析します
      </Typography>

      {/* サマリー — わかりやすい表現 */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
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
            投げる速さ
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
            左右のクセ
          </Typography>
          <Typography
            variant="body1"
            sx={{
              fontWeight: 'bold',
              color: Math.abs(xBias) > 5 ? '#ff9800' : 'success.main',
            }}
          >
            {Math.abs(xBias) < 2 ? '中央' : `${xBias > 0 ? '右' : '左'}寄り`}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: 9 }}>
            {biasLabel(xBias)}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            上下のクセ
          </Typography>
          <Typography
            variant="body1"
            sx={{
              fontWeight: 'bold',
              color: Math.abs(yBias) > 5 ? '#ff9800' : 'success.main',
            }}
          >
            {Math.abs(yBias) < 2 ? '中央' : `${yBias > 0 ? '下' : '上'}寄り`}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: 9 }}>
            {biasLabel(yBias)}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            まとまり具合
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            {overallStats.avgRadius.toFixed(1)}mm
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: 9 }}>
            {groupingLabel(overallStats.avgRadius)}
          </Typography>
          {overallStats.radiusImprovement != null && (
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                fontSize: 9,
                color: overallStats.radiusImprovement < 0 ? 'success.main' : 'error.main',
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

      {/* ベクトル散布図 */}
      {trendPoints.length > 10 && (
        <>
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 'bold', mb: 0.5 }}
            color="text.secondary"
          >
            着弾位置の分布
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            中心に近いほど安定。偏っている方向にクセがあります
          </Typography>
          <ResponsiveContainer width="100%" height={220}>
            <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} />
              <XAxis
                type="number"
                dataKey="vectorX"
                name="X"
                fontSize={10}
                tick={{ fill: ct.text }}
                label={{ value: '← 左　　右 →', position: 'bottom', fontSize: 10, fill: ct.text }}
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
                  fill: ct.text,
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
              投げる速さとスコアの関係
            </Typography>
            <Chip
              label={`${speedAnalysis.validCount}件`}
              size="small"
              color="secondary"
              sx={{ fontSize: 10, height: 20 }}
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
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mb: 1.5 }}
              >
                速く投げた方が良いのか、ゆっくり投げた方が良いのかを分析します
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: 1.5,
                  p: 1.5,
                  borderRadius: 1,
                  bgcolor: 'action.hover',
                  border: 1,
                  borderColor: 'divider',
                  mb: 2,
                }}
              >
                {speedAnalysis.sweetSpot && (
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      ベストな速度帯
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'success.main' }}>
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
                <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} />
                  <XAxis
                    type="number"
                    dataKey="speed"
                    name="速度"
                    fontSize={10}
                    tick={{ fill: ct.text }}
                    label={{
                      value: '速度 (km/h)',
                      position: 'bottom',
                      fontSize: 10,
                      fill: ct.text,
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
