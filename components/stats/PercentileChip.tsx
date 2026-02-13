'use client';

import { Chip, Tooltip } from '@mui/material';
import { getPercentile, getPercentileColor } from '@/lib/dartslive-percentile';

interface PercentileChipProps {
  type: 'rating' | 'ppd' | 'mpr' | 'countup';
  value: number;
}

const TYPE_LABELS: Record<string, string> = {
  rating: 'RATING',
  ppd: 'PPD',
  mpr: 'MPR',
  countup: 'COUNT-UP',
};

export default function PercentileChip({ type, value }: PercentileChipProps) {
  const percentile = getPercentile(type, value);
  const color = getPercentileColor(percentile);
  const label = TYPE_LABELS[type] ?? type;

  return (
    <Tooltip
      title={`あなたの ${label} ${type === 'countup' ? Math.round(value) : value.toFixed(2)} は DARTSLIVEプレイヤーの上位約 ${percentile}% に位置します。\n※ DARTSLIVE公式分布(2024)を参考にした推定値です`}
      arrow
    >
      <Chip
        label={`上位 ${percentile}%`}
        size="small"
        sx={{
          bgcolor: `${color}22`,
          color,
          fontWeight: 'bold',
          fontSize: '0.7rem',
          height: 22,
          borderColor: `${color}44`,
          border: '1px solid',
        }}
      />
    </Tooltip>
  );
}
