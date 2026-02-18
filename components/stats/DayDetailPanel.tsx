'use client';

import { Box, Typography, Paper, Divider, Rating, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import Link from 'next/link';

interface DayRecord {
  id: string;
  date: string;
  rating: number | null;
  ppd: number | null;
  mpr: number | null;
  gamesPlayed: number;
  condition: number | null;
  memo: string;
  challenge: string;
}

interface DayDetailPanelProps {
  date: string;
  records: DayRecord[];
}

const CONDITION_LABELS: Record<number, string> = {
  1: 'ひどい',
  2: 'いまいち',
  3: 'ふつう',
  4: 'いい感じ',
  5: '絶好調',
};

const DAY_NAMES = ['日', '月', '火', '水', '木', '金', '土'];

function formatDateHeader(dateStr: string): string {
  const [, monthStr, dayStr] = dateStr.split('-');
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);
  const d = new Date(dateStr + 'T12:00:00');
  const dow = DAY_NAMES[d.getDay()];
  return `${month}月${day}日（${dow}）`;
}

export default function DayDetailPanel({ date, records }: DayDetailPanelProps) {
  if (records.length === 0) return null;

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="subtitle1" fontWeight={700} gutterBottom>
        {formatDateHeader(date)}
      </Typography>

      {records.map((record, idx) => (
        <Box key={record.id}>
          {idx > 0 && <Divider sx={{ my: 2 }} />}

          {/* 編集ボタン */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
            <IconButton
              component={Link}
              href={`/stats/${record.id}/edit?from=calendar`}
              size="small"
              aria-label="編集"
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* スタッツ行 */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, mb: 1.5 }}>
            <Paper
              variant="outlined"
              sx={{ p: 1, textAlign: 'center' }}
            >
              <Typography variant="caption" color="text.secondary">
                Rating
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                {record.rating != null ? record.rating.toFixed(2) : '-'}
              </Typography>
            </Paper>
            <Paper
              variant="outlined"
              sx={{ p: 1, textAlign: 'center' }}
            >
              <Typography variant="caption" color="text.secondary">
                PPD
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                {record.ppd != null ? record.ppd.toFixed(2) : '-'}
              </Typography>
            </Paper>
            <Paper
              variant="outlined"
              sx={{ p: 1, textAlign: 'center' }}
            >
              <Typography variant="caption" color="text.secondary">
                MPR
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                {record.mpr != null ? record.mpr.toFixed(2) : '-'}
              </Typography>
            </Paper>
          </Box>

          {/* コンディション */}
          {record.condition != null && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Rating value={record.condition} readOnly size="small" />
              <Typography variant="body2" color="text.secondary">
                {CONDITION_LABELS[record.condition] ?? ''}
              </Typography>
            </Box>
          )}

          {/* メモ */}
          {record.memo && (
            <Box sx={{ mb: 1 }}>
              <Typography variant="caption" color="text.secondary">
                メモ
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {record.memo}
              </Typography>
            </Box>
          )}

          {/* 課題 */}
          {record.challenge && (
            <Box>
              <Typography variant="caption" color="text.secondary">
                課題
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {record.challenge}
              </Typography>
            </Box>
          )}
        </Box>
      ))}
    </Paper>
  );
}
