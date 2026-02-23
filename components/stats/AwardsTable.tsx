'use client';

import { useState } from 'react';
import {
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  Collapse,
  IconButton,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const AWARD_ORDER = [
  'D-BULL',
  'S-BULL',
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
  const [open, setOpen] = useState(false);

  const filteredAwards = AWARD_ORDER.filter((key) => awards[key]);

  // ブル合計
  const dBull = awards['D-BULL'];
  const sBull = awards['S-BULL'];
  const hasBullTotal = dBull && sBull;
  const bullTotal = hasBullTotal
    ? { monthly: dBull.monthly + sBull.monthly, total: dBull.total + sBull.total }
    : null;

  if (filteredAwards.length === 0) return null;

  return (
    <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
      <Box
        onClick={() => setOpen((v) => !v)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
          Award & Feats
        </Typography>
        <IconButton
          size="small"
          sx={{
            transition: 'transform 0.2s',
            transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
          }}
        >
          <ExpandMoreIcon sx={{ fontSize: 20 }} />
        </IconButton>
      </Box>
      <Collapse in={open}>
        <TableContainer sx={{ overflowX: 'auto', mt: 1 }}>
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
              {bullTotal && (
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>BULL 合計</TableCell>
                  <TableCell align="right">{bullTotal.monthly.toLocaleString()}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    {bullTotal.total.toLocaleString()}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Collapse>
    </Paper>
  );
}
