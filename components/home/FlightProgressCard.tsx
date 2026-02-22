'use client';

import { Box, Card, Typography, LinearProgress } from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { getFlightColor, COLOR_01, COLOR_CRICKET } from '@/lib/dartslive-colors';
import { getRatingTarget } from '@/lib/dartslive-rating';

interface FlightProgressCardProps {
  rating: number;
  flight: string;
  stats01Avg: number;
  statsCriAvg: number;
  statsPraBest: number | null;
  dBullMonthly: number;
  hatTricksMonthly: number;
  prevDBullMonthly: number | null;
  prevHatTricksMonthly: number | null;
  prevStatsPraBest: number | null;
}

function DiffChip({ current, prev }: { current: number; prev: number | null }) {
  if (prev == null) return null;
  const diff = current - prev;
  if (diff === 0) return null;
  const isUp = diff > 0;
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        ml: 0.5,
        fontSize: '0.7rem',
        color: isUp ? 'success.main' : 'error.main',
      }}
    >
      {isUp ? (
        <ArrowUpwardIcon sx={{ fontSize: 12 }} />
      ) : (
        <ArrowDownwardIcon sx={{ fontSize: 12 }} />
      )}
      {Math.abs(diff)}
    </Box>
  );
}

export default function FlightProgressCard({
  rating,
  flight,
  stats01Avg,
  statsCriAvg,
  statsPraBest,
  dBullMonthly,
  hatTricksMonthly,
  prevDBullMonthly,
  prevHatTricksMonthly,
  prevStatsPraBest,
}: FlightProgressCardProps) {
  const target = getRatingTarget(stats01Avg, statsCriAvg);
  const fc = getFlightColor(flight);
  const progress = ((rating - Math.floor(rating)) / 1) * 100;
  const maxReached = target.ppd01Only.achieved && target.mprCriOnly.achieved;

  return (
    <Card sx={{ p: 2, mb: 4, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
      {/* フライト進捗 */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
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
            '& .MuiLinearProgress-bar': {
              borderRadius: 3,
              bgcolor: fc,
            },
          }}
        />
      )}

      {/* 目標スタッツ */}
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
                {target.ppdBalanced.achieved ? '達成' : <>+{target.ppdBalanced.gap.toFixed(2)}</>}
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                <Box component="span" sx={{ color: COLOR_CRICKET }}>
                  Cri
                </Box>{' '}
                {target.mprBalanced.achieved ? '達成' : <>+{target.mprBalanced.gap.toFixed(2)}</>}
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

      {/* 今月の実績 */}
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          justifyContent: 'space-around',
          pt: 1.5,
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            D-BULL
          </Typography>
          <Typography variant="body1" fontWeight="bold">
            {dBullMonthly}
            <DiffChip current={dBullMonthly} prev={prevDBullMonthly} />
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            HAT TRICK
          </Typography>
          <Typography variant="body1" fontWeight="bold">
            {hatTricksMonthly}
            <DiffChip current={hatTricksMonthly} prev={prevHatTricksMonthly} />
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            CU Best
          </Typography>
          <Typography variant="body1" fontWeight="bold">
            {statsPraBest ?? '--'}
            {statsPraBest != null && <DiffChip current={statsPraBest} prev={prevStatsPraBest} />}
          </Typography>
        </Box>
      </Box>
    </Card>
  );
}
