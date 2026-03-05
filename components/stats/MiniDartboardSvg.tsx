'use client';

import { getHeatIntensity } from '@/lib/heatmap-data';
import type { HeatmapData } from '@/lib/heatmap-data';
import {
  BOARD_ORDER,
  BASE_SIZE,
  R_DOUBLE_OUTER,
  R_DOUBLE_INNER,
  R_OUTER_SINGLE_INNER,
  R_TRIPLE_OUTER,
  R_TRIPLE_INNER,
  R_INNER_SINGLE_INNER,
  R_BULL,
  R_DBULL,
  arcPath,
  heatColor,
} from '@/lib/dartboard-svg-utils';

interface MiniDartboardSvgProps {
  heatmapData: HeatmapData;
  size?: number;
}

export default function MiniDartboardSvg({ heatmapData, size = 140 }: MiniDartboardSvgProps) {
  const scale = size / BASE_SIZE;
  const cx = size / 2;
  const cy = size / 2;

  const s = (r: number) => r * scale;

  const bullCount = heatmapData.segments.get('B') ?? 0;
  const dBullCount = heatmapData.segments.get('BB') ?? 0;
  const bullIntensity = getHeatIntensity(bullCount, heatmapData.maxCount);
  const dBullIntensity = getHeatIntensity(dBullCount, heatmapData.maxCount);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* 背景円 */}
      <circle
        cx={cx}
        cy={cy}
        r={s(R_DOUBLE_OUTER)}
        fill="#1a1a1a"
        stroke="#444"
        strokeWidth="0.5"
      />

      {/* 各数字セグメント */}
      {BOARD_ORDER.map((num, idx) => {
        const angle = idx * 18;
        const startAngle = angle - 9;
        const endAngle = angle + 9;

        const segments = [
          { id: `D${num}`, innerR: R_DOUBLE_INNER, outerR: R_DOUBLE_OUTER },
          { id: `S${num}`, innerR: R_OUTER_SINGLE_INNER, outerR: R_DOUBLE_INNER },
          { id: `T${num}`, innerR: R_TRIPLE_INNER, outerR: R_TRIPLE_OUTER },
          { id: `I${num}`, innerR: R_INNER_SINGLE_INNER, outerR: R_TRIPLE_INNER },
        ];

        return (
          <g key={num}>
            {segments.map((seg) => {
              const count = heatmapData.segments.get(seg.id) ?? 0;
              const intensity = getHeatIntensity(count, heatmapData.maxCount);
              const fill = count > 0 ? heatColor(intensity) : 'transparent';
              return (
                <path
                  key={seg.id}
                  d={arcPath(cx, cy, s(seg.innerR), s(seg.outerR), startAngle, endAngle)}
                  fill={fill}
                  fillOpacity={count > 0 ? 0.7 : 0}
                  stroke="#333"
                  strokeWidth="0.3"
                />
              );
            })}
          </g>
        );
      })}

      {/* 構造線 */}
      <circle cx={cx} cy={cy} r={s(R_DOUBLE_OUTER)} fill="none" stroke="#555" strokeWidth="0.3" />
      <circle cx={cx} cy={cy} r={s(R_DOUBLE_INNER)} fill="none" stroke="#444" strokeWidth="0.3" />
      <circle cx={cx} cy={cy} r={s(R_TRIPLE_OUTER)} fill="none" stroke="#444" strokeWidth="0.3" />
      <circle cx={cx} cy={cy} r={s(R_TRIPLE_INNER)} fill="none" stroke="#444" strokeWidth="0.3" />
      <circle
        cx={cx}
        cy={cy}
        r={s(R_INNER_SINGLE_INNER)}
        fill="none"
        stroke="#444"
        strokeWidth="0.3"
      />

      {/* シングルブル */}
      <circle
        cx={cx}
        cy={cy}
        r={s(R_BULL)}
        fill={bullCount > 0 ? heatColor(bullIntensity) : 'transparent'}
        fillOpacity={bullCount > 0 ? 0.7 : 0}
        stroke="#4caf50"
        strokeWidth="0.8"
      />

      {/* ダブルブル */}
      <circle
        cx={cx}
        cy={cy}
        r={s(R_DBULL)}
        fill={dBullCount > 0 ? heatColor(dBullIntensity) : 'transparent'}
        fillOpacity={dBullCount > 0 ? 0.7 : 0}
        stroke="#4caf50"
        strokeWidth="1"
      />
    </svg>
  );
}
