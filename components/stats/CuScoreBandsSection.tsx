'use client';

import { Typography, Box } from '@mui/material';
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
import { buildScoreBands, parsePlayTime } from '@/lib/stats-math';
import { ppdForRating, calc01Rating } from '@/lib/dartslive-rating';
import { COLOR_COUNTUP } from '@/lib/dartslive-colors';
import { useChartTheme } from '@/lib/chart-theme';
import { SectionTitle, type CountUpPlay } from './countup-deep-shared';

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

interface CuScoreBandsSectionProps {
  filtered: CountUpPlay[];
  scores: number[];
  stats: { avg: number };
  expectedScore: number | null;
  performanceRatio: number | null;
}

export default function CuScoreBandsSection({
  filtered,
  scores,
  stats,
  expectedScore,
  performanceRatio,
}: CuScoreBandsSectionProps) {
  const ct = useChartTheme();

  const centerScore = expectedScore ?? stats.avg;
  const { bands: ratingBands, centerRt } = generateRatingBands(centerScore);
  const bands = buildScoreBands(scores, ratingBands);

  const trendData = filtered.map((p, i) => ({
    idx: i + 1,
    score: p.score,
    date: parsePlayTime(p.time).toLocaleDateString('ja-JP', {
      month: 'numeric',
      day: 'numeric',
    }),
  }));

  return (
    <>
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
          <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} />
          <XAxis dataKey="label" fontSize={10} tick={{ fill: ct.text }} />
          <YAxis fontSize={11} tick={{ fill: ct.text }} />
          <Tooltip
            contentStyle={ct.tooltipStyle}
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
          <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} />
          <XAxis dataKey="date" fontSize={10} tick={{ fill: ct.text }} />
          <YAxis fontSize={11} tick={{ fill: ct.text }} domain={['dataMin - 50', 'dataMax + 50']} />
          <Tooltip contentStyle={ct.tooltipStyle} />
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
    </>
  );
}
