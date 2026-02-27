'use client';

import { useMemo, useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  Alert,
} from '@mui/material';
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
  ComposedChart,
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
  simulateBullImprovement,
  analyzeWeekdayHourly,
  getDayLabel,
} from '@/lib/stats-math';
import type {
  MissDirectionResult,
  DirectionLabel,
  BullSimulationResult,
  WeekdayHourlyResult,
} from '@/lib/stats-math';
import { analyzeSpeedSegments } from '@/lib/sensor-analysis';
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

type PeriodKey = 'last30' | 'month' | 'week' | 'latest';

const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: 'last30', label: '直近30G' },
  { key: 'month', label: '1ヶ月' },
  { key: 'week', label: '1週間' },
  { key: 'latest', label: '直近' },
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

// ─── スピードチャートTooltip ───

function SpeedChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ payload: Record<string, unknown> }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const data = payload[0]?.payload;
  if (!data) return null;
  return (
    <Box
      sx={{
        bgcolor: '#1e1e1e',
        border: '1px solid #444',
        borderRadius: 1,
        p: 1,
        minWidth: 120,
      }}
    >
      <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#fff', display: 'block' }}>
        {label} km/h (n={data.count as number})
      </Typography>
      <Typography variant="caption" sx={{ color: '#CE93D8', display: 'block' }}>
        スコア: {data.avgScore as number}点
      </Typography>
      <Typography variant="caption" sx={{ color: '#FF9800', display: 'block' }}>
        ブル率: {data.bullRate as number}%
      </Typography>
      {data.primaryMissDir !== '-' && (
        <Typography variant="caption" sx={{ color: '#aaa', display: 'block' }}>
          主ミス方向: {data.primaryMissDir as string}
        </Typography>
      )}
    </Box>
  );
}

// ─── 曜日×時間帯ヒートマップ ───

/** スコアに応じた色を返す（青=低い、灰=中、緑=高い） */
function scoreToColor(score: number, min: number, max: number): string {
  if (max === min) return '#666';
  const ratio = (score - min) / (max - min);
  if (ratio < 0.33) {
    // 青系 (低い)
    const t = ratio / 0.33;
    const r = Math.round(66 + t * 30);
    const g = Math.round(133 + t * 20);
    const b = Math.round(244 - t * 40);
    return `rgb(${r},${g},${b})`;
  }
  if (ratio < 0.66) {
    // 灰系 (中)
    const t = (ratio - 0.33) / 0.33;
    const v = Math.round(150 + t * 20);
    return `rgb(${v},${v},${v - 10})`;
  }
  // 緑系 (高い)
  const t = (ratio - 0.66) / 0.34;
  const r = Math.round(100 - t * 24);
  const g = Math.round(175 + t * 80);
  const b = Math.round(80 - t * 9);
  return `rgb(${r},${g},${b})`;
}

// 月〜日の順 (getDay: 0=日なので [1,2,3,4,5,6,0])
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

function WeekdayHourlyHeatmap({ result }: { result: WeekdayHourlyResult }) {
  // データがある時間帯のみ表示
  const hours = [...new Set(result.cells.map((c) => c.hour))].sort((a, b) => a - b);
  const allScores = result.cells.map((c) => c.avgScore);
  const minScore = Math.min(...allScores);
  const maxScore = Math.max(...allScores);

  const cellMap = new Map<string, (typeof result.cells)[0]>();
  for (const cell of result.cells) {
    cellMap.set(`${cell.day}-${cell.hour}`, cell);
  }

  const cellW = 36;
  const cellH = 28;
  const labelW = 28;
  const headerH = 24;
  const svgW = labelW + hours.length * cellW;
  const svgH = headerH + DAY_ORDER.length * cellH;

  return (
    <>
      <SectionTitle>曜日×時間帯パフォーマンス</SectionTitle>
      <Box sx={{ overflowX: 'auto', mb: 1 }}>
        <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`}>
          {/* 時間帯ヘッダー */}
          {hours.map((h, i) => (
            <text
              key={h}
              x={labelW + i * cellW + cellW / 2}
              y={headerH - 6}
              textAnchor="middle"
              fill="#aaa"
              fontSize="10"
            >
              {h}
            </text>
          ))}
          {/* 曜日行 */}
          {DAY_ORDER.map((day, rowIdx) => (
            <g key={day}>
              <text
                x={labelW - 6}
                y={headerH + rowIdx * cellH + cellH / 2 + 4}
                textAnchor="end"
                fill="#aaa"
                fontSize="11"
              >
                {getDayLabel(day)}
              </text>
              {hours.map((h, colIdx) => {
                const cell = cellMap.get(`${day}-${h}`);
                const x = labelW + colIdx * cellW;
                const y = headerH + rowIdx * cellH;
                if (!cell) {
                  return (
                    <rect
                      key={h}
                      x={x + 1}
                      y={y + 1}
                      width={cellW - 2}
                      height={cellH - 2}
                      rx={3}
                      fill="#222"
                      fillOpacity={0.5}
                    />
                  );
                }
                const color = scoreToColor(cell.avgScore, minScore, maxScore);
                const isBest = result.bestCell?.day === day && result.bestCell?.hour === h;
                return (
                  <g key={h}>
                    <rect
                      x={x + 1}
                      y={y + 1}
                      width={cellW - 2}
                      height={cellH - 2}
                      rx={3}
                      fill={color}
                      fillOpacity={0.7}
                      stroke={isBest ? '#fff' : 'none'}
                      strokeWidth={isBest ? 1.5 : 0}
                    />
                    <text
                      x={x + cellW / 2}
                      y={y + cellH / 2 + 4}
                      textAnchor="middle"
                      fill="#fff"
                      fontSize="9"
                      fontWeight="bold"
                    >
                      {cell.count}
                    </text>
                  </g>
                );
              })}
            </g>
          ))}
        </svg>
      </Box>

      {/* 凡例 */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
          低({Math.round(minScore)})
        </Typography>
        <Box
          sx={{
            width: 80,
            height: 8,
            borderRadius: 1,
            background: `linear-gradient(to right, ${scoreToColor(minScore, minScore, maxScore)}, #999, ${scoreToColor(maxScore, minScore, maxScore)})`,
          }}
        />
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
          高({Math.round(maxScore)})
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10, ml: 1 }}>
          セル内=ゲーム数
        </Typography>
      </Box>

      {/* ベスト/ワーストタイム */}
      {result.bestCell && (
        <Alert severity="success" sx={{ py: 0, mb: 0.5, '& .MuiAlert-message': { fontSize: 12 } }}>
          {getDayLabel(result.bestCell.day)}曜 {result.bestCell.hour}
          時台が最高パフォーマンス（平均{result.bestCell.avgScore}点、{result.bestCell.count}
          ゲーム）
        </Alert>
      )}
      {result.worstCell && (
        <Alert severity="warning" sx={{ py: 0, '& .MuiAlert-message': { fontSize: 12 } }}>
          {getDayLabel(result.worstCell.day)}曜 {result.worstCell.hour}
          時台が最低パフォーマンス（平均{result.worstCell.avgScore}点、{result.worstCell.count}
          ゲーム）
        </Alert>
      )}
    </>
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

  // スピード帯別セグメント分析
  const speedSegments = useMemo(() => analyzeSpeedSegments(filtered), [filtered]);

  // ブル率改善シミュレーション
  const bullSimulation = useMemo((): BullSimulationResult | null => {
    if (playLogs.length === 0 || scores.length === 0) return null;
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    return simulateBullImprovement(playLogs, avg);
  }, [playLogs, scores]);

  // 曜日×時間帯分析
  const weekdayHourly = useMemo(
    (): WeekdayHourlyResult | null => analyzeWeekdayHourly(filtered),
    [filtered],
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
  const expectedScore = ppd != null ? Math.round(ppd * 8) : null;
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
                期待スコア (PPD&times;8)
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

      {/* スピード分析 */}
      {speedSegments && (
        <>
          <SectionTitle>スピード分析</SectionTitle>

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
              mb: 1.5,
            }}
          >
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                ベスト速度帯
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                {speedSegments.bestSegment?.label}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: 9 }}>
                km/h（スコア最高）
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                最高ブル率帯
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#FF9800' }}>
                {speedSegments.bestBullSegment?.label}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: 9 }}>
                km/h（ブル率{speedSegments.bestBullSegment?.bullRate}%）
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                速度レンジ
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                {speedSegments.speedRange.min}-{speedSegments.speedRange.max}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: 9 }}>
                km/h
              </Typography>
            </Box>
          </Box>

          {/* スピード帯別チャート（複合バーチャート） */}
          {speedSegments.segments.length > 1 && (
            <ResponsiveContainer width="100%" height={200}>
              <ComposedChart data={speedSegments.segments}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="label" fontSize={10} tick={{ fill: '#aaa' }} />
                <YAxis
                  yAxisId="left"
                  fontSize={11}
                  tick={{ fill: '#aaa' }}
                  domain={['dataMin - 30', 'dataMax + 30']}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  fontSize={11}
                  tick={{ fill: '#aaa' }}
                  unit="%"
                />
                <Tooltip content={<SpeedChartTooltip />} />
                <Bar yAxisId="left" dataKey="avgScore" name="平均スコア" radius={[4, 4, 0, 0]}>
                  {speedSegments.segments.map((s, i) => (
                    <Cell
                      key={i}
                      fill={s.label === speedSegments.bestSegment?.label ? '#4caf50' : '#7B1FA2'}
                    />
                  ))}
                </Bar>
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="bullRate"
                  name="ブル率"
                  stroke="#FF9800"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#FF9800' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}

          {/* 遅い帯 vs 速い帯 比較テーブル */}
          {speedSegments.slowVsFast && (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: '80px 1fr 1fr',
                gap: 0.5,
                mt: 1.5,
                p: 1.5,
                borderRadius: 1,
                bgcolor: 'rgba(255,255,255,0.03)',
                border: '1px solid #333',
                alignItems: 'center',
              }}
            >
              <Box />
              <Typography
                variant="caption"
                sx={{ textAlign: 'center', fontWeight: 'bold', color: '#64B5F6' }}
              >
                遅い帯({speedSegments.slowVsFast.slowLabel})
              </Typography>
              <Typography
                variant="caption"
                sx={{ textAlign: 'center', fontWeight: 'bold', color: '#EF5350' }}
              >
                速い帯({speedSegments.slowVsFast.fastLabel})
              </Typography>

              <Typography variant="caption" color="text.secondary">
                スコア
              </Typography>
              <Typography variant="body2" sx={{ textAlign: 'center', fontWeight: 'bold' }}>
                {speedSegments.slowVsFast.slowAvgScore}
              </Typography>
              <Typography variant="body2" sx={{ textAlign: 'center', fontWeight: 'bold' }}>
                {speedSegments.slowVsFast.fastAvgScore}
              </Typography>

              <Typography variant="caption" color="text.secondary">
                ブル率
              </Typography>
              <Typography variant="body2" sx={{ textAlign: 'center', fontWeight: 'bold' }}>
                {speedSegments.slowVsFast.slowBullRate}%
              </Typography>
              <Typography variant="body2" sx={{ textAlign: 'center', fontWeight: 'bold' }}>
                {speedSegments.slowVsFast.fastBullRate}%
              </Typography>

              <Typography variant="caption" color="text.secondary">
                ミス傾向
              </Typography>
              <Typography variant="body2" sx={{ textAlign: 'center', fontWeight: 'bold' }}>
                {speedSegments.slowVsFast.slowMissDir}方向
              </Typography>
              <Typography variant="body2" sx={{ textAlign: 'center', fontWeight: 'bold' }}>
                {speedSegments.slowVsFast.fastMissDir}方向
              </Typography>
            </Box>
          )}

          {/* インサイト */}
          {speedSegments.insights.length > 0 && (
            <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {speedSegments.insights.map((insight, i) => (
                <Alert
                  key={i}
                  severity={
                    i === 0
                      ? 'success'
                      : insight.includes('ミス') || insight.includes('偏る')
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

      {/* ブル率改善シミュレーター */}
      {bullSimulation && bullSimulation.steps.length > 0 && (
        <>
          <SectionTitle>ブル率改善シミュレーター</SectionTitle>
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              flexWrap: 'wrap',
              mb: 1,
              p: 1.5,
              borderRadius: 1,
              bgcolor: 'rgba(255,255,255,0.03)',
              border: '1px solid #333',
            }}
          >
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                現在のブル率
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#FF9800' }}>
                {bullSimulation.currentBullRate}%
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                ミス平均スコア
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                {bullSimulation.missDartAvgScore}点
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                分析ダーツ数
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                {bullSimulation.totalDarts}本
              </Typography>
            </Box>
          </Box>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={bullSimulation.steps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis
                dataKey="improvedBullRate"
                fontSize={10}
                tick={{ fill: '#aaa' }}
                tickFormatter={(v: number) => `${v}%`}
              />
              <YAxis fontSize={11} tick={{ fill: '#aaa' }} unit="点" />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(v: number | undefined) => [`+${v ?? 0}点`, 'スコア上昇']}
                labelFormatter={(v: unknown) => `ブル率 ${v}%`}
              />
              <Bar dataKey="scoreDiff" name="scoreDiff" radius={[4, 4, 0, 0]}>
                {bullSimulation.steps.map((_, i) => (
                  <Cell
                    key={i}
                    fill={i === 4 ? '#4caf50' : '#43A047'}
                    fillOpacity={i === 4 ? 1 : 0.6}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <Alert severity="info" sx={{ mt: 1, py: 0, '& .MuiAlert-message': { fontSize: 12 } }}>
            ブル率を5%改善すると、スコアが約{bullSimulation.steps[4]?.scoreDiff ?? 0}
            点アップ（推定{bullSimulation.steps[4]?.estimatedAvgScore ?? 0}点）
          </Alert>
        </>
      )}

      {/* 曜日×時間帯パフォーマンス */}
      {weekdayHourly && <WeekdayHourlyHeatmap result={weekdayHourly} />}

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
