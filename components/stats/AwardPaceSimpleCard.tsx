'use client';

import { Paper, Box, Typography, LinearProgress } from '@mui/material';

interface AwardPaceSimpleCardProps {
  awards: Record<string, { monthly: number; total: number }>;
}

const TARGET_AWARDS = ['D-BULL', 'S-BULL', 'HAT TRICK', 'LOW TON', 'TON 80'];
const MILESTONES = [100, 500, 1000, 5000, 10000];

function nextMilestone(total: number): number | null {
  for (const m of MILESTONES) {
    if (total < m) return m;
  }
  return null;
}

export default function AwardPaceSimpleCard({ awards }: AwardPaceSimpleCardProps) {
  if (!awards) return null;

  const rows = TARGET_AWARDS.map((name) => {
    const data = awards[name];
    if (!data || data.monthly <= 0) return null;
    const milestone = nextMilestone(data.total);
    if (milestone == null) return null;
    const remaining = milestone - data.total;
    const estimatedMonths = Math.ceil(remaining / data.monthly);
    const progress = Math.round((data.total / milestone) * 100);
    return {
      name,
      total: data.total,
      monthly: data.monthly,
      milestone,
      remaining,
      estimatedMonths,
      progress,
    };
  }).filter(Boolean) as {
    name: string;
    total: number;
    monthly: number;
    milestone: number;
    remaining: number;
    estimatedMonths: number;
    progress: number;
  }[];

  if (rows.length === 0) return null;

  return (
    <Paper sx={{ p: 2, mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1.5 }}>
        アワードペース予測
      </Typography>

      {rows.map((row) => (
        <Box key={row.name} sx={{ mb: 2, '&:last-child': { mb: 0 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              {row.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {row.total} / {row.milestone}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={row.progress}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: 'action.hover',
              '& .MuiLinearProgress-bar': { borderRadius: 4 },
              mb: 0.5,
            }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="caption" color="text.secondary">
              月間 {row.monthly}回ペース
            </Typography>
            <Typography variant="caption" color="text.secondary">
              あと約{row.estimatedMonths}ヶ月
            </Typography>
          </Box>
        </Box>
      ))}
    </Paper>
  );
}
