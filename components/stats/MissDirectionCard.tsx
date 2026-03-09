'use client';

import { useState, useMemo } from 'react';
import { Paper, Typography, Box, Chip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { analyzeMissDirection } from '@/lib/stats-math';
import type { MissDirectionResult, DirectionLabel } from '@/lib/stats-math';
import type { CountUpPlay } from './countup-deep-shared';

interface MissDirectionCardProps {
  countupPlays: CountUpPlay[];
}

/** 8方向の角度 (0°=上, 時計回り) */
const DIR_ANGLES: Record<DirectionLabel, number> = {
  上: 0,
  右上: 45,
  右: 90,
  右下: 135,
  下: 180,
  左下: 225,
  左: 270,
  左上: 315,
};

function MissDirectionBoard({ result }: { result: MissDirectionResult }) {
  const theme = useTheme();
  const maxPct = Math.max(...result.directions.map((d) => d.percentage), 1);
  const size = 260;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 10;
  const innerR = 36;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 1 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={cx}
          cy={cy}
          r={outerR}
          fill="none"
          stroke={theme.palette.text.primary}
          strokeWidth="1"
        />
        <circle
          cx={cx}
          cy={cy}
          r={outerR * 0.66}
          fill="none"
          stroke={theme.palette.text.primary}
          strokeWidth="0.5"
        />
        <circle
          cx={cx}
          cy={cy}
          r={outerR * 0.33}
          fill="none"
          stroke={theme.palette.text.primary}
          strokeWidth="0.5"
        />

        {result.directions.map((d) => {
          const angle = DIR_ANGLES[d.label];
          if (angle == null) return null;
          const intensity = d.percentage / maxPct;
          const isPrimary = d.label === result.primaryDirection;

          const midR = outerR * 0.55;
          const rad = ((angle - 90) * Math.PI) / 180;
          const tx = cx + midR * Math.cos(rad);
          const ty = cy + midR * Math.sin(rad);

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

          const fillOpacity = 0.15 + intensity * 0.55;

          return (
            <g key={d.label}>
              <path
                d={pathD}
                fill={isPrimary ? theme.palette.error.main : theme.palette.error.light}
                fillOpacity={fillOpacity}
                stroke={isPrimary ? theme.palette.error.main : theme.palette.text.primary}
                strokeWidth={isPrimary ? 1.5 : 0.5}
              />
              <text
                x={tx}
                y={ty - 6}
                textAnchor="middle"
                fill={isPrimary ? theme.palette.error.main : theme.palette.text.secondary}
                fontSize="10"
                fontWeight={isPrimary ? 'bold' : 'normal'}
              >
                {d.label}
              </text>
              <text
                x={tx}
                y={ty + 8}
                textAnchor="middle"
                fill={isPrimary ? theme.palette.error.light : theme.palette.divider}
                fontSize="12"
                fontWeight="bold"
              >
                {d.percentage}%
              </text>
            </g>
          );
        })}

        <circle
          cx={cx}
          cy={cy}
          r={innerR}
          fill={`${theme.palette.success.main}40`}
          stroke={theme.palette.success.main}
          strokeWidth="2"
        />
        <text
          x={cx}
          y={cy - 8}
          textAnchor="middle"
          fill={theme.palette.success.main}
          fontSize="9"
          fontWeight="bold"
        >
          BULL
        </text>
        <text
          x={cx}
          y={cy + 6}
          textAnchor="middle"
          fill={theme.palette.success.main}
          fontSize="14"
          fontWeight="bold"
        >
          {result.bullRate}%
        </text>
        <text
          x={cx}
          y={cy + 18}
          textAnchor="middle"
          fill={theme.palette.text.secondary}
          fontSize="8"
        >
          BB:{result.doubleBullRate}%
        </text>

        {result.directionStrength > 0.05 &&
          (() => {
            const vec = result.avgVector;
            const arrowLen = Math.min(result.directionStrength * outerR * 1.5, outerR * 0.85);
            const mag = Math.sqrt(vec.x * vec.x + vec.y * vec.y) || 1;
            const nx = vec.x / mag;
            const ny = vec.y / mag;
            const ax = cx + nx * arrowLen;
            const ay = cy + ny * arrowLen;
            return (
              <line
                x1={cx}
                y1={cy}
                x2={ax}
                y2={ay}
                stroke={theme.palette.warning.main}
                strokeWidth="2.5"
                strokeLinecap="round"
                markerEnd="url(#miss-arrowhead)"
                opacity="0.8"
              />
            );
          })()}
        <defs>
          <marker
            id="miss-arrowhead"
            markerWidth="8"
            markerHeight="6"
            refX="8"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 8 3, 0 6" fill={theme.palette.warning.main} />
          </marker>
        </defs>
      </svg>
    </Box>
  );
}

export default function MissDirectionCard({ countupPlays }: MissDirectionCardProps) {
  const theme = useTheme();
  const [excludeOuter, setExcludeOuter] = useState(false);

  const playLogs = useMemo(
    () => countupPlays.map((p) => p.playLog).filter((l) => l && l.length > 0),
    [countupPlays],
  );

  const missDirection = useMemo(
    () => analyzeMissDirection(playLogs, { excludeOuterSingle: excludeOuter }),
    [playLogs, excludeOuter],
  );

  // DL3センサー平均
  const avgDl3 = useMemo(() => {
    const dl3Plays = countupPlays.filter(
      (p) => p.dl3VectorX !== 0 || p.dl3VectorY !== 0 || p.dl3Radius !== 0 || p.dl3Speed !== 0,
    );
    if (dl3Plays.length === 0) return null;
    return {
      vectorX:
        Math.round((dl3Plays.reduce((s, p) => s + p.dl3VectorX, 0) / dl3Plays.length) * 10) / 10,
      vectorY:
        Math.round((dl3Plays.reduce((s, p) => s + p.dl3VectorY, 0) / dl3Plays.length) * 10) / 10,
      radius:
        Math.round((dl3Plays.reduce((s, p) => s + p.dl3Radius, 0) / dl3Plays.length) * 10) / 10,
      speed: Math.round((dl3Plays.reduce((s, p) => s + p.dl3Speed, 0) / dl3Plays.length) * 10) / 10,
    };
  }, [countupPlays]);

  if (!missDirection || missDirection.missCount <= 0) return null;

  return (
    <Paper sx={{ p: 2, mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
          ミス方向分析（ブル狙い）{excludeOuter ? '(アウター除外)' : ''}
        </Typography>
        <Chip
          label="アウター除外"
          size="small"
          variant={excludeOuter ? 'filled' : 'outlined'}
          onClick={() => setExcludeOuter((v) => !v)}
          sx={{
            fontSize: 10,
            height: 22,
            cursor: 'pointer',
            bgcolor: excludeOuter ? 'rgba(244,67,54,0.2)' : undefined,
          }}
        />
      </Box>

      <MissDirectionBoard result={missDirection} />

      <Box sx={{ textAlign: 'center', mt: 0.5 }}>
        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
          主傾向:{' '}
          <Box
            component="span"
            sx={{ color: missDirection.directionStrength > 0.1 ? 'error.main' : 'warning.main' }}
          >
            {missDirection.directionStrength > 0.05
              ? `${missDirection.primaryDirection}方向にミスしやすい`
              : 'ミス方向は均等'}
          </Box>
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1, justifyContent: 'center' }}>
        {missDirection.topMissNumbers.map((n) => (
          <Chip
            key={n.number}
            label={`${n.number}: ${n.percentage}%`}
            size="small"
            variant="outlined"
            sx={{ fontSize: 10, height: 22 }}
          />
        ))}
      </Box>

      {avgDl3 && (
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 1.5, justifyContent: 'center' }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              偏り(X)
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 'bold',
                color: Math.abs(avgDl3.vectorX) > 5 ? 'warning.main' : 'success.main',
              }}
            >
              {avgDl3.vectorX > 0 ? '右' : '左'} {Math.abs(avgDl3.vectorX).toFixed(1)}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              偏り(Y)
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 'bold',
                color: Math.abs(avgDl3.vectorY) > 5 ? 'warning.main' : 'success.main',
              }}
            >
              {avgDl3.vectorY > 0 ? '下' : '上'} {Math.abs(avgDl3.vectorY).toFixed(1)}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              グルーピング
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              {avgDl3.radius.toFixed(1)}mm
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              スピード
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              {avgDl3.speed.toFixed(1)}km/h
            </Typography>
          </Box>
        </Box>
      )}
    </Paper>
  );
}
