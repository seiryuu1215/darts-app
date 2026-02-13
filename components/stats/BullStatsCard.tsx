'use client';

import { Paper, Box, Typography, useTheme } from '@mui/material';
import AdjustIcon from '@mui/icons-material/Adjust';
import PercentileChip from './PercentileChip';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  LineChart,
  Line,
} from 'recharts';

export interface BullHistoryEntry {
  date: string;
  dBull: number | null;
  sBull: number | null;
}

interface BullStatsCardProps {
  awards: Record<string, { monthly: number; total: number }>;
  bullHistory?: BullHistoryEntry[];
}

export default function BullStatsCard({ awards, bullHistory }: BullStatsCardProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const chartText = isDark ? '#ccc' : '#666';
  const chartGrid = isDark ? '#333' : '#ddd';
  const chartTooltipBg = isDark ? '#1e1e1e' : '#fff';
  const chartTooltipBorder = isDark ? '#444' : '#ddd';

  const dBull = awards['D-BULL'] ?? { monthly: 0, total: 0 };
  const sBull = awards['S-BULL'] ?? { monthly: 0, total: 0 };
  const totalBulls = dBull.total + sBull.total;
  const monthlyBulls = dBull.monthly + sBull.monthly;

  if (totalBulls === 0) return null;

  const pieData = [
    { name: 'D-BULL', value: dBull.total },
    { name: 'S-BULL', value: sBull.total },
  ];

  const barData = [
    {
      name: '今月',
      'D-BULL': dBull.monthly,
      'S-BULL': sBull.monthly,
    },
  ];

  const DBULL_COLOR = '#FFB300'; // 金
  const SBULL_COLOR = '#90A4AE'; // 銀

  return (
    <Paper sx={{ p: 2, mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.5 }}>
        <AdjustIcon sx={{ fontSize: 18, color: DBULL_COLOR }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', flex: 1 }}>
          ブル統計
        </Typography>
        <PercentileChip type="bull" value={totalBulls} />
      </Box>

      {/* 数値サマリー */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <Paper variant="outlined" sx={{ flex: 1, p: 1.5, textAlign: 'center' }}>
          <Typography variant="caption" sx={{ color: DBULL_COLOR, fontWeight: 'bold' }}>
            D-BULL
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            {dBull.total.toLocaleString()}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            今月 {dBull.monthly}
          </Typography>
        </Paper>
        <Paper variant="outlined" sx={{ flex: 1, p: 1.5, textAlign: 'center' }}>
          <Typography variant="caption" sx={{ color: SBULL_COLOR, fontWeight: 'bold' }}>
            S-BULL
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            {sBull.total.toLocaleString()}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            今月 {sBull.monthly}
          </Typography>
        </Paper>
        <Paper variant="outlined" sx={{ flex: 1, p: 1.5, textAlign: 'center' }}>
          <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
            累計ブル
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            {totalBulls.toLocaleString()}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            今月 {monthlyBulls}
          </Typography>
        </Paper>
      </Box>

      {/* チャートエリア */}
      <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
        {/* ドーナツチャート */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
            D-BULL / S-BULL 比率
          </Typography>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={65}
                paddingAngle={3}
                dataKey="value"
              >
                <Cell fill={DBULL_COLOR} />
                <Cell fill={SBULL_COLOR} />
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: chartTooltipBg,
                  border: `1px solid ${chartTooltipBorder}`,
                  borderRadius: 6,
                  color: chartText,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </Box>

        {/* 今月バーチャート */}
        {monthlyBulls > 0 && (
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
              今月のブル
            </Typography>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
                <XAxis dataKey="name" fontSize={11} tick={{ fill: chartText }} />
                <YAxis fontSize={11} tick={{ fill: chartText }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: chartTooltipBg,
                    border: `1px solid ${chartTooltipBorder}`,
                    borderRadius: 6,
                    color: chartText,
                  }}
                />
                <Bar dataKey="D-BULL" stackId="bull" fill={DBULL_COLOR} radius={[2, 2, 0, 0]} />
                <Bar dataKey="S-BULL" stackId="bull" fill={SBULL_COLOR} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        )}
      </Box>

      {/* ブル累計推移チャート */}
      {bullHistory && bullHistory.length >= 2 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
            ブル累計推移
          </Typography>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart
              data={bullHistory.map((h) => ({
                date: h.date.slice(5, 10).replace('-', '/'),
                'D-BULL': h.dBull,
                'S-BULL': h.sBull,
                合計: (h.dBull ?? 0) + (h.sBull ?? 0),
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
              <XAxis dataKey="date" fontSize={10} tick={{ fill: chartText }} />
              <YAxis fontSize={10} tick={{ fill: chartText }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: chartTooltipBg,
                  border: `1px solid ${chartTooltipBorder}`,
                  borderRadius: 6,
                  color: chartText,
                }}
              />
              <Line
                type="monotone"
                dataKey="D-BULL"
                stroke={DBULL_COLOR}
                dot={false}
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="S-BULL"
                stroke={SBULL_COLOR}
                dot={false}
                strokeWidth={2}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      )}
    </Paper>
  );
}
