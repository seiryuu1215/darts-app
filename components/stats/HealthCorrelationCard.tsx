'use client';

import { useState, useEffect, useMemo } from 'react';
import { Paper, Box, Typography, Alert, Skeleton } from '@mui/material';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useChartTheme } from '@/lib/chart-theme';
import { analyzeDartsHealthCorrelations } from '@/lib/health-analytics';
import type { HealthDartsCorrelation } from '@/types';

const MIN_RECORDS = 5;

export default function HealthCorrelationCard() {
  const ct = useChartTheme();
  const [data, setData] = useState<HealthDartsCorrelation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/health-correlation?days=90');
        if (res.ok) {
          const json = await res.json();
          if (!cancelled) setData(json.correlations || []);
        }
      } catch (err) {
        console.error('Failed to fetch health correlation data:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const results = useMemo(() => analyzeDartsHealthCorrelations(data), [data]);

  if (loading) {
    return <Skeleton variant="rounded" height={200} sx={{ mb: 2, borderRadius: 2 }} />;
  }

  // データ不足の場合は表示しない
  if (data.length < MIN_RECORDS || results.length === 0) return null;

  // 上位3つの強い相関を取得
  const topResults = results.slice(0, 3);
  const strongest = results[0];

  // 最強相関の散布図データ
  const scatterData = data
    .filter(
      (d) =>
        d[strongest.metric as keyof HealthDartsCorrelation] !== null &&
        d[strongest.dartsMetric] !== null,
    )
    .map((d) => ({
      x: d[strongest.metric as keyof HealthDartsCorrelation] as number,
      y: d[strongest.dartsMetric] as number,
    }));

  return (
    <Paper sx={{ p: 2, mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1.5 }}>
        ヘルスケア × ダーツ相関
      </Typography>

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
        <Paper variant="outlined" sx={{ flex: 1, minWidth: 80, p: 1, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            最強相関
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            {strongest.r.toFixed(2)}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
            {strongest.metricLabel} × {strongest.dartsLabel}
          </Typography>
        </Paper>
        <Paper variant="outlined" sx={{ flex: 1, minWidth: 80, p: 1, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            分析対象日数
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            {data.length}
          </Typography>
        </Paper>
      </Box>

      {/* 散布図 */}
      {scatterData.length >= MIN_RECORDS && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            {strongest.metricLabel} vs {strongest.dartsLabel}
          </Typography>
          <Box sx={{ width: '100%', height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} />
                <XAxis
                  dataKey="x"
                  type="number"
                  name={strongest.metricLabel}
                  tick={{ fontSize: 10, fill: ct.text }}
                />
                <YAxis
                  dataKey="y"
                  type="number"
                  name={strongest.dartsLabel}
                  tick={{ fontSize: 10, fill: ct.text }}
                />
                <Tooltip
                  contentStyle={{ ...ct.tooltipStyle, fontSize: 12 }}
                  formatter={(v: number | undefined, n: string | undefined) => [
                    v !== undefined ? v.toFixed(1) : '--',
                    n === 'x' ? strongest.metricLabel : strongest.dartsLabel,
                  ]}
                />
                <Scatter data={scatterData} fill="#8884d8" fillOpacity={0.6} />
              </ScatterChart>
            </ResponsiveContainer>
          </Box>
        </Box>
      )}

      {/* インサイト */}
      {topResults.map((result, i) => (
        <Alert
          key={i}
          severity={Math.abs(result.r) > 0.5 ? 'success' : 'info'}
          sx={{ mt: 1, '& .MuiAlert-message': { fontSize: 13 } }}
        >
          {result.messageJa}
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
            相関係数: {result.r.toFixed(2)} / データ数: {result.n}
          </Typography>
        </Alert>
      ))}
    </Paper>
  );
}
