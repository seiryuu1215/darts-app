'use client';

import { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  CircularProgress,
  Tabs,
  Tab,
  Alert,
} from '@mui/material';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import BarrelCard from '@/components/barrels/BarrelCard';
import DartCard from '@/components/darts/DartCard';
import type { BarrelProduct, Dart } from '@/types';

export default function BookmarksPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState(0);
  const [barrelBookmarks, setBarrelBookmarks] = useState<BarrelProduct[]>([]);
  const [dartBookmarks, setDartBookmarks] = useState<Dart[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

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
        // バレルブックマーク
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
        setBarrelBookmarks(barrels);

        // ダーツブックマーク
        const dartBmSnap = await getDocs(collection(db, 'users', session.user.id, 'bookmarks'));
        const dartPromises = dartBmSnap.docs.map(async (bmDoc) => {
          const dartId = bmDoc.data().dartId;
          const dartSnap = await getDoc(doc(db, 'darts', dartId));
          if (dartSnap.exists()) {
            return { id: dartSnap.id, ...dartSnap.data() } as Dart;
          }
          return null;
        });
        const darts = (await Promise.all(dartPromises)).filter(Boolean) as Dart[];
        setDartBookmarks(darts);
      } catch (err) {
        console.error('ブックマーク取得エラー:', err);
        setFetchError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchBookmarks();
  }, [session]);

  if (status === 'loading') return null;
  if (!session) return null;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>ブックマーク</Typography>

      {fetchError && <Alert severity="error" sx={{ mb: 2 }}>ブックマークの取得に失敗しました</Alert>}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label={`バレル (${barrelBookmarks.length})`} />
        <Tab label={`セッティング (${dartBookmarks.length})`} />
      </Tabs>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : tab === 0 ? (
        barrelBookmarks.length === 0 ? (
          <Typography color="text.secondary" textAlign="center" sx={{ py: 8 }}>
            ブックマークしたバレルはありません
          </Typography>
        ) : (
          <Grid container spacing={2}>
            {barrelBookmarks.map((barrel) => (
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={barrel.id}>
                <BarrelCard barrel={barrel} />
              </Grid>
            ))}
          </Grid>
        )
      ) : (
        dartBookmarks.length === 0 ? (
          <Typography color="text.secondary" textAlign="center" sx={{ py: 8 }}>
            ブックマークしたセッティングはありません
          </Typography>
        ) : (
          <Grid container spacing={3}>
            {dartBookmarks.map((dart) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={dart.id}>
                <DartCard dart={dart} />
              </Grid>
            ))}
          </Grid>
        )
      )}
    </Container>
  );
}
