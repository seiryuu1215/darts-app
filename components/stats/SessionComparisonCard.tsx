'use client';

import { Paper, Box, Typography, Chip } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';

interface StatsHistoryRecord {
  id: string;
  date: string;
  rating: number | null;
  ppd: number | null;
  mpr: number | null;
  gamesPlayed: number;
  condition: number | null;
  memo: string;
  dBull: number | null;
  sBull: number | null;
}

interface SessionComparisonCardProps {
  periodRecords: StatsHistoryRecord[];
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function DeltaCell({
  delta,
  higherIsBetter,
  decimals = 2,
}: {
  delta: number | null;
  higherIsBetter: boolean;
  decimals?: number;
}) {
  if (delta == null) {
    return (
      <Typography variant="body2" color="text.secondary">
        --
      </Typography>
    );
  }

  const positive = higherIsBetter ? delta > 0 : delta < 0;
  const color = Math.abs(delta) < 0.01 ? '#888' : positive ? '#4caf50' : '#f44336';
  const Icon = delta > 0.01 ? TrendingUpIcon : delta < -0.01 ? TrendingDownIcon : TrendingFlatIcon;

  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.3, color }}>
      <Icon sx={{ fontSize: 14 }} />
      <Typography variant="body2" sx={{ fontWeight: 'bold', color, fontSize: 13 }}>
        {delta > 0 ? '+' : ''}
        {delta.toFixed(decimals)}
      </Typography>
    </Box>
  );
}

function ConditionStars({ value }: { value: number | null }) {
  if (value == null)
    return (
      <Typography variant="body2" color="text.secondary">
        --
      </Typography>
    );
  return (
    <Typography variant="body2" sx={{ fontSize: 13 }}>
      {'★'.repeat(Math.min(5, Math.max(0, value)))}
      {'☆'.repeat(Math.max(0, 5 - value))}
    </Typography>
  );
}

export default function SessionComparisonCard({ periodRecords }: SessionComparisonCardProps) {
  // 日付でソートして直近2件を取得
  const sorted = [...periodRecords]
    .filter((r) => r.rating != null || r.ppd != null || r.mpr != null)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (sorted.length < 2) return null;

  const prev = sorted[sorted.length - 2];
  const curr = sorted[sorted.length - 1];

  const rows: {
    label: string;
    prev: string;
    curr: string;
    delta: number | null;
    higherIsBetter: boolean;
    decimals: number;
  }[] = [
    {
      label: 'Rating',
      prev: prev.rating?.toFixed(2) ?? '--',
      curr: curr.rating?.toFixed(2) ?? '--',
      delta: prev.rating != null && curr.rating != null ? curr.rating - prev.rating : null,
      higherIsBetter: true,
      decimals: 2,
    },
    {
      label: 'PPD',
      prev: prev.ppd?.toFixed(2) ?? '--',
      curr: curr.ppd?.toFixed(2) ?? '--',
      delta: prev.ppd != null && curr.ppd != null ? curr.ppd - prev.ppd : null,
      higherIsBetter: true,
      decimals: 2,
    },
    {
      label: 'MPR',
      prev: prev.mpr?.toFixed(2) ?? '--',
      curr: curr.mpr?.toFixed(2) ?? '--',
      delta: prev.mpr != null && curr.mpr != null ? curr.mpr - prev.mpr : null,
      higherIsBetter: true,
      decimals: 2,
    },
    {
      label: 'ゲーム数',
      prev: `${prev.gamesPlayed}`,
      curr: `${curr.gamesPlayed}`,
      delta: curr.gamesPlayed - prev.gamesPlayed,
      higherIsBetter: true,
      decimals: 0,
    },
  ];

  // 総合判定
  let positiveCount = 0;
  let negativeCount = 0;
  for (const r of rows) {
    if (r.delta == null) continue;
    if (r.label === 'ゲーム数') continue;
    if (r.delta > 0.01) positiveCount++;
    else if (r.delta < -0.01) negativeCount++;
  }

  const verdict =
    positiveCount > negativeCount
      ? { label: '前回より好調', color: '#4caf50' as const }
      : negativeCount > positiveCount
        ? { label: '前回より不調', color: '#f44336' as const }
        : { label: '前回と同水準', color: '#888' as const };

  return (
    <Paper sx={{ p: 2, mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1.5 }}>
        セッション比較
      </Typography>

      {/* ヘッダー行 */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '72px 1fr 1fr 1fr',
          gap: 1,
          mb: 0.5,
        }}
      >
        <Box />
        <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
          前回 ({formatDate(prev.date)})
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
          今回 ({formatDate(curr.date)})
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
          変化
        </Typography>
      </Box>

      {/* データ行 */}
      {rows.map((r) => (
        <Box
          key={r.label}
          sx={{
            display: 'grid',
            gridTemplateColumns: '72px 1fr 1fr 1fr',
            gap: 1,
            py: 0.7,
            borderTop: '1px solid',
            borderColor: 'divider',
            alignItems: 'center',
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: 12 }}>
            {r.label}
          </Typography>
          <Typography variant="body2" sx={{ textAlign: 'center', fontSize: 13 }}>
            {r.prev}
          </Typography>
          <Typography variant="body2" sx={{ textAlign: 'center', fontSize: 13 }}>
            {r.curr}
          </Typography>
          <Box sx={{ textAlign: 'center' }}>
            <DeltaCell delta={r.delta} higherIsBetter={r.higherIsBetter} decimals={r.decimals} />
          </Box>
        </Box>
      ))}

      {/* 調子行 */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '72px 1fr 1fr 1fr',
          gap: 1,
          py: 0.7,
          borderTop: '1px solid',
          borderColor: 'divider',
          alignItems: 'center',
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: 12 }}>
          調子
        </Typography>
        <Box sx={{ textAlign: 'center' }}>
          <ConditionStars value={prev.condition} />
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <ConditionStars value={curr.condition} />
        </Box>
        <Box />
      </Box>

      {/* 総合判定チップ */}
      <Box sx={{ textAlign: 'center', mt: 1.5 }}>
        <Chip
          label={verdict.label}
          size="small"
          sx={{
            bgcolor: `${verdict.color}22`,
            color: verdict.color,
            fontWeight: 'bold',
            borderColor: verdict.color,
          }}
          variant="outlined"
        />
      </Box>
    </Paper>
  );
}
