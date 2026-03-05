'use client';

import { useMemo } from 'react';
import { Typography, Box, Alert } from '@mui/material';
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
import {
  getConsistencyLabel,
  simulateBullImprovement,
  analyzeWeekdayHourly,
  getDayLabel,
} from '@/lib/stats-math';
import type { BullSimulationResult, WeekdayHourlyResult } from '@/lib/stats-math';
import { useChartTheme } from '@/lib/chart-theme';
import { SectionTitle, type CountUpPlay } from './countup-deep-shared';

// ─── 曜日×時間帯ヒートマップ ───

/** スコアに応じた色を返す（青=低い、灰=中、緑=高い） */
function scoreToColor(score: number, min: number, max: number): string {
  if (max === min) return '#666';
  const ratio = (score - min) / (max - min);
  if (ratio < 0.33) {
    const t = ratio / 0.33;
    const r = Math.round(66 + t * 30);
    const g = Math.round(133 + t * 20);
    const b = Math.round(244 - t * 40);
    return `rgb(${r},${g},${b})`;
  }
  if (ratio < 0.66) {
    const t = (ratio - 0.33) / 0.33;
    const v = Math.round(150 + t * 20);
    return `rgb(${v},${v},${v - 10})`;
  }
  const t = (ratio - 0.66) / 0.34;
  const r = Math.round(100 - t * 24);
  const g = Math.round(175 + t * 80);
  const b = Math.round(80 - t * 9);
  return `rgb(${r},${g},${b})`;
}

// 月〜日の順 (getDay: 0=日なので [1,2,3,4,5,6,0])
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

function WeekdayHourlyHeatmap({ result }: { result: WeekdayHourlyResult }) {
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

// ─── メインセクション ───

interface CuPerformanceSectionProps {
  filtered: CountUpPlay[];
  scores: number[];
  playLogs: string[];
  consistency: { stdDev: number; cv: number; score: number } | null;
  bestDeviation: number | null;
}

export default function CuPerformanceSection({
  filtered,
  scores,
  playLogs,
  consistency,
  bestDeviation,
}: CuPerformanceSectionProps) {
  const ct = useChartTheme();
  const consistencyLabel = consistency ? getConsistencyLabel(consistency.score) : null;

  const bullSimulation = useMemo((): BullSimulationResult | null => {
    if (playLogs.length === 0 || scores.length === 0) return null;
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    return simulateBullImprovement(playLogs, avg);
  }, [playLogs, scores]);

  const weekdayHourly = useMemo(
    (): WeekdayHourlyResult | null => analyzeWeekdayHourly(filtered),
    [filtered],
  );

  return (
    <>
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
              <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} />
              <XAxis
                dataKey="improvedBullRate"
                fontSize={10}
                tick={{ fill: ct.text }}
                tickFormatter={(v: number) => `${v}%`}
              />
              <YAxis fontSize={11} tick={{ fill: ct.text }} unit="点" />
              <Tooltip
                contentStyle={ct.tooltipStyle}
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
    </>
  );
}
