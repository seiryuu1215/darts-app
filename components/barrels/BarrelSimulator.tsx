'use client';

import { Box, Typography, useTheme } from '@mui/material';
import type { BarrelProduct } from '@/types';
import { contourToSvgPath } from '@/lib/barrel-contour';
import { useBarrelContour } from './useBarrelContour';

interface BarrelSimulatorProps {
  barrels: BarrelProduct[];
}

const COLORS = ['#1976d2', '#dc004e'];
const SVG_HEIGHT = 160;
const PADDING = 40;
const SCALE = 8; // 1mm = 8px

function drawBarrelPath(
  length: number,
  maxDiameter: number,
  yCenter: number,
): string {
  const scaledLen = length * SCALE;
  const scaledMaxR = (maxDiameter / 2) * SCALE;
  const frontR = scaledMaxR * 0.7;
  const rearR = scaledMaxR * 0.85;
  const maxPoint = scaledLen * 0.4;
  const x0 = PADDING;

  const topFront = yCenter - frontR;
  const topMax = yCenter - scaledMaxR;
  const topRear = yCenter - rearR;
  const botFront = yCenter + frontR;
  const botMax = yCenter + scaledMaxR;
  const botRear = yCenter + rearR;

  return [
    `M ${x0} ${topFront}`,
    `C ${x0 + maxPoint * 0.5} ${topFront}, ${x0 + maxPoint * 0.8} ${topMax}, ${x0 + maxPoint} ${topMax}`,
    `C ${x0 + maxPoint * 1.2} ${topMax}, ${x0 + scaledLen * 0.7} ${topRear * 0.98 + yCenter * 0.02}, ${x0 + scaledLen} ${topRear}`,
    `L ${x0 + scaledLen} ${botRear}`,
    `C ${x0 + scaledLen * 0.7} ${botRear * 0.98 + yCenter * 0.02}, ${x0 + maxPoint * 1.2} ${botMax}, ${x0 + maxPoint} ${botMax}`,
    `C ${x0 + maxPoint * 0.8} ${botMax}, ${x0 + maxPoint * 0.5} ${botFront}, ${x0} ${botFront}`,
    'Z',
  ].join(' ');
}

/** Individual barrel shape — renders on a shared center line for overlay comparison */
function BarrelShape({
  barrel,
  yCenter,
  color,
  subColor,
  showLabelsAbove,
}: {
  barrel: BarrelProduct;
  yCenter: number;
  color: string;
  subColor: string;
  showLabelsAbove: boolean;
}) {
  const len = barrel.length ?? 45;
  const dia = barrel.maxDiameter ?? 7.0;
  const { contour, loading } = useBarrelContour(barrel);

  const shapePath = contour
    ? contourToSvgPath(contour, SCALE, PADDING, yCenter)
    : drawBarrelPath(len, dia, yCenter);

  // Label vertical offsets: first barrel above, second below
  const labelY = showLabelsAbove
    ? yCenter - (dia / 2) * SCALE - 22
    : yCenter + (dia / 2) * SCALE + 36;

  const dimLineY = showLabelsAbove
    ? yCenter - (dia / 2) * SCALE - 8
    : yCenter + (dia / 2) * SCALE + 12;

  const dimTextY = showLabelsAbove ? dimLineY - 4 : dimLineY + 14;

  return (
    <g>
      <path
        d={shapePath}
        fill={color}
        fillOpacity={0.25}
        stroke={color}
        strokeWidth={2}
      >
        {loading && (
          <animate
            attributeName="fill-opacity"
            values="0.1;0.3;0.1"
            dur="1.5s"
            repeatCount="indefinite"
          />
        )}
      </path>

      {/* Length dimension line */}
      <line
        x1={PADDING}
        y1={dimLineY}
        x2={PADDING + len * SCALE}
        y2={dimLineY}
        stroke={color}
        strokeWidth={1}
        strokeOpacity={0.6}
        markerStart={`url(#arrow-${color.replace('#', '')}L)`}
        markerEnd={`url(#arrow-${color.replace('#', '')}R)`}
      />
      <text
        x={PADDING + (len * SCALE) / 2}
        y={dimTextY}
        textAnchor="middle"
        fill={color}
        fontSize={10}
        fontWeight="bold"
      >
        {len}mm / ⌀{dia}mm
      </text>

      {/* Barrel name label */}
      <text
        x={PADDING}
        y={labelY}
        fill={color}
        fontSize={12}
        fontWeight="bold"
      >
        {barrel.brand} {barrel.name}
      </text>
    </g>
  );
}

export default function BarrelSimulator({ barrels }: BarrelSimulatorProps) {
  const theme = useTheme();
  const subColor = theme.palette.text.secondary;

  if (barrels.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography color="text.secondary">
          バレルを選択してください
        </Typography>
      </Box>
    );
  }

  const maxLen = Math.max(...barrels.map((b) => b.length ?? 45));
  const dynamicWidth = Math.max(500, PADDING * 2 + maxLen * SCALE + 60);
  // Both barrels share the same center line for overlay comparison
  const yCenter = SVG_HEIGHT / 2;

  return (
    <Box sx={{ width: '100%', overflowX: 'auto' }}>
      <svg
        viewBox={`0 0 ${dynamicWidth} ${SVG_HEIGHT}`}
        width="100%"
        style={{ maxHeight: 300 }}
      >
        {barrels.map((barrel, i) => {
          const color = COLORS[i % COLORS.length];
          return (
            <BarrelShape
              key={barrel.id ?? i}
              barrel={barrel}
              yCenter={yCenter}
              color={color}
              subColor={subColor}
              showLabelsAbove={i === 0}
            />
          );
        })}
        {/* Per-color arrow markers */}
        <defs>
          {COLORS.map((color) => {
            const id = color.replace('#', '');
            return (
              <g key={color}>
                <marker
                  id={`arrow-${id}L`}
                  markerWidth="6"
                  markerHeight="6"
                  refX="6"
                  refY="3"
                  orient="auto"
                >
                  <path
                    d="M6,0 L0,3 L6,6"
                    fill="none"
                    stroke={color}
                    strokeWidth={1}
                  />
                </marker>
                <marker
                  id={`arrow-${id}R`}
                  markerWidth="6"
                  markerHeight="6"
                  refX="0"
                  refY="3"
                  orient="auto"
                >
                  <path
                    d="M0,0 L6,3 L0,6"
                    fill="none"
                    stroke={color}
                    strokeWidth={1}
                  />
                </marker>
              </g>
            );
          })}
        </defs>
      </svg>
    </Box>
  );
}
