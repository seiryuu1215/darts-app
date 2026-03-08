'use client';

import { Paper, Typography } from '@mui/material';

export function ChartTooltip({
  active,
  payload,
  label,
  unit,
}: {
  active?: boolean;
  payload?: Array<{ value: number; color: string }>;
  label?: string;
  unit?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <Paper sx={{ px: 1.5, py: 1, bgcolor: '#1e1e1e', border: '1px solid #444', borderRadius: 1.5 }}>
      <Typography variant="caption" sx={{ fontSize: 10, color: '#a1a1aa' }}>
        {label}
      </Typography>
      {payload.map((p, i) => (
        <Typography
          key={i}
          variant="body2"
          sx={{ fontFamily: 'monospace', fontWeight: 500, color: p.color }}
        >
          {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
          {unit && (
            <Typography
              component="span"
              variant="caption"
              sx={{ ml: 0.5, color: '#71717a', fontSize: 10 }}
            >
              {unit}
            </Typography>
          )}
        </Typography>
      ))}
    </Paper>
  );
}
