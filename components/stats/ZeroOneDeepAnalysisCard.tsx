'use client';

import { useMemo } from 'react';
import { Paper, Typography, Box, Chip, Alert } from '@mui/material';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { calc01Rating, calcCriRating, ppdForRating } from '@/lib/dartslive-rating';
import { getPercentile, getPercentileColor } from '@/lib/dartslive-percentile';
import { COLOR_01 } from '@/lib/dartslive-colors';
import { getFlightColor } from '@/lib/dartslive-colors';
import { analyzeDartout, analyzeDoublePreference } from '@/lib/dartout-analysis';
import { useChartTheme } from '@/lib/chart-theme';

interface Stats01Detailed {
  avg: number | null;
  best: number | null;
  winRate: number | null;
  bullRate: number | null;
  arrangeRate: number | null;
  avgBust: number | null;
  avg100: number | null;
}

interface DartoutItem {
  score: number;
  count: number;
}

interface ZeroOneDeepAnalysisCardProps {
  stats01Detailed: Stats01Detailed | null;
  dailyHistory: {
    date: string;
    rating: number | null;
    stats01Avg: number | null;
    statsCriAvg: number | null;
  }[];
  dartoutList: DartoutItem[] | null;
  currentRating: number | null;
  statsCriAvg: number | null;
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

export default function ZeroOneDeepAnalysisCard({
  stats01Detailed,
  dartoutList,
  currentRating,
  statsCriAvg,
}: ZeroOneDeepAnalysisCardProps) {
  const ppd = stats01Detailed?.avg ?? null;
  const winRate = stats01Detailed?.winRate ?? null;
  const arrangeRate = stats01Detailed?.arrangeRate ?? null;
  const avgBust = stats01Detailed?.avgBust ?? null;

  const rt01 = useMemo(() => (ppd != null ? calc01Rating(ppd) : null), [ppd]);
  const rtCri = useMemo(
    () => (statsCriAvg != null ? calcCriRating(statsCriAvg) : null),
    [statsCriAvg],
  );
  const ppdPercentile = useMemo(() => (ppd != null ? getPercentile('ppd', ppd) : null), [ppd]);

  const dartoutAnalysis = useMemo(
    () => (dartoutList && dartoutList.length > 0 ? analyzeDartout(dartoutList) : null),
    [dartoutList],
  );
  const topFinishes = useMemo(
    () =>
      dartoutList && dartoutList.length > 0
        ? analyzeDoublePreference(dartoutList).slice(0, 10)
        : [],
    [dartoutList],
  );

  const nextRtTarget = useMemo(() => {
    if (rt01 == null) return null;
    const nextRt = Math.floor(rt01) + 1;
    return { nextRt, requiredPpd: ppdForRating(nextRt) };
  }, [rt01]);

  const ct = useChartTheme();

  if (!stats01Detailed || ppd == null) return null;

  const rt01Flight = rt01 != null ? getFlightName(rt01) : 'N';

  // インサイト生成
  const insights: { severity: 'success' | 'warning' | 'info'; text: string }[] = [];

  if (arrangeRate != null && avgBust != null) {
    if (arrangeRate >= 30) {
      insights.push({
        severity: 'success',
        text: `アレンジ率${arrangeRate}%は高水準。平均バスト${avgBust}%で安定したフィニッシュ力`,
      });
    } else if (arrangeRate < 20 && avgBust > 10) {
      insights.push({
        severity: 'warning',
        text: `アレンジ率${arrangeRate}%・バスト${avgBust}%。アレンジの組み立てを見直すと改善の余地あり`,
      });
    }
  }

  if (dartoutAnalysis) {
    if (dartoutAnalysis.bullFinishPercentage > 30) {
      insights.push({
        severity: 'info',
        text: `ブルフィニッシュが${dartoutAnalysis.bullFinishPercentage}%と高め。ブルアウト偏重型`,
      });
    } else if (dartoutAnalysis.typeBreakdown.doubleRate > 40) {
      insights.push({
        severity: 'info',
        text: `ダブルフィニッシュ${dartoutAnalysis.typeBreakdown.doubleRate}%でバランスの良いフィニッシュパターン`,
      });
    }
  }

  return (
    <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
          01 深掘り分析
        </Typography>
        <Chip
          label="ZERO-ONE"
          size="small"
          sx={{ fontSize: 10, height: 20, bgcolor: COLOR_01, color: 'common.white' }}
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
            PPD
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            {ppd.toFixed(2)}
          </Typography>
          {ppdPercentile != null && (
            <Chip
              label={`上位${ppdPercentile}%`}
              size="small"
              sx={{
                fontSize: 9,
                height: 18,
                bgcolor: getPercentileColor(ppdPercentile),
                color: 'common.white',
              }}
            />
          )}
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            01 Rt
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            {rt01?.toFixed(1)}
          </Typography>
          <Chip
            label={rt01Flight}
            size="small"
            sx={{
              fontSize: 9,
              height: 18,
              bgcolor: getFlightColor(rt01Flight),
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
      {rt01 != null && rtCri != null && currentRating != null && (
        <>
          <SectionTitle>レーティング貢献分析</SectionTitle>
          <Box sx={{ mb: 1 }}>
            {[
              { label: '01 Rt', value: rt01, color: COLOR_01 },
              { label: 'Cri Rt', value: rtCri, color: '#1E88E5' },
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
              01がレーティングの {((rt01 / (rt01 + rtCri)) * 100).toFixed(0)}% を占めています
              {rt01 > rtCri + 1
                ? '（Cricketが足を引っ張り気味）'
                : rtCri > rt01 + 1
                  ? '（01が足を引っ張り気味）'
                  : '（バランス良好）'}
            </Typography>
          </Box>
          {nextRtTarget && (
            <Typography variant="caption" color="text.secondary">
              次のRt{nextRtTarget.nextRt}に必要なPPD: {nextRtTarget.requiredPpd.toFixed(1)}
              {ppd != null && (
                <Box component="span" sx={{ color: '#ff9800', ml: 0.5 }}>
                  (あと+{(nextRtTarget.requiredPpd - ppd).toFixed(1)})
                </Box>
              )}
            </Typography>
          )}
        </>
      )}

      {/* ダーツアウト分析 */}
      {dartoutAnalysis && (
        <>
          <SectionTitle>ダーツアウト分析</SectionTitle>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 1,
              p: 1.5,
              borderRadius: 1,
              bgcolor: 'action.hover',
              border: 1,
              borderColor: 'divider',
              mb: 1.5,
            }}
          >
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
                総フィニッシュ
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                {dartoutAnalysis.totalFinishes}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
                平均スコア
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                {dartoutAnalysis.avgFinishScore.toFixed(1)}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
                クラッチ率(40+)
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                {dartoutAnalysis.clutchRatio}%
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
                ブルフィニッシュ
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                {dartoutAnalysis.bullFinishPercentage}%
              </Typography>
            </Box>
          </Box>

          {/* TOP10フィニッシュ */}
          {topFinishes.length > 0 && (
            <>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 1.5, mb: 0.5, display: 'block' }}
              >
                TOP10フィニッシュ
              </Typography>
              <ResponsiveContainer width="100%" height={Math.max(180, topFinishes.length * 28)}>
                <BarChart data={topFinishes} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} />
                  <XAxis type="number" fontSize={11} tick={{ fill: ct.text }} />
                  <YAxis
                    type="category"
                    dataKey="label"
                    fontSize={10}
                    tick={{ fill: ct.text }}
                    width={50}
                  />
                  <Tooltip
                    contentStyle={ct.tooltipStyle}
                    formatter={(v: number | undefined) => [`${v ?? 0}回`, '回数']}
                  />
                  <Bar dataKey="count" name="回数" radius={[0, 4, 4, 0]}>
                    {topFinishes.map((f, i) => (
                      <Cell key={i} fill={f.isDouble ? COLOR_01 : '#ff9800'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </>
          )}

          {/* フィニッシュタイプ内訳 */}
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 1.5, mb: 0.5, display: 'block' }}
          >
            フィニッシュタイプ内訳
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 1,
              p: 1.5,
              borderRadius: 1,
              bgcolor: 'action.hover',
              border: 1,
              borderColor: 'divider',
            }}
          >
            {[
              { label: 'ダブル', value: dartoutAnalysis.typeBreakdown.doubleRate, color: COLOR_01 },
              { label: 'シングル', value: dartoutAnalysis.typeBreakdown.singleRate, color: '#888' },
              { label: 'ブル', value: dartoutAnalysis.typeBreakdown.bullRate, color: '#4caf50' },
              {
                label: 'トリプル',
                value: dartoutAnalysis.typeBreakdown.tripleRate,
                color: '#ff9800',
              },
            ].map((item) => (
              <Box key={item.label} sx={{ textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
                  {item.label}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold', color: item.color }}>
                  {item.value}%
                </Typography>
              </Box>
            ))}
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
