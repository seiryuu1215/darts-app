'use client';

import { Box, Typography, Divider, Rating, IconButton, Paper, Chip } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import EditIcon from '@mui/icons-material/Edit';
import SportsScoreIcon from '@mui/icons-material/SportsScore';
import AdjustIcon from '@mui/icons-material/Adjust';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
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
  dBull: number | null;
  sBull: number | null;
  bullRate: number | null;
  avg01: number | null;
  highOff: number | null;
  cricketHighScore: number | null;
  ton80: number;
  lowTon: number;
  highTon: number;
  hatTrick: number;
  threeInABed: number;
  threeInABlack: number;
  whiteHorse: number;
}

interface DayDetailPanelProps {
  records: DayRecord[];
}

const CONDITION_LABELS: Record<number, string> = {
  1: 'ひどい',
  2: 'いまいち',
  3: 'ふつう',
  4: 'いい感じ',
  5: '絶好調',
};

// 高難度アワード
const RARE_AWARDS = new Set(['TON80', '3 in the Black', 'ホワイトホース']);

interface AwardItem {
  label: string;
  count: number;
}

function StatBox({ label, value, unit }: { label: string; value: string | number; unit?: string }) {
  return (
    <Paper variant="outlined" sx={{ p: 1, textAlign: 'center' }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
        {label}
      </Typography>
      <Typography variant="body1" fontWeight={600}>
        {value}
        {unit && (
          <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.3 }}>
            {unit}
          </Typography>
        )}
      </Typography>
    </Paper>
  );
}

function SectionHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
      {icon}
      <Typography variant="subtitle2" fontWeight={700} sx={{ fontSize: '0.8rem' }}>
        {label}
      </Typography>
    </Box>
  );
}

export default function DayDetailPanel({ records }: DayDetailPanelProps) {
  const theme = useTheme();

  if (records.length === 0) return null;

  return (
    <Box>
      {records.map((record, idx) => {
        const totalBull =
          record.dBull != null || record.sBull != null
            ? (record.dBull ?? 0) + (record.sBull ?? 0)
            : null;

        const awards: AwardItem[] = [
          { label: 'ロートン', count: record.lowTon },
          { label: 'ハイトン', count: record.highTon },
          { label: 'TON80', count: record.ton80 },
          { label: 'ハットトリック', count: record.hatTrick },
          { label: '3 in a Bed', count: record.threeInABed },
          { label: '3 in the Black', count: record.threeInABlack },
          { label: 'ホワイトホース', count: record.whiteHorse },
        ];

        const hasAnyAward = awards.some((a) => a.count > 0);
        const has01Stats = record.ppd != null || record.avg01 != null || record.highOff != null;
        const hasCricketStats = record.mpr != null || record.cricketHighScore != null;
        const hasBullStats = record.dBull != null || record.sBull != null;

        return (
          <Box key={record.id}>
            {idx > 0 && <Divider sx={{ my: 2 }} />}

            {/* 編集ボタン */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 0.5 }}>
              <IconButton
                component={Link}
                href={`/stats/${record.id}/edit?from=calendar`}
                size="small"
                aria-label="編集"
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Box>

            {/* ヘッダー: Rating + コンディション */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 1.5,
              }}
            >
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Rating
                </Typography>
                <Typography variant="h5" fontWeight={700}>
                  {record.rating != null ? record.rating.toFixed(2) : '-'}
                </Typography>
              </Box>
              {record.condition != null && (
                <Box sx={{ textAlign: 'right' }}>
                  <Rating value={record.condition} readOnly size="small" />
                  <Typography variant="caption" color="text.secondary" display="block">
                    {CONDITION_LABELS[record.condition] ?? ''}
                  </Typography>
                </Box>
              )}
            </Box>

            {/* ゲーム概要 */}
            {record.gamesPlayed > 0 && (
              <Paper
                variant="outlined"
                sx={{
                  p: 1,
                  mb: 1.5,
                  textAlign: 'center',
                  bgcolor: alpha(theme.palette.primary.main, 0.04),
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  総ゲーム数
                </Typography>
                <Typography variant="h6" fontWeight={700}>
                  {record.gamesPlayed}
                </Typography>
              </Paper>
            )}

            {/* 01スタッツ */}
            {has01Stats && (
              <Box sx={{ mb: 1.5 }}>
                <SectionHeader
                  icon={<SportsScoreIcon sx={{ fontSize: 16, color: 'text.secondary' }} />}
                  label="01 スタッツ"
                />
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
                  {record.ppd != null && <StatBox label="PPD" value={record.ppd.toFixed(2)} />}
                  {record.avg01 != null && (
                    <StatBox label="平均スコア" value={record.avg01.toFixed(1)} />
                  )}
                  {record.highOff != null && <StatBox label="ハイオフ" value={record.highOff} />}
                </Box>
              </Box>
            )}

            {/* Cricketスタッツ */}
            {hasCricketStats && (
              <Box sx={{ mb: 1.5 }}>
                <SectionHeader
                  icon={<SportsScoreIcon sx={{ fontSize: 16, color: 'text.secondary' }} />}
                  label="Cricket スタッツ"
                />
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1 }}>
                  {record.mpr != null && <StatBox label="MPR" value={record.mpr.toFixed(2)} />}
                  {record.cricketHighScore != null && (
                    <StatBox label="ハイスコア" value={record.cricketHighScore} />
                  )}
                </Box>
              </Box>
            )}

            {/* ブルスタッツ */}
            {hasBullStats && (
              <Box sx={{ mb: 1.5 }}>
                <SectionHeader
                  icon={<AdjustIcon sx={{ fontSize: 16, color: 'text.secondary' }} />}
                  label="ブルスタッツ"
                />
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
                  {record.dBull != null && <StatBox label="D-BULL" value={record.dBull} />}
                  {record.sBull != null && <StatBox label="S-BULL" value={record.sBull} />}
                  {totalBull != null && <StatBox label="合計" value={totalBull} />}
                </Box>
                {record.bullRate != null && (
                  <Box sx={{ mt: 0.5 }}>
                    <StatBox label="ブル率" value={`${record.bullRate.toFixed(1)}%`} />
                  </Box>
                )}
              </Box>
            )}

            {/* アワード */}
            {hasAnyAward && (
              <Box sx={{ mb: 1.5 }}>
                <SectionHeader
                  icon={<EmojiEventsIcon sx={{ fontSize: 16, color: 'text.secondary' }} />}
                  label="アワード"
                />
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {awards.map((award) => {
                    const isRare = RARE_AWARDS.has(award.label);
                    const hasCount = award.count > 0;
                    return (
                      <Chip
                        key={award.label}
                        label={`${award.label} ×${award.count}`}
                        size="small"
                        variant={hasCount ? 'filled' : 'outlined'}
                        sx={{
                          fontSize: '0.7rem',
                          height: 26,
                          ...(hasCount && isRare
                            ? {
                                bgcolor: alpha(theme.palette.warning.main, 0.15),
                                color: theme.palette.warning.main,
                                fontWeight: 700,
                                borderColor: theme.palette.warning.main,
                                border: `1px solid ${alpha(theme.palette.warning.main, 0.4)}`,
                              }
                            : hasCount
                              ? {
                                  bgcolor: alpha(theme.palette.success.main, 0.1),
                                  color: theme.palette.success.main,
                                  fontWeight: 600,
                                }
                              : {
                                  opacity: 0.4,
                                }),
                        }}
                      />
                    );
                  })}
                </Box>
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
        );
      })}
    </Box>
  );
}
