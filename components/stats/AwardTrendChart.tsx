'use client';

import { useState } from 'react';
import { Paper, Typography, Box, ToggleButtonGroup, ToggleButton } from '@mui/material';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

type AwardCategory = 'bull' | 'hatTrick' | 'lowTon' | 'highTon' | 'ton80';

interface AwardEntry {
  date: string;
  awards: Record<string, number>;
}

interface AwardTrendChartProps {
  awardList: AwardEntry[];
}

const AWARD_CONFIG: Record<AwardCategory, { label: string; keys: string[]; color: string }> = {
  bull: {
    label: 'BULL系',
    keys: ['BULL', 'S-BULL', 'HAT TRICK BULL'],
    color: '#E53935',
  },
  hatTrick: {
    label: 'HAT TRICK',
    keys: ['HAT TRICK'],
    color: '#FF9800',
  },
  lowTon: {
    label: 'LOW TON',
    keys: ['LOW TON'],
    color: '#4CAF50',
  },
  highTon: {
    label: 'HIGH TON',
    keys: ['HIGH TON'],
    color: '#1E88E5',
  },
  ton80: {
    label: 'TON 80',
    keys: ['TON 80'],
    color: '#7B1FA2',
  },
};

export default function AwardTrendChart({ awardList }: AwardTrendChartProps) {
  const [category, setCategory] = useState<AwardCategory>('bull');

  if (!awardList || awardList.length === 0) return null;

  const config = AWARD_CONFIG[category];
  const chartData = awardList.map((entry) => {
    const total = config.keys.reduce((sum, key) => sum + (entry.awards[key] ?? 0), 0);
    return {
      date: entry.date.replace(/^\d{4}-/, ''),
      value: total,
    };
  });

  return (
    <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
          アワード推移
        </Typography>
        <ToggleButtonGroup
          value={category}
          exclusive
          onChange={(_, v) => {
            if (v) setCategory(v);
          }}
          size="small"
        >
          {Object.entries(AWARD_CONFIG).map(([key, cfg]) => (
            <ToggleButton
              key={key}
              value={key}
              sx={{ '&.Mui-selected': { color: cfg.color }, px: 1, fontSize: 11 }}
            >
              {cfg.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis dataKey="date" fontSize={10} tick={{ fill: '#aaa' }} />
          <YAxis fontSize={11} tick={{ fill: '#aaa' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e1e1e',
              border: '1px solid #444',
              borderRadius: 6,
              color: '#ccc',
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            name={config.label}
            stroke={config.color}
            fill={config.color}
            fillOpacity={0.2}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Paper>
  );
}
