'use client';

import { Box, Card, Typography, Button } from '@mui/material';
import BarChartIcon from '@mui/icons-material/BarChart';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import Link from 'next/link';
import { getFlightColor, COLOR_01, COLOR_CRICKET, COLOR_COUNTUP } from '@/lib/dartslive-colors';

interface DartsliveCache {
  rating: number | null;
  flight: string;
  cardName: string;
  stats01Avg: number | null;
  statsCriAvg: number | null;
  statsPraAvg: number | null;
  prevRating: number | null;
  prevStats01Avg: number | null;
  prevStatsCriAvg: number | null;
  prevStatsPraAvg: number | null;
}

interface CompactStatsCardProps {
  dlCache: DartsliveCache;
}

function DiffArrow({ current, prev }: { current: number | null; prev: number | null }) {
  if (current == null || prev == null) return null;
  const diff = current - prev;
  if (diff === 0) return null;

  const isUp = diff > 0;
  return isUp ? (
    <ArrowUpwardIcon sx={{ fontSize: 14, color: 'success.main' }} />
  ) : (
    <ArrowDownwardIcon sx={{ fontSize: 14, color: 'error.main' }} />
  );
}

export default function CompactStatsCard({ dlCache }: CompactStatsCardProps) {
  const fc = getFlightColor(dlCache.flight);

  const items = [
    {
      label: 'Rt',
      sub: dlCache.flight,
      value: dlCache.rating?.toFixed(2) ?? '--',
      color: fc,
      current: dlCache.rating,
      prev: dlCache.prevRating,
    },
    {
      label: '01',
      value: dlCache.stats01Avg?.toFixed(2) ?? '--',
      color: COLOR_01,
      current: dlCache.stats01Avg,
      prev: dlCache.prevStats01Avg,
    },
    {
      label: 'Cricket',
      value: dlCache.statsCriAvg?.toFixed(2) ?? '--',
      color: COLOR_CRICKET,
      current: dlCache.statsCriAvg,
      prev: dlCache.prevStatsCriAvg,
    },
    {
      label: 'CU',
      value: dlCache.statsPraAvg?.toFixed(0) ?? '--',
      color: COLOR_COUNTUP,
      current: dlCache.statsPraAvg,
      prev: dlCache.prevStatsPraAvg,
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
      <Card
        component={Link}
        href="/stats"
        sx={{ textDecoration: 'none', borderRadius: 2, overflow: 'hidden' }}
      >
        <Box sx={{ display: 'flex' }}>
          {items.map((item) => (
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
                sx={{
                  color: item.color,
                  fontWeight: 'bold',
                  display: 'block',
                  lineHeight: 1.2,
                }}
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
      </Card>
    </Box>
  );
}
