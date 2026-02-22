'use client';

import { useMemo } from 'react';
import { Paper, Typography, Box, Chip } from '@mui/material';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import {
  computeStats,
  calculateConsistency,
  getConsistencyLabel,
  buildScoreBands,
} from '@/lib/stats-math';
import { COLOR_COUNTUP } from '@/lib/dartslive-colors';

interface RecentPlay {
  date: string;
  gameId: string;
  gameName: string;
  score: number;
  awards?: Record<string, number>;
}

interface Stats01Detailed {
  avg: number | null;
  best: number | null;
  winRate: number | null;
  bullRate: number | null;
  arrangeRate: number | null;
  avgBust: number | null;
  avg100: number | null;
}

interface BestRecord {
  gameId: string;
  gameName: string;
  bestScore: number;
  bestDate: string | null;
}

interface CountUpDeepAnalysisCardProps {
  recentPlays: RecentPlay[];
  stats01Detailed?: Stats01Detailed | null;
  bestRecords?: BestRecord[] | null;
}

const SCORE_BANDS = [
  { label: '~399', min: 0, max: 399 },
  { label: '400-499', min: 400, max: 499 },
  { label: '500-599', min: 500, max: 599 },
  { label: '600-699', min: 600, max: 699 },
  { label: '700+', min: 700, max: 9999 },
];

const TOOLTIP_STYLE = {
  backgroundColor: '#1e1e1e',
  border: '1px solid #444',
  borderRadius: 6,
  color: '#ccc',
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mt: 2.5, mb: 1, color: '#aaa' }}>
      {children}
    </Typography>
  );
}

export default function CountUpDeepAnalysisCard({
  recentPlays,
  stats01Detailed,
  bestRecords,
}: CountUpDeepAnalysisCardProps) {
  // COUNT-UPデータのみ抽出
  const cuPlays = useMemo(
    () =>
      recentPlays
        .filter((p) => p.gameName === 'COUNT-UP' || p.gameId === 'COUNT-UP')
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [recentPlays],
  );

  const scores = useMemo(() => cuPlays.map((p) => p.score), [cuPlays]);

  if (scores.length < 3) return null;

  const stats = computeStats(scores);
  const consistency = calculateConsistency(scores);

  // PPD期待スコア (PPD × 24ダーツ = 8ラウンド × 3本)
  const ppd = stats01Detailed?.avg ?? null;
  const expectedScore = ppd != null ? Math.round(ppd * 24) : null;
  const performanceRatio =
    expectedScore != null && expectedScore > 0
      ? Math.round((stats.avg / expectedScore) * 100)
      : null;

  // ベストスコア
  const cuBest = bestRecords?.find(
    (r) => r.gameName === 'COUNT-UP' || r.gameId === 'COUNT-UP',
  )?.bestScore;

  // スコア帯分布
  const bands = buildScoreBands(scores, SCORE_BANDS);

  // 時系列データ
  const trendData = cuPlays.map((p, i) => ({
    idx: i + 1,
    score: p.score,
    date: new Date(p.date).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' }),
  }));

  // 安定性分析
  const consistencyLabel = consistency ? getConsistencyLabel(consistency.score) : null;
  const bestDeviation =
    cuBest != null && cuBest > 0 ? Math.round(((cuBest - stats.avg) / cuBest) * 100) : null;

  return (
    <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
          COUNT-UP 深掘り分析
        </Typography>
        <Chip
          label={`${scores.length}件`}
          size="small"
          sx={{ fontSize: 10, height: 20, bgcolor: COLOR_COUNTUP, color: '#fff' }}
        />
      </Box>

      {/* 1. PPD vs COUNT-UP 比較 */}
      {expectedScore != null && (
        <>
          <SectionTitle>PPD vs COUNT-UP 比較</SectionTitle>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 1 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                期待スコア (PPD&times;24)
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                {expectedScore}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                実平均
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  fontWeight: 'bold',
                  color: stats.avg >= expectedScore ? '#4caf50' : '#ff9800',
                }}
              >
                {stats.avg.toFixed(1)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                達成率
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  fontWeight: 'bold',
                  color:
                    performanceRatio != null && performanceRatio >= 100 ? '#4caf50' : '#ff9800',
                }}
              >
                {performanceRatio}%
              </Typography>
            </Box>
          </Box>
          <Typography variant="caption" color="text.secondary">
            {performanceRatio != null && performanceRatio >= 100
              ? '01のPPDを上回るパフォーマンスです'
              : 'COUNT-UPは対人プレッシャーがない分、PPD期待値を超えたいところ'}
          </Typography>
        </>
      )}

      {/* 2. スコア帯分布 */}
      <SectionTitle>スコア帯分布</SectionTitle>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={bands}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis dataKey="label" fontSize={11} tick={{ fill: '#aaa' }} />
          <YAxis fontSize={11} tick={{ fill: '#aaa' }} />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(v: number | undefined) => [`${v ?? 0}回`, '回数']}
          />
          <Bar dataKey="count" name="回数" fill={COLOR_COUNTUP} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
        {bands.map((b) => (
          <Typography key={b.label} variant="caption" color="text.secondary">
            {b.label}: {b.percentage}%
          </Typography>
        ))}
      </Box>

      {/* 3. スコア推移チャート */}
      <SectionTitle>スコア推移</SectionTitle>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={trendData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis dataKey="date" fontSize={10} tick={{ fill: '#aaa' }} />
          <YAxis fontSize={11} tick={{ fill: '#aaa' }} domain={['dataMin - 50', 'dataMax + 50']} />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <ReferenceLine
            y={stats.avg}
            stroke="#ff9800"
            strokeDasharray="5 5"
            label={{ value: `平均 ${stats.avg.toFixed(0)}`, fill: '#ff9800', fontSize: 10 }}
          />
          {expectedScore != null && (
            <ReferenceLine
              y={expectedScore}
              stroke="#2196f3"
              strokeDasharray="3 3"
              label={{ value: `期待 ${expectedScore}`, fill: '#2196f3', fontSize: 10 }}
            />
          )}
          <Line
            type="monotone"
            dataKey="score"
            stroke={COLOR_COUNTUP}
            strokeWidth={2}
            dot={{ r: 3, fill: COLOR_COUNTUP }}
            name="スコア"
          />
        </LineChart>
      </ResponsiveContainer>

      {/* 4. 安定性分析 */}
      <SectionTitle>安定性分析</SectionTitle>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        {consistency && (
          <>
            <Box>
              <Typography variant="caption" color="text.secondary">
                標準偏差
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                {consistency.stdDev.toFixed(1)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                変動係数
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                {consistency.cv.toFixed(1)}%
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                安定度
              </Typography>
              <Typography
                variant="body1"
                sx={{ fontWeight: 'bold', color: consistencyLabel?.color }}
              >
                {consistency.score}点 ({consistencyLabel?.label})
              </Typography>
            </Box>
          </>
        )}
        {bestDeviation != null && (
          <Box>
            <Typography variant="caption" color="text.secondary">
              ベストからの乖離
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
              -{bestDeviation}%
            </Typography>
          </Box>
        )}
      </Box>
      {consistency && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
          {consistency.cv < 10
            ? '安定したスコアリング。ナンバー精度の向上に注力しましょう'
            : consistency.cv < 20
              ? 'まずまずの安定性。集中力を維持してスコアのブレを減らしましょう'
              : 'スコアのバラつきが大きめ。フォームの一貫性を意識しましょう'}
        </Typography>
      )}
    </Paper>
  );
}
