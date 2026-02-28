'use client';

import { Paper, Box, Typography, Alert } from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useChartTheme } from '@/lib/chart-theme';

interface StatsHistoryRecord {
  id: string;
  date: string;
  rating: number | null;
  ppd: number | null;
  mpr: number | null;
  gamesPlayed: number;
  condition: number | null;
  memo: string;
  dBull: number | null;
  sBull: number | null;
}

interface ConditionCorrelationCardProps {
  periodRecords: StatsHistoryRecord[];
}

const MIN_RECORDS = 5;

const CONDITION_COLORS: Record<number, string> = {
  1: '#f44336',
  2: '#ff9800',
  3: '#fdd835',
  4: '#8bc34a',
  5: '#4caf50',
};

function pearsonCorrelation(xs: number[], ys: number[]): number {
  const n = xs.length;
  if (n < 3) return 0;
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let denX = 0;
  let denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  const den = Math.sqrt(denX * denY);
  return den === 0 ? 0 : num / den;
}

export default function ConditionCorrelationCard({ periodRecords }: ConditionCorrelationCardProps) {
  const ct = useChartTheme();
  const valid = periodRecords.filter(
    (r) => r.condition != null && r.condition >= 1 && r.condition <= 5 && r.ppd != null,
  );
  if (valid.length < MIN_RECORDS) return null;

  const conditions = valid.map((r) => r.condition!);
  const ppds = valid.map((r) => r.ppd!);
  const r = pearsonCorrelation(conditions, ppds);

  // condition別の平均PPD集計
  const groups: Record<number, number[]> = { 1: [], 2: [], 3: [], 4: [], 5: [] };
  for (const rec of valid) {
    groups[rec.condition!].push(rec.ppd!);
  }

  const chartData = [1, 2, 3, 4, 5]
    .filter((c) => groups[c].length > 0)
    .map((c) => ({
      condition: `★${c}`,
      conditionNum: c,
      avgPpd: Math.round((groups[c].reduce((a, b) => a + b, 0) / groups[c].length) * 10) / 10,
      count: groups[c].length,
    }));

  // 好調時(4-5) vs 不調時(1-3)の平均PPD差
  const highPpds = [...groups[4], ...groups[5]];
  const lowPpds = [...groups[1], ...groups[2], ...groups[3]];
  const highAvg = highPpds.length > 0 ? highPpds.reduce((a, b) => a + b, 0) / highPpds.length : 0;
  const lowAvg = lowPpds.length > 0 ? lowPpds.reduce((a, b) => a + b, 0) / lowPpds.length : 0;
  const diff = highAvg - lowAvg;

  // インサイト生成
  const insights: { severity: 'success' | 'info' | 'warning'; message: string }[] = [];
  if (r > 0.3) {
    insights.push({
      severity: 'success',
      message: '体調の自己評価がパフォーマンスに反映されています',
    });
  } else if (r < 0.1) {
    insights.push({
      severity: 'info',
      message: '体調とスタッツの相関は弱めです。客観的な数値を重視しましょう',
    });
  }
  if (highPpds.length > 0 && lowPpds.length > 0 && diff > 0) {
    insights.push({
      severity: 'info',
      message: `好調時はPPDが平均+${diff.toFixed(1)}高い傾向`,
    });
  }

  return (
    <Paper sx={{ p: 2, mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1.5 }}>
        コンディション × パフォーマンス相関
      </Typography>

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
        <Paper variant="outlined" sx={{ flex: 1, minWidth: 80, p: 1, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            相関係数
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            {r.toFixed(2)}
          </Typography>
        </Paper>
        <Paper variant="outlined" sx={{ flex: 1, minWidth: 80, p: 1, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            対象日数
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            {valid.length}
          </Typography>
        </Paper>
      </Box>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
        コンディション別 平均PPD
      </Typography>
      <Box sx={{ width: '100%', height: 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={ct.grid} />
            <XAxis dataKey="condition" tick={{ fontSize: 11, fill: ct.text }} />
            <YAxis tick={{ fontSize: 11, fill: ct.text }} />
            <Tooltip
              formatter={(v: number | undefined) => [`${v ?? 0}`, '平均PPD']}
              contentStyle={{ ...ct.tooltipStyle, fontSize: 12 }}
            />
            <Bar dataKey="avgPpd" radius={[4, 4, 0, 0]}>
              {chartData.map((entry) => (
                <Cell key={entry.conditionNum} fill={CONDITION_COLORS[entry.conditionNum]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Box>

      {insights.map((insight, i) => (
        <Alert key={i} severity={insight.severity} sx={{ mt: 1.5 }}>
          {insight.message}
        </Alert>
      ))}
    </Paper>
  );
}
