'use client';

import { useMemo } from 'react';
import { Box, Paper, Typography, LinearProgress } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import StarIcon from '@mui/icons-material/Star';
import InsightsIcon from '@mui/icons-material/Insights';
import type { HealthMetric, HealthDartsCorrelation } from '@/types';
import {
  calculateConditionScore,
  calculatePersonalBaseline,
  predictCuFromCondition,
} from '@/lib/health-analytics';

export function ConditionScoreSection({
  metrics,
  correlationData,
}: {
  metrics: HealthMetric[];
  correlationData: HealthDartsCorrelation[];
}) {
  const result = useMemo(() => {
    if (metrics.length === 0) return null;
    const baseline = calculatePersonalBaseline(metrics);
    const score = calculateConditionScore(metrics[0], baseline);
    const prediction = predictCuFromCondition(score.score, correlationData);
    return { score, prediction };
  }, [metrics, correlationData]);

  if (!result) return null;

  const { score, prediction } = result;
  const progressColor =
    score.score >= 80
      ? '#22c55e'
      : score.score >= 60
        ? '#eab308'
        : score.score >= 40
          ? '#f97316'
          : '#ef4444';

  const factors = [
    { label: 'HRV', value: score.factors.hrv, color: '#ef4444' },
    { label: '睡眠時間', value: score.factors.sleep, color: '#a78bfa' },
    { label: '安静時心拍', value: score.factors.restingHr, color: '#f97316' },
    { label: '睡眠品質', value: score.factors.sleepQuality, color: '#6d28d9' },
    { label: '活動量', value: score.factors.activity, color: '#22c55e' },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 0.5 }}>
        <InsightsIcon sx={{ fontSize: 16, color: progressColor }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          コンディションスコア
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ position: 'relative', display: 'inline-flex' }}>
            <CircularProgress
              variant="determinate"
              value={score.score}
              size={80}
              thickness={5}
              sx={{ color: progressColor }}
            />
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1 }}>
                {score.score}
              </Typography>
              <Typography variant="caption" sx={{ fontSize: 9, color: '#71717a' }}>
                {score.label}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ flex: 1 }}>
            {factors.map((f) => (
              <Box key={f.label} sx={{ mb: 0.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
                  <Typography variant="caption" sx={{ fontSize: 10, color: '#a1a1aa' }}>
                    {f.label}
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: 10, color: '#a1a1aa' }}>
                    {f.value}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={f.value}
                  sx={{
                    height: 4,
                    borderRadius: 2,
                    bgcolor: 'rgba(255,255,255,0.05)',
                    '& .MuiLinearProgress-bar': { bgcolor: f.color, borderRadius: 2 },
                  }}
                />
              </Box>
            ))}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1.5 }}>
          <StarIcon sx={{ fontSize: 14, color: '#eab308' }} />
          <Typography variant="caption" sx={{ fontSize: 11, color: '#a1a1aa' }}>
            LINE記録おすすめ: ★{score.star}
          </Typography>
        </Box>

        {prediction && (
          <Box sx={{ mt: 1, p: 1, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 1 }}>
            <Typography variant="caption" sx={{ fontSize: 10, color: '#71717a' }}>
              CU平均予測レンジ
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#fafafa' }}>
              {prediction.low} — <strong>{prediction.expected}</strong> — {prediction.high}
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
