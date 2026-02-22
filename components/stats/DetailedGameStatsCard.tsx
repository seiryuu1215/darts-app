'use client';

import { Box, Paper, Typography, Divider } from '@mui/material';
import { COLOR_01, COLOR_CRICKET } from '@/lib/dartslive-colors';

interface DetailedStats {
  avg: number | null;
  best: number | null;
  winRate: number | null;
  bullRate?: number | null;
  arrangeRate?: number | null;
  avgBust?: number | null;
  tripleRate?: number | null;
  openCloseRate?: number | null;
  avg100?: number | null;
}

interface DetailedGameStatsCardProps {
  stats01: DetailedStats | null;
  statsCricket: DetailedStats | null;
}

function StatRow({ label, value, unit }: { label: string; value: number | null; unit?: string }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
        {value != null ? `${value}${unit ?? ''}` : '--'}
      </Typography>
    </Box>
  );
}

export default function DetailedGameStatsCard({
  stats01,
  statsCricket,
}: DetailedGameStatsCardProps) {
  if (!stats01 && !statsCricket) return null;

  return (
    <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
      {/* 01 詳細 */}
      <Paper sx={{ flex: 1, p: 2, borderRadius: 2, borderTop: `3px solid ${COLOR_01}` }}>
        <Typography variant="subtitle2" sx={{ color: COLOR_01, fontWeight: 'bold', mb: 1 }}>
          01 GAMES 詳細
        </Typography>
        <StatRow label="平均" value={stats01?.avg ?? null} />
        <StatRow label="ベスト" value={stats01?.best ?? null} />
        <StatRow label="100%平均" value={stats01?.avg100 ?? null} />
        <Divider sx={{ my: 1 }} />
        <StatRow label="勝率" value={stats01?.winRate ?? null} unit="%" />
        <StatRow label="Bull率" value={stats01?.bullRate ?? null} unit="%" />
        <StatRow label="アレンジ成功率" value={stats01?.arrangeRate ?? null} unit="%" />
        <StatRow label="平均バスト" value={stats01?.avgBust ?? null} />
      </Paper>

      {/* Cricket 詳細 */}
      <Paper sx={{ flex: 1, p: 2, borderRadius: 2, borderTop: `3px solid ${COLOR_CRICKET}` }}>
        <Typography variant="subtitle2" sx={{ color: COLOR_CRICKET, fontWeight: 'bold', mb: 1 }}>
          CRICKET 詳細
        </Typography>
        <StatRow label="平均" value={statsCricket?.avg ?? null} />
        <StatRow label="ベスト" value={statsCricket?.best ?? null} />
        <StatRow label="100%平均" value={statsCricket?.avg100 ?? null} />
        <Divider sx={{ my: 1 }} />
        <StatRow label="勝率" value={statsCricket?.winRate ?? null} unit="%" />
        <StatRow label="トリプル率" value={statsCricket?.tripleRate ?? null} unit="%" />
        <StatRow label="Open-Close率" value={statsCricket?.openCloseRate ?? null} unit="%" />
      </Paper>
    </Box>
  );
}
