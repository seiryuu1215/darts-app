'use client';

import { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  ToggleButton,
  ToggleButtonGroup,
  Button,
  CircularProgress,
  Chip,
  Alert,
  Avatar,
} from '@mui/material';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import RefreshIcon from '@mui/icons-material/Refresh';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { useSession } from 'next-auth/react';

interface GroupMember {
  name: string;
  rating: number;
  ppd: number;
  mpr: number;
}

interface GroupData {
  groupName: string;
  members: GroupMember[];
  updatedAt?: string;
}

type SortKey = 'rating' | 'ppd' | 'mpr';

const MEDAL_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];
const MEDAL_LABELS = ['1st', '2nd', '3rd'];

function StatLabel({ label, value, active }: { label: string; value: string; active: boolean }) {
  return (
    <Box sx={{ textAlign: 'center', minWidth: 48 }}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: 'block', fontSize: '0.6rem', lineHeight: 1.2 }}
      >
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{ fontWeight: active ? 'bold' : 'normal', fontSize: '0.85rem' }}
      >
        {value}
      </Typography>
    </Box>
  );
}

export default function RankingPage() {
  const { data: session } = useSession();
  const [group, setGroup] = useState<GroupData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>('rating');
  const [error, setError] = useState('');

  const fetchGroup = async () => {
    try {
      const res = await fetch('/api/dartslive-group');
      if (res.ok) {
        const json = await res.json();
        setGroup(json.group);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.id) {
      fetchGroup();
    } else {
      setLoading(false);
    }
  }, [session]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setError('');
    try {
      const res = await fetch('/api/dartslive-group', { method: 'POST' });
      if (res.ok) {
        const json = await res.json();
        setGroup(json.group);
      } else {
        const json = await res.json();
        setError(json.error || 'エラーが発生しました');
      }
    } catch {
      setError('通信エラーが発生しました');
    } finally {
      setRefreshing(false);
    }
  };

  const sortedMembers = group?.members
    ? [...group.members].sort((a, b) => b[sortBy] - a[sortBy])
    : [];

  if (!session) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Typography color="text.secondary" textAlign="center">
          ログインが必要です
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <LeaderboardIcon color="primary" sx={{ fontSize: 28 }} />
        <Typography variant="h5" fontWeight="bold">
          ランキング
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : !group || group.members.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 6 }}>
          <CardContent>
            <EmojiEventsIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
              グループデータがありません
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              DARTSLIVEでグループに参加している場合、
              <br />
              データを取得できます
            </Typography>
            <Button
              variant="contained"
              startIcon={refreshing ? <CircularProgress size={18} /> : <RefreshIcon />}
              onClick={handleRefresh}
              disabled={refreshing}
              size="small"
            >
              グループデータを取得
            </Button>
            {error && (
              <Alert severity="error" sx={{ mt: 2, textAlign: 'left' }}>
                {error}
              </Alert>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 1.5,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography variant="subtitle1" fontWeight="bold">
                {group.groupName}
              </Typography>
              <Chip label={`${group.members.length}人`} size="small" sx={{ height: 20 }} />
            </Box>
            <Button
              size="small"
              startIcon={refreshing ? <CircularProgress size={14} /> : <RefreshIcon />}
              onClick={handleRefresh}
              disabled={refreshing}
              sx={{ minWidth: 0, px: 1 }}
            >
              更新
            </Button>
          </Box>

          <ToggleButtonGroup
            value={sortBy}
            exclusive
            onChange={(_, v) => v && setSortBy(v)}
            size="small"
            fullWidth
            sx={{ mb: 1.5 }}
          >
            <ToggleButton value="rating">Rating</ToggleButton>
            <ToggleButton value="ppd">PPD</ToggleButton>
            <ToggleButton value="mpr">MPR</ToggleButton>
          </ToggleButtonGroup>

          {error && (
            <Alert severity="error" sx={{ mb: 1.5 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {sortedMembers.map((member, index) => {
              const isTop3 = index < 3;
              const medalColor = isTop3 ? MEDAL_COLORS[index] : undefined;

              return (
                <Card
                  key={member.name}
                  sx={{
                    borderLeft: isTop3 ? 3 : 1,
                    borderLeftColor: medalColor || 'divider',
                    borderColor: 'divider',
                  }}
                >
                  <CardContent
                    sx={{
                      py: 1,
                      px: 1.5,
                      '&:last-child': { pb: 1 },
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                    }}
                  >
                    {/* 順位 */}
                    <Avatar
                      sx={{
                        width: 28,
                        height: 28,
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        bgcolor: medalColor || 'action.selected',
                        color: isTop3 ? '#fff' : 'text.secondary',
                      }}
                    >
                      {isTop3 ? MEDAL_LABELS[index] : index + 1}
                    </Avatar>

                    {/* 名前 */}
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: isTop3 ? 'bold' : 'medium',
                        flex: 1,
                        minWidth: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {member.name}
                    </Typography>

                    {/* スタッツ */}
                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                      <StatLabel
                        label="Rt"
                        value={member.rating.toFixed(2)}
                        active={sortBy === 'rating'}
                      />
                      <StatLabel
                        label="PPD"
                        value={member.ppd.toFixed(2)}
                        active={sortBy === 'ppd'}
                      />
                      <StatLabel
                        label="MPR"
                        value={member.mpr.toFixed(2)}
                        active={sortBy === 'mpr'}
                      />
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Box>

          {group.updatedAt && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: 'block' }}>
              最終更新:{' '}
              {new Date(group.updatedAt).toLocaleDateString('ja-JP', {
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Typography>
          )}
        </>
      )}
    </Container>
  );
}
