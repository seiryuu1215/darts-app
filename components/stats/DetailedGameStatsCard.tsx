'use client';

import { useMemo } from 'react';
import { Box, Paper, Typography, Chip, Divider } from '@mui/material';
import { COLOR_01, COLOR_CRICKET } from '@/lib/dartslive-colors';
import { getPercentile, getPercentileColor, getPercentileLabel } from '@/lib/dartslive-percentile';
import { evaluateBullRate } from '@/lib/dartslive-reference';

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

function StatRow({
  label,
  value,
  unit,
  percentile,
}: {
  label: string;
  value: number | null;
  unit?: string;
  percentile?: { type: 'ppd' | 'mpr'; value: number } | null;
}) {
  const pctResult = useMemo(() => {
    if (!percentile || value == null) return null;
    const pct = getPercentile(percentile.type, percentile.value);
    return { pct, color: getPercentileColor(pct), label: getPercentileLabel(pct) };
  }, [percentile, value]);

  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
          {value != null ? `${value}${unit ?? ''}` : '--'}
        </Typography>
        {pctResult && (
          <Chip
            label={`上位${pctResult.pct}%`}
            size="small"
            sx={{
              height: 18,
              fontSize: 9,
              bgcolor: `${pctResult.color}22`,
              color: pctResult.color,
              border: `1px solid ${pctResult.color}44`,
              '& .MuiChip-label': { px: 0.5 },
            }}
          />
        )}
      </Box>
    </Box>
  );
}

function DiffRow({
  label,
  avg,
  avg100,
}: {
  label: string;
  avg: number | null;
  avg100: number | null;
}) {
  if (avg == null || avg100 == null) return null;
  const diff = Math.round((avg100 - avg) * 100) / 100;
  if (diff === 0) return null;
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.3 }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography
        variant="caption"
        sx={{ color: diff > 0 ? '#4caf50' : '#f44336', fontWeight: 'bold' }}
      >
        {diff > 0 ? '+' : ''}
        {diff}
      </Typography>
    </Box>
  );
}

function BullRateBenchmark({ ppd, actualBullRate }: { ppd: number; actualBullRate: number }) {
  const { expected, diff } = evaluateBullRate(ppd, actualBullRate);
  if (expected === 0) return null;
  const diffColor = diff >= 1 ? '#4caf50' : diff >= -2 ? '#aaa' : '#f44336';
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.3 }}>
      <Typography variant="caption" color="text.secondary">
        Rt期待値
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Typography variant="caption" sx={{ color: '#888' }}>
          {expected}%
        </Typography>
        <Typography variant="caption" sx={{ color: diffColor, fontWeight: 'bold' }}>
          ({diff >= 0 ? '+' : ''}
          {diff.toFixed(1)}%)
        </Typography>
      </Box>
    </Box>
  );
}

function generate01Analysis(stats: DetailedStats): string {
  const parts: string[] = [];
  if (stats.bullRate != null && stats.bullRate >= 20) parts.push('Bull率が高い');
  else if (stats.bullRate != null && stats.bullRate < 10) parts.push('Bull率が課題');

  if (stats.arrangeRate != null && stats.arrangeRate >= 25) parts.push('フィニッシュ力◎');
  else if (stats.arrangeRate != null && stats.arrangeRate < 15) parts.push('アレンジが課題');

  if (stats.avgBust != null && stats.avgBust >= 80) parts.push('バスト時の残りが高め');

  if (stats.winRate != null && stats.winRate >= 55) parts.push('勝率良好');
  else if (stats.winRate != null && stats.winRate < 40) parts.push('勝率改善の余地あり');

  if (parts.length === 0) return 'バランスの取れたプレースタイル';
  return parts.join('・');
}

function generateCricketAnalysis(stats: DetailedStats): string {
  const parts: string[] = [];
  if (stats.tripleRate != null && stats.tripleRate >= 15) parts.push('トリプル精度が高い');
  else if (stats.tripleRate != null && stats.tripleRate < 8) parts.push('トリプル精度が課題');

  if (stats.openCloseRate != null && stats.openCloseRate >= 50) parts.push('オープン力◎');
  else if (stats.openCloseRate != null && stats.openCloseRate < 30) parts.push('オープン率が課題');

  if (stats.winRate != null && stats.winRate >= 55) parts.push('勝率良好');
  else if (stats.winRate != null && stats.winRate < 40) parts.push('勝率改善の余地あり');

  if (parts.length === 0) return 'バランスの取れたプレースタイル';
  return parts.join('・');
}

export default function DetailedGameStatsCard({
  stats01,
  statsCricket,
}: DetailedGameStatsCardProps) {
  const analysis01 = useMemo(() => (stats01 ? generate01Analysis(stats01) : null), [stats01]);
  const analysisCri = useMemo(
    () => (statsCricket ? generateCricketAnalysis(statsCricket) : null),
    [statsCricket],
  );

  if (!stats01 && !statsCricket) return null;

  return (
    <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
      {/* 01 詳細 */}
      <Paper sx={{ flex: 1, p: 2, borderRadius: 2, borderTop: `3px solid ${COLOR_01}` }}>
        <Typography variant="subtitle2" sx={{ color: COLOR_01, fontWeight: 'bold', mb: 1 }}>
          01 GAMES 詳細
        </Typography>
        <StatRow
          label="平均"
          value={stats01?.avg ?? null}
          percentile={stats01?.avg != null ? { type: 'ppd', value: stats01.avg } : null}
        />
        <StatRow label="ベスト" value={stats01?.best ?? null} />
        <StatRow label="100%平均" value={stats01?.avg100 ?? null} />
        <DiffRow label="80%→100%差分" avg={stats01?.avg ?? null} avg100={stats01?.avg100 ?? null} />
        <Divider sx={{ my: 1 }} />
        <StatRow label="勝率" value={stats01?.winRate ?? null} unit="%" />
        <StatRow label="Bull率" value={stats01?.bullRate ?? null} unit="%" />
        {stats01?.avg != null && stats01?.bullRate != null && (
          <BullRateBenchmark ppd={stats01.avg} actualBullRate={stats01.bullRate} />
        )}
        <StatRow label="アレンジ成功率" value={stats01?.arrangeRate ?? null} unit="%" />
        <StatRow label="平均バスト" value={stats01?.avgBust ?? null} />
        {analysis01 && (
          <>
            <Divider sx={{ my: 1 }} />
            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              {analysis01}
            </Typography>
          </>
        )}
      </Paper>

      {/* Cricket 詳細 */}
      <Paper sx={{ flex: 1, p: 2, borderRadius: 2, borderTop: `3px solid ${COLOR_CRICKET}` }}>
        <Typography variant="subtitle2" sx={{ color: COLOR_CRICKET, fontWeight: 'bold', mb: 1 }}>
          CRICKET 詳細
        </Typography>
        <StatRow
          label="平均"
          value={statsCricket?.avg ?? null}
          percentile={statsCricket?.avg != null ? { type: 'mpr', value: statsCricket.avg } : null}
        />
        <StatRow label="ベスト" value={statsCricket?.best ?? null} />
        <StatRow label="100%平均" value={statsCricket?.avg100 ?? null} />
        <DiffRow
          label="80%→100%差分"
          avg={statsCricket?.avg ?? null}
          avg100={statsCricket?.avg100 ?? null}
        />
        <Divider sx={{ my: 1 }} />
        <StatRow label="勝率" value={statsCricket?.winRate ?? null} unit="%" />
        <StatRow label="トリプル率" value={statsCricket?.tripleRate ?? null} unit="%" />
        <StatRow label="Open-Close率" value={statsCricket?.openCloseRate ?? null} unit="%" />
        {analysisCri && (
          <>
            <Divider sx={{ my: 1 }} />
            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              {analysisCri}
            </Typography>
          </>
        )}
      </Paper>
    </Box>
  );
}
