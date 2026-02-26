'use client';

import { useMemo, useState } from 'react';
import { Paper, Typography, Box, Chip, ToggleButton, ToggleButtonGroup } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
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
  parsePlayTime,
} from '@/lib/stats-math';
import type { MissDirectionResult, DirectionLabel } from '@/lib/stats-math';
import { ppdForRating, calc01Rating } from '@/lib/dartslive-rating';
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

type PeriodKey = 'last30' | 'month' | 'week' | 'day';

const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: 'last30', label: '直近30G' },
  { key: 'month', label: '1ヶ月' },
  { key: 'week', label: '1週間' },
  { key: 'day', label: '1日' },
];

interface RatingBand {
  label: string;
  min: number;
  max: number;
  rt: number;
}

/** ユーザーのCOUNT-UPスコアを基準に、前後3Rtレベル分（計7バンド＋上下限）を動的生成 */
function generateRatingBands(centerScore: number): { bands: RatingBand[]; centerRt: number } {
  const centerPpr = centerScore / 8;
  const centerRt = Math.round(calc01Rating(centerPpr));

  const startRt = Math.max(2, centerRt - 3);
  const endRt = Math.min(18, centerRt + 3);

  const bands: RatingBand[] = [];

  // 下限バンド
  bands.push({
    label: `~Rt${startRt - 1}`,
    min: 0,
    max: Math.round(ppdForRating(startRt) * 8) - 1,
    rt: startRt - 1,
  });

  // 各Rtレベルのバンド
  for (let rt = startRt; rt <= endRt; rt++) {
    bands.push({
      label: `Rt${rt}`,
      min: Math.round(ppdForRating(rt) * 8),
      max: Math.round(ppdForRating(rt + 1) * 8) - 1,
      rt,
    });
  }

  // 上限バンド
  bands.push({
    label: `Rt${endRt + 1}~`,
    min: Math.round(ppdForRating(endRt + 1) * 8),
    max: 9999,
    rt: endRt + 1,
  });

  return { bands, centerRt };
}

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

  return plays.filter((p) => parsePlayTime(p.time) >= cutoff);
}

// ─── 円形ダーツボード風ミス方向ビジュアル ───

/** 8方向の角度 (0°=上, 時計回り) */
const DIR_ANGLES: Record<DirectionLabel, number> = {
  上: 0,
  右上: 45,
  右: 90,
  右下: 135,
  下: 180,
  左下: 225,
  左: 270,
  左上: 315,
};

function MissDirectionBoard({ result }: { result: MissDirectionResult }) {
  const maxPct = Math.max(...result.directions.map((d) => d.percentage), 1);
  const size = 260;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 10;
  const innerR = 36;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 1 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* 外円 */}
        <circle cx={cx} cy={cy} r={outerR} fill="none" stroke="#333" strokeWidth="1" />
        <circle cx={cx} cy={cy} r={outerR * 0.66} fill="none" stroke="#222" strokeWidth="0.5" />
        <circle cx={cx} cy={cy} r={outerR * 0.33} fill="none" stroke="#222" strokeWidth="0.5" />

        {/* 8方向の区画 */}
        {result.directions.map((d) => {
          const angle = DIR_ANGLES[d.label];
          if (angle == null) return null;
          const intensity = d.percentage / maxPct;
          const isPrimary = d.label === result.primaryDirection;

          // 扇形の中心点（方向ラベル・数値の位置）
          const midR = outerR * 0.55;
          const rad = ((angle - 90) * Math.PI) / 180;
          const tx = cx + midR * Math.cos(rad);
          const ty = cy + midR * Math.sin(rad);

          // 扇形パス（±22.5°の範囲）
          const startAngle = angle - 22.5;
          const endAngle = angle + 22.5;
          const barR = innerR + (outerR - innerR) * intensity;
          const sa = ((startAngle - 90) * Math.PI) / 180;
          const ea = ((endAngle - 90) * Math.PI) / 180;

          const x1 = cx + innerR * Math.cos(sa);
          const y1 = cy + innerR * Math.sin(sa);
          const x2 = cx + barR * Math.cos(sa);
          const y2 = cy + barR * Math.sin(sa);
          const x3 = cx + barR * Math.cos(ea);
          const y3 = cy + barR * Math.sin(ea);
          const x4 = cx + innerR * Math.cos(ea);
          const y4 = cy + innerR * Math.sin(ea);

          const pathD = [
            `M ${x1} ${y1}`,
            `L ${x2} ${y2}`,
            `A ${barR} ${barR} 0 0 1 ${x3} ${y3}`,
            `L ${x4} ${y4}`,
            `A ${innerR} ${innerR} 0 0 0 ${x1} ${y1}`,
            'Z',
          ].join(' ');

          const fillOpacity = 0.15 + intensity * 0.55;

          return (
            <g key={d.label}>
              <path
                d={pathD}
                fill={isPrimary ? '#f44336' : '#ef5350'}
                fillOpacity={fillOpacity}
                stroke={isPrimary ? '#f44336' : '#444'}
                strokeWidth={isPrimary ? 1.5 : 0.5}
              />
              {/* ラベル */}
              <text
                x={tx}
                y={ty - 6}
                textAnchor="middle"
                fill={isPrimary ? '#f44336' : '#aaa'}
                fontSize="10"
                fontWeight={isPrimary ? 'bold' : 'normal'}
              >
                {d.label}
              </text>
              <text
                x={tx}
                y={ty + 8}
                textAnchor="middle"
                fill={isPrimary ? '#ff8a80' : '#ccc'}
                fontSize="12"
                fontWeight="bold"
              >
                {d.percentage}%
              </text>
            </g>
          );
        })}

        {/* 中央 BULL */}
        <circle
          cx={cx}
          cy={cy}
          r={innerR}
          fill="rgba(76,175,80,0.25)"
          stroke="#4caf50"
          strokeWidth="2"
        />
        <text x={cx} y={cy - 8} textAnchor="middle" fill="#4caf50" fontSize="9" fontWeight="bold">
          BULL
        </text>
        <text x={cx} y={cy + 6} textAnchor="middle" fill="#4caf50" fontSize="14" fontWeight="bold">
          {result.bullRate}%
        </text>
        <text x={cx} y={cy + 18} textAnchor="middle" fill="#888" fontSize="8">
          BB:{result.doubleBullRate}%
        </text>

        {/* 主傾向の矢印 */}
        {result.directionStrength > 0.05 &&
          (() => {
            const vec = result.avgVector;
            const arrowLen = Math.min(result.directionStrength * outerR * 1.5, outerR * 0.85);
            const mag = Math.sqrt(vec.x * vec.x + vec.y * vec.y) || 1;
            const nx = vec.x / mag;
            const ny = vec.y / mag;
            const ax = cx + nx * arrowLen;
            const ay = cy + ny * arrowLen;
            return (
              <line
                x1={cx}
                y1={cy}
                x2={ax}
                y2={ay}
                stroke="#ff9800"
                strokeWidth="2.5"
                strokeLinecap="round"
                markerEnd="url(#arrowhead)"
                opacity="0.8"
              />
            );
          })()}
        <defs>
          <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#ff9800" />
          </marker>
        </defs>
      </svg>
    </Box>
  );
}

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

// ─── メインコンポーネント ───

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

  // 前回30Gとの比較（直近30Gモード時のみ）
  const comparison = useMemo(
    () => (period === 'last30' ? computeComparison(sortedPlays) : null),
    [sortedPlays, period],
  );

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
  const expectedScore = ppd != null ? Math.round(ppd * 24) : null;
  const performanceRatio =
    expectedScore != null && expectedScore > 0
      ? Math.round((stats.avg / expectedScore) * 100)
      : null;

  const cuBest = bestRecords?.find(
    (r) => r.gameName === 'COUNT-UP' || r.gameId === 'COUNT-UP',
  )?.bestScore;

  // レーティングベースのスコア帯分布：PPDから期待スコア、なければ実データ平均から推定
  const centerScore = expectedScore ?? stats.avg;
  const { bands: ratingBands, centerRt } = generateRatingBands(centerScore);
  const bands = buildScoreBands(scores, ratingBands);

  const trendData = filtered.map((p, i) => ({
    idx: i + 1,
    score: p.score,
    date: parsePlayTime(p.time).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' }),
  }));

  const consistencyLabel = consistency ? getConsistencyLabel(consistency.score) : null;
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
          sx={{ fontSize: 10, height: 20, bgcolor: COLOR_COUNTUP, color: '#fff' }}
        />
        <Chip
          label={`全${sortedPlays.length}件`}
          size="small"
          variant="outlined"
          sx={{ fontSize: 10, height: 20 }}
        />
      </Box>

      <PeriodSelector period={period} onChange={setPeriod} counts={sortedPlays} />

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
              bgcolor: 'rgba(255,255,255,0.03)',
              border: '1px solid #333',
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

      {/* PPD vs COUNT-UP */}
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

      {/* スコア帯分布 */}
      <SectionTitle>スコア帯分布（Rt{centerRt}基準）</SectionTitle>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={bands}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis dataKey="label" fontSize={10} tick={{ fill: '#aaa' }} />
          <YAxis fontSize={11} tick={{ fill: '#aaa' }} />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(v: number | undefined) => [`${v ?? 0}回`, '回数']}
          />
          <Bar dataKey="count" name="回数" radius={[4, 4, 0, 0]}>
            {ratingBands.map((b, i) => (
              <Cell key={i} fill={b.rt === centerRt ? '#ff9800' : COLOR_COUNTUP} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* スコア推移 */}
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

      {/* ミス方向分析（円形ダーツボード） */}
      {missDirection && missDirection.missCount > 0 && (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2.5, mb: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#aaa' }}>
              ミス方向分析（ブル狙い）{excludeOuterSingle ? '(アウター除外)' : ''}
            </Typography>
            <Chip
              label="アウター除外"
              size="small"
              variant={excludeOuterSingle ? 'filled' : 'outlined'}
              onClick={() => setExcludeOuterSingle((v) => !v)}
              sx={{
                fontSize: 10,
                height: 22,
                cursor: 'pointer',
                bgcolor: excludeOuterSingle ? 'rgba(244,67,54,0.2)' : undefined,
              }}
            />
          </Box>
          <MissDirectionBoard result={missDirection} />

          <Box sx={{ textAlign: 'center', mt: 0.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              主傾向:{' '}
              <Box
                component="span"
                sx={{ color: missDirection.directionStrength > 0.1 ? '#f44336' : '#ff9800' }}
              >
                {missDirection.directionStrength > 0.05
                  ? `${missDirection.primaryDirection}方向にミスしやすい`
                  : 'ミス方向は均等'}
              </Box>
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1, justifyContent: 'center' }}>
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

          {avgDl3 && (
            <Box
              sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 1.5, justifyContent: 'center' }}
            >
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  偏り(X)
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
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  偏り(Y)
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
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  グルーピング
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  {avgDl3.radius.toFixed(1)}mm
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  スピード
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  {avgDl3.speed.toFixed(1)}km/h
                </Typography>
              </Box>
            </Box>
          )}
        </>
      )}

      {/* 安定性分析 */}
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
    </Paper>
  );
}

/** 期間セレクタ */
function PeriodSelector({
  period,
  onChange,
  counts,
}: {
  period: PeriodKey;
  onChange: (v: PeriodKey) => void;
  counts: CountUpPlay[];
}) {
  const periodCounts = useMemo(() => {
    const result: Record<PeriodKey, number> = { last30: 0, month: 0, week: 0, day: 0 };
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
