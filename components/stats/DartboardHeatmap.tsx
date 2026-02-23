'use client';

import { useMemo, useState } from 'react';
import { Paper, Typography, Box, ToggleButton, ToggleButtonGroup, Chip } from '@mui/material';
import { computeSegmentFrequency, getHeatIntensity } from '@/lib/heatmap-data';
import type { HeatmapData } from '@/lib/heatmap-data';
import type { CountUpPlay } from './CountUpDeepAnalysisCard';

interface DartboardHeatmapProps {
  countupPlays: CountUpPlay[];
}

type PeriodKey = 'last30' | 'month' | 'week' | 'day';

const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: 'last30', label: '直近30G' },
  { key: 'month', label: '1ヶ月' },
  { key: 'week', label: '1週間' },
  { key: 'day', label: '1日' },
];

function filterByPeriod(plays: CountUpPlay[], period: PeriodKey): CountUpPlay[] {
  if (period === 'last30') return plays.slice(-30);
  const now = new Date();
  let cutoff: Date;
  switch (period) {
    case 'day':
      cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'week':
      cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      return plays;
  }
  return plays.filter((p) => new Date(p.time) >= cutoff);
}

/** ダーツボードの数字配置（12時=20、時計回り） */
const BOARD_ORDER = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];

const SIZE = 300;
const CX = SIZE / 2;
const CY = SIZE / 2;

// 半径定義（ダーツボードの各リング）
const R_DOUBLE_OUTER = 140;
const R_DOUBLE_INNER = 130;
const R_OUTER_SINGLE_INNER = 82;
const R_TRIPLE_OUTER = 82;
const R_TRIPLE_INNER = 72;
const R_INNER_SINGLE_INNER = 18;
const R_BULL = 18;
const R_DBULL = 8;

/** 扇形のSVGパスを生成 */
function arcPath(
  cx: number,
  cy: number,
  innerR: number,
  outerR: number,
  startAngle: number,
  endAngle: number,
): string {
  const toRad = (deg: number) => ((deg - 90) * Math.PI) / 180;
  const sa = toRad(startAngle);
  const ea = toRad(endAngle);

  const x1 = cx + innerR * Math.cos(sa);
  const y1 = cy + innerR * Math.sin(sa);
  const x2 = cx + outerR * Math.cos(sa);
  const y2 = cy + outerR * Math.sin(sa);
  const x3 = cx + outerR * Math.cos(ea);
  const y3 = cy + outerR * Math.sin(ea);
  const x4 = cx + innerR * Math.cos(ea);
  const y4 = cy + innerR * Math.sin(ea);

  return [
    `M ${x1} ${y1}`,
    `L ${x2} ${y2}`,
    `A ${outerR} ${outerR} 0 0 1 ${x3} ${y3}`,
    `L ${x4} ${y4}`,
    `A ${innerR} ${innerR} 0 0 0 ${x1} ${y1}`,
    'Z',
  ].join(' ');
}

/** ヒートマップ色（赤系グラデーション） */
function heatColor(intensity: number): string {
  if (intensity <= 0) return 'transparent';
  // 低→青, 中→黄, 高→赤
  if (intensity < 0.33) {
    const t = intensity / 0.33;
    const r = Math.round(30 + t * 50);
    const g = Math.round(80 + t * 120);
    const b = Math.round(180 - t * 80);
    return `rgb(${r},${g},${b})`;
  }
  if (intensity < 0.66) {
    const t = (intensity - 0.33) / 0.33;
    const r = Math.round(80 + t * 175);
    const g = Math.round(200 - t * 50);
    const b = Math.round(100 - t * 80);
    return `rgb(${r},${g},${b})`;
  }
  const t = (intensity - 0.66) / 0.34;
  const r = Math.round(255);
  const g = Math.round(150 - t * 120);
  const b = Math.round(20 - t * 20);
  return `rgb(${r},${g},${b})`;
}

/** 各数字のセグメントを描画 */
function NumberSegments({
  number,
  index,
  heatmap,
}: {
  number: number;
  index: number;
  heatmap: HeatmapData;
}) {
  const angle = index * 18; // 各セグメント18°
  const startAngle = angle - 9;
  const endAngle = angle + 9;

  const segments: { id: string; innerR: number; outerR: number }[] = [
    { id: `D${number}`, innerR: R_DOUBLE_INNER, outerR: R_DOUBLE_OUTER },
    { id: `S${number}`, innerR: R_OUTER_SINGLE_INNER, outerR: R_DOUBLE_INNER },
    { id: `T${number}`, innerR: R_TRIPLE_INNER, outerR: R_TRIPLE_OUTER },
    { id: `I${number}`, innerR: R_INNER_SINGLE_INNER, outerR: R_TRIPLE_INNER },
  ];

  return (
    <g>
      {segments.map((seg) => {
        const count = heatmap.segments.get(seg.id) ?? 0;
        const intensity = getHeatIntensity(count, heatmap.maxCount);
        const fill = count > 0 ? heatColor(intensity) : 'transparent';

        return (
          <path
            key={seg.id}
            d={arcPath(CX, CY, seg.innerR, seg.outerR, startAngle, endAngle)}
            fill={fill}
            fillOpacity={count > 0 ? 0.7 : 0}
            stroke="#333"
            strokeWidth="0.5"
          >
            <title>
              {seg.id}: {count}回
            </title>
          </path>
        );
      })}
    </g>
  );
}

function DartboardSvg({ heatmap }: { heatmap: HeatmapData }) {
  const bullCount = heatmap.segments.get('B') ?? 0;
  const dBullCount = heatmap.segments.get('BB') ?? 0;
  const bullIntensity = getHeatIntensity(bullCount, heatmap.maxCount);
  const dBullIntensity = getHeatIntensity(dBullCount, heatmap.maxCount);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 1 }}>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        {/* 背景円 */}
        <circle cx={CX} cy={CY} r={R_DOUBLE_OUTER} fill="#1a1a1a" stroke="#444" strokeWidth="1" />

        {/* 各数字セグメント */}
        {BOARD_ORDER.map((num, idx) => (
          <NumberSegments key={num} number={num} index={idx} heatmap={heatmap} />
        ))}

        {/* ボードの構造線 */}
        <circle cx={CX} cy={CY} r={R_DOUBLE_OUTER} fill="none" stroke="#555" strokeWidth="0.5" />
        <circle cx={CX} cy={CY} r={R_DOUBLE_INNER} fill="none" stroke="#444" strokeWidth="0.5" />
        <circle cx={CX} cy={CY} r={R_TRIPLE_OUTER} fill="none" stroke="#444" strokeWidth="0.5" />
        <circle cx={CX} cy={CY} r={R_TRIPLE_INNER} fill="none" stroke="#444" strokeWidth="0.5" />
        <circle
          cx={CX}
          cy={CY}
          r={R_INNER_SINGLE_INNER}
          fill="none"
          stroke="#444"
          strokeWidth="0.5"
        />

        {/* シングルブル */}
        <circle
          cx={CX}
          cy={CY}
          r={R_BULL}
          fill={bullCount > 0 ? heatColor(bullIntensity) : 'transparent'}
          fillOpacity={bullCount > 0 ? 0.7 : 0}
          stroke="#4caf50"
          strokeWidth="1"
        >
          <title>S-BULL: {bullCount}回</title>
        </circle>

        {/* ダブルブル */}
        <circle
          cx={CX}
          cy={CY}
          r={R_DBULL}
          fill={dBullCount > 0 ? heatColor(dBullIntensity) : 'transparent'}
          fillOpacity={dBullCount > 0 ? 0.7 : 0}
          stroke="#4caf50"
          strokeWidth="1.5"
        >
          <title>D-BULL: {dBullCount}回</title>
        </circle>

        {/* 数字ラベル */}
        {BOARD_ORDER.map((num, idx) => {
          const angle = idx * 18;
          const rad = ((angle - 90) * Math.PI) / 180;
          const labelR = R_DOUBLE_OUTER + 2;
          const x = CX + labelR * Math.cos(rad);
          const y = CY + labelR * Math.sin(rad);
          return (
            <text
              key={num}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="central"
              fill="#888"
              fontSize="9"
            >
              {num}
            </text>
          );
        })}
      </svg>
    </Box>
  );
}

export default function DartboardHeatmap({ countupPlays }: DartboardHeatmapProps) {
  const [mode, setMode] = useState<'all' | 'miss'>('all');
  const [period, setPeriod] = useState<PeriodKey>('last30');

  const filtered = useMemo(() => filterByPeriod(countupPlays, period), [countupPlays, period]);

  const playLogs = useMemo(
    () => filtered.map((p) => p.playLog).filter((l) => l && l.length > 0),
    [filtered],
  );

  const heatmap = useMemo(() => computeSegmentFrequency(playLogs, mode), [playLogs, mode]);

  const periodCounts = useMemo(() => {
    const result: Record<PeriodKey, number> = { last30: 0, month: 0, week: 0, day: 0 };
    for (const p of PERIODS) {
      result[p.key] = filterByPeriod(countupPlays, p.key).length;
    }
    return result;
  }, [countupPlays]);

  if (countupPlays.length < 24) return null;

  if (filtered.length === 0) {
    return (
      <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
          ダーツボードヒートマップ
        </Typography>
        <ToggleButtonGroup
          value={period}
          exclusive
          onChange={(_, v) => v && setPeriod(v as PeriodKey)}
          size="small"
          sx={{ mb: 1, flexWrap: 'wrap' }}
        >
          {PERIODS.map((p) => (
            <ToggleButton
              key={p.key}
              value={p.key}
              sx={{
                fontSize: 11,
                px: 1.2,
                py: 0.4,
                textTransform: 'none',
                '&.Mui-selected': { bgcolor: 'rgba(67, 160, 71, 0.2)' },
              }}
            >
              {p.label}
              <Typography component="span" sx={{ fontSize: 9, ml: 0.5, opacity: 0.7 }}>
                ({periodCounts[p.key]})
              </Typography>
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
          この期間のデータがありません
        </Typography>
      </Paper>
    );
  }

  // TOP5セグメント
  const top5 = Array.from(heatmap.segments.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
          ダーツボードヒートマップ
        </Typography>
        <Chip
          label={`${heatmap.totalDarts.toLocaleString()}本`}
          size="small"
          sx={{ fontSize: 10, height: 20 }}
          variant="outlined"
        />
      </Box>

      <ToggleButtonGroup
        value={period}
        exclusive
        onChange={(_, v) => v && setPeriod(v as PeriodKey)}
        size="small"
        sx={{ mb: 1, flexWrap: 'wrap' }}
      >
        {PERIODS.map((p) => (
          <ToggleButton
            key={p.key}
            value={p.key}
            sx={{
              fontSize: 11,
              px: 1.2,
              py: 0.4,
              textTransform: 'none',
              '&.Mui-selected': { bgcolor: 'rgba(67, 160, 71, 0.2)' },
            }}
          >
            {p.label}
            <Typography component="span" sx={{ fontSize: 9, ml: 0.5, opacity: 0.7 }}>
              ({periodCounts[p.key]})
            </Typography>
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      <ToggleButtonGroup
        value={mode}
        exclusive
        onChange={(_, v) => v && setMode(v as 'all' | 'miss')}
        size="small"
        sx={{ mb: 1, ml: 1 }}
      >
        <ToggleButton value="all" sx={{ fontSize: 11, px: 1.2, py: 0.4, textTransform: 'none' }}>
          全ダーツ
        </ToggleButton>
        <ToggleButton value="miss" sx={{ fontSize: 11, px: 1.2, py: 0.4, textTransform: 'none' }}>
          ミスのみ
        </ToggleButton>
      </ToggleButtonGroup>

      <DartboardSvg heatmap={heatmap} />

      {/* TOP5セグメント */}
      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', justifyContent: 'center', mt: 1 }}>
        {top5.map(([id, count]) => (
          <Chip
            key={id}
            label={`${id}: ${count}回 (${((count / heatmap.totalDarts) * 100).toFixed(1)}%)`}
            size="small"
            variant="outlined"
            sx={{ fontSize: 10, height: 22 }}
          />
        ))}
      </Box>

      {/* カラースケール */}
      <Box
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mt: 1 }}
      >
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: 9 }}>
          少
        </Typography>
        <Box
          sx={{
            width: 100,
            height: 8,
            borderRadius: 4,
            background: 'linear-gradient(to right, rgb(30,80,180), rgb(255,200,20), rgb(255,30,0))',
          }}
        />
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: 9 }}>
          多
        </Typography>
      </Box>
    </Paper>
  );
}
