'use client';

import {
  Paper,
  Box,
  Typography,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import StarIcon from '@mui/icons-material/Star';

interface StatsHistorySummary {
  avgRating: number | null;
  avgPpd: number | null;
  avgMpr: number | null;
  avgCondition: number | null;
  totalGames: number;
  playDays: number;
  ratingChange: number | null;
  bestRating: number | null;
  bestPpd: number | null;
  bestMpr: number | null;
  streak: number;
}

interface StatsHistoryRecord {
  id: string;
  date: string;
  rating: number | null;
  ppd: number | null;
  mpr: number | null;
  gamesPlayed: number;
  condition: number | null;
  memo: string;
}

interface PeriodStatsPanelProps {
  periodTab: 'today' | 'week' | 'month' | 'all';
  onPeriodChange: (v: 'today' | 'week' | 'month' | 'all') => void;
  loading: boolean;
  summary: StatsHistorySummary | null;
  records: StatsHistoryRecord[];
}

export default function PeriodStatsPanel({
  periodTab,
  onPeriodChange,
  loading,
  summary,
  records,
}: PeriodStatsPanelProps) {
  return (
    <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
      <Tabs
        value={periodTab}
        onChange={(_, v) => onPeriodChange(v)}
        variant="fullWidth"
        sx={{
          minHeight: 36,
          mb: 1.5,
          '& .MuiTab-root': { minHeight: 36, py: 0.5, fontSize: '0.8rem' },
        }}
      >
        <Tab label="今日" value="today" />
        <Tab label="今週" value="week" />
        <Tab label="今月" value="month" />
        <Tab label="累計" value="all" />
      </Tabs>

      {loading ? (
        <Box sx={{ textAlign: 'center', py: 3 }}>
          <CircularProgress size={24} />
        </Box>
      ) : summary && (records.length > 0 || periodTab === 'all') ? (
        <>
          {/* サマリー */}
          <Box sx={{ display: 'flex', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
            <Paper variant="outlined" sx={{ flex: 1, minWidth: 80, p: 1, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                Avg Rt
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                {summary.avgRating?.toFixed(2) ?? '--'}
              </Typography>
              {summary.ratingChange != null && (
                <Typography
                  variant="caption"
                  sx={{
                    color: summary.ratingChange >= 0 ? '#4caf50' : '#f44336',
                    fontWeight: 'bold',
                  }}
                >
                  {summary.ratingChange >= 0 ? '+' : ''}
                  {summary.ratingChange.toFixed(2)}
                </Typography>
              )}
            </Paper>
            <Paper variant="outlined" sx={{ flex: 1, minWidth: 80, p: 1, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                Avg PPD
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                {summary.avgPpd?.toFixed(2) ?? '--'}
              </Typography>
            </Paper>
            <Paper variant="outlined" sx={{ flex: 1, minWidth: 80, p: 1, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                Avg MPR
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                {summary.avgMpr?.toFixed(2) ?? '--'}
              </Typography>
            </Paper>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
            <Paper variant="outlined" sx={{ flex: 1, minWidth: 80, p: 1, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                ゲーム数
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                {summary.totalGames}
              </Typography>
            </Paper>
            <Paper variant="outlined" sx={{ flex: 1, minWidth: 80, p: 1, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                プレイ日数
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                {summary.playDays}
              </Typography>
            </Paper>
            {summary.avgCondition != null && (
              <Paper variant="outlined" sx={{ flex: 1, minWidth: 80, p: 1, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  コンディション
                </Typography>
                <Box
                  sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.3 }}
                >
                  <StarIcon sx={{ fontSize: 16, color: '#ffc107' }} />
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {summary.avgCondition.toFixed(1)}
                  </Typography>
                </Box>
              </Paper>
            )}
          </Box>

          {/* 自己ベスト（累計のみ） */}
          {periodTab === 'all' &&
            (summary.bestRating != null || summary.bestPpd != null || summary.bestMpr != null) && (
              <Paper variant="outlined" sx={{ p: 1.5, mb: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                  <EmojiEventsIcon sx={{ fontSize: 18, color: '#ffc107' }} />
                  <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                    自己ベスト（記録内）
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  {summary.bestRating != null && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Rating
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {summary.bestRating.toFixed(2)}
                      </Typography>
                    </Box>
                  )}
                  {summary.bestPpd != null && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        PPD
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {summary.bestPpd.toFixed(2)}
                      </Typography>
                    </Box>
                  )}
                  {summary.bestMpr != null && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        MPR
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {summary.bestMpr.toFixed(2)}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Paper>
            )}

          {/* レコード一覧 */}
          {records.length > 0 && (
            <TableContainer sx={{ maxHeight: 300 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>日付</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>
                      Rt
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>
                      PPD
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>
                      MPR
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>
                      調子
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {records
                    .slice()
                    .reverse()
                    .map((r) => (
                      <TableRow key={r.id}>
                        <TableCell sx={{ fontSize: '0.75rem' }}>
                          {r.date
                            ? new Date(r.date).toLocaleDateString('ja-JP', {
                                month: 'numeric',
                                day: 'numeric',
                              })
                            : '--'}
                        </TableCell>
                        <TableCell align="right" sx={{ fontSize: '0.75rem' }}>
                          {r.rating?.toFixed(2) ?? '--'}
                        </TableCell>
                        <TableCell align="right" sx={{ fontSize: '0.75rem' }}>
                          {r.ppd?.toFixed(2) ?? '--'}
                        </TableCell>
                        <TableCell align="right" sx={{ fontSize: '0.75rem' }}>
                          {r.mpr?.toFixed(2) ?? '--'}
                        </TableCell>
                        <TableCell align="center" sx={{ fontSize: '0.75rem' }}>
                          {r.condition ? `${'★'.repeat(r.condition)}` : '--'}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
          この期間のデータはありません
        </Typography>
      )}
    </Paper>
  );
}
