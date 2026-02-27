'use client';

import { Suspense, useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Container,
  Grid,
  Typography,
  Box,
  TextField,
  Paper,
  CircularProgress,
  Chip,
  Card,
  CardActionArea,
  CardMedia,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  InputAdornment,
  Button,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import { collection, getDocs } from 'firebase/firestore';
import { useSession } from 'next-auth/react';
import { db } from '@/lib/firebase';
import type { BarrelProduct } from '@/types';
import BarrelSimulator from '@/components/barrels/BarrelSimulator';
import AffiliateButton from '@/components/affiliate/AffiliateButton';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import { getBarrelImageUrl } from '@/lib/image-proxy';

const MAX_BARRELS = 2;

export default function SimulatorPage() {
  return (
    <Suspense
      fallback={
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      }
    >
      <SimulatorContent />
    </Suspense>
  );
}

function SimulatorContent() {
  const searchParams = useSearchParams();
  const initialBarrel = searchParams.get('barrel') ?? '';
  const { data: session } = useSession();

  const [allBarrels, setAllBarrels] = useState<BarrelProduct[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(initialBarrel);
  const [selected, setSelected] = useState<BarrelProduct[]>([]);

  // Fetch barrels
  useEffect(() => {
    getDocs(collection(db, 'barrels'))
      .then((snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as BarrelProduct);
        // Filter out barrels without images (contour extraction requires image)
        const withImages = data.filter((b) => b.imageUrl);
        setAllBarrels(withImages);

        if (initialBarrel) {
          const found = withImages.find((b) => b.name.includes(initialBarrel));
          if (found) setSelected([found]);
        }
      })
      .finally(() => setLoading(false));
  }, [initialBarrel]);

  // Fetch user's barrel bookmarks
  useEffect(() => {
    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (!userId) return;
    getDocs(collection(db, 'users', userId, 'barrelBookmarks'))
      .then((snap) => {
        const ids = new Set(snap.docs.map((d) => d.data().barrelId as string));
        setBookmarkedIds(ids);
      })
      .catch(() => {});
  }, [session]);

  const filtered = useMemo(() => {
    let list = allBarrels;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (b) => b.name.toLowerCase().includes(q) || b.brand.toLowerCase().includes(q),
      );
    }

    // Sort: bookmarked first, then alphabetical
    list = [...list].sort((a, b) => {
      const aBookmarked = bookmarkedIds.has(a.id ?? '');
      const bBookmarked = bookmarkedIds.has(b.id ?? '');
      if (aBookmarked && !bBookmarked) return -1;
      if (!aBookmarked && bBookmarked) return 1;
      return 0;
    });

    return list.slice(0, 30);
  }, [allBarrels, searchQuery, bookmarkedIds]);

  const toggleSelect = (barrel: BarrelProduct) => {
    setSelected((prev) => {
      const exists = prev.find((b) => b.id === barrel.id);
      if (exists) return prev.filter((b) => b.id !== barrel.id);
      if (prev.length >= MAX_BARRELS) return prev;
      return [...prev, barrel];
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Breadcrumbs
        items={[{ label: 'バレル検索', href: '/barrels' }, { label: 'シミュレーター' }]}
      />

      <Typography variant="h4" gutterBottom>
        バレルシミュレーター
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        バレルの形状を可視化して比較できます。最大{MAX_BARRELS}本まで選択可能です。
      </Typography>

      {/* シミュレーター表示 */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <BarrelSimulator barrels={selected} />
      </Paper>

      {/* 選択中バレルのスペック比較テーブル */}
      {selected.length > 0 && (
        <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>バレル</TableCell>
                <TableCell align="right">重量</TableCell>
                <TableCell align="right">最大径</TableCell>
                <TableCell align="right">全長</TableCell>
                <TableCell>カット</TableCell>
                <TableCell align="center">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {selected.map((b, i) => (
                <TableRow key={b.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          bgcolor: ['#1976d2', '#dc004e'][i],
                        }}
                      />
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {b.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {b.brand}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell align="right">{b.weight}g</TableCell>
                  <TableCell align="right">{b.maxDiameter ? `${b.maxDiameter}mm` : '-'}</TableCell>
                  <TableCell align="right">{b.length ? `${b.length}mm` : '-'}</TableCell>
                  <TableCell>{b.cut || '-'}</TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                      <AffiliateButton barrel={b} size="small" />
                      <Button
                        size="small"
                        color="error"
                        onClick={() => toggleSelect(b)}
                        startIcon={<DeleteIcon />}
                      >
                        削除
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* バレル選択エリア */}
      <Typography variant="h6" gutterBottom>
        バレルを選択（{selected.length}/{MAX_BARRELS}）
      </Typography>

      <TextField
        fullWidth
        size="small"
        placeholder="バレル名・ブランドで検索..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{ mb: 2 }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          },
        }}
      />

      <Grid container spacing={1.5}>
        {filtered.map((barrel) => {
          const isSelected = selected.some((b) => b.id === barrel.id);
          const isDisabled = !isSelected && selected.length >= MAX_BARRELS;
          const isBookmarked = bookmarkedIds.has(barrel.id ?? '');
          return (
            <Grid key={barrel.id} size={{ xs: 6, sm: 4, md: 3 }}>
              <Card
                sx={{
                  opacity: isDisabled ? 0.5 : 1,
                  border: isSelected ? '2px solid' : '2px solid transparent',
                  borderColor: isSelected ? 'primary.main' : 'transparent',
                  position: 'relative',
                }}
              >
                <CardActionArea
                  onClick={() => !isDisabled && toggleSelect(barrel)}
                  disabled={isDisabled}
                >
                  {barrel.imageUrl ? (
                    <CardMedia
                      component="img"
                      height="100"
                      image={getBarrelImageUrl(barrel.imageUrl) ?? ''}
                      alt={barrel.name}
                      sx={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <Box
                      sx={{
                        height: 100,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: 'action.hover',
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        No Image
                      </Typography>
                    </Box>
                  )}
                  <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                    <Typography variant="caption" fontWeight="bold" noWrap display="block">
                      {barrel.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap display="block">
                      {barrel.brand} / {barrel.weight}g
                    </Typography>
                    {isSelected && (
                      <Chip
                        label="選択中"
                        size="small"
                        color="primary"
                        sx={{ mt: 0.5, height: 20 }}
                      />
                    )}
                  </CardContent>
                </CardActionArea>
                {isBookmarked && (
                  <BookmarkIcon
                    sx={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      fontSize: 20,
                      color: 'warning.main',
                      filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))',
                    }}
                  />
                )}
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Container>
  );
}
