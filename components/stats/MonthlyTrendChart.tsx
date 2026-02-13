'use client';

import { Paper, Box, Typography, ToggleButtonGroup, ToggleButton, useTheme } from '@mui/material';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { COLOR_01, COLOR_CRICKET, COLOR_COUNTUP } from '@/lib/dartslive-colors';

type MonthlyTab = 'rating' | 'zeroOne' | 'cricket' | 'countUp';

const MONTHLY_CONFIG_BASE: Record<MonthlyTab, { label: string; color: string }> = {
  rating: { label: 'RATING', color: '#808080' },
  zeroOne: { label: '01 GAMES', color: COLOR_01 },
  cricket: { label: 'CRICKET', color: COLOR_CRICKET },
  countUp: { label: 'COUNT-UP', color: COLOR_COUNTUP },
};

interface MonthlyTrendChartProps {
  monthly: Record<string, { month: string; value: number }[]>;
  monthlyTab: MonthlyTab;
  onTabChange: (tab: MonthlyTab) => void;
  flightColor: string;
}

export default function MonthlyTrendChart({
  monthly,
  monthlyTab,
  onTabChange,
  flightColor,
}: MonthlyTrendChartProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const chartGrid = isDark ? '#333' : '#ddd';
  const chartText = isDark ? '#ccc' : '#666';
  const chartTooltipBg = isDark ? '#1e1e1e' : '#fff';
  const chartTooltipBorder = isDark ? '#444' : '#ddd';

  const monthlyConfig = { ...MONTHLY_CONFIG_BASE, rating: { label: 'RATING', color: flightColor } };
  const chartData = monthly[monthlyTab]?.slice().reverse() || [];

  if (chartData.length === 0) return null;

  return (
    <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
      <Box
        sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
          月間推移
        </Typography>
        <ToggleButtonGroup
          value={monthlyTab}
          exclusive
          onChange={(_, v) => {
            if (v) onTabChange(v);
          }}
          size="small"
        >
          <ToggleButton value="rating" sx={{ '&.Mui-selected': { color: flightColor } }}>
            Rt
          </ToggleButton>
          <ToggleButton value="zeroOne" sx={{ '&.Mui-selected': { color: COLOR_01 } }}>
            01
          </ToggleButton>
          <ToggleButton value="cricket" sx={{ '&.Mui-selected': { color: COLOR_CRICKET } }}>
            Cri
          </ToggleButton>
          <ToggleButton value="countUp" sx={{ '&.Mui-selected': { color: COLOR_COUNTUP } }}>
            CU
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
          <XAxis dataKey="month" fontSize={11} tick={{ fill: chartText }} />
          <YAxis domain={['auto', 'auto']} fontSize={11} tick={{ fill: chartText }} />
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
            dataKey="value"
            name={monthlyConfig[monthlyTab].label}
            stroke={monthlyConfig[monthlyTab].color}
            strokeWidth={2.5}
            dot={{ r: 3, fill: monthlyConfig[monthlyTab].color }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Paper>
  );
}
