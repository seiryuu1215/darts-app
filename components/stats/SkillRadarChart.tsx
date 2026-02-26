'use client';

import { Paper, Typography, Box } from '@mui/material';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  Legend,
} from 'recharts';
import { RATING_BENCHMARKS } from '@/lib/dartslive-reference';
import { ppdForRating, mprForRating } from '@/lib/dartslive-rating';

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

interface DetailedModeProps {
  simpleMode?: false;
  stats01: Stats01Detailed | null;
  statsCricket: StatsCricketDetailed | null;
  flight?: string;
  stats01Avg?: never;
  statsCriAvg?: never;
  statsPraAvg?: never;
  dBullTotal?: never;
  sBullTotal?: never;
  countUpScores?: never;
}

interface SimpleModeProps {
  simpleMode: true;
  stats01Avg: number | null;
  statsCriAvg: number | null;
  statsPraAvg: number | null;
  dBullTotal: number | null;
  sBullTotal: number | null;
  countUpScores?: number[];
  flight?: string;
  stats01?: never;
  statsCricket?: never;
}

type SkillRadarChartProps = DetailedModeProps | SimpleModeProps;

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
  benchmark?: number;
  rawLabel: string;
}

function getFlightRating(flight?: string): number | null {
  if (!flight) return null;
  const bench = RATING_BENCHMARKS.find((b) => b.flight === flight);
  return bench?.rating ?? null;
}

function buildDetailedData(
  stats01: Stats01Detailed | null,
  statsCricket: StatsCricketDetailed | null,
  flight?: string,
): RadarDataItem[] {
  const rt = getFlightRating(flight);
  const bench = rt != null ? RATING_BENCHMARKS.find((b) => b.rating === rt) : null;
  const benchPpd = rt != null ? ppdForRating(rt) : null;
  const benchMpr = rt != null ? mprForRating(rt) : null;

  return [
    {
      axis: '01 Avg',
      value: normalize(stats01?.avg, 20, 80),
      benchmark: benchPpd != null ? normalize(benchPpd, 20, 80) : undefined,
      rawLabel: `(${formatRaw(stats01?.avg, '')}/80)`,
    },
    {
      axis: '01 勝率',
      value: stats01?.winRate ?? 0,
      benchmark: 50,
      rawLabel: `(${formatRaw(stats01?.winRate, '%')})`,
    },
    {
      axis: 'Bull率',
      value: stats01?.bullRate ?? 0,
      benchmark: bench?.bullRatePerThrow,
      rawLabel: `(${formatRaw(stats01?.bullRate, '%')})`,
    },
    {
      axis: 'アレンジ率',
      value: stats01?.arrangeRate ?? 0,
      benchmark: rt != null ? Math.min(100, rt * 3.5) : undefined,
      rawLabel: `(${formatRaw(stats01?.arrangeRate, '%')})`,
    },
    {
      axis: 'Cri Avg',
      value: normalize(statsCricket?.avg, 0.5, 4.0),
      benchmark: benchMpr != null ? normalize(benchMpr, 0.5, 4.0) : undefined,
      rawLabel: `(${formatRaw(statsCricket?.avg, '')}/4.0)`,
    },
    {
      axis: 'Cri 勝率',
      value: statsCricket?.winRate ?? 0,
      benchmark: 50,
      rawLabel: `(${formatRaw(statsCricket?.winRate, '%')})`,
    },
    {
      axis: 'トリプル率',
      value: Math.max(0, (stats01?.bullRate ?? 0) - 25),
      benchmark:
        bench?.bullRatePerThrow != null ? Math.max(0, bench.bullRatePerThrow - 25) : undefined,
      rawLabel: `(推定${Math.max(0, (stats01?.bullRate ?? 0) - 25).toFixed(1)}% / 実${formatRaw(statsCricket?.tripleRate, '%')})`,
    },
    {
      axis: 'Open-Close',
      value: statsCricket?.openCloseRate ?? 0,
      benchmark: rt != null ? Math.min(100, rt * 3.5) : undefined,
      rawLabel: `(${formatRaw(statsCricket?.openCloseRate, '%')})`,
    },
  ];
}

function buildSimpleData(
  stats01Avg: number | null,
  statsCriAvg: number | null,
  statsPraAvg: number | null,
  dBullTotal: number | null,
  sBullTotal: number | null,
  countUpScores?: number[],
  flight?: string,
): RadarDataItem[] {
  const rt = getFlightRating(flight);
  const benchPpd = rt != null ? ppdForRating(rt) : null;
  const benchMpr = rt != null ? mprForRating(rt) : null;

  // D-Bull率
  const totalBulls = (dBullTotal ?? 0) + (sBullTotal ?? 0);
  const dBullRate = totalBulls > 0 ? ((dBullTotal ?? 0) / totalBulls) * 100 : 0;

  // 安定性 (CVベース)
  let stability = 50;
  if (countUpScores && countUpScores.length >= 3) {
    const avg = countUpScores.reduce((a, b) => a + b, 0) / countUpScores.length;
    const stdDev = Math.sqrt(
      countUpScores.reduce((s, v) => s + (v - avg) ** 2, 0) / countUpScores.length,
    );
    const cv = avg > 0 ? stdDev / avg : 1;
    stability = Math.max(0, Math.min(100, (1 - cv / 0.5) * 100));
  }

  return [
    {
      axis: '01 Avg',
      value: normalize(stats01Avg, 20, 80),
      benchmark: benchPpd != null ? normalize(benchPpd, 20, 80) : undefined,
      rawLabel: stats01Avg != null ? `(${stats01Avg.toFixed(1)})` : '',
    },
    {
      axis: 'Cricket Avg',
      value: normalize(statsCriAvg, 0.5, 4.0),
      benchmark: benchMpr != null ? normalize(benchMpr, 0.5, 4.0) : undefined,
      rawLabel: statsCriAvg != null ? `(${statsCriAvg.toFixed(2)})` : '',
    },
    {
      axis: 'COUNT-UP',
      value: normalize(statsPraAvg, 200, 800),
      benchmark: benchPpd != null ? normalize(benchPpd * 8, 200, 800) : undefined,
      rawLabel: statsPraAvg != null ? `(${Math.round(statsPraAvg)})` : '',
    },
    {
      axis: 'D-Bull率',
      value: dBullRate,
      rawLabel: totalBulls > 0 ? `(${dBullRate.toFixed(1)}%)` : '',
    },
    {
      axis: '安定性',
      value: stability,
      rawLabel: `(${Math.round(stability)})`,
    },
  ];
}

export default function SkillRadarChart(props: SkillRadarChartProps) {
  const isSimple = props.simpleMode === true;
  const hasBenchmark = !!props.flight;

  const data: RadarDataItem[] = isSimple
    ? buildSimpleData(
        props.stats01Avg,
        props.statsCriAvg,
        props.statsPraAvg,
        props.dBullTotal,
        props.sBullTotal,
        props.countUpScores,
        props.flight,
      )
    : buildDetailedData(props.stats01, props.statsCricket, props.flight);

  const hasData = data.some((d) => d.value > 0);
  if (!hasData) return null;

  const showBenchmark = hasBenchmark && data.some((d) => d.benchmark != null);

  return (
    <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
        スキルレーダー{isSimple ? '' : ' (詳細)'}
      </Typography>
      <ResponsiveContainer width="100%" height={isSimple ? 280 : 320}>
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
          {showBenchmark && (
            <Radar
              dataKey="benchmark"
              stroke="#888"
              fill="none"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              dot={false}
            />
          )}
          <Radar
            dataKey="value"
            stroke="#FF9800"
            fill="#FF9800"
            fillOpacity={0.25}
            strokeWidth={2}
          />
          {showBenchmark && (
            <Legend
              content={() => (
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: 2,
                    mt: 0.5,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 16, height: 2, bgcolor: '#FF9800' }} />
                    <Typography variant="caption" color="text.secondary">
                      あなた
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box
                      sx={{
                        width: 16,
                        height: 0,
                        borderTop: '2px dashed #888',
                      }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {props.flight}平均
                    </Typography>
                  </Box>
                </Box>
              )}
            />
          )}
        </RadarChart>
      </ResponsiveContainer>
    </Paper>
  );
}
