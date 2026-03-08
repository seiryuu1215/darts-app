'use client';

import { useMemo } from 'react';
import { Paper, Typography, Box, Chip, Alert } from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { compareLastTwoSessions, extractQualifiedSessions } from '@/lib/countup-session-compare';
import { computeSegmentFrequency } from '@/lib/heatmap-data';
import { calc01Rating } from '@/lib/dartslive-rating';
import { getBenchmarkByRating } from '@/lib/dartslive-reference';
import { useChartTheme } from '@/lib/chart-theme';
import MiniDartboardSvg from './MiniDartboardSvg';
import type { CountUpPlay } from './countup-deep-shared';

interface SessionCompareCardProps {
  countupPlays: CountUpPlay[];
}

// ─── サブコンポーネント ───────────────────────────

/** 簡易ミス方向ボード */
function MiniMissBoard({
  directions,
  bullRate,
  primaryDir,
}: {
  directions: { direction: string; percentage: number }[];
  bullRate: number;
  primaryDir: string;
}) {
  const maxPct = Math.max(...directions.map((d) => d.percentage), 1);
  const size = 180;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 12;
  const innerR = 28;

  const dirAngles: Record<string, number> = {
    上: 0,
    右上: 45,
    右: 90,
    右下: 135,
    下: 180,
    左下: 225,
    左: 270,
    左上: 315,
  };

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={outerR} fill="none" stroke="#333" strokeWidth="0.5" />
      {directions.map((d) => {
        const angle = dirAngles[d.direction];
        if (angle == null) return null;
        const intensity = d.percentage / maxPct;
        const isPrimary = d.direction === primaryDir;

        const startAngle = angle - 22.5;
        const endAngle = angle + 22.5;
        const barR = innerR + (outerR - innerR) * intensity;
        const sa = ((startAngle - 90) * Math.PI) / 180;
        const ea = ((endAngle - 90) * Math.PI) / 180;

        const x1 = cx + innerR * Math.cos(sa);
        const y1 = cy + innerR * Math.sin(sa);
        const x2 = cx + barR * Math.cos(sa);
        const y2 = cy + barR * Math.sin(sa);
        const x3 = cx + barR * Math.cos(ea);
        const y3 = cy + barR * Math.sin(ea);
        const x4 = cx + innerR * Math.cos(ea);
        const y4 = cy + innerR * Math.sin(ea);

        const pathD = [
          `M ${x1} ${y1}`,
          `L ${x2} ${y2}`,
          `A ${barR} ${barR} 0 0 1 ${x3} ${y3}`,
          `L ${x4} ${y4}`,
          `A ${innerR} ${innerR} 0 0 0 ${x1} ${y1}`,
          'Z',
        ].join(' ');

        const labelR = outerR * 0.52;
        const rad = ((angle - 90) * Math.PI) / 180;
        const tx = cx + labelR * Math.cos(rad);
        const ty = cy + labelR * Math.sin(rad);

        const pctR = outerR * 0.78;
        const px = cx + pctR * Math.cos(rad);
        const py = cy + pctR * Math.sin(rad);

        return (
          <g key={d.direction}>
            <path
              d={pathD}
              fill={isPrimary ? '#f44336' : '#ef5350'}
              fillOpacity={0.15 + intensity * 0.55}
              stroke={isPrimary ? '#f44336' : '#444'}
              strokeWidth={isPrimary ? 1 : 0.5}
            />
            <text
              x={tx}
              y={ty}
              textAnchor="middle"
              dominantBaseline="central"
              fill={isPrimary ? '#f44336' : '#999'}
              fontSize="9"
              fontWeight={isPrimary ? 'bold' : 'normal'}
            >
              {d.direction}
            </text>
            <text
              x={px}
              y={py}
              textAnchor="middle"
              dominantBaseline="central"
              fill={isPrimary ? '#f44336' : '#777'}
              fontSize="8"
              fontWeight={isPrimary ? 'bold' : 'normal'}
              opacity={intensity > 0.1 ? 1 : 0.5}
            >
              {d.percentage.toFixed(1)}%
            </text>
          </g>
        );
      })}
      <circle
        cx={cx}
        cy={cy}
        r={innerR}
        fill="rgba(76,175,80,0.2)"
        stroke="#4caf50"
        strokeWidth="1.5"
      />
      <text x={cx} y={cy - 3} textAnchor="middle" fill="#4caf50" fontSize="11" fontWeight="bold">
        {bullRate}%
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill="#888" fontSize="8">
        BULL
      </text>
    </svg>
  );
}

/** 値の増減色 */
function valColor(delta: number, inverse?: boolean): string | undefined {
  if (Math.abs(delta) < 0.01) return undefined;
  const positive = inverse ? delta < 0 : delta > 0;
  return positive ? '#4caf50' : '#f44336';
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' });
}

/** セクションタイトル */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      variant="subtitle2"
      color="text.secondary"
      sx={{ fontWeight: 'bold', mt: 2.5, mb: 1, fontSize: 12 }}
    >
      {children}
    </Typography>
  );
}

// ─── メイン ────────────────────────────────────

export default function SessionCompareCard({ countupPlays }: SessionCompareCardProps) {
  const ct = useChartTheme();

  const { comparison, bandData, heatmaps } = useMemo(() => {
    const comp = compareLastTwoSessions(countupPlays, 30);
    if (!comp) return { comparison: null, bandData: [], heatmaps: null };

    const allSessions = extractQualifiedSessions(countupPlays, 30);
    if (allSessions.length < 2) return { comparison: comp, bandData: [], heatmaps: null };

    const prevSession = allSessions[allSessions.length - 2];
    const currSession = allSessions[allSessions.length - 1];

    // スコア分布（±3 rating bands + 端を「以下」「以上」表記）
    const prevScores = prevSession.plays.map((p) => p.score);
    const currScores = currSession.plays.map((p) => p.score);
    const centerRt = Math.floor(calc01Rating(comp.current.avgScore / 8));
    const minRt = Math.max(1, centerRt - 3);
    const maxRt = centerRt + 3;

    const bandMap = new Map<number, { prev: number; current: number }>();
    for (let rt = minRt; rt <= maxRt; rt++) {
      bandMap.set(rt, { prev: 0, current: 0 });
    }

    for (const score of prevScores) {
      const rt = Math.min(maxRt, Math.max(minRt, Math.floor(calc01Rating(score / 8))));
      const entry = bandMap.get(rt)!;
      entry.prev++;
    }
    for (const score of currScores) {
      const rt = Math.min(maxRt, Math.max(minRt, Math.floor(calc01Rating(score / 8))));
      const entry = bandMap.get(rt)!;
      entry.current++;
    }

    const bd = Array.from(bandMap.entries()).map(([rt, counts]) => {
      let label: string;
      if (rt === minRt) label = `Rt.${rt}以下`;
      else if (rt === maxRt) label = `Rt.${rt}以上`;
      else label = `Rt.${rt}`;
      return { label, ...counts };
    });

    // ヒートマップ（ミスのみ）
    const prevLogs = prevSession.plays.map((p) => p.playLog).filter((l) => l && l.length > 0);
    const currLogs = currSession.plays.map((p) => p.playLog).filter((l) => l && l.length > 0);
    const hm =
      prevLogs.length > 0 && currLogs.length > 0
        ? {
            prev: computeSegmentFrequency(prevLogs, 'miss', { excludeOuterSingle: true }),
            current: computeSegmentFrequency(currLogs, 'miss', { excludeOuterSingle: true }),
          }
        : null;

    return { comparison: comp, bandData: bd, heatmaps: hm };
  }, [countupPlays]);

  if (!comparison) return null;

  const { prev, current, deltas, insights } = comparison;

  const currentRating = Math.floor(calc01Rating(current.avgScore / 8));
  const benchmark = getBenchmarkByRating(currentRating);

  const metrics: {
    label: string;
    prev: string;
    curr: string;
    delta: number;
    unit: string;
    inverse?: boolean;
    benchmarkLabel?: string;
  }[] = [
    {
      label: 'ブル率',
      prev: `${prev.bullRate}%`,
      curr: `${current.bullRate}%`,
      delta: deltas.bullRate,
      unit: '%',
    },
    {
      label: 'DBull率',
      prev: `${prev.doubleBullRate}%`,
      curr: `${current.doubleBullRate}%`,
      delta: Math.round((current.doubleBullRate - prev.doubleBullRate) * 10) / 10,
      unit: '%',
    },
    {
      label: 'ワンブル率',
      prev: `${prev.oneBullRate}%`,
      curr: `${current.oneBullRate}%`,
      delta: deltas.oneBullRate,
      unit: '%',
      benchmarkLabel: benchmark ? `Rt.${benchmark.rating}: ${benchmark.oneBullRate}%` : undefined,
    },
    {
      label: 'ロートン率',
      prev: `${prev.lowTonRate}%`,
      curr: `${current.lowTonRate}%`,
      delta: deltas.lowTonRate,
      unit: '%',
      benchmarkLabel: benchmark ? `Rt.${benchmark.rating}: ${benchmark.lowTonRate}%` : undefined,
    },
    {
      label: 'ハット率',
      prev: `${prev.hatTrickRate}%`,
      curr: `${current.hatTrickRate}%`,
      delta: deltas.hatTrickRate,
      unit: '%',
      benchmarkLabel: benchmark ? `Rt.${benchmark.rating}: ${benchmark.hatTrickRate}%` : undefined,
    },
    {
      label: '平均スコア',
      prev: `${prev.avgScore}`,
      curr: `${current.avgScore}`,
      delta: deltas.avgScore,
      unit: '',
    },
    {
      label: '安定度',
      prev: `${prev.consistency}`,
      curr: `${current.consistency}`,
      delta: deltas.consistency,
      unit: 'pt',
    },
  ];

  if (prev.avgRadius > 0 || current.avgRadius > 0) {
    metrics.push({
      label: 'グルーピング',
      prev: `${prev.avgRadius}mm`,
      curr: `${current.avgRadius}mm`,
      delta: deltas.radius,
      unit: 'mm',
      inverse: true,
    });
  }

  if (prev.avgSpeed > 0 || current.avgSpeed > 0) {
    metrics.push({
      label: 'スピード',
      prev: `${prev.avgSpeed}`,
      curr: `${current.avgSpeed}`,
      delta: deltas.speed,
      unit: 'km/h',
    });
  }

  const prevDateLabel = formatDate(prev.date);
  const currDateLabel = formatDate(current.date);

  return (
    <Paper sx={{ p: 2, mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1.5 }}>
        練習日比較 (30G以上)
      </Typography>

      {/* セッション日付ヘッダー */}
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mb: 2 }}>
        <Chip
          label={`${prevDateLabel} (${prev.gameCount}G)`}
          size="small"
          variant="outlined"
          sx={{ fontSize: 12 }}
        />
        <Typography variant="body2" color="text.secondary">
          vs
        </Typography>
        <Chip
          label={`${currDateLabel} (${current.gameCount}G)`}
          size="small"
          color="primary"
          sx={{ fontSize: 12 }}
        />
      </Box>

      {/* ミスヒートマップ並列比較 */}
      {heatmaps && (
        <>
          <SectionLabel>ミスヒートマップ</SectionLabel>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 0.5 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10, mb: 0.5 }}>
                {prevDateLabel}
              </Typography>
              <MiniDartboardSvg heatmapData={heatmaps.prev} size={155} />
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10, mb: 0.5 }}>
                {currDateLabel}
              </Typography>
              <MiniDartboardSvg heatmapData={heatmaps.current} size={155} />
            </Box>
          </Box>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.5,
              mb: 1,
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: 9 }}>
              少
            </Typography>
            <Box
              sx={{
                width: 120,
                height: 8,
                borderRadius: 4,
                background:
                  'linear-gradient(to right, rgb(30,80,180), rgb(255,200,20), rgb(255,30,0))',
              }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: 9 }}>
              多
            </Typography>
          </Box>
        </>
      )}

      {/* ミス方向ボード並列比較 */}
      {prev.missDirections.length > 0 && current.missDirections.length > 0 && (
        <>
          <SectionLabel>ミス方向</SectionLabel>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 1 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
                {prevDateLabel}
              </Typography>
              <MiniMissBoard
                directions={prev.missDirections}
                bullRate={prev.bullRate}
                primaryDir={prev.primaryMissDir}
              />
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>
                主傾向: <b>{prev.primaryMissDir}</b>
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
                {currDateLabel}
              </Typography>
              <MiniMissBoard
                directions={current.missDirections}
                bullRate={current.bullRate}
                primaryDir={current.primaryMissDir}
              />
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>
                主傾向: <b>{current.primaryMissDir}</b>
              </Typography>
            </Box>
          </Box>
        </>
      )}

      {/* メトリクス比較テーブル */}
      <SectionLabel>メトリクス比較</SectionLabel>
      <Box
        component="table"
        sx={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: 13,
          '& th, & td': {
            py: 0.6,
            px: 1,
            borderBottom: '1px solid',
            borderColor: 'divider',
          },
          '& th': {
            fontWeight: 'bold',
            fontSize: 11,
            color: 'text.secondary',
            textAlign: 'center',
          },
          '& td': {
            textAlign: 'center',
          },
          '& td:first-of-type': {
            textAlign: 'left',
            color: 'text.secondary',
            fontSize: 12,
          },
        }}
      >
        <thead>
          <tr>
            <Box component="th" sx={{ textAlign: 'left !important', width: 80 }} />
            <th>{prevDateLabel}</th>
            <th>{currDateLabel}</th>
            <th>差分</th>
          </tr>
        </thead>
        <tbody>
          {metrics.map((m) => {
            const color = valColor(m.delta, m.inverse);
            const arrow = m.delta > 0 ? '↑' : m.delta < 0 ? '↓' : '';
            const deltaStr = `${m.delta > 0 ? '+' : ''}${!Number.isInteger(m.delta) ? m.delta.toFixed(1) : m.delta}${m.unit}`;
            return (
              <tr key={m.label}>
                <td>
                  {m.label}
                  {m.benchmarkLabel && (
                    <Box
                      component="span"
                      sx={{ display: 'block', fontSize: 9, color: '#888', mt: 0.2 }}
                    >
                      ({m.benchmarkLabel})
                    </Box>
                  )}
                </td>
                <td>{m.prev}</td>
                <Box component="td" sx={{ fontWeight: 'bold' }}>
                  {m.curr}
                </Box>
                <Box component="td" sx={{ fontWeight: 'bold', color, fontSize: 11 }}>
                  {arrow} {deltaStr}
                </Box>
              </tr>
            );
          })}
        </tbody>
      </Box>

      {/* スコア分布比較 */}
      {bandData.length > 0 && (
        <>
          <SectionLabel>スコア分布比較</SectionLabel>
          <Box sx={{ width: '100%', height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bandData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={ct.grid} />
                <XAxis dataKey="label" tick={{ fontSize: 9, fill: ct.text }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: ct.text }} />
                <Tooltip
                  contentStyle={{ ...ct.tooltipStyle, fontSize: 12 }}
                  formatter={(value) => [`${value}ゲーム`, '回数']}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar
                  dataKey="prev"
                  name="前回"
                  fill="#78909C"
                  fillOpacity={0.6}
                  radius={[2, 2, 0, 0]}
                />
                <Bar dataKey="current" name="今回" fill="#43A047" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </>
      )}

      {/* インサイト */}
      {insights.length > 0 && (
        <>
          <SectionLabel>インサイト</SectionLabel>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {insights.map((text, i) => (
              <Alert
                key={i}
                severity={
                  text.includes('改善') || text.includes('アップ') || text.includes('向上')
                    ? 'success'
                    : 'info'
                }
                sx={{ py: 0, '& .MuiAlert-message': { fontSize: 12 } }}
              >
                {text}
              </Alert>
            ))}
          </Box>
        </>
      )}
    </Paper>
  );
}
