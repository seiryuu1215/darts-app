'use client';

import { useState } from 'react';
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
import { COLOR_01, COLOR_CRICKET } from '@/lib/dartslive-colors';

type DailyTab = 'rating' | 'zeroOne' | 'cricket' | 'zeroOneVs' | 'cricketVs';

interface DailyRecord {
  date: string;
  rating: number | null;
  stats01Avg: number | null;
  statsCriAvg: number | null;
  stats01Avg100?: number | null;
  statsCriAvg100?: number | null;
}

interface DailyHistoryChartProps {
  records: DailyRecord[];
  flightColor?: string;
}

const COLOR_01_100 = '#FF8A80';
const COLOR_CRICKET_100 = '#82B1FF';

const TAB_CONFIG: Record<
  DailyTab,
  { label: string; color: string; dataKey: string; compareKey?: string; compareColor?: string }
> = {
  rating: { label: 'RATING', color: '#808080', dataKey: 'rating' },
  zeroOne: { label: '01 GAMES', color: COLOR_01, dataKey: 'stats01Avg' },
  cricket: { label: 'CRICKET', color: COLOR_CRICKET, dataKey: 'statsCriAvg' },
  zeroOneVs: {
    label: '01 80% vs 100%',
    color: COLOR_01,
    dataKey: 'stats01Avg',
    compareKey: 'stats01Avg100',
    compareColor: COLOR_01_100,
  },
  cricketVs: {
    label: 'Cri 80% vs 100%',
    color: COLOR_CRICKET,
    dataKey: 'statsCriAvg',
    compareKey: 'statsCriAvg100',
    compareColor: COLOR_CRICKET_100,
  },
};

export default function DailyHistoryChart({ records, flightColor }: DailyHistoryChartProps) {
  const [tab, setTab] = useState<DailyTab>('rating');
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const chartGrid = isDark ? '#333' : '#ddd';
  const chartText = isDark ? '#ccc' : '#666';
  const chartTooltipBg = isDark ? '#1e1e1e' : '#fff';
  const chartTooltipBorder = isDark ? '#444' : '#ddd';

  const config = { ...TAB_CONFIG };
  if (flightColor) {
    config.rating = { ...config.rating, color: flightColor };
  }

  const current = config[tab];
  const isCompareMode = !!current.compareKey;

  // 日付降順 → 昇順に（チャート表示のため）
  const chartData = [...records]
    .reverse()
    .filter((r) => r[current.dataKey as keyof DailyRecord] != null)
    .map((r) => ({
      date: r.date.replace(/^\d{4}-/, ''),
      value: r[current.dataKey as keyof DailyRecord] as number,
      ...(isCompareMode && current.compareKey
        ? { value100: r[current.compareKey as keyof DailyRecord] as number | null }
        : {}),
    }));

  if (chartData.length === 0) return null;

  // 表示件数が多い場合はラベル間引き
  const tickInterval = chartData.length > 60 ? Math.floor(chartData.length / 20) : undefined;

  return (
    <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
          日別推移
        </Typography>
        <ToggleButtonGroup
          value={tab}
          exclusive
          onChange={(_, v) => {
            if (v) setTab(v);
          }}
          size="small"
        >
          <ToggleButton value="rating" sx={{ '&.Mui-selected': { color: config.rating.color } }}>
            Rt
          </ToggleButton>
          <ToggleButton value="zeroOne" sx={{ '&.Mui-selected': { color: COLOR_01 } }}>
            01
          </ToggleButton>
          <ToggleButton value="cricket" sx={{ '&.Mui-selected': { color: COLOR_CRICKET } }}>
            Cri
          </ToggleButton>
          <ToggleButton value="zeroOneVs" sx={{ '&.Mui-selected': { color: COLOR_01 }, px: 1 }}>
            01vs
          </ToggleButton>
          <ToggleButton
            value="cricketVs"
            sx={{ '&.Mui-selected': { color: COLOR_CRICKET }, px: 1 }}
          >
            Cvs
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
          <XAxis
            dataKey="date"
            fontSize={10}
            tick={{ fill: chartText }}
            interval={tickInterval}
            angle={-30}
            textAnchor="end"
            height={50}
          />
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
            name={isCompareMode ? `${current.label.split(' ')[0]} 80%` : current.label}
            stroke={current.color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5 }}
          />
          {isCompareMode && current.compareKey && (
            <Line
              type="monotone"
              dataKey="value100"
              name={`${current.label.split(' ')[0]} 100%`}
              stroke={current.compareColor}
              strokeWidth={2}
              strokeDasharray="6 3"
              dot={false}
              activeDot={{ r: 5 }}
              connectNulls
            />
          )}
        </LineChart>
      </ResponsiveContainer>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        {chartData.length}日分のデータ
        {isCompareMode && '（実線: 80%、破線: 100%）'}
      </Typography>
    </Paper>
  );
}
