'use client';

import { useState, useMemo } from 'react';
import {
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Collapse,
  IconButton,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useTheme } from '@mui/material/styles';
import { RATING_BENCHMARKS, getRatingFromPpd } from '@/lib/dartslive-reference';

interface RatingBenchmarkCardProps {
  currentPpd?: number | null;
}

export default function RatingBenchmarkCard({ currentPpd }: RatingBenchmarkCardProps) {
  const [open, setOpen] = useState(false);
  const theme = useTheme();

  const FLIGHT_COLORS: Record<string, string> = {
    N: theme.palette.text.secondary,
    C: theme.palette.info.light,
    CC: '#ce93d8',
    B: '#f48fb1',
    BB: theme.palette.error.light,
    A: '#ffa726',
    AA: '#ffee58',
    SA: theme.palette.success.light,
  };
  const currentRating = useMemo(
    () => (currentPpd != null ? getRatingFromPpd(currentPpd) : null),
    [currentPpd],
  );

  return (
    <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
        }}
        onClick={() => setOpen(!open)}
      >
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            レーティング別ベンチマーク
          </Typography>
          <Typography variant="caption" color="text.secondary">
            DARTSLIVE公式データ — 1ラウンドごとの確率
          </Typography>
        </Box>
        <IconButton size="small">{open ? <ExpandLessIcon /> : <ExpandMoreIcon />}</IconButton>
      </Box>

      <Collapse in={open}>
        <TableContainer sx={{ mt: 1.5, maxHeight: 480 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{ fontWeight: 'bold', bgcolor: 'background.paper', fontSize: 11, px: 1 }}
                >
                  Rt
                </TableCell>
                <TableCell
                  sx={{ fontWeight: 'bold', bgcolor: 'background.paper', fontSize: 11, px: 1 }}
                >
                  フライト
                </TableCell>
                <TableCell
                  sx={{ fontWeight: 'bold', bgcolor: 'background.paper', fontSize: 11, px: 1 }}
                >
                  01 Stats
                </TableCell>
                <TableCell
                  sx={{ fontWeight: 'bold', bgcolor: 'background.paper', fontSize: 11, px: 1 }}
                >
                  ブル率
                </TableCell>
                <TableCell
                  sx={{ fontWeight: 'bold', bgcolor: 'background.paper', fontSize: 11, px: 1 }}
                >
                  ノーブル
                </TableCell>
                <TableCell
                  sx={{ fontWeight: 'bold', bgcolor: 'background.paper', fontSize: 11, px: 1 }}
                >
                  ワンブル
                </TableCell>
                <TableCell
                  sx={{ fontWeight: 'bold', bgcolor: 'background.paper', fontSize: 11, px: 1 }}
                >
                  ロートン
                </TableCell>
                <TableCell
                  sx={{ fontWeight: 'bold', bgcolor: 'background.paper', fontSize: 11, px: 1 }}
                >
                  ハット率
                </TableCell>
                <TableCell
                  sx={{ fontWeight: 'bold', bgcolor: 'background.paper', fontSize: 11, px: 1 }}
                >
                  レンジ
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {RATING_BENCHMARKS.map((b) => {
                const isCurrent = currentRating === b.rating;
                return (
                  <TableRow
                    key={b.rating}
                    sx={{
                      bgcolor: isCurrent ? 'rgba(255,152,0,0.15)' : 'transparent',
                      '& td': { borderColor: 'text.primary' },
                    }}
                  >
                    <TableCell
                      sx={{
                        fontWeight: isCurrent ? 'bold' : 'normal',
                        color: isCurrent ? 'warning.main' : 'divider',
                        fontSize: 12,
                        px: 1,
                      }}
                    >
                      {b.rating}
                    </TableCell>
                    <TableCell sx={{ px: 1 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 'bold',
                          color: FLIGHT_COLORS[b.flight] ?? theme.palette.divider,
                          fontSize: 11,
                        }}
                      >
                        {b.flight}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontSize: 11, px: 1 }}>
                      {b.ppdMin}~
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontSize: 11, px: 1 }}>
                      {b.bullRatePerThrow}%
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontSize: 11, px: 1 }}>
                      {b.noBullRate}%
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontSize: 11, px: 1 }}>
                      {b.oneBullRate}%
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontSize: 11, px: 1 }}>
                      {b.lowTonRate}%
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontSize: 11, px: 1 }}>
                      {b.hatTrickRate}%
                      <Typography
                        component="span"
                        variant="caption"
                        sx={{ color: 'text.secondary', fontSize: 9, ml: 0.3 }}
                      >
                        ({b.hatTrickFrequency})
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontSize: 11, px: 1 }}>
                      {b.avgRange}mm
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          出典: DARTSLIVE公式コラム (2024) / レンジデータ: dartslive.com/jp/news/127509/
        </Typography>
      </Collapse>
    </Paper>
  );
}
