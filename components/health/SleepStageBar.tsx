'use client';

import { Box, Typography } from '@mui/material';
import type { HealthMetric } from '@/types';
import { formatMinutesToHM } from './utils';

export function SleepStageBar({ metric }: { metric: HealthMetric }) {
  const total = metric.timeInBedMinutes || metric.sleepDurationMinutes || 0;
  if (total === 0) return null;

  const deep = metric.sleepDeepMinutes || 0;
  const rem = metric.sleepRemMinutes || 0;
  const core = metric.sleepCoreMinutes || 0;
  const awake = metric.sleepAwakeMinutes || 0;
  const light = Math.max(0, (metric.sleepDurationMinutes || 0) - deep - rem - core);

  const stages = [
    { label: '深い', minutes: deep, color: '#6d28d9' },
    { label: 'コア', minutes: core, color: '#7c3aed' },
    { label: 'REM', minutes: rem, color: '#a78bfa' },
    { label: '浅い', minutes: light, color: '#c4b5fd' },
    { label: '覚醒', minutes: awake, color: '#3f3f46' },
  ].filter((s) => s.minutes > 0);

  return (
    <Box>
      <Box sx={{ display: 'flex', height: 24, borderRadius: 2, overflow: 'hidden' }}>
        {stages.map((stage, i) => (
          <Box
            key={i}
            sx={{
              width: `${(stage.minutes / total) * 100}%`,
              backgroundColor: stage.color,
              transition: 'all 0.5s',
            }}
          />
        ))}
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 1 }}>
        {stages.map((stage, i) => (
          <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: stage.color }} />
            <Typography variant="caption" sx={{ fontSize: 10, color: '#a1a1aa' }}>
              {stage.label} {formatMinutesToHM(stage.minutes)}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
