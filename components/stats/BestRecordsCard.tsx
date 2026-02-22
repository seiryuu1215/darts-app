'use client';

import { Paper, Typography, Table, TableHead, TableBody, TableRow, TableCell } from '@mui/material';

interface BestRecord {
  gameId: string;
  gameName: string;
  bestScore: number;
  bestDate: string | null;
}

interface BestRecordsCardProps {
  records: BestRecord[];
}

export default function BestRecordsCard({ records }: BestRecordsCardProps) {
  if (!records || records.length === 0) return null;

  // 上位10件
  const displayed = records.slice(0, 10);

  return (
    <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
        ベスト記録
      </Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>ゲーム</TableCell>
            <TableCell align="right">ベストスコア</TableCell>
            <TableCell align="right">日付</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {displayed.map((r) => (
            <TableRow key={r.gameId}>
              <TableCell>
                <Typography variant="body2">{r.gameName || r.gameId}</Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  {r.bestScore}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="caption" color="text.secondary">
                  {r.bestDate ?? '--'}
                </Typography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
}
