'use client';

import { useMemo } from 'react';
import { Paper, Typography, Box, Chip, Alert } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { compareLastTwoSessions, extractQualifiedSessions } from '@/lib/countup-session-compare';
import { computeSegmentFrequency } from '@/lib/heatmap-data';
import { buildRatingBands } from '@/lib/stats-math';
import { calc01Rating } from '@/lib/dartslive-rating';
import { useChartTheme } from '@/lib/chart-theme';
import MiniDartboardSvg from './MiniDartboardSvg';
import type { CountUpPlay } from './countup-deep-shared';

interface SessionCompareCardProps {
  countupPlays: CountUpPlay[];
}

/** 簡易ミス方向ボード (小型) */
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
  const size = 160;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 8;
  const innerR = 24;

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

        // ラベル位置
        const midR = outerR * 0.6;
        const rad = ((angle - 90) * Math.PI) / 180;
        const tx = cx + midR * Math.cos(rad);
        const ty = cy + midR * Math.sin(rad);

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
              fontSize="8"
              fontWeight={isPrimary ? 'bold' : 'normal'}
            >
              {d.direction}
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
      <text x={cx} y={cy - 3} textAnchor="middle" fill="#4caf50" fontSize="10" fontWeight="bold">
        {bullRate}%
      </text>
      <text x={cx} y={cy + 9} textAnchor="middle" fill="#888" fontSize="7">
        BULL
      </text>
    </svg>
  );
}

/** 差分チップ */
function DiffChip({ value, unit, inverse }: { value: number; unit: string; inverse?: boolean }) {
  const positive = inverse ? value < 0 : value > 0;
  const color = Math.abs(value) < 0.01 ? '#888' : positive ? '#4caf50' : '#f44336';
  const arrow = value > 0 ? '↑' : value < 0 ? '↓' : '→';
  const display = `${value > 0 ? '+' : ''}${typeof value === 'number' && !Number.isInteger(value) ? value.toFixed(1) : value}${unit}`;

  return (
    <Typography component="span" sx={{ fontSize: 11, fontWeight: 'bold', color, ml: 0.5 }}>
      {arrow} {display}
    </Typography>
  );
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' });
}

export default function SessionCompareCard({ countupPlays }: SessionCompareCardProps) {
  const ct = useChartTheme();

  const { comparison, bandData, heatmaps } = useMemo(() => {
    const comp = compareLastTwoSessions(countupPlays, 30);
    if (!comp) return { comparison: null, bandData: [], heatmaps: null };

    const allSessions = extractQualifiedSessions(countupPlays, 30);
    if (allSessions.length < 2) return { comparison: comp, bandData: [], heatmaps: null };

    const prevSession = allSessions[allSessions.length - 2];
    const currSession = allSessions[allSessions.length - 1];

    // バンドデータ
    const prevScores = prevSession.plays.map((p) => p.score);
    const currScores = currSession.plays.map((p) => p.score);
    const centerRt = calc01Rating(comp.current.avgScore / 8);
    const prevBands = buildRatingBands(prevScores, centerRt, (s) => s / 8, calc01Rating);
    const currBands = buildRatingBands(currScores, centerRt, (s) => s / 8, calc01Rating);
    const bd = prevBands.map((pb, i) => ({
      label: pb.label,
      prev: pb.count,
      current: currBands[i]?.count ?? 0,
    }));

    // ヒートマップ
    const prevLogs = prevSession.plays.map((p) => p.playLog).filter((l) => l && l.length > 0);
    const currLogs = currSession.plays.map((p) => p.playLog).filter((l) => l && l.length > 0);
    const hm =
      prevLogs.length > 0 && currLogs.length > 0
        ? { prev: computeSegmentFrequency(prevLogs), current: computeSegmentFrequency(currLogs) }
        : null;

    return { comparison: comp, bandData: bd, heatmaps: hm };
  }, [countupPlays]);

  if (!comparison) return null;

  const { prev, current, deltas, insights } = comparison;

  const metrics: {
    label: string;
    prevVal: string;
    currVal: string;
    delta: number;
    unit: string;
    inverse?: boolean;
  }[] = [
    {
      label: 'ブル率',
      prevVal: `${prev.bullRate}%`,
      currVal: `${current.bullRate}%`,
      delta: deltas.bullRate,
      unit: '%',
    },
    {
      label: 'DBull率',
      prevVal: `${prev.doubleBullRate}%`,
      currVal: `${current.doubleBullRate}%`,
      delta: Math.round((current.doubleBullRate - prev.doubleBullRate) * 10) / 10,
      unit: '%',
    },
    {
      label: 'ロートン率',
      prevVal: `${prev.lowTonRate}%`,
      currVal: `${current.lowTonRate}%`,
      delta: deltas.lowTonRate,
      unit: '%',
    },
    {
      label: 'ハット率',
      prevVal: `${prev.hatTrickRate}%`,
      currVal: `${current.hatTrickRate}%`,
      delta: deltas.hatTrickRate,
      unit: '%',
    },
    {
      label: '平均スコア',
      prevVal: `${prev.avgScore}`,
      currVal: `${current.avgScore}`,
      delta: deltas.avgScore,
      unit: '',
    },
    {
      label: '安定度',
      prevVal: `${prev.consistency}`,
      currVal: `${current.consistency}`,
      delta: deltas.consistency,
      unit: 'pt',
    },
  ];

  if (prev.avgRadius > 0 || current.avgRadius > 0) {
    metrics.push({
      label: 'グルーピング',
      prevVal: `${prev.avgRadius}mm`,
      currVal: `${current.avgRadius}mm`,
      delta: deltas.radius,
      unit: 'mm',
      inverse: true,
    });
  }

  if (prev.avgSpeed > 0 || current.avgSpeed > 0) {
    metrics.push({
      label: 'スピード',
      prevVal: `${prev.avgSpeed}km/h`,
      currVal: `${current.avgSpeed}km/h`,
      delta: deltas.speed,
      unit: 'km/h',
    });
  }

  return (
    <Paper sx={{ p: 2, mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1.5 }}>
        練習日比較 (30G以上)
      </Typography>

      {/* セッション日付ヘッダー */}
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mb: 2 }}>
        <Chip
          label={`${formatDate(prev.date)} (${prev.gameCount}G)`}
          size="small"
          variant="outlined"
          sx={{ fontSize: 12 }}
        />
        <Typography variant="body2" color="text.secondary">
          vs
        </Typography>
        <Chip
          label={`${formatDate(current.date)} (${current.gameCount}G)`}
          size="small"
          color="primary"
          sx={{ fontSize: 12 }}
        />
      </Box>

      {/* ヒートマップ並列比較 */}
      {heatmaps && (
        <>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#aaa', mb: 1 }}>
            ヒートマップ
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 0.5 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
                {formatDate(prev.date)}
              </Typography>
              <MiniDartboardSvg heatmapData={heatmaps.prev} size={140} />
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
                {formatDate(current.date)}
              </Typography>
              <MiniDartboardSvg heatmapData={heatmaps.current} size={140} />
            </Box>
          </Box>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.5,
              mb: 1.5,
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: 9 }}>
              少
            </Typography>
            <Box
              sx={{
                width: 100,
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
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 1 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
              {formatDate(prev.date)}
            </Typography>
            <MiniMissBoard
              directions={prev.missDirections}
              bullRate={prev.bullRate}
              primaryDir={prev.primaryMissDir}
            />
            <Typography variant="caption" color="text.secondary">
              主傾向: {prev.primaryMissDir}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
              {formatDate(current.date)}
            </Typography>
            <MiniMissBoard
              directions={current.missDirections}
              bullRate={current.bullRate}
              primaryDir={current.primaryMissDir}
            />
            <Typography variant="caption" color="text.secondary">
              主傾向: {current.primaryMissDir}
            </Typography>
          </Box>
        </Box>
      )}

      {/* メトリクス比較テーブル */}
      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#aaa', mt: 2, mb: 1 }}>
        メトリクス比較
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '1fr auto auto auto',
          gap: 0.5,
          alignItems: 'center',
          px: 1,
        }}
      >
        {metrics.map((m) => (
          <Box key={m.label} sx={{ display: 'contents' }}>
            <Typography variant="caption" color="text.secondary">
              {m.label}
            </Typography>
            <Typography variant="body2" sx={{ textAlign: 'right', opacity: 0.7 }}>
              {m.prevVal}
            </Typography>
            <Typography variant="body2" sx={{ textAlign: 'center', px: 0.5 }}>
              →
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                {m.currVal}
              </Typography>
              <DiffChip value={m.delta} unit={m.unit} inverse={m.inverse} />
            </Box>
          </Box>
        ))}
      </Box>

      {/* レーティングバンド重ね棒グラフ */}
      {bandData.length > 0 && (
        <>
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 'bold', color: '#aaa', mt: 2.5, mb: 1 }}
          >
            スコア分布比較 (rating bands)
          </Typography>
          <Box sx={{ width: '100%', height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bandData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={ct.grid} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: ct.text }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: ct.text }} />
                <Tooltip
                  contentStyle={{ ...ct.tooltipStyle, fontSize: 12 }}
                  formatter={(value) => [`${value}ゲーム`, '回数']}
                />
                <Bar
                  dataKey="prev"
                  name="前回"
                  fill="#43A047"
                  fillOpacity={0.35}
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
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#aaa', mt: 2, mb: 1 }}>
            インサイト
          </Typography>
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
