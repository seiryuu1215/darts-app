'use client';

import { useMemo } from 'react';
import { Typography, Box, Alert } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import { calculateConsistency, analyzeMissDirection } from '@/lib/stats-math';
import { compareLastTwoSessions } from '@/lib/countup-session-compare';
import type { CuSessionComparison } from '@/lib/countup-session-compare';
import { SectionTitle, type CountUpPlay } from './countup-deep-shared';

// ─── 前回30G比較ヘルパー ───

interface ComparisonData {
  prevAvg: number;
  currAvg: number;
  diff: number;
  prevBullRate: number | null;
  currBullRate: number | null;
  bullDiff: number | null;
  prevConsistency: number | null;
  currConsistency: number | null;
}

function computeComparison(sorted: CountUpPlay[]): ComparisonData | null {
  if (sorted.length < 60) return null;
  const curr = sorted.slice(-30);
  const prev = sorted.slice(-60, -30);

  const currScores = curr.map((p) => p.score);
  const prevScores = prev.map((p) => p.score);
  const currAvg = currScores.reduce((a, b) => a + b, 0) / currScores.length;
  const prevAvg = prevScores.reduce((a, b) => a + b, 0) / prevScores.length;

  const currMiss = analyzeMissDirection(curr.map((p) => p.playLog));
  const prevMiss = analyzeMissDirection(prev.map((p) => p.playLog));

  const currCon = calculateConsistency(currScores);
  const prevCon = calculateConsistency(prevScores);

  return {
    prevAvg,
    currAvg,
    diff: currAvg - prevAvg,
    prevBullRate: prevMiss?.bullRate ?? null,
    currBullRate: currMiss?.bullRate ?? null,
    bullDiff:
      currMiss?.bullRate != null && prevMiss?.bullRate != null
        ? currMiss.bullRate - prevMiss.bullRate
        : null,
    prevConsistency: prevCon?.score ?? null,
    currConsistency: currCon?.score ?? null,
  };
}

function DiffChip({
  value,
  suffix = '',
  inverse = false,
}: {
  value: number;
  suffix?: string;
  inverse?: boolean;
}) {
  const positive = inverse ? value < 0 : value > 0;
  const color = positive ? '#4caf50' : value === 0 ? '#888' : '#f44336';
  const Icon = value > 0 ? TrendingUpIcon : value < 0 ? TrendingDownIcon : TrendingFlatIcon;
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.3, color }}>
      <Icon sx={{ fontSize: 14 }} />
      <Typography variant="caption" sx={{ fontWeight: 'bold', color }}>
        {value > 0 ? '+' : ''}
        {value.toFixed(1)}
        {suffix}
      </Typography>
    </Box>
  );
}

interface CuComparisonSectionProps {
  sortedPlays: CountUpPlay[];
  period: string;
}

export default function CuComparisonSection({ sortedPlays, period }: CuComparisonSectionProps) {
  const comparison = useMemo(
    () => (period === 'last30' ? computeComparison(sortedPlays) : null),
    [sortedPlays, period],
  );

  const sessionComparison = useMemo(
    (): CuSessionComparison | null => compareLastTwoSessions(sortedPlays),
    [sortedPlays],
  );

  return (
    <>
      {/* 前回30G比較（直近30Gモード時） */}
      {comparison && period === 'last30' && (
        <>
          <SectionTitle>前回30Gとの比較</SectionTitle>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 1.5,
              p: 1.5,
              borderRadius: 1,
              bgcolor: 'action.hover',
              border: 1,
              borderColor: 'divider',
            }}
          >
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                平均スコア
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                {comparison.currAvg.toFixed(0)}
              </Typography>
              <DiffChip value={comparison.diff} />
            </Box>
            {comparison.currBullRate != null && (
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  ブル率
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  {comparison.currBullRate}%
                </Typography>
                {comparison.bullDiff != null && <DiffChip value={comparison.bullDiff} suffix="%" />}
              </Box>
            )}
            {comparison.currConsistency != null && (
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  安定度
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  {comparison.currConsistency}点
                </Typography>
                {comparison.prevConsistency != null && (
                  <DiffChip
                    value={comparison.currConsistency - comparison.prevConsistency}
                    suffix="pt"
                  />
                )}
              </Box>
            )}
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            前回30G: 平均 {comparison.prevAvg.toFixed(0)}
            {comparison.prevBullRate != null && ` / ブル率 ${comparison.prevBullRate}%`}
          </Typography>
        </>
      )}

      {/* 有効セッション比較 (30G以上の日) */}
      {sessionComparison && (
        <>
          <SectionTitle>前回練習日 vs 今回練習日 (30G以上)</SectionTitle>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '80px 1fr 1fr 1fr',
              gap: 0.5,
              p: 1.5,
              borderRadius: 1,
              bgcolor: 'action.hover',
              border: 1,
              borderColor: 'divider',
            }}
          >
            {/* ヘッダー行 */}
            <Box />
            <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
              {sessionComparison.prev.date}
              <br />({sessionComparison.prev.gameCount}G)
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
              {sessionComparison.current.date}
              <br />({sessionComparison.current.gameCount}G)
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
              差分
            </Typography>

            {/* スコア平均 */}
            <Typography
              variant="body2"
              sx={{ fontWeight: 'bold', py: 0.5, borderTop: '1px solid #222' }}
            >
              スコア平均
            </Typography>
            <Typography
              variant="body2"
              sx={{ textAlign: 'center', py: 0.5, borderTop: '1px solid #222' }}
            >
              {sessionComparison.prev.avgScore}
            </Typography>
            <Typography
              variant="body2"
              sx={{ textAlign: 'center', py: 0.5, borderTop: '1px solid #222' }}
            >
              {sessionComparison.current.avgScore}
            </Typography>
            <Box sx={{ textAlign: 'center', py: 0.5, borderTop: '1px solid #222' }}>
              <DiffChip value={sessionComparison.deltas.avgScore} />
            </Box>

            {/* 安定性 */}
            <Typography
              variant="body2"
              sx={{ fontWeight: 'bold', py: 0.5, borderTop: '1px solid #222' }}
            >
              安定性
            </Typography>
            <Typography
              variant="body2"
              sx={{ textAlign: 'center', py: 0.5, borderTop: '1px solid #222' }}
            >
              {sessionComparison.prev.consistency}
            </Typography>
            <Typography
              variant="body2"
              sx={{ textAlign: 'center', py: 0.5, borderTop: '1px solid #222' }}
            >
              {sessionComparison.current.consistency}
            </Typography>
            <Box sx={{ textAlign: 'center', py: 0.5, borderTop: '1px solid #222' }}>
              <DiffChip value={sessionComparison.deltas.consistency} suffix="pt" />
            </Box>

            {/* ブル率 */}
            <Typography
              variant="body2"
              sx={{ fontWeight: 'bold', py: 0.5, borderTop: '1px solid #222' }}
            >
              ブル率
            </Typography>
            <Typography
              variant="body2"
              sx={{ textAlign: 'center', py: 0.5, borderTop: '1px solid #222' }}
            >
              {sessionComparison.prev.bullRate}%
            </Typography>
            <Typography
              variant="body2"
              sx={{ textAlign: 'center', py: 0.5, borderTop: '1px solid #222' }}
            >
              {sessionComparison.current.bullRate}%
            </Typography>
            <Box sx={{ textAlign: 'center', py: 0.5, borderTop: '1px solid #222' }}>
              <DiffChip value={sessionComparison.deltas.bullRate} suffix="%" />
            </Box>

            {/* 横ずれ(X) */}
            {(sessionComparison.prev.avgVectorX !== 0 ||
              sessionComparison.current.avgVectorX !== 0) && (
              <>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 'bold', py: 0.5, borderTop: '1px solid #222' }}
                >
                  横ずれ(X)
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ textAlign: 'center', py: 0.5, borderTop: '1px solid #222' }}
                >
                  {sessionComparison.prev.avgVectorX}mm
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ textAlign: 'center', py: 0.5, borderTop: '1px solid #222' }}
                >
                  {sessionComparison.current.avgVectorX}mm
                </Typography>
                <Box sx={{ textAlign: 'center', py: 0.5, borderTop: '1px solid #222' }}>
                  <DiffChip value={sessionComparison.deltas.vectorX} suffix="mm" inverse />
                </Box>
              </>
            )}

            {/* 縦ずれ(Y) */}
            {(sessionComparison.prev.avgVectorY !== 0 ||
              sessionComparison.current.avgVectorY !== 0) && (
              <>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 'bold', py: 0.5, borderTop: '1px solid #222' }}
                >
                  縦ずれ(Y)
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ textAlign: 'center', py: 0.5, borderTop: '1px solid #222' }}
                >
                  {sessionComparison.prev.avgVectorY}mm
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ textAlign: 'center', py: 0.5, borderTop: '1px solid #222' }}
                >
                  {sessionComparison.current.avgVectorY}mm
                </Typography>
                <Box sx={{ textAlign: 'center', py: 0.5, borderTop: '1px solid #222' }}>
                  <DiffChip value={sessionComparison.deltas.vectorY} suffix="mm" inverse />
                </Box>
              </>
            )}

            {/* レンジ(半径) */}
            {(sessionComparison.prev.avgRadius !== 0 ||
              sessionComparison.current.avgRadius !== 0) && (
              <>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 'bold', py: 0.5, borderTop: '1px solid #222' }}
                >
                  レンジ
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ textAlign: 'center', py: 0.5, borderTop: '1px solid #222' }}
                >
                  {sessionComparison.prev.avgRadius}mm
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ textAlign: 'center', py: 0.5, borderTop: '1px solid #222' }}
                >
                  {sessionComparison.current.avgRadius}mm
                </Typography>
                <Box sx={{ textAlign: 'center', py: 0.5, borderTop: '1px solid #222' }}>
                  <DiffChip value={sessionComparison.deltas.radius} suffix="mm" inverse />
                </Box>
              </>
            )}

            {/* スピード */}
            {(sessionComparison.prev.avgSpeed !== 0 ||
              sessionComparison.current.avgSpeed !== 0) && (
              <>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 'bold', py: 0.5, borderTop: '1px solid #222' }}
                >
                  スピード
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ textAlign: 'center', py: 0.5, borderTop: '1px solid #222' }}
                >
                  {sessionComparison.prev.avgSpeed}km/h
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ textAlign: 'center', py: 0.5, borderTop: '1px solid #222' }}
                >
                  {sessionComparison.current.avgSpeed}km/h
                </Typography>
                <Box sx={{ textAlign: 'center', py: 0.5, borderTop: '1px solid #222' }}>
                  <DiffChip value={sessionComparison.deltas.speed} suffix="km/h" />
                </Box>
              </>
            )}
          </Box>

          {/* インサイト */}
          {sessionComparison.insights.length > 0 && (
            <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {sessionComparison.insights.map((insight, i) => (
                <Alert
                  key={i}
                  severity={
                    insight.includes('改善') ||
                    insight.includes('アップ') ||
                    insight.includes('近づ')
                      ? 'success'
                      : insight.includes('低下') ||
                          insight.includes('ダウン') ||
                          insight.includes('広が')
                        ? 'warning'
                        : 'info'
                  }
                  sx={{ py: 0, '& .MuiAlert-message': { fontSize: 12 } }}
                >
                  {insight}
                </Alert>
              ))}
            </Box>
          )}
        </>
      )}
    </>
  );
}
