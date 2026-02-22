'use client';

import { Box, Card, Typography, Button, LinearProgress } from '@mui/material';
import BarChartIcon from '@mui/icons-material/BarChart';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import Link from 'next/link';
import { getFlightColor, COLOR_01, COLOR_CRICKET, COLOR_COUNTUP } from '@/lib/dartslive-colors';
import { getRatingTarget } from '@/lib/dartslive-rating';

interface PrevMonthStats {
  dBullMonthly: number;
  sBullMonthly: number;
  lowTonMonthly: number;
  hatTricksMonthly: number;
  playDays: number;
}

interface StatsOverviewCardProps {
  rating: number;
  flight: string;
  stats01Avg: number;
  statsCriAvg: number;
  statsPraAvg: number | null;
  prevRating: number | null;
  prevStats01Avg: number | null;
  prevStatsCriAvg: number | null;
  prevStatsPraAvg: number | null;
  dBullMonthly: number;
  sBullMonthly: number;
  lowTonMonthly: number;
  hatTricksMonthly: number;
  currentMonthPlayDays: number;
  prevMonthStats: PrevMonthStats | null;
}

function DiffArrow({ current, prev }: { current: number | null; prev: number | null }) {
  if (current == null || prev == null) return null;
  const diff = current - prev;
  if (diff === 0) return null;
  return diff > 0 ? (
    <ArrowUpwardIcon sx={{ fontSize: 14, color: 'success.main' }} />
  ) : (
    <ArrowDownwardIcon sx={{ fontSize: 14, color: 'error.main' }} />
  );
}

function PerDayDiffArrow({
  current,
  currentDays,
  prev,
  prevDays,
}: {
  current: number;
  currentDays: number;
  prev: number;
  prevDays: number;
}) {
  if (currentDays === 0 || prevDays === 0) return null;
  const currentPerDay = current / currentDays;
  const prevPerDay = prev / prevDays;
  const diff = currentPerDay - prevPerDay;
  if (Math.abs(diff) < 0.01) return null;
  return diff > 0 ? (
    <ArrowUpwardIcon sx={{ fontSize: 12, color: 'success.main' }} />
  ) : (
    <ArrowDownwardIcon sx={{ fontSize: 12, color: 'error.main' }} />
  );
}

export default function StatsOverviewCard({
  rating,
  flight,
  stats01Avg,
  statsCriAvg,
  statsPraAvg,
  prevRating,
  prevStats01Avg,
  prevStatsCriAvg,
  prevStatsPraAvg,
  dBullMonthly,
  sBullMonthly,
  lowTonMonthly,
  hatTricksMonthly,
  currentMonthPlayDays,
  prevMonthStats,
}: StatsOverviewCardProps) {
  const fc = getFlightColor(flight);
  const target = getRatingTarget(stats01Avg, statsCriAvg);
  const progress = ((rating - Math.floor(rating)) / 1) * 100;
  const maxReached = target.ppd01Only.achieved && target.mprCriOnly.achieved;

  const bullTotal = dBullMonthly + sBullMonthly;
  const perDay =
    currentMonthPlayDays > 0 ? (v: number) => (v / currentMonthPlayDays).toFixed(1) : null;

  const statsItems = [
    {
      label: 'Rt',
      sub: flight,
      value: rating.toFixed(2),
      color: fc,
      current: rating,
      prev: prevRating,
    },
    {
      label: '01',
      value: stats01Avg.toFixed(2),
      color: COLOR_01,
      current: stats01Avg,
      prev: prevStats01Avg,
    },
    {
      label: 'Cricket',
      value: statsCriAvg.toFixed(2),
      color: COLOR_CRICKET,
      current: statsCriAvg,
      prev: prevStatsCriAvg,
    },
    {
      label: 'CU',
      value: statsPraAvg?.toFixed(0) ?? '--',
      color: COLOR_COUNTUP,
      current: statsPraAvg,
      prev: prevStatsPraAvg,
    },
  ];

  const monthlyItems = [
    {
      label: 'BULL',
      value: bullTotal,
      prevValue: prevMonthStats ? prevMonthStats.dBullMonthly + prevMonthStats.sBullMonthly : 0,
    },
    {
      label: 'LOW TON',
      value: lowTonMonthly,
      prevValue: prevMonthStats?.lowTonMonthly ?? 0,
    },
    {
      label: 'HAT TRICK',
      value: hatTricksMonthly,
      prevValue: prevMonthStats?.hatTricksMonthly ?? 0,
    },
  ];

  return (
    <Box sx={{ mb: 4 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 1.5,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BarChartIcon color="primary" />
          <Typography variant="h5">DARTSLIVE Stats</Typography>
        </Box>
        <Button component={Link} href="/stats" endIcon={<ArrowForwardIcon />} size="small">
          詳細
        </Button>
      </Box>

      <Card sx={{ borderRadius: 2, overflow: 'hidden' }}>
        {/* 上段: Rt / 01 / Cricket / CU */}
        <Box
          component={Link}
          href="/stats"
          sx={{ display: 'flex', textDecoration: 'none', color: 'inherit' }}
        >
          {statsItems.map((item) => (
            <Box
              key={item.label}
              sx={{
                flex: 1,
                textAlign: 'center',
                py: 1.5,
                minHeight: 64,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                borderTop: `3px solid ${item.color}`,
              }}
            >
              <Typography
                variant="caption"
                sx={{ color: item.color, fontWeight: 'bold', display: 'block', lineHeight: 1.2 }}
              >
                {item.label}
                {item.sub && (
                  <Typography component="span" variant="caption" sx={{ ml: 0.5, opacity: 0.7 }}>
                    {item.sub}
                  </Typography>
                )}
              </Typography>
              <Box
                sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.3 }}
              >
                <Typography variant="h6" sx={{ fontWeight: 'bold', lineHeight: 1.3 }}>
                  {item.value}
                </Typography>
                <DiffArrow current={item.current} prev={item.prev} />
              </Box>
            </Box>
          ))}
        </Box>

        {/* 中段: フライト進捗 */}
        <Box sx={{ px: 2, pt: 1.5, pb: !maxReached ? 0 : 1.5 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 1,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  bgcolor: fc,
                  boxShadow: `0 0 6px ${fc}`,
                }}
              />
              <Typography variant="subtitle2" fontWeight="bold">
                {maxReached ? '最大レーティング到達' : `次の目標: Rt.${target.nextRating}`}
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              現在 Rt.{rating.toFixed(2)}
            </Typography>
          </Box>

          {!maxReached && (
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 6,
                borderRadius: 3,
                mb: 2,
                bgcolor: 'action.hover',
                '& .MuiLinearProgress-bar': { borderRadius: 3, bgcolor: fc },
              }}
            />
          )}

          {!maxReached && (
            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              <Box sx={{ flex: 1, minWidth: 120, p: 1, borderRadius: 1, bgcolor: 'action.hover' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 'bold' }}>
                  均等に上げる
                </Typography>
                <Box sx={{ display: 'flex', gap: 1.5, mt: 0.5 }}>
                  <Typography variant="body2" fontWeight="bold">
                    <Box component="span" sx={{ color: COLOR_01 }}>
                      01
                    </Box>{' '}
                    {target.ppdBalanced.achieved ? (
                      '達成'
                    ) : (
                      <>+{target.ppdBalanced.gap.toFixed(2)}</>
                    )}
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    <Box component="span" sx={{ color: COLOR_CRICKET }}>
                      Cri
                    </Box>{' '}
                    {target.mprBalanced.achieved ? (
                      '達成'
                    ) : (
                      <>+{target.mprBalanced.gap.toFixed(2)}</>
                    )}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ flex: 1, minWidth: 120, p: 1, borderRadius: 1, bgcolor: 'action.hover' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 'bold' }}>
                  片方で上げる
                </Typography>
                <Box sx={{ display: 'flex', gap: 1.5, mt: 0.5 }}>
                  <Typography variant="body2" fontWeight="bold">
                    <Box component="span" sx={{ color: COLOR_01 }}>
                      01
                    </Box>{' '}
                    {target.ppd01Only.achieved ? '達成' : <>+{target.ppd01Only.gap.toFixed(2)}</>}
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    <Box component="span" sx={{ color: COLOR_CRICKET }}>
                      Cri
                    </Box>{' '}
                    {target.mprCriOnly.achieved ? '達成' : <>+{target.mprCriOnly.gap.toFixed(2)}</>}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
        </Box>

        {/* 下段: 今月の実績 */}
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            justifyContent: 'space-around',
            px: 2,
            py: 1.5,
            borderTop: '1px solid',
            borderColor: 'divider',
          }}
        >
          {monthlyItems.map((item) => (
            <Box key={item.label} sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                {item.label}
              </Typography>
              <Typography variant="body1" fontWeight="bold">
                {item.value}
              </Typography>
              {perDay && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 0.3,
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    {perDay(item.value)}/日
                  </Typography>
                  {prevMonthStats && prevMonthStats.playDays > 0 && (
                    <PerDayDiffArrow
                      current={item.value}
                      currentDays={currentMonthPlayDays}
                      prev={item.prevValue}
                      prevDays={prevMonthStats.playDays}
                    />
                  )}
                </Box>
              )}
            </Box>
          ))}
        </Box>
      </Card>
    </Box>
  );
}
