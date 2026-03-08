'use client';

import { useMemo, useState } from 'react';
import { Paper, Typography, Box, Chip } from '@mui/material';
import { computeStats, calculateConsistency, analyzeMissDirection } from '@/lib/stats-math';
import { parsePlayTime } from '@/lib/stats-math';
import { COLOR_COUNTUP } from '@/lib/dartslive-colors';
import {
  filterByPeriod,
  PeriodSelector,
  type CountUpPlay,
  type PeriodKey,
  type Stats01Detailed,
  type BestRecord,
} from './countup-deep-shared';
import CuScoreBandsSection from './CuScoreBandsSection';
import CuMissAnalysisSection from './CuMissAnalysisSection';
import CuSpeedAnalysisSection from './CuSpeedAnalysisSection';
import CuPerformanceSection from './CuPerformanceSection';

export type { CountUpPlay } from './countup-deep-shared';

interface CountUpDeepAnalysisCardProps {
  countupPlays: CountUpPlay[];
  stats01Detailed?: Stats01Detailed | null;
  bestRecords?: BestRecord[] | null;
}

export default function CountUpDeepAnalysisCard({
  countupPlays,
  stats01Detailed,
  bestRecords,
}: CountUpDeepAnalysisCardProps) {
  const [period, setPeriod] = useState<PeriodKey>('last30');
  const [excludeOuterSingle, setExcludeOuterSingle] = useState(false);

  const sortedPlays = useMemo(
    () =>
      [...countupPlays].sort(
        (a, b) => parsePlayTime(a.time).getTime() - parsePlayTime(b.time).getTime(),
      ),
    [countupPlays],
  );

  const filtered = useMemo(() => filterByPeriod(sortedPlays, period), [sortedPlays, period]);
  const scores = useMemo(() => filtered.map((p) => p.score), [filtered]);
  const playLogs = useMemo(() => filtered.map((p) => p.playLog), [filtered]);

  if (sortedPlays.length < 3) return null;

  if (filtered.length === 0) {
    return (
      <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            COUNT-UP 深掘り分析
          </Typography>
        </Box>
        <PeriodSelector period={period} onChange={setPeriod} counts={sortedPlays} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
          この期間のデータがありません
        </Typography>
      </Paper>
    );
  }

  const stats = computeStats(scores);
  const consistency = calculateConsistency(scores);
  const missDirection = analyzeMissDirection(
    playLogs,
    excludeOuterSingle ? { excludeOuterSingle: true } : undefined,
  );

  const ppd = stats01Detailed?.avg ?? null;
  const expectedScore = ppd != null ? Math.round(ppd * 8) : null;
  const performanceRatio =
    expectedScore != null && expectedScore > 0
      ? Math.round((stats.avg / expectedScore) * 100)
      : null;

  const cuBest = bestRecords?.find(
    (r) => r.gameName === 'COUNT-UP' || r.gameId === 'COUNT-UP',
  )?.bestScore;
  const bestDeviation =
    cuBest != null && cuBest > 0 ? Math.round(((cuBest - stats.avg) / cuBest) * 100) : null;

  const dl3Plays = filtered.filter(
    (p) => p.dl3VectorX !== 0 || p.dl3VectorY !== 0 || p.dl3Radius !== 0,
  );
  const avgDl3 =
    dl3Plays.length > 0
      ? {
          vectorX: dl3Plays.reduce((s, p) => s + p.dl3VectorX, 0) / dl3Plays.length,
          vectorY: dl3Plays.reduce((s, p) => s + p.dl3VectorY, 0) / dl3Plays.length,
          radius: dl3Plays.reduce((s, p) => s + p.dl3Radius, 0) / dl3Plays.length,
          speed: dl3Plays.reduce((s, p) => s + p.dl3Speed, 0) / dl3Plays.length,
        }
      : null;

  return (
    <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
          COUNT-UP 深掘り分析
        </Typography>
        <Chip
          label={`${filtered.length}件`}
          size="small"
          sx={{ fontSize: 10, height: 20, bgcolor: COLOR_COUNTUP, color: 'common.white' }}
        />
        <Chip
          label={`全${sortedPlays.length}件`}
          size="small"
          variant="outlined"
          sx={{ fontSize: 10, height: 20 }}
        />
      </Box>

      <PeriodSelector period={period} onChange={setPeriod} counts={sortedPlays} />

      <CuScoreBandsSection
        filtered={filtered}
        scores={scores}
        stats={stats}
        expectedScore={expectedScore}
        performanceRatio={performanceRatio}
      />

      {missDirection && (
        <CuMissAnalysisSection
          missDirection={missDirection}
          excludeOuterSingle={excludeOuterSingle}
          onToggleExcludeOuterSingle={() => setExcludeOuterSingle((v) => !v)}
          avgDl3={avgDl3}
        />
      )}

      <CuSpeedAnalysisSection filtered={filtered} />

      <CuPerformanceSection
        filtered={filtered}
        scores={scores}
        playLogs={playLogs}
        consistency={consistency}
        bestDeviation={bestDeviation}
      />
    </Paper>
  );
}
