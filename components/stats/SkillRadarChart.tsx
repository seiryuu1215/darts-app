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
  hatTrickRate?: never;
  countUpScores?: never;
}

interface SimpleModeProps {
  simpleMode: true;
  stats01Avg: number | null;
  statsCriAvg: number | null;
  statsPraAvg: number | null;
  bullRate?: number | null;
  noBullRate?: number | null;
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

/** 次フライトの最上位Rtを返す（レーダーの最大値・ベンチマーク基準） */
const NEXT_FLIGHT_MAX_RT: Record<string, number> = {
  N: 3, // N → C(2-3) の最上位
  C: 5, // C → CC(4-5)
  CC: 7, // CC → B(6-7)
  B: 9, // B → BB(8-9)
  BB: 11, // BB → A(10-11)
  A: 13, // A → AA(12-13)
  AA: 16, // AA → SA(14-18) の中間
  SA: 18, // SA → SA最上位
};

function getNextFlightTargetRt(flight?: string): number | null {
  if (!flight) return null;
  return NEXT_FLIGHT_MAX_RT[flight] ?? null;
}

function buildDetailedData(
  stats01: Stats01Detailed | null,
  statsCricket: StatsCricketDetailed | null,
  flight?: string,
): RadarDataItem[] {
  // 次フライトの最上位Rtをベンチマーク基準として使う
  const targetRt = getNextFlightTargetRt(flight);
  const targetBench =
    targetRt != null ? RATING_BENCHMARKS.find((b) => b.rating === targetRt) : null;
  const nextPpd = targetRt != null ? ppdForRating(targetRt) : null;
  const nextMpr = targetRt != null ? mprForRating(targetRt) : null;
  const max01 = nextPpd ?? 80;
  const maxCri = nextMpr ?? 4.0;

  return [
    {
      axis: '01 Avg',
      value: normalize(stats01?.avg, 20, max01),
      benchmark: nextPpd != null ? normalize(nextPpd, 20, max01) : undefined,
      rawLabel: `(${formatRaw(stats01?.avg, '')}/${max01.toFixed(0)})`,
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
      benchmark: targetBench?.bullRatePerThrow,
      rawLabel: `(${formatRaw(stats01?.bullRate, '%')})`,
    },
    {
      axis: 'アレンジ率',
      value: stats01?.arrangeRate ?? 0,
      benchmark: targetRt != null ? Math.min(100, targetRt * 3.5) : undefined,
      rawLabel: `(${formatRaw(stats01?.arrangeRate, '%')})`,
    },
    {
      axis: 'Cri Avg',
      value: normalize(statsCricket?.avg, 0.5, maxCri),
      benchmark: nextMpr != null ? normalize(nextMpr, 0.5, maxCri) : undefined,
      rawLabel: `(${formatRaw(statsCricket?.avg, '')}/${maxCri.toFixed(1)})`,
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
        targetBench?.bullRatePerThrow != null
          ? Math.max(0, targetBench.bullRatePerThrow - 25)
          : undefined,
      rawLabel: `(推定${Math.max(0, (stats01?.bullRate ?? 0) - 25).toFixed(1)}% / 実${formatRaw(statsCricket?.tripleRate, '%')})`,
    },
    {
      axis: 'Open-Close',
      value: statsCricket?.openCloseRate ?? 0,
      benchmark: targetRt != null ? Math.min(100, targetRt * 3.5) : undefined,
      rawLabel: `(${formatRaw(statsCricket?.openCloseRate, '%')})`,
    },
  ];
}

function buildSimpleData(
  stats01Avg: number | null,
  statsCriAvg: number | null,
  statsPraAvg: number | null,
  bullRate: number | null | undefined,
  noBullRate: number | null | undefined,
  flight?: string,
): RadarDataItem[] {
  // 次フライトの最上位Rtをベンチマーク基準として使う
  const targetRt = getNextFlightTargetRt(flight);
  const targetBench =
    targetRt != null ? RATING_BENCHMARKS.find((b) => b.rating === targetRt) : null;
  const nextPpd = targetRt != null ? ppdForRating(targetRt) : null;
  const nextMpr = targetRt != null ? mprForRating(targetRt) : null;
  const max01 = nextPpd ?? 80;
  const maxCri = nextMpr ?? 4.0;
  const maxCU = nextPpd != null ? nextPpd * 8 : 800;
  const maxBull = targetBench?.bullRatePerThrow ?? 40;
  // ノーブル率: 低い方が優秀 → max = 100(最悪値), min = targetBenchのnoBullRate(目標値)
  const minNoBull = targetBench?.noBullRate ?? 30;

  const br = bullRate ?? 0;
  const nbr = noBullRate ?? 0;

  return [
    {
      axis: '01 Avg',
      value: normalize(stats01Avg, 20, max01),
      benchmark: nextPpd != null ? normalize(nextPpd, 20, max01) : undefined,
      rawLabel: stats01Avg != null ? `(${stats01Avg.toFixed(1)})` : '',
    },
    {
      axis: 'Cricket Avg',
      value: normalize(statsCriAvg, 0.5, maxCri),
      benchmark: nextMpr != null ? normalize(nextMpr, 0.5, maxCri) : undefined,
      rawLabel: statsCriAvg != null ? `(${statsCriAvg.toFixed(2)})` : '',
    },
    {
      axis: 'COUNT-UP',
      value: normalize(statsPraAvg, 200, maxCU),
      benchmark: nextPpd != null ? normalize(nextPpd * 8, 200, maxCU) : undefined,
      rawLabel: statsPraAvg != null ? `(${Math.round(statsPraAvg)})` : '',
    },
    {
      axis: 'ブル率',
      value: normalize(br, 0, maxBull),
      benchmark:
        targetBench?.bullRatePerThrow != null
          ? normalize(targetBench.bullRatePerThrow, 0, maxBull)
          : undefined,
      rawLabel: bullRate != null ? `(${br.toFixed(1)}%)` : '',
    },
    {
      axis: 'ノーブル率',
      // ノーブル率は低い方が良い → 反転正規化 (100からの距離)
      value: normalize(100 - nbr, 0, 100 - minNoBull),
      benchmark:
        targetBench?.noBullRate != null
          ? normalize(100 - targetBench.noBullRate, 0, 100 - minNoBull)
          : undefined,
      rawLabel: noBullRate != null ? `(${nbr.toFixed(1)}%)` : '',
    },
  ];
}

export default function SkillRadarChart(props: SkillRadarChartProps) {
  const isSimple = props.simpleMode === true;
  const hasBenchmark = !!props.flight;
  const targetRt = getNextFlightTargetRt(props.flight);

  const data: RadarDataItem[] = isSimple
    ? buildSimpleData(
        props.stats01Avg,
        props.statsCriAvg,
        props.statsPraAvg,
        props.bullRate,
        props.noBullRate,
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
                      Rt.{targetRt}平均
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
