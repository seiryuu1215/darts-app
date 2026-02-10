'use client';

import { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  CircularProgress,
  Button,
  Card,
  CardMedia,
  CardContent,
  Chip,
  Checkbox,
  Alert,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import BarrelCard from '@/components/barrels/BarrelCard';
import { recommendFromBarrels } from '@/lib/recommend-barrels';
import type { BarrelProduct } from '@/types';

export default function RecommendPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [bookmarkedBarrels, setBookmarkedBarrels] = useState<BarrelProduct[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<BarrelProduct[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (!session?.user?.id) return;
    const fetchBookmarks = async () => {
      setLoading(true);
      try {
        const barrelBmSnap = await getDocs(collection(db, 'users', session.user.id, 'barrelBookmarks'));
        const barrelPromises = barrelBmSnap.docs.map(async (bmDoc) => {
          const barrelId = bmDoc.data().barrelId;
          const barrelSnap = await getDoc(doc(db, 'barrels', barrelId));
          if (barrelSnap.exists()) {
            return { id: barrelSnap.id, ...barrelSnap.data() } as BarrelProduct;
          }
          return null;
        });
        const barrels = (await Promise.all(barrelPromises)).filter(Boolean) as BarrelProduct[];
        setBookmarkedBarrels(barrels);
      } catch (err) {
        console.error('ブックマーク取得エラー:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBookmarks();
  }, [session]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < 3) {
        next.add(id);
      }
      return next;
    });
  };

  const handleSearch = async () => {
    setSearching(true);
    try {
      const selectedBarrels = bookmarkedBarrels.filter((b) => b.id && selectedIds.has(b.id));
      const snapshot = await getDocs(collection(db, 'barrels'));
      const allBarrels = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as BarrelProduct[];
      const recommended = recommendFromBarrels(selectedBarrels, allBarrels, 30);
      setResults(recommended);
    } catch (err) {
      console.error('おすすめ検索エラー:', err);
    } finally {
      setSearching(false);
    }
  };

  if (status === 'loading') return null;
  if (!session) return null;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 1 }}>おすすめバレルを探す</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        ブックマークしたバレルから好みの3つを選んで、似たスペックのバレルを提案します。
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : bookmarkedBarrels.length === 0 ? (
        <Alert severity="info">
          ブックマークしたバレルがありません。まずバレル検索からお気に入りをブックマークしてください。
        </Alert>
      ) : (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Typography variant="h6">バレルを3つ選択</Typography>
            <Chip
              label={`${selectedIds.size} / 3`}
              color={selectedIds.size === 3 ? 'success' : 'default'}
              size="small"
            />
          </Box>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            {bookmarkedBarrels.map((barrel) => {
              const isSelected = barrel.id ? selectedIds.has(barrel.id) : false;
              return (
                <Grid size={{ xs: 6, sm: 4, md: 3 }} key={barrel.id}>
                  <Card
                    onClick={() => barrel.id && toggleSelect(barrel.id)}
                    sx={{
                      cursor: 'pointer',
                      border: 2,
                      borderColor: isSelected ? 'primary.main' : 'transparent',
                      opacity: !isSelected && selectedIds.size >= 3 ? 0.5 : 1,
                      transition: 'all 0.2s',
                      position: 'relative',
                    }}
                  >
                    <Checkbox
                      checked={isSelected}
                      sx={{ position: 'absolute', top: 4, right: 4, zIndex: 1 }}
                      size="small"
                    />
                    {barrel.imageUrl ? (
                      <CardMedia
                        component="img"
                        height="100"
                        image={barrel.imageUrl}
                        alt={barrel.name}
                        sx={{ objectFit: 'cover' }}
                      />
                    ) : (
                      <Box sx={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'action.hover' }}>
                        <Typography variant="caption" color="text.secondary">No Image</Typography>
                      </Box>
                    )}
                    <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                      <Typography variant="caption" noWrap display="block" fontWeight="bold">
                        {barrel.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap display="block">
                        {barrel.brand} / {barrel.weight}g
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>

          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<SearchIcon />}
              disabled={selectedIds.size !== 3 || searching}
              onClick={handleSearch}
            >
              {searching ? 'おすすめを検索中...' : 'おすすめを探す'}
            </Button>
          </Box>
        </>
      )}

      {results !== null && (
        <>
          <Typography variant="h6" sx={{ mb: 2 }}>おすすめバレル</Typography>
          {results.length === 0 ? (
            <Typography color="text.secondary" textAlign="center" sx={{ py: 4 }}>
              類似バレルが見つかりませんでした
            </Typography>
          ) : (
            <Grid container spacing={2}>
              {results.map((barrel) => (
                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={barrel.id}>
                  <BarrelCard barrel={barrel} />
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}
    </Container>
  );
}
