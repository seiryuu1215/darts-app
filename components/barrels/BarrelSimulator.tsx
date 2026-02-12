'use client';

import { Box, Typography, useTheme } from '@mui/material';
import type { BarrelProduct } from '@/types';

interface BarrelSimulatorProps {
  barrels: BarrelProduct[];
}

const COLORS = ['#1976d2', '#dc004e', '#9e9e9e'];
const SVG_WIDTH = 600;
const SVG_HEIGHT = 200;
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

  // Upper profile (front → max → rear)
  const topFront = yCenter - frontR;
  const topMax = yCenter - scaledMaxR;
  const topRear = yCenter - rearR;

  // Lower profile
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

export default function BarrelSimulator({ barrels }: BarrelSimulatorProps) {
  const theme = useTheme();
  const textColor = theme.palette.text.primary;
  const subColor = theme.palette.text.secondary;

  if (barrels.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography color="text.secondary">バレルを選択してください</Typography>
      </Box>
    );
  }

  const maxLen = Math.max(...barrels.map((b) => b.length ?? 45));
  const dynamicWidth = Math.max(SVG_WIDTH, PADDING * 2 + maxLen * SCALE + 60);
  const barrelCount = barrels.length;
  const spacing = barrelCount === 1 ? 0 : SVG_HEIGHT / (barrelCount + 1);
  const dynamicHeight = barrelCount === 1 ? SVG_HEIGHT : spacing * (barrelCount + 1);

  return (
    <Box sx={{ width: '100%', overflowX: 'auto' }}>
      <svg
        viewBox={`0 0 ${dynamicWidth} ${dynamicHeight}`}
        width="100%"
        style={{ maxHeight: 400 }}
      >
        {barrels.map((barrel, i) => {
          const len = barrel.length ?? 45;
          const dia = barrel.maxDiameter ?? 7.0;
          const yCenter = barrelCount === 1 ? dynamicHeight / 2 : spacing * (i + 1);
          const color = COLORS[i % COLORS.length];

          return (
            <g key={barrel.id ?? i}>
              <path
                d={drawBarrelPath(len, dia, yCenter)}
                fill={color}
                fillOpacity={0.3}
                stroke={color}
                strokeWidth={2}
              />
              {/* Length dimension line */}
              <line
                x1={PADDING}
                y1={yCenter + (dia / 2) * SCALE + 12}
                x2={PADDING + len * SCALE}
                y2={yCenter + (dia / 2) * SCALE + 12}
                stroke={subColor}
                strokeWidth={1}
                markerStart="url(#arrowLeft)"
                markerEnd="url(#arrowRight)"
              />
              <text
                x={PADDING + (len * SCALE) / 2}
                y={yCenter + (dia / 2) * SCALE + 26}
                textAnchor="middle"
                fill={subColor}
                fontSize={11}
              >
                {len}mm
              </text>
              {/* Max diameter label */}
              <text
                x={PADDING + len * SCALE + 8}
                y={yCenter + 4}
                fill={subColor}
                fontSize={11}
              >
                ⌀{dia}mm
              </text>
              {/* Barrel name label */}
              <text
                x={PADDING}
                y={yCenter - (dia / 2) * SCALE - 8}
                fill={color}
                fontSize={12}
                fontWeight="bold"
              >
                {barrel.brand} {barrel.name}
              </text>
            </g>
          );
        })}
        {/* Arrow markers */}
        <defs>
          <marker id="arrowLeft" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto">
            <path d="M6,0 L0,3 L6,6" fill="none" stroke={subColor} strokeWidth={1} />
          </marker>
          <marker id="arrowRight" markerWidth="6" markerHeight="6" refX="0" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6" fill="none" stroke={subColor} strokeWidth={1} />
          </marker>
        </defs>
      </svg>
    </Box>
  );
}
