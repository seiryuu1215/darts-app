'use client';

import { useMemo } from 'react';
import { Paper, Typography, Box, Chip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Cell,
} from 'recharts';
import { analyzeSession } from '@/lib/session-analysis';
import { COLOR_COUNTUP } from '@/lib/dartslive-colors';
import type { CountUpPlay } from './CountUpDeepAnalysisCard';
import { parsePlayTime } from '@/lib/stats-math';
import { useChartTheme } from '@/lib/chart-theme';

interface SessionFatigueCardProps {
  countupPlays: CountUpPlay[];
}

function filterLastMonth(plays: CountUpPlay[]): CountUpPlay[] {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  return plays.filter((p) => parsePlayTime(p.time) >= cutoff);
}

export default function SessionFatigueCard({ countupPlays }: SessionFatigueCardProps) {
  const theme = useTheme();
  const ct = useChartTheme();

  const filtered = useMemo(() => filterLastMonth(countupPlays), [countupPlays]);
  const analysis = useMemo(() => analyzeSession(filtered), [filtered]);

  if (countupPlays.length < 10) return null;

  if (!analysis || analysis.sessionCurve.length < 3) {
    return (
      <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
          セッション疲労分析
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
          直近1ヶ月のデータが不足しています
        </Typography>
      </Paper>
    );
  }

  const { sessionCurve, optimalLength, timeOfDay, avgSessionLength, totalSessions } = analysis;

  const bestHour =
    timeOfDay.length > 0 ? timeOfDay.reduce((a, b) => (b.avgScore > a.avgScore ? b : a)) : null;
  const worstHour =
    timeOfDay.length > 0 ? timeOfDay.reduce((a, b) => (b.avgScore < a.avgScore ? b : a)) : null;

  const overallAvg =
    sessionCurve.reduce((s, p) => s + p.avgScore * p.count, 0) /
    sessionCurve.reduce((s, p) => s + p.count, 0);

  return (
    <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
          セッション疲労分析
        </Typography>
        <Chip
          label={`${totalSessions}セッション`}
          size="small"
          sx={{ fontSize: 10, height: 20, bgcolor: COLOR_COUNTUP, color: 'common.white' }}
        />
        <Typography variant="caption" color="text.secondary">
          直近1ヶ月
        </Typography>
      </Box>

      {/* サマリー */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
          gap: 1.5,
          p: 1.5,
          borderRadius: 1,
          bgcolor: 'action.hover',
          border: 1,
          borderColor: 'divider',
          mb: 2,
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            平均セッション長
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            {avgSessionLength}G
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            ピークゲーム
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'success.main' }}>
            {optimalLength.peakGameNumber}G目
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: 9 }}>
            平均{optimalLength.peakAvgScore.toFixed(0)}点
          </Typography>
        </Box>
        {optimalLength.dropoffGameNumber && (
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              集中力低下
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'error.main' }}>
              {optimalLength.dropoffGameNumber}G目〜
            </Typography>
          </Box>
        )}
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            推奨セッション長
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
            {optimalLength.optimalLength}G
          </Typography>
        </Box>
      </Box>

      {/* セッション曲線 */}
      <Typography
        variant="subtitle2"
        sx={{ fontWeight: 'bold', mt: 2.5, mb: 1 }}
        color="text.secondary"
      >
        ゲーム番号別平均スコア
      </Typography>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={sessionCurve}>
          <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} />
          <XAxis
            dataKey="gameNumber"
            fontSize={11}
            tick={{ fill: ct.text }}
            label={{
              value: 'G目',
              position: 'insideBottomRight',
              offset: -5,
              fontSize: 10,
              fill: ct.text,
            }}
          />
          <YAxis fontSize={11} tick={{ fill: ct.text }} domain={['dataMin - 30', 'dataMax + 30']} />
          <Tooltip
            contentStyle={ct.tooltipStyle}
            formatter={(v: number | undefined) => [`${(v ?? 0).toFixed(1)}`, '平均スコア']}
            labelFormatter={(label) => `${label}G目`}
          />
          <ReferenceLine
            y={Math.round(overallAvg)}
            stroke={theme.palette.warning.main}
            strokeDasharray="5 5"
            label={{
              value: `全体平均 ${Math.round(overallAvg)}`,
              fill: theme.palette.warning.main,
              fontSize: 10,
            }}
          />
          {optimalLength.dropoffGameNumber && (
            <ReferenceLine
              x={optimalLength.dropoffGameNumber}
              stroke={theme.palette.error.main}
              strokeDasharray="3 3"
              label={{ value: '低下開始', fill: theme.palette.error.main, fontSize: 10 }}
            />
          )}
          <Line
            type="monotone"
            dataKey="avgScore"
            stroke={COLOR_COUNTUP}
            strokeWidth={2.5}
            dot={(props: { cx?: number; cy?: number; index?: number }) => {
              const cx = props.cx ?? 0;
              const cy = props.cy ?? 0;
              const index = props.index ?? 0;
              const point = sessionCurve[index];
              if (!point) return <circle key={index} cx={cx} cy={cy} r={0} />;
              const isPeak = point.gameNumber === optimalLength.peakGameNumber;
              return (
                <circle
                  key={index}
                  cx={cx}
                  cy={cy}
                  r={isPeak ? 6 : 4}
                  fill={isPeak ? theme.palette.success.main : COLOR_COUNTUP}
                  stroke={isPeak ? '#fff' : 'none'}
                  strokeWidth={isPeak ? 2 : 0}
                />
              );
            }}
            name="avgScore"
          />
        </LineChart>
      </ResponsiveContainer>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5, justifyContent: 'center' }}>
        {sessionCurve.map((p) => (
          <Typography
            key={p.gameNumber}
            variant="caption"
            color="text.secondary"
            sx={{ fontSize: 9 }}
          >
            {p.gameNumber}G: n={p.count}
          </Typography>
        ))}
      </Box>

      {/* 時間帯別パフォーマンス */}
      {timeOfDay.length >= 3 && (
        <>
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 'bold', mt: 2.5, mb: 1 }}
            color="text.secondary"
          >
            時間帯別パフォーマンス
          </Typography>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={timeOfDay}>
              <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} />
              <XAxis
                dataKey="hour"
                fontSize={10}
                tick={{ fill: ct.text }}
                tickFormatter={(h: number) => `${h}時`}
              />
              <YAxis
                fontSize={11}
                tick={{ fill: ct.text }}
                domain={['dataMin - 30', 'dataMax + 30']}
              />
              <Tooltip
                contentStyle={ct.tooltipStyle}
                labelFormatter={(h) => `${h}時台`}
                formatter={(v: number | undefined) => [`${(v ?? 0).toFixed(1)}`, '平均スコア']}
              />
              <Bar dataKey="avgScore" name="avgScore" radius={[4, 4, 0, 0]}>
                {timeOfDay.map((entry, idx) => (
                  <Cell
                    key={idx}
                    fill={
                      bestHour && entry.hour === bestHour.hour
                        ? theme.palette.success.main
                        : worstHour && entry.hour === worstHour.hour
                          ? theme.palette.error.main
                          : COLOR_COUNTUP
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {bestHour && worstHour && bestHour.hour !== worstHour.hour && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 0.5, display: 'block', textAlign: 'center' }}
            >
              ベスト: {bestHour.hour}時台 (平均{bestHour.avgScore.toFixed(0)}点, n={bestHour.count})
              {' / '}
              ワースト: {worstHour.hour}時台 (平均{worstHour.avgScore.toFixed(0)}点, n=
              {worstHour.count})
            </Typography>
          )}
        </>
      )}
    </Paper>
  );
}
