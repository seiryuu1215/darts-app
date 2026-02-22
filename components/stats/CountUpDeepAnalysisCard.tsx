'use client';

import { useMemo, useState } from 'react';
import { Paper, Typography, Box, Chip, ToggleButton, ToggleButtonGroup } from '@mui/material';
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
  analyzeMissDirection,
} from '@/lib/stats-math';
import type { MissDirectionResult, DirectionLabel } from '@/lib/stats-math';
import { COLOR_COUNTUP } from '@/lib/dartslive-colors';

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
  countupPlays: CountUpPlay[];
  stats01Detailed?: Stats01Detailed | null;
  bestRecords?: BestRecord[] | null;
}

type PeriodKey = 'all' | 'month' | 'week' | 'day' | 'last30';

const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: 'all', label: '全期間' },
  { key: 'month', label: '1ヶ月' },
  { key: 'week', label: '1週間' },
  { key: 'day', label: '1日' },
  { key: 'last30', label: '直近30G' },
];

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

/** 期間でフィルタ */
function filterByPeriod(plays: CountUpPlay[], period: PeriodKey): CountUpPlay[] {
  if (period === 'all') return plays;
  if (period === 'last30') return plays.slice(-30);

  const now = new Date();
  let cutoff: Date;
  switch (period) {
    case 'day':
      cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'week':
      cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      return plays;
  }

  return plays.filter((p) => new Date(p.time) >= cutoff);
}

/** 8方向レイアウト: direction → CSS grid position */
const DIRECTION_POSITIONS: Record<DirectionLabel, { row: number; col: number }> = {
  左上: { row: 0, col: 0 },
  上: { row: 0, col: 1 },
  右上: { row: 0, col: 2 },
  左: { row: 1, col: 0 },
  右: { row: 1, col: 2 },
  左下: { row: 2, col: 0 },
  下: { row: 2, col: 1 },
  右下: { row: 2, col: 2 },
};

/** ミス方向ビジュアル */
function MissDirectionGrid({ result }: { result: MissDirectionResult }) {
  const maxPct = Math.max(...result.directions.map((d) => d.percentage), 1);

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gridTemplateRows: 'repeat(3, 1fr)',
        gap: 0.5,
        maxWidth: 320,
        mx: 'auto',
        my: 1,
      }}
    >
      {result.directions.map((d) => {
        const pos = DIRECTION_POSITIONS[d.label];
        if (!pos) return null;
        const intensity = d.percentage / maxPct;
        const bgColor = `rgba(244, 67, 54, ${intensity * 0.6})`;
        return (
          <Box
            key={d.label}
            sx={{
              gridRow: pos.row + 1,
              gridColumn: pos.col + 1,
              textAlign: 'center',
              p: 1,
              borderRadius: 1,
              bgcolor: bgColor,
              border: d.label === result.primaryDirection ? '2px solid #f44336' : '1px solid #333',
              minHeight: 56,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 'bold', fontSize: 11 }}>
              {d.label}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              {d.percentage}%
            </Typography>
            {d.numbers.length > 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: 9 }}>
                {d.numbers
                  .slice(0, 2)
                  .map((n) => n.number)
                  .join(', ')}
              </Typography>
            )}
          </Box>
        );
      })}
      {/* 中央: ブル率 */}
      <Box
        sx={{
          gridRow: 2,
          gridColumn: 2,
          textAlign: 'center',
          p: 1,
          borderRadius: '50%',
          bgcolor: 'rgba(76, 175, 80, 0.3)',
          border: '2px solid #4caf50',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          aspectRatio: '1',
        }}
      >
        <Typography variant="caption" sx={{ fontWeight: 'bold', fontSize: 10 }}>
          BULL
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
          {result.bullRate}%
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: 9 }}>
          BB: {result.doubleBullRate}%
        </Typography>
      </Box>
    </Box>
  );
}

export default function CountUpDeepAnalysisCard({
  countupPlays,
  stats01Detailed,
  bestRecords,
}: CountUpDeepAnalysisCardProps) {
  const [period, setPeriod] = useState<PeriodKey>('all');

  // 時系列ソート
  const sortedPlays = useMemo(
    () => [...countupPlays].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()),
    [countupPlays],
  );

  // 期間フィルタ
  const filtered = useMemo(() => filterByPeriod(sortedPlays, period), [sortedPlays, period]);

  const scores = useMemo(() => filtered.map((p) => p.score), [filtered]);
  const playLogs = useMemo(() => filtered.map((p) => p.playLog), [filtered]);

  if (sortedPlays.length < 3) return null;

  // 表示データがない場合
  if (filtered.length === 0) {
    return (
      <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            COUNT-UP 深掘り分析
          </Typography>
          <Chip
            label={`${sortedPlays.length}件`}
            size="small"
            sx={{ fontSize: 10, height: 20, bgcolor: COLOR_COUNTUP, color: '#fff' }}
          />
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
  const missDirection = analyzeMissDirection(playLogs);

  // PPD期待スコア
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
  const trendData = filtered.map((p, i) => ({
    idx: i + 1,
    score: p.score,
    date: new Date(p.time).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' }),
  }));

  // 安定性分析
  const consistencyLabel = consistency ? getConsistencyLabel(consistency.score) : null;
  const bestDeviation =
    cuBest != null && cuBest > 0 ? Math.round(((cuBest - stats.avg) / cuBest) * 100) : null;

  // DL3センサーデータ集計
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
      {/* ヘッダー */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
          COUNT-UP 深掘り分析
        </Typography>
        <Chip
          label={`${filtered.length}件`}
          size="small"
          sx={{ fontSize: 10, height: 20, bgcolor: COLOR_COUNTUP, color: '#fff' }}
        />
        {period !== 'all' && (
          <Chip
            label={`全${sortedPlays.length}件中`}
            size="small"
            variant="outlined"
            sx={{ fontSize: 10, height: 20 }}
          />
        )}
      </Box>

      {/* 期間セレクタ */}
      <PeriodSelector period={period} onChange={setPeriod} counts={sortedPlays} />

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

      {/* 4. ミス方向分析 */}
      {missDirection && missDirection.missCount > 0 && (
        <>
          <SectionTitle>ミス方向分析（ブル狙い）</SectionTitle>

          {/* 方向グリッド */}
          <MissDirectionGrid result={missDirection} />

          {/* 主傾向サマリー */}
          <Box sx={{ textAlign: 'center', mt: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              主傾向:{' '}
              <Box
                component="span"
                sx={{ color: missDirection.directionStrength > 0.1 ? '#f44336' : '#ff9800' }}
              >
                {missDirection.directionStrength > 0.05
                  ? `${missDirection.primaryDirection}方向にミスしやすい`
                  : 'ミス方向は均等（特定の傾向なし）'}
              </Box>
            </Typography>
          </Box>

          {/* TOP5 ミスナンバー */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
            {missDirection.topMissNumbers.map((n) => (
              <Chip
                key={n.number}
                label={`${n.number}: ${n.percentage}%`}
                size="small"
                variant="outlined"
                sx={{ fontSize: 10, height: 22 }}
              />
            ))}
          </Box>

          {/* DL3センサーデータ */}
          {avgDl3 && (
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 1.5 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  センサー偏り(X)
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 'bold',
                    color: Math.abs(avgDl3.vectorX) > 5 ? '#ff9800' : '#4caf50',
                  }}
                >
                  {avgDl3.vectorX > 0 ? '右' : '左'} {Math.abs(avgDl3.vectorX).toFixed(1)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  センサー偏り(Y)
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 'bold',
                    color: Math.abs(avgDl3.vectorY) > 5 ? '#ff9800' : '#4caf50',
                  }}
                >
                  {avgDl3.vectorY > 0 ? '下' : '上'} {Math.abs(avgDl3.vectorY).toFixed(1)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  グルーピング
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  {avgDl3.radius.toFixed(1)}mm
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  平均スピード
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  {avgDl3.speed.toFixed(1)}km/h
                </Typography>
              </Box>
            </Box>
          )}
        </>
      )}

      {/* 5. 安定性分析 */}
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

/** 期間セレクタコンポーネント */
function PeriodSelector({
  period,
  onChange,
  counts,
}: {
  period: PeriodKey;
  onChange: (v: PeriodKey) => void;
  counts: CountUpPlay[];
}) {
  // 各期間のゲーム数を計算
  const periodCounts = useMemo(() => {
    const result: Record<PeriodKey, number> = { all: 0, month: 0, week: 0, day: 0, last30: 0 };
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
