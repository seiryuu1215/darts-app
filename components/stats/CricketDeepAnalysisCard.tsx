'use client';

import { useMemo } from 'react';
import { Paper, Typography, Box, Chip, Alert } from '@mui/material';
import {
  ResponsiveContainer,
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
import { calc01Rating, calcCriRating, mprForRating } from '@/lib/dartslive-rating';
import { RATING_BENCHMARKS } from '@/lib/dartslive-reference';
import { getPercentile, getPercentileColor } from '@/lib/dartslive-percentile';
import { COLOR_CRICKET } from '@/lib/dartslive-colors';
import { getFlightColor } from '@/lib/dartslive-colors';
import { useChartTheme } from '@/lib/chart-theme';

interface StatsCricketDetailed {
  avg: number | null;
  best: number | null;
  winRate: number | null;
  tripleRate: number | null;
  openCloseRate: number | null;
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

interface CricketDeepAnalysisCardProps {
  statsCricketDetailed: StatsCricketDetailed | null;
  dailyHistory: DailyRecord[];
  bullRate: number | null;
  currentRating: number | null;
  stats01Avg: number | null;
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

export default function CricketDeepAnalysisCard({
  statsCricketDetailed,
  dailyHistory,
  bullRate,
  currentRating,
  stats01Avg,
}: CricketDeepAnalysisCardProps) {
  const ct = useChartTheme();
  const mpr = statsCricketDetailed?.avg ?? null;
  const mpr100 = statsCricketDetailed?.avg100 ?? null;
  const winRate = statsCricketDetailed?.winRate ?? null;
  const tripleRate = statsCricketDetailed?.tripleRate ?? null;
  const openCloseRate = statsCricketDetailed?.openCloseRate ?? null;

  // Cricket個別レーティング
  const rtCri = useMemo(() => (mpr != null ? calcCriRating(mpr) : null), [mpr]);
  const rt01 = useMemo(() => (stats01Avg != null ? calc01Rating(stats01Avg) : null), [stats01Avg]);

  // MPRパーセンタイル
  const mprPercentile = useMemo(() => (mpr != null ? getPercentile('mpr', mpr) : null), [mpr]);

  // 推定トリプル率（Bull率-25%）
  const estimatedTripleRate = useMemo(
    () => (bullRate != null ? Math.max(0, bullRate - 25) : null),
    [bullRate],
  );

  // トリプル率 vs 推定値の差分
  const tripleDiff = useMemo(
    () =>
      tripleRate != null && estimatedTripleRate != null ? tripleRate - estimatedTripleRate : null,
    [tripleRate, estimatedTripleRate],
  );

  // Bull率/トリプル率ベンチマークチャートデータ
  const benchmarkData = useMemo(() => {
    return RATING_BENCHMARKS.filter((b) => b.rating >= 4 && b.rating <= 14).map((b) => ({
      rating: `Rt${b.rating}`,
      ratingNum: b.rating,
      bullRate: b.bullRatePerThrow,
      tripleRate: Math.max(0, b.bullRatePerThrow - 25),
    }));
  }, []);

  // MPR推移データ（直近90日）
  const trendData = useMemo(() => {
    const now = new Date();
    const cutoff = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    return dailyHistory
      .filter((d) => d.statsCriAvg != null && new Date(d.date) >= cutoff)
      .map((d) => ({
        date: new Date(d.date).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' }),
        mpr: d.statsCriAvg,
        mpr100: d.statsCriAvg100 ?? null,
      }))
      .reverse();
  }, [dailyHistory]);

  // 次のRtに必要なMPR
  const nextRtTarget = useMemo(() => {
    if (rtCri == null) return null;
    const nextRt = Math.floor(rtCri) + 1;
    return { nextRt, requiredMpr: mprForRating(nextRt) };
  }, [rtCri]);

  // スキルバランス
  const skillType = useMemo(() => {
    if (tripleRate == null || openCloseRate == null) return null;
    if (openCloseRate > tripleRate + 10) return '戦術型';
    if (tripleRate > openCloseRate + 10) return '精度型';
    return 'バランス型';
  }, [tripleRate, openCloseRate]);

  if (!statsCricketDetailed || mpr == null) return null;

  const rtCriFlight = rtCri != null ? getFlightName(rtCri) : 'N';

  // 80/100ギャップ評価
  const mprGap = mpr100 != null ? Math.abs(mpr - mpr100) : null;
  const gapLabel =
    mprGap != null ? (mprGap <= 0.1 ? '安定' : mprGap <= 0.3 ? 'やや波あり' : '差が大きい') : null;
  const gapColor =
    mprGap != null ? (mprGap <= 0.1 ? '#4caf50' : mprGap <= 0.3 ? '#ff9800' : '#f44336') : '#888';

  // トリプル率差分の色分け
  const tripleDiffColor =
    tripleDiff != null
      ? tripleDiff >= 2
        ? '#4caf50'
        : tripleDiff >= -2
          ? '#888'
          : '#f44336'
      : '#888';
  const tripleDiffLabel =
    tripleDiff != null
      ? tripleDiff >= 2
        ? '期待以上'
        : tripleDiff >= -2
          ? '妥当'
          : '改善余地'
      : null;

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

  if (mprGap != null && mprGap > 0.3) {
    insights.push({
      severity: 'warning',
      text: `80%平均と100%平均の差が${mprGap.toFixed(2)}。安定性の向上が課題`,
    });
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
          sx={{ fontSize: 10, height: 20, bgcolor: COLOR_CRICKET, color: '#fff' }}
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
                color: '#fff',
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

      {/* 80% vs 100% MPR 比較 */}
      {mpr100 != null && (
        <>
          <SectionTitle>80% vs 100% MPR 比較</SectionTitle>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 0.5 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                80%平均 (MPR)
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                {mpr.toFixed(2)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                100%平均
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                {mpr100.toFixed(2)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                差分
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold', color: gapColor }}>
                {mprGap?.toFixed(2)} ({gapLabel})
              </Typography>
            </Box>
          </Box>
        </>
      )}

      {/* トリプル率 vs ブル率ベンチマーク */}
      {tripleRate != null && (
        <>
          <SectionTitle>トリプル率 vs ブル率ベンチマーク</SectionTitle>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 1 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                トリプル率
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                {tripleRate}%
              </Typography>
            </Box>
            {estimatedTripleRate != null && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  推定値(Bull率-25%)
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  {estimatedTripleRate.toFixed(1)}%
                </Typography>
              </Box>
            )}
            {tripleDiff != null && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  差分
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold', color: tripleDiffColor }}>
                  {tripleDiff >= 0 ? '+' : ''}
                  {tripleDiff.toFixed(1)}% ({tripleDiffLabel})
                </Typography>
              </Box>
            )}
          </Box>

          {/* Bull率/トリプル率チャート */}
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={benchmarkData}>
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
                name="トリプル率推定(Bull率-25%)"
                stroke="#ff9800"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 2 }}
              />
              {currentRating != null && tripleRate != null && (
                <ReferenceDot
                  x={`Rt${Math.min(14, Math.max(4, Math.round(currentRating)))}`}
                  y={tripleRate}
                  r={6}
                  fill={COLOR_CRICKET}
                  stroke="#fff"
                  strokeWidth={2}
                />
              )}
              {currentRating != null && bullRate != null && (
                <ReferenceDot
                  x={`Rt${Math.min(14, Math.max(4, Math.round(currentRating)))}`}
                  y={bullRate}
                  r={5}
                  fill="#4caf50"
                  stroke="#fff"
                  strokeWidth={2}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
            ※ Bull率-25%を目安値として使用
          </Typography>
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
              bgcolor: 'rgba(255,255,255,0.03)',
              border: '1px solid #333',
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

      {/* MPR推移チャート */}
      {trendData.length > 1 && (
        <>
          <SectionTitle>MPR推移（直近90日）</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} />
              <XAxis dataKey="date" fontSize={10} tick={{ fill: ct.text }} />
              <YAxis
                fontSize={11}
                tick={{ fill: ct.text }}
                domain={['dataMin - 0.3', 'dataMax + 0.3']}
              />
              <Tooltip contentStyle={ct.tooltipStyle} />
              {mpr != null && (
                <ReferenceLine
                  y={mpr}
                  stroke="#ff9800"
                  strokeDasharray="5 5"
                  label={{ value: `平均 ${mpr.toFixed(2)}`, fill: '#ff9800', fontSize: 10 }}
                />
              )}
              <Line
                type="monotone"
                dataKey="mpr"
                name="80%平均"
                stroke={COLOR_CRICKET}
                strokeWidth={2}
                dot={{ r: 2, fill: COLOR_CRICKET }}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="mpr100"
                name="100%平均"
                stroke={COLOR_CRICKET}
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
