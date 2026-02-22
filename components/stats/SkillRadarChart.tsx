'use client';

import { Paper, Typography } from '@mui/material';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts';

interface Stats01Detailed {
  avg: number | null;
  winRate: number | null;
  bullRate: number | null;
  arrangeRate: number | null;
}

interface StatsCricketDetailed {
  avg: number | null;
  winRate: number | null;
  tripleRate: number | null;
  openCloseRate: number | null;
}

interface SkillRadarChartProps {
  stats01: Stats01Detailed | null;
  statsCricket: StatsCricketDetailed | null;
}

function normalize(value: number | null | undefined, min: number, max: number): number {
  if (value == null) return 0;
  return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
}

export default function SkillRadarChart({ stats01, statsCricket }: SkillRadarChartProps) {
  if (!stats01 && !statsCricket) return null;

  const data = [
    { axis: '01 Avg', value: normalize(stats01?.avg, 20, 80) },
    { axis: '01 勝率', value: stats01?.winRate ?? 0 },
    { axis: 'Bull率', value: stats01?.bullRate ?? 0 },
    { axis: 'アレンジ率', value: stats01?.arrangeRate ?? 0 },
    { axis: 'Cri Avg', value: normalize(statsCricket?.avg, 0.5, 4.0) },
    { axis: 'Cri 勝率', value: statsCricket?.winRate ?? 0 },
    { axis: 'トリプル率', value: statsCricket?.tripleRate ?? 0 },
    { axis: 'Open-Close', value: statsCricket?.openCloseRate ?? 0 },
  ];

  return (
    <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
        スキルレーダー
      </Typography>
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
          <PolarGrid stroke="#555" />
          <PolarAngleAxis dataKey="axis" tick={{ fontSize: 11, fill: '#aaa' }} />
          <Radar
            dataKey="value"
            stroke="#FF9800"
            fill="#FF9800"
            fillOpacity={0.25}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </Paper>
  );
}
