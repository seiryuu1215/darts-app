'use client';

import {
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';

const AWARD_ORDER = [
  'LOW TON',
  'HIGH TON',
  'HAT TRICK',
  'TON 80',
  '3 IN A BED',
  '3 - BLACK',
  'WHITE HRS',
  '9 COUNT',
  '8 COUNT',
  '7 COUNT',
  '6 COUNT',
  '5 COUNT',
];

interface AwardsTableProps {
  awards: Record<string, { monthly: number; total: number }>;
}

export default function AwardsTable({ awards }: AwardsTableProps) {
  // ブル以外のアワードを表示（ブルは BullStatsCard で表示）
  const filteredAwards = AWARD_ORDER.filter((key) => awards[key]);

  if (filteredAwards.length === 0) return null;

  return (
    <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
        Award & Feats
      </Typography>
      <TableContainer sx={{ overflowX: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Award</TableCell>
              <TableCell align="right">今月</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                累計
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAwards.map((key) => (
              <TableRow key={key}>
                <TableCell>{key}</TableCell>
                <TableCell align="right">{awards[key].monthly.toLocaleString()}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                  {awards[key].total.toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
