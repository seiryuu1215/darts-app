'use client';

import { Box, Typography } from '@mui/material';
import AirIcon from '@mui/icons-material/Air';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import type { HealthMetric } from '@/types';
import { CATEGORY_COLORS } from './constants';
import { getTrend } from './utils';
import { HealthCard } from './HealthCard';

export function VitalsSection({
  latest,
  previousLatest,
}: {
  latest: HealthMetric | null;
  previousLatest: HealthMetric | null;
}) {
  const color = CATEGORY_COLORS.vitals;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 0.5 }}>
        <WaterDropIcon sx={{ fontSize: 16, color: color.primary }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          バイタル
        </Typography>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
        <HealthCard
          icon={<AirIcon sx={{ fontSize: 14, color: color.primary }} />}
          label="呼吸数"
          value={latest?.respiratoryRate ?? null}
          unit="回/分"
          trend={getTrend(latest?.respiratoryRate ?? null, previousLatest?.respiratoryRate ?? null)}
          trendGoodDirection="down"
          color={color}
        />
        <HealthCard
          icon={<WaterDropIcon sx={{ fontSize: 14, color: color.primary }} />}
          label="SpO2"
          value={latest?.bloodOxygenPct ?? null}
          unit="%"
          trend={getTrend(latest?.bloodOxygenPct ?? null, previousLatest?.bloodOxygenPct ?? null)}
          trendGoodDirection="up"
          color={color}
        />
      </Box>
    </Box>
  );
}
