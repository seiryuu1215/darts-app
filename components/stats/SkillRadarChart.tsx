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

function formatRaw(value: number | null | undefined, unit: string): string {
  if (value == null) return '--';
  return `${value}${unit}`;
}

interface RadarDataItem {
  axis: string;
  value: number;
  rawLabel: string;
}

export default function SkillRadarChart({ stats01, statsCricket }: SkillRadarChartProps) {
  if (!stats01 && !statsCricket) return null;

  const data: RadarDataItem[] = [
    {
      axis: '01 Avg',
      value: normalize(stats01?.avg, 20, 80),
      rawLabel: `(${formatRaw(stats01?.avg, '')}/80)`,
    },
    {
      axis: '01 勝率',
      value: stats01?.winRate ?? 0,
      rawLabel: `(${formatRaw(stats01?.winRate, '%')})`,
    },
    {
      axis: 'Bull率',
      value: stats01?.bullRate ?? 0,
      rawLabel: `(${formatRaw(stats01?.bullRate, '%')})`,
    },
    {
      axis: 'アレンジ率',
      value: stats01?.arrangeRate ?? 0,
      rawLabel: `(${formatRaw(stats01?.arrangeRate, '%')})`,
    },
    {
      axis: 'Cri Avg',
      value: normalize(statsCricket?.avg, 0.5, 4.0),
      rawLabel: `(${formatRaw(statsCricket?.avg, '')}/4.0)`,
    },
    {
      axis: 'Cri 勝率',
      value: statsCricket?.winRate ?? 0,
      rawLabel: `(${formatRaw(statsCricket?.winRate, '%')})`,
    },
    {
      axis: 'トリプル率',
      value: statsCricket?.tripleRate ?? 0,
      rawLabel: `(${formatRaw(statsCricket?.tripleRate, '%')})`,
    },
    {
      axis: 'Open-Close',
      value: statsCricket?.openCloseRate ?? 0,
      rawLabel: `(${formatRaw(statsCricket?.openCloseRate, '%')})`,
    },
  ];

  return (
    <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
        スキルレーダー
      </Typography>
      <ResponsiveContainer width="100%" height={320}>
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="65%">
          <PolarGrid stroke="#555" />
          <PolarAngleAxis
            dataKey="axis"
            tick={({ x, y, payload, index }: Record<string, unknown>) => {
              const item = data[index as number];
              return (
                <g transform={`translate(${x},${y})`}>
                  <text
                    textAnchor="middle"
                    fill="#aaa"
                    fontSize={11}
                    dominantBaseline="central"
                    dy={-6}
                  >
                    {payload && typeof payload === 'object' && 'value' in payload
                      ? (payload as { value: string }).value
                      : ''}
                  </text>
                  <text
                    textAnchor="middle"
                    fill="#888"
                    fontSize={9}
                    dominantBaseline="central"
                    dy={8}
                  >
                    {item?.rawLabel ?? ''}
                  </text>
                </g>
              );
            }}
          />
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
