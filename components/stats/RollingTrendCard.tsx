'use client';

import { useMemo, useState } from 'react';
import { Paper, Typography, Box, ToggleButton, ToggleButtonGroup, Chip } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceDot,
} from 'recharts';
import { computeSMA, detectCrosses, classifyTrend } from '@/lib/stats-trend';
import type { CrossSignal } from '@/lib/stats-trend';
import { COLOR_01, COLOR_CRICKET } from '@/lib/dartslive-colors';

interface DailyRecord {
  date: string;
  rating: number | null;
  stats01Avg: number | null;
  statsCriAvg: number | null;
}

interface RollingTrendCardProps {
  dailyHistory: DailyRecord[];
}

type MetricKey = 'rating' | 'stats01Avg' | 'statsCriAvg';

const METRICS: { key: MetricKey; label: string; color: string }[] = [
  { key: 'rating', label: 'Rating', color: '#FF9800' },
  { key: 'stats01Avg', label: '01 Avg', color: COLOR_01 },
  { key: 'statsCriAvg', label: 'Cri Avg', color: COLOR_CRICKET },
];

const TOOLTIP_STYLE = {
  backgroundColor: '#1e1e1e',
  border: '1px solid #444',
  borderRadius: 6,
  color: '#ccc',
};

export default function RollingTrendCard({ dailyHistory }: RollingTrendCardProps) {
  const [metric, setMetric] = useState<MetricKey>('rating');

  const sorted = useMemo(
    () => [...dailyHistory].sort((a, b) => a.date.localeCompare(b.date)),
    [dailyHistory],
  );

  const smaData = useMemo(() => {
    const dataPoints = sorted.map((d) => ({
      date: d.date,
      value: d[metric],
    }));
    return computeSMA(dataPoints);
  }, [sorted, metric]);

  const crosses = useMemo(() => detectCrosses(smaData), [smaData]);

  const trend = useMemo(() => classifyTrend(smaData), [smaData]);

  const metricConfig = METRICS.find((m) => m.key === metric)!;

  if (sorted.length < 7) return null;

  const TrendIcon =
    trend.direction === 'up'
      ? TrendingUpIcon
      : trend.direction === 'down'
        ? TrendingDownIcon
        : TrendingFlatIcon;

  // チャートデータ（日付表示を短縮）
  const chartData = smaData.map((d) => ({
    ...d,
    displayDate: d.date.replace(/^\d{4}-/, ''),
  }));

  // 直近のクロスシグナル（最大5件）
  const recentCrosses = crosses.slice(-5);

  return (
    <Paper sx={{ p: 2, borderRadius: 2, flex: 1, minWidth: 0 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
          トレンド分析
        </Typography>
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.3,
            px: 1,
            py: 0.2,
            borderRadius: 1,
            bgcolor: `${trend.color}22`,
            border: `1px solid ${trend.color}`,
          }}
        >
          <TrendIcon sx={{ fontSize: 14, color: trend.color }} />
          <Typography variant="caption" sx={{ fontWeight: 'bold', color: trend.color }}>
            {trend.label}
          </Typography>
        </Box>
      </Box>

      {/* メトリック選択 */}
      <ToggleButtonGroup
        value={metric}
        exclusive
        onChange={(_, v) => v && setMetric(v as MetricKey)}
        size="small"
        sx={{ mb: 1.5 }}
      >
        {METRICS.map((m) => (
          <ToggleButton
            key={m.key}
            value={m.key}
            sx={{
              fontSize: 11,
              px: 1.2,
              py: 0.4,
              textTransform: 'none',
              '&.Mui-selected': { bgcolor: `${m.color}33` },
            }}
          >
            {m.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      {/* SMAチャート */}
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis dataKey="displayDate" fontSize={10} tick={{ fill: '#aaa' }} />
          <YAxis fontSize={11} tick={{ fill: '#aaa' }} domain={['dataMin - 1', 'dataMax + 1']} />
          <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={(label) => `日付: ${label}`} />
          {/* 生データ */}
          <Line
            type="monotone"
            dataKey="value"
            stroke={metricConfig.color}
            strokeWidth={1}
            strokeOpacity={0.3}
            dot={false}
            name="実値"
          />
          {/* 7日MA */}
          <Line
            type="monotone"
            dataKey="sma7"
            stroke={metricConfig.color}
            strokeWidth={2}
            dot={false}
            name="7日MA"
          />
          {/* 14日MA */}
          <Line
            type="monotone"
            dataKey="sma14"
            stroke="#aaa"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            dot={false}
            name="14日MA"
          />
          {/* 30日MA */}
          <Line
            type="monotone"
            dataKey="sma30"
            stroke="#666"
            strokeWidth={1.5}
            strokeDasharray="8 4"
            dot={false}
            name="30日MA"
          />
          {/* クロスシグナル */}
          {recentCrosses.map((c: CrossSignal) => (
            <ReferenceDot
              key={`${c.date}-${c.type}`}
              x={c.date.replace(/^\d{4}-/, '')}
              y={c.shortSma}
              r={6}
              fill={c.type === 'golden' ? '#4caf50' : '#f44336'}
              stroke="#fff"
              strokeWidth={1.5}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      {/* 凡例 */}
      <Box sx={{ display: 'flex', gap: 2, mt: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 16, height: 2, bgcolor: metricConfig.color, borderRadius: 1 }} />
          <Typography variant="caption" color="text.secondary">
            7日MA
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box
            sx={{
              width: 16,
              height: 2,
              bgcolor: '#aaa',
              borderRadius: 1,
              borderTop: '1px dashed #aaa',
            }}
          />
          <Typography variant="caption" color="text.secondary">
            14日MA
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box
            sx={{
              width: 16,
              height: 2,
              bgcolor: '#666',
              borderRadius: 1,
              borderTop: '1px dashed #666',
            }}
          />
          <Typography variant="caption" color="text.secondary">
            30日MA
          </Typography>
        </Box>
      </Box>

      {/* クロスシグナル一覧 */}
      {recentCrosses.length > 0 && (
        <Box sx={{ mt: 1.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
            シグナル
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
            {recentCrosses.map((c: CrossSignal) => (
              <Chip
                key={`${c.date}-${c.type}`}
                label={`${c.date.replace(/^\d{4}-/, '')} ${c.type === 'golden' ? 'GC' : 'DC'}`}
                size="small"
                sx={{
                  fontSize: 10,
                  height: 22,
                  bgcolor: c.type === 'golden' ? 'rgba(76,175,80,0.2)' : 'rgba(244,67,54,0.2)',
                  color: c.type === 'golden' ? '#4caf50' : '#f44336',
                  border: `1px solid ${c.type === 'golden' ? '#4caf50' : '#f44336'}`,
                }}
              />
            ))}
          </Box>
        </Box>
      )}
    </Paper>
  );
}
