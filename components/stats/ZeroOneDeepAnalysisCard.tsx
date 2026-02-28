'use client';

import { useMemo } from 'react';
import { Paper, Typography, Box, Chip, Alert } from '@mui/material';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  LineChart,
  Line,
  ComposedChart,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  ReferenceDot,
} from 'recharts';
import { calc01Rating, calcCriRating, ppdForRating } from '@/lib/dartslive-rating';
import { evaluateBullRate, RATING_BENCHMARKS } from '@/lib/dartslive-reference';
import { getPercentile, getPercentileColor } from '@/lib/dartslive-percentile';
import { COLOR_01 } from '@/lib/dartslive-colors';
import { getFlightColor } from '@/lib/dartslive-colors';
import {
  analyzeDartout,
  classifyFinishRange,
  analyzeDoublePreference,
} from '@/lib/dartout-analysis';
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

interface DailyRecord {
  date: string;
  rating: number | null;
  stats01Avg: number | null;
  statsCriAvg: number | null;
  stats01Avg100?: number | null;
  statsCriAvg100?: number | null;
}

interface DartoutItem {
  score: number;
  count: number;
}

interface ZeroOneDeepAnalysisCardProps {
  stats01Detailed: Stats01Detailed | null;
  dailyHistory: DailyRecord[];
  dartoutList: DartoutItem[] | null;
  currentRating: number | null;
  statsCriAvg: number | null;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mt: 2.5, mb: 1, color: '#aaa' }}>
      {children}
    </Typography>
  );
}

/** フライト名を返す */
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
  dailyHistory,
  dartoutList,
  currentRating,
  statsCriAvg,
}: ZeroOneDeepAnalysisCardProps) {
  const ppd = stats01Detailed?.avg ?? null;
  const ppd100 = stats01Detailed?.avg100 ?? null;
  const bullRate = stats01Detailed?.bullRate ?? null;
  const winRate = stats01Detailed?.winRate ?? null;
  const arrangeRate = stats01Detailed?.arrangeRate ?? null;
  const avgBust = stats01Detailed?.avgBust ?? null;

  // 01個別レーティング
  const rt01 = useMemo(() => (ppd != null ? calc01Rating(ppd) : null), [ppd]);
  const rtCri = useMemo(
    () => (statsCriAvg != null ? calcCriRating(statsCriAvg) : null),
    [statsCriAvg],
  );

  // PPDパーセンタイル
  const ppdPercentile = useMemo(() => (ppd != null ? getPercentile('ppd', ppd) : null), [ppd]);

  // Bull率ベンチマーク
  const bullEval = useMemo(
    () => (ppd != null && bullRate != null ? evaluateBullRate(ppd, bullRate) : null),
    [ppd, bullRate],
  );

  // Bull率/トリプル率ベンチマークチャートデータ
  const bullBenchmarkData = useMemo(() => {
    return RATING_BENCHMARKS.filter((b) => b.rating >= 4 && b.rating <= 14).map((b) => ({
      rating: `Rt${b.rating}`,
      ratingNum: b.rating,
      bullRate: b.bullRatePerThrow,
      tripleRate: Math.max(0, b.bullRatePerThrow - 25),
    }));
  }, []);

  // ダーツアウト分析
  const dartoutAnalysis = useMemo(
    () => (dartoutList && dartoutList.length > 0 ? analyzeDartout(dartoutList) : null),
    [dartoutList],
  );

  // フィニッシュスコア帯
  const finishRanges = useMemo(
    () => (dartoutList && dartoutList.length > 0 ? classifyFinishRange(dartoutList) : []),
    [dartoutList],
  );

  // TOP10フィニッシュ
  const topFinishes = useMemo(
    () =>
      dartoutList && dartoutList.length > 0
        ? analyzeDoublePreference(dartoutList).slice(0, 10)
        : [],
    [dartoutList],
  );

  // PPD推移データ（直近90日）
  const trendData = useMemo(() => {
    const now = new Date();
    const cutoff = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    return dailyHistory
      .filter((d) => d.stats01Avg != null && new Date(d.date) >= cutoff)
      .map((d) => ({
        date: new Date(d.date).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' }),
        ppd: d.stats01Avg,
        ppd100: d.stats01Avg100 ?? null,
      }))
      .reverse();
  }, [dailyHistory]);

  // 次のRtに必要なPPD
  const nextRtTarget = useMemo(() => {
    if (rt01 == null) return null;
    const nextRt = Math.floor(rt01) + 1;
    return { nextRt, requiredPpd: ppdForRating(nextRt) };
  }, [rt01]);

  const ct = useChartTheme();

  if (!stats01Detailed || ppd == null) return null;

  const rt01Flight = rt01 != null ? getFlightName(rt01) : 'N';
  const estimatedTripleRate = bullRate != null ? Math.max(0, bullRate - 25) : null;

  // 80/100ギャップ評価
  const ppdGap = ppd100 != null ? Math.abs(ppd - ppd100) : null;
  const gapLabel =
    ppdGap != null ? (ppdGap <= 2 ? '安定' : ppdGap <= 5 ? 'やや波あり' : '差が大きい') : null;
  const gapColor =
    ppdGap != null ? (ppdGap <= 2 ? '#4caf50' : ppdGap <= 5 ? '#ff9800' : '#f44336') : '#888';

  // インサイト生成
  const insights: { severity: 'success' | 'warning' | 'info'; text: string }[] = [];

  if (bullEval) {
    if (bullEval.diff >= 1) {
      insights.push({
        severity: 'success',
        text: `Bull率${bullRate}%はRt期待値(${bullEval.expected}%)を上回っています（${bullEval.evaluation}）`,
      });
    } else if (bullEval.diff < -2) {
      insights.push({
        severity: 'warning',
        text: `Bull率${bullRate}%はRt期待値(${bullEval.expected}%)より低めです。Bull練習で伸びしろがあります`,
      });
    }
  }

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

  if (ppdGap != null && ppdGap > 5) {
    insights.push({
      severity: 'warning',
      text: `80%平均と100%平均の差が${ppdGap.toFixed(1)}。波の大きさが課題かもしれません`,
    });
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
          sx={{ fontSize: 10, height: 20, bgcolor: COLOR_01, color: '#fff' }}
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
          bgcolor: 'rgba(255,255,255,0.03)',
          border: '1px solid #333',
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
                color: '#fff',
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
              color: '#fff',
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
            {/* 水平バーチャート */}
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

      {/* 80% vs 100% PPD 比較 */}
      {ppd100 != null && (
        <>
          <SectionTitle>80% vs 100% PPD 比較</SectionTitle>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 0.5 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                80%平均 (PPD)
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                {ppd.toFixed(2)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                100%平均
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                {ppd100.toFixed(2)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                差分
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold', color: gapColor }}>
                {ppdGap?.toFixed(1)} ({gapLabel})
              </Typography>
            </Box>
          </Box>
        </>
      )}

      {/* Bull率ベンチマーク */}
      {bullRate != null && bullEval && (
        <>
          <SectionTitle>Bull率ベンチマーク</SectionTitle>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 1 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Bull率
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                {bullRate}%
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Rt期待値
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                {bullEval.expected}%
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                差
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  fontWeight: 'bold',
                  color: bullEval.diff >= 0 ? '#4caf50' : '#f44336',
                }}
              >
                {bullEval.diff >= 0 ? '+' : ''}
                {bullEval.diff.toFixed(1)}%
              </Typography>
            </Box>
            {estimatedTripleRate != null && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  推定トリプル率
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#ff9800' }}>
                  {estimatedTripleRate.toFixed(1)}%
                </Typography>
              </Box>
            )}
          </Box>

          {/* Bull率/トリプル率チャート */}
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={bullBenchmarkData}>
              <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} />
              <XAxis dataKey="rating" fontSize={10} tick={{ fill: ct.text }} />
              <YAxis fontSize={11} tick={{ fill: ct.text }} unit="%" />
              <Tooltip contentStyle={ct.tooltipStyle} />
              <Line
                type="monotone"
                dataKey="bullRate"
                name="Bull率基準"
                stroke="#4caf50"
                strokeWidth={2}
                dot={{ r: 2 }}
              />
              <Line
                type="monotone"
                dataKey="tripleRate"
                name="トリプル率推定"
                stroke="#ff9800"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 2 }}
              />
              {currentRating != null && bullRate != null && (
                <ReferenceDot
                  x={`Rt${Math.min(14, Math.max(4, Math.round(currentRating)))}`}
                  y={bullRate}
                  r={6}
                  fill={COLOR_01}
                  stroke="#fff"
                  strokeWidth={2}
                />
              )}
              {currentRating != null && estimatedTripleRate != null && (
                <ReferenceDot
                  x={`Rt${Math.min(14, Math.max(4, Math.round(currentRating)))}`}
                  y={estimatedTripleRate}
                  r={5}
                  fill="#ff9800"
                  stroke="#fff"
                  strokeWidth={2}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
            ※ トリプル率推定 = max(0, Bull率 - 25%)
          </Typography>
        </>
      )}

      {/* ダーツアウト分析 */}
      {dartoutAnalysis && (
        <>
          <SectionTitle>ダーツアウト分析</SectionTitle>

          {/* メトリクスサマリー */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 1,
              p: 1.5,
              borderRadius: 1,
              bgcolor: 'rgba(255,255,255,0.03)',
              border: '1px solid #333',
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

          {/* フィニッシュスコア帯分布 */}
          {finishRanges.length > 0 && (
            <>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mb: 0.5, display: 'block' }}
              >
                フィニッシュスコア帯分布
              </Typography>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={finishRanges}>
                  <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} />
                  <XAxis dataKey="label" fontSize={10} tick={{ fill: ct.text }} />
                  <YAxis fontSize={11} tick={{ fill: ct.text }} />
                  <Tooltip
                    contentStyle={ct.tooltipStyle}
                    formatter={(v: number | undefined) => [
                      `${v ?? 0}回 (${(((v ?? 0) / dartoutAnalysis.totalFinishes) * 100).toFixed(1)}%)`,
                      '回数',
                    ]}
                  />
                  <Bar dataKey="count" name="回数" radius={[4, 4, 0, 0]} fill={COLOR_01} />
                </BarChart>
              </ResponsiveContainer>
            </>
          )}

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
              bgcolor: 'rgba(255,255,255,0.03)',
              border: '1px solid #333',
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

      {/* PPD推移チャート */}
      {trendData.length > 1 && (
        <>
          <SectionTitle>PPD推移（直近90日）</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} />
              <XAxis dataKey="date" fontSize={10} tick={{ fill: ct.text }} />
              <YAxis
                fontSize={11}
                tick={{ fill: ct.text }}
                domain={['dataMin - 5', 'dataMax + 5']}
              />
              <Tooltip contentStyle={ct.tooltipStyle} />
              {ppd != null && (
                <ReferenceLine
                  y={ppd}
                  stroke="#ff9800"
                  strokeDasharray="5 5"
                  label={{ value: `平均 ${ppd.toFixed(1)}`, fill: '#ff9800', fontSize: 10 }}
                />
              )}
              <Line
                type="monotone"
                dataKey="ppd"
                name="80%平均"
                stroke={COLOR_01}
                strokeWidth={2}
                dot={{ r: 2, fill: COLOR_01 }}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="ppd100"
                name="100%平均"
                stroke={COLOR_01}
                strokeWidth={1.5}
                strokeDasharray="5 5"
                dot={false}
                connectNulls
                opacity={0.5}
              />
            </LineChart>
          </ResponsiveContainer>
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
