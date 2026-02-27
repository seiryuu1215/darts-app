'use client';

import { useMemo, useState } from 'react';
import { Paper, Typography, Box, Chip, ToggleButton, ToggleButtonGroup } from '@mui/material';
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

interface SessionFatigueCardProps {
  countupPlays: CountUpPlay[];
}

type PeriodKey = 'last30' | 'month' | 'week' | 'latest';

const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: 'last30', label: '直近30G' },
  { key: 'month', label: '1ヶ月' },
  { key: 'week', label: '1週間' },
  { key: 'latest', label: '直近' },
];

function filterByPeriod(plays: CountUpPlay[], period: PeriodKey): CountUpPlay[] {
  if (period === 'last30') return plays.slice(-30);
  const now = new Date();
  let cutoff: Date;
  switch (period) {
    case 'latest': {
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

export default function SessionFatigueCard({ countupPlays }: SessionFatigueCardProps) {
  const [period, setPeriod] = useState<PeriodKey>('last30');

  const filtered = useMemo(() => filterByPeriod(countupPlays, period), [countupPlays, period]);
  const analysis = useMemo(() => analyzeSession(filtered), [filtered]);

  const periodCounts = useMemo(() => {
    const result: Record<PeriodKey, number> = { last30: 0, month: 0, week: 0, latest: 0 };
    for (const p of PERIODS) {
      result[p.key] = filterByPeriod(countupPlays, p.key).length;
    }
    return result;
  }, [countupPlays]);

  if (countupPlays.length < 10) return null;

  if (!analysis || analysis.sessionCurve.length < 3) {
    return (
      <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
          セッション疲労分析
        </Typography>
        <ToggleButtonGroup
          value={period}
          exclusive
          onChange={(_, v) => v && setPeriod(v as PeriodKey)}
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
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
          この期間のデータが不足しています
        </Typography>
      </Paper>
    );
  }

  const { sessionCurve, optimalLength, timeOfDay, avgSessionLength, totalSessions } = analysis;

  // 時間帯のベストとワースト
  const bestHour =
    timeOfDay.length > 0 ? timeOfDay.reduce((a, b) => (b.avgScore > a.avgScore ? b : a)) : null;
  const worstHour =
    timeOfDay.length > 0 ? timeOfDay.reduce((a, b) => (b.avgScore < a.avgScore ? b : a)) : null;

  // 全体平均
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
          sx={{ fontSize: 10, height: 20, bgcolor: COLOR_COUNTUP, color: '#fff' }}
        />
      </Box>

      <ToggleButtonGroup
        value={period}
        exclusive
        onChange={(_, v) => v && setPeriod(v as PeriodKey)}
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

      {/* サマリー */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
          gap: 1.5,
          p: 1.5,
          borderRadius: 1,
          bgcolor: 'rgba(255,255,255,0.03)',
          border: '1px solid #333',
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
          <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
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
            <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#f44336' }}>
              {optimalLength.dropoffGameNumber}G目〜
            </Typography>
          </Box>
        )}
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            推奨セッション長
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#FF9800' }}>
            {optimalLength.optimalLength}G
          </Typography>
        </Box>
      </Box>

      {/* セッション曲線 */}
      <SectionTitle>ゲーム番号別平均スコア</SectionTitle>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={sessionCurve}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis
            dataKey="gameNumber"
            fontSize={11}
            tick={{ fill: '#aaa' }}
            label={{
              value: 'G目',
              position: 'insideBottomRight',
              offset: -5,
              fontSize: 10,
              fill: '#888',
            }}
          />
          <YAxis fontSize={11} tick={{ fill: '#aaa' }} domain={['dataMin - 30', 'dataMax + 30']} />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(v: number | undefined) => [`${(v ?? 0).toFixed(1)}`, '平均スコア']}
            labelFormatter={(label) => `${label}G目`}
          />
          <ReferenceLine
            y={Math.round(overallAvg)}
            stroke="#FF9800"
            strokeDasharray="5 5"
            label={{ value: `全体平均 ${Math.round(overallAvg)}`, fill: '#FF9800', fontSize: 10 }}
          />
          {optimalLength.dropoffGameNumber && (
            <ReferenceLine
              x={optimalLength.dropoffGameNumber}
              stroke="#f44336"
              strokeDasharray="3 3"
              label={{ value: '低下開始', fill: '#f44336', fontSize: 10 }}
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
                  fill={isPeak ? '#4caf50' : COLOR_COUNTUP}
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
          <SectionTitle>時間帯別パフォーマンス</SectionTitle>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={timeOfDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis
                dataKey="hour"
                fontSize={10}
                tick={{ fill: '#aaa' }}
                tickFormatter={(h: number) => `${h}時`}
              />
              <YAxis
                fontSize={11}
                tick={{ fill: '#aaa' }}
                domain={['dataMin - 30', 'dataMax + 30']}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                labelFormatter={(h) => `${h}時台`}
                formatter={(v: number | undefined) => [`${(v ?? 0).toFixed(1)}`, '平均スコア']}
              />
              <Bar dataKey="avgScore" name="avgScore" radius={[4, 4, 0, 0]}>
                {timeOfDay.map((entry, idx) => (
                  <Cell
                    key={idx}
                    fill={
                      bestHour && entry.hour === bestHour.hour
                        ? '#4caf50'
                        : worstHour && entry.hour === worstHour.hour
                          ? '#f44336'
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
