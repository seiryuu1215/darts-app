'use client';

import { useMemo, type ReactNode } from 'react';
import { Typography, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { parsePlayTime } from '@/lib/stats-math';

/** COUNT-UPプレイデータ（PLAY_LOG付き） */
export interface CountUpPlay {
  time: string;
  score: number;
  playLog: string;
  dl3VectorX: number;
  dl3VectorY: number;
  dl3Radius: number;
  dl3Speed: number;
}

export interface Stats01Detailed {
  avg: number | null;
  best: number | null;
  winRate: number | null;
  bullRate: number | null;
  arrangeRate: number | null;
  avgBust: number | null;
  avg100: number | null;
}

export interface BestRecord {
  gameId: string;
  gameName: string;
  bestScore: number;
  bestDate: string | null;
}

export type PeriodKey = 'last30' | 'month' | 'week' | 'latest';

export const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: 'last30', label: '直近30G' },
  { key: 'month', label: '1ヶ月' },
  { key: 'week', label: '1週間' },
  { key: 'latest', label: '直近' },
];

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mt: 2.5, mb: 1, color: '#aaa' }}>
      {children}
    </Typography>
  );
}

/** 期間でフィルタ */
export function filterByPeriod(plays: CountUpPlay[], period: PeriodKey): CountUpPlay[] {
  if (period === 'last30') return plays.slice(-30);

  const now = new Date();
  let cutoff: Date;
  switch (period) {
    case 'latest': {
      // 最新プレイ日のデータのみ返す
      if (plays.length === 0) return [];
      const latestTime = parsePlayTime(plays[plays.length - 1].time);
      cutoff = new Date(latestTime.getFullYear(), latestTime.getMonth(), latestTime.getDate());
      break;
    }
    case 'week':
      cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      return plays;
  }

  return plays.filter((p) => parsePlayTime(p.time) >= cutoff);
}

/** 期間セレクタ */
export function PeriodSelector({
  period,
  onChange,
  counts,
}: {
  period: PeriodKey;
  onChange: (v: PeriodKey) => void;
  counts: CountUpPlay[];
}) {
  const periodCounts = useMemo(() => {
    const result: Record<PeriodKey, number> = { last30: 0, month: 0, week: 0, latest: 0 };
    for (const p of PERIODS) {
      result[p.key] = filterByPeriod(counts, p.key).length;
    }
    return result;
  }, [counts]);

  return (
    <ToggleButtonGroup
      value={period}
      exclusive
      onChange={(_, v) => v && onChange(v as PeriodKey)}
      size="small"
      sx={{ mb: 1, flexWrap: 'wrap' }}
    >
      {PERIODS.map((p) => (
        <ToggleButton
          key={p.key}
          value={p.key}
          sx={{
            fontSize: 11,
            px: 1.2,
            py: 0.4,
            textTransform: 'none',
            '&.Mui-selected': { bgcolor: 'rgba(67, 160, 71, 0.2)' },
          }}
        >
          {p.label}
          <Typography component="span" sx={{ fontSize: 9, ml: 0.5, opacity: 0.7 }}>
            ({periodCounts[p.key]})
          </Typography>
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
