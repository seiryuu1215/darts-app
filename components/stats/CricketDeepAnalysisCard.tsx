'use client';

import { useMemo } from 'react';
import { Paper, Typography, Box, Chip, Alert } from '@mui/material';
import { calc01Rating, calcCriRating, mprForRating } from '@/lib/dartslive-rating';
import { getPercentile, getPercentileColor } from '@/lib/dartslive-percentile';
import { COLOR_CRICKET } from '@/lib/dartslive-colors';
import { getFlightColor } from '@/lib/dartslive-colors';

interface StatsCricketDetailed {
  avg: number | null;
  best: number | null;
  winRate: number | null;
  tripleRate: number | null;
  openCloseRate: number | null;
  avg100: number | null;
}

interface CricketDeepAnalysisCardProps {
  statsCricketDetailed: StatsCricketDetailed | null;
  dailyHistory: {
    date: string;
    rating: number | null;
    stats01Avg: number | null;
    statsCriAvg: number | null;
  }[];
  bullRate: number | null;
  currentRating: number | null;
  stats01Avg: number | null;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      variant="subtitle2"
      sx={{ fontWeight: 'bold', mt: 2.5, mb: 1 }}
      color="text.secondary"
    >
      {children}
    </Typography>
  );
}

function getFlightName(rt: number): string {
  if (rt >= 14) return 'SA';
  if (rt >= 12) return 'AA';
  if (rt >= 10) return 'A';
  if (rt >= 8) return 'BB';
  if (rt >= 6) return 'B';
  if (rt >= 4) return 'CC';
  if (rt >= 2) return 'C';
  return 'N';
}

export default function CricketDeepAnalysisCard({
  statsCricketDetailed,
  bullRate,
  currentRating,
  stats01Avg,
}: CricketDeepAnalysisCardProps) {
  const mpr = statsCricketDetailed?.avg ?? null;
  const winRate = statsCricketDetailed?.winRate ?? null;
  const tripleRate = statsCricketDetailed?.tripleRate ?? null;
  const openCloseRate = statsCricketDetailed?.openCloseRate ?? null;

  const rtCri = useMemo(() => (mpr != null ? calcCriRating(mpr) : null), [mpr]);
  const rt01 = useMemo(() => (stats01Avg != null ? calc01Rating(stats01Avg) : null), [stats01Avg]);
  const mprPercentile = useMemo(() => (mpr != null ? getPercentile('mpr', mpr) : null), [mpr]);

  const estimatedTripleRate = useMemo(
    () => (bullRate != null ? Math.max(0, bullRate - 25) : null),
    [bullRate],
  );
  const tripleDiff = useMemo(
    () =>
      tripleRate != null && estimatedTripleRate != null ? tripleRate - estimatedTripleRate : null,
    [tripleRate, estimatedTripleRate],
  );

  const nextRtTarget = useMemo(() => {
    if (rtCri == null) return null;
    const nextRt = Math.floor(rtCri) + 1;
    return { nextRt, requiredMpr: mprForRating(nextRt) };
  }, [rtCri]);

  const skillType = useMemo(() => {
    if (tripleRate == null || openCloseRate == null) return null;
    if (openCloseRate > tripleRate + 10) return '戦術型';
    if (tripleRate > openCloseRate + 10) return '精度型';
    return 'バランス型';
  }, [tripleRate, openCloseRate]);

  if (!statsCricketDetailed || mpr == null) return null;

  const rtCriFlight = rtCri != null ? getFlightName(rtCri) : 'N';

  // インサイト生成
  const insights: { severity: 'success' | 'warning' | 'info'; text: string }[] = [];

  if (tripleDiff != null && tripleRate != null && estimatedTripleRate != null) {
    if (tripleDiff >= 2) {
      insights.push({
        severity: 'success',
        text: `トリプル率${tripleRate}%は推定値(${estimatedTripleRate.toFixed(1)}%)を上回っています。トリプル精度が強み`,
      });
    } else if (tripleDiff < -3) {
      insights.push({
        severity: 'warning',
        text: `トリプル率${tripleRate}%は推定値(${estimatedTripleRate.toFixed(1)}%)を下回っています。ナンバー精度の向上が課題`,
      });
    }
  }

  if (tripleRate != null && openCloseRate != null) {
    if (skillType === '戦術型') {
      insights.push({
        severity: 'info',
        text: `Open-Close率${openCloseRate}%が高く戦術型。相手のナンバーを的確にクローズする判断力が強み`,
      });
    } else if (skillType === '精度型') {
      insights.push({
        severity: 'info',
        text: `トリプル率${tripleRate}%が高く精度型。マーク力を活かしたプレッシャー型の戦い方が得意`,
      });
    }
  }

  return (
    <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
          Cricket 深掘り分析
        </Typography>
        <Chip
          label="CRICKET"
          size="small"
          sx={{ fontSize: 10, height: 20, bgcolor: COLOR_CRICKET, color: 'common.white' }}
        />
      </Box>

      {/* サマリー（3列グリッド） */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 1,
          p: 1.5,
          borderRadius: 1,
          bgcolor: 'action.hover',
          border: 1,
          borderColor: 'divider',
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            MPR
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            {mpr.toFixed(2)}
          </Typography>
          {mprPercentile != null && (
            <Chip
              label={`上位${mprPercentile}%`}
              size="small"
              sx={{
                fontSize: 9,
                height: 18,
                bgcolor: getPercentileColor(mprPercentile),
                color: 'common.white',
              }}
            />
          )}
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Cricket Rt
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            {rtCri?.toFixed(1)}
          </Typography>
          <Chip
            label={rtCriFlight}
            size="small"
            sx={{
              fontSize: 9,
              height: 18,
              bgcolor: getFlightColor(rtCriFlight),
              color: 'common.white',
            }}
          />
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            勝率
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            {winRate != null ? `${winRate}%` : '-'}
          </Typography>
        </Box>
      </Box>

      {/* レーティング貢献分析 */}
      {rtCri != null && rt01 != null && currentRating != null && (
        <>
          <SectionTitle>レーティング貢献分析</SectionTitle>
          <Box sx={{ mb: 1 }}>
            {[
              { label: '01 Rt', value: rt01, color: '#E53935' },
              { label: 'Cri Rt', value: rtCri, color: COLOR_CRICKET },
            ].map((item) => (
              <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Typography variant="caption" sx={{ width: 48, textAlign: 'right' }}>
                  {item.label}
                </Typography>
                <Box sx={{ flex: 1, position: 'relative', height: 20 }}>
                  <Box
                    sx={{
                      height: '100%',
                      bgcolor: 'rgba(255,255,255,0.05)',
                      borderRadius: 1,
                      position: 'absolute',
                      width: '100%',
                    }}
                  />
                  <Box
                    sx={{
                      height: '100%',
                      bgcolor: item.color,
                      borderRadius: 1,
                      position: 'absolute',
                      width: `${Math.min(100, (item.value / 18) * 100)}%`,
                      opacity: 0.7,
                    }}
                  />
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 'bold', width: 36 }}>
                  {item.value.toFixed(1)}
                </Typography>
              </Box>
            ))}
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              Cricketがレーティングの {((rtCri / (rt01 + rtCri)) * 100).toFixed(0)}% を占めています
              {rtCri > rt01 + 1
                ? '（01が足を引っ張り気味）'
                : rt01 > rtCri + 1
                  ? '（Cricketが足を引っ張り気味）'
                  : '（バランス良好）'}
            </Typography>
          </Box>
          {nextRtTarget && (
            <Typography variant="caption" color="text.secondary">
              次のRt{nextRtTarget.nextRt}に必要なMPR: {nextRtTarget.requiredMpr.toFixed(2)}
              {mpr != null && (
                <Box component="span" sx={{ color: '#ff9800', ml: 0.5 }}>
                  (あと+{(nextRtTarget.requiredMpr - mpr).toFixed(2)})
                </Box>
              )}
            </Typography>
          )}
        </>
      )}

      {/* スキルバランス */}
      {tripleRate != null && openCloseRate != null && (
        <>
          <SectionTitle>スキルバランス</SectionTitle>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 1,
              p: 1.5,
              borderRadius: 1,
              bgcolor: 'action.hover',
              border: 1,
              borderColor: 'divider',
            }}
          >
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                トリプル率
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                {tripleRate}%
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                Open-Close率
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                {openCloseRate}%
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                プレイスタイル
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  fontWeight: 'bold',
                  color:
                    skillType === '戦術型'
                      ? '#2196f3'
                      : skillType === '精度型'
                        ? '#ff9800'
                        : '#4caf50',
                }}
              >
                {skillType}
              </Typography>
            </Box>
          </Box>
        </>
      )}

      {/* インサイト */}
      {insights.length > 0 && (
        <>
          <SectionTitle>インサイト</SectionTitle>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {insights.slice(0, 3).map((insight, i) => (
              <Alert
                key={i}
                severity={insight.severity}
                sx={{ py: 0, '& .MuiAlert-message': { fontSize: 12 } }}
              >
                {insight.text}
              </Alert>
            ))}
          </Box>
        </>
      )}
    </Paper>
  );
}
