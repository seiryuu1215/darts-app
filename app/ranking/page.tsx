'use client';

import { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Button,
  CircularProgress,
  Chip,
  Alert,
} from '@mui/material';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useSession } from 'next-auth/react';

interface GroupMember {
  name: string;
  rating: number;
  ppd: number;
  mpr: number;
  cardImageUrl?: string;
}

interface GroupData {
  groupName: string;
  members: GroupMember[];
  updatedAt?: string;
}

type SortKey = 'rating' | 'ppd' | 'mpr';

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
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography color="text.secondary" textAlign="center">
          ログインが必要です
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <LeaderboardIcon color="primary" sx={{ fontSize: 32 }} />
        <Typography variant="h4">グループランキング</Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : !group || group.members.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            グループデータがありません
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            DARTSLIVEでグループに参加している場合、データを取得できます
          </Typography>
          <Button
            variant="contained"
            startIcon={refreshing ? <CircularProgress size={18} /> : <RefreshIcon />}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            グループデータを取得
          </Button>
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </Box>
      ) : (
        <>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
              flexWrap: 'wrap',
              gap: 1,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6">{group.groupName}</Typography>
              <Chip label={`${group.members.length}人`} size="small" />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ToggleButtonGroup
                value={sortBy}
                exclusive
                onChange={(_, v) => v && setSortBy(v)}
                size="small"
              >
                <ToggleButton value="rating">Rating</ToggleButton>
                <ToggleButton value="ppd">PPD</ToggleButton>
                <ToggleButton value="mpr">MPR</ToggleButton>
              </ToggleButtonGroup>
              <Button
                size="small"
                startIcon={refreshing ? <CircularProgress size={14} /> : <RefreshIcon />}
                onClick={handleRefresh}
                disabled={refreshing}
              >
                更新
              </Button>
            </Box>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TableContainer component={Card}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell width={40}>#</TableCell>
                  <TableCell>名前</TableCell>
                  <TableCell align="right" sx={{ fontWeight: sortBy === 'rating' ? 'bold' : 'normal' }}>
                    Rating
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: sortBy === 'ppd' ? 'bold' : 'normal' }}>
                    PPD
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: sortBy === 'mpr' ? 'bold' : 'normal' }}>
                    MPR
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedMembers.map((member, index) => (
                  <TableRow
                    key={member.name}
                    sx={{
                      bgcolor: index < 3 ? 'action.hover' : 'transparent',
                    }}
                  >
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: index < 3 ? 'bold' : 'normal',
                          color:
                            index === 0
                              ? '#FFD700'
                              : index === 1
                                ? '#C0C0C0'
                                : index === 2
                                  ? '#CD7F32'
                                  : 'inherit',
                        }}
                      >
                        {index + 1}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                        {member.name}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: sortBy === 'rating' ? 'bold' : 'normal' }}
                      >
                        {member.rating.toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: sortBy === 'ppd' ? 'bold' : 'normal' }}
                      >
                        {member.ppd.toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: sortBy === 'mpr' ? 'bold' : 'normal' }}
                      >
                        {member.mpr.toFixed(2)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {group.updatedAt && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
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
