'use client';

import { useMemo } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import type { HealthDartsCorrelation } from '@/types';
import { analyzeBestConditionProfile } from '@/lib/health-analytics';

export function BestConditionSection({
  correlationData,
}: {
  correlationData: HealthDartsCorrelation[];
}) {
  const profile = useMemo(() => analyzeBestConditionProfile(correlationData), [correlationData]);

  if (!profile) return null;

  const ranges = [
    { label: 'HRV', range: profile.optimalHrv, unit: 'ms', color: '#ef4444' },
    { label: '睡眠', range: profile.optimalSleep, unit: 'h', color: '#a78bfa' },
    { label: '安静時心拍', range: profile.optimalRestingHr, unit: 'bpm', color: '#f97316' },
    { label: '歩数', range: profile.optimalSteps, unit: '歩', color: '#22c55e' },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 0.5 }}>
        <EmojiEventsIcon sx={{ fontSize: 16, color: '#eab308' }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          ベストコンディション
        </Typography>
      </Box>

      <Paper
        sx={{
          p: 2,
          borderRadius: 2,
          border: '1px solid rgba(255,255,255,0.05)',
          bgcolor: 'rgba(24,24,27,0.8)',
        }}
      >
        <Typography
          variant="caption"
          sx={{ fontSize: 11, color: '#71717a', mb: 1, display: 'block' }}
        >
          CU平均上位20%時の最適レンジ（{profile.sampleSize}日分析）
        </Typography>
        {ranges.map((r) => (
          <Box key={r.label} sx={{ mb: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
              <Typography variant="caption" sx={{ fontSize: 11, color: '#a1a1aa' }}>
                {r.label}
              </Typography>
              <Typography
                variant="caption"
                sx={{ fontSize: 11, color: '#fafafa', fontFamily: 'monospace' }}
              >
                {r.range[0].toLocaleString()} - {r.range[1].toLocaleString()} {r.unit}
              </Typography>
            </Box>
            <Box
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: 'rgba(255,255,255,0.05)',
                position: 'relative',
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  height: '100%',
                  borderRadius: 3,
                  bgcolor: r.color,
                  opacity: 0.6,
                  left: '20%',
                  width: '60%',
                }}
              />
            </Box>
          </Box>
        ))}
      </Paper>
    </Box>
  );
}
