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
import { collection, getDocs, query, where, documentId } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import BarrelCard from '@/components/barrels/BarrelCard';
import DartCard from '@/components/darts/DartCard';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
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
        // バレルブックマーク — バッチ取得（30件ずつチャンク）
        const barrelBmSnap = await getDocs(collection(db, 'users', session.user.id, 'barrelBookmarks'));
        const barrelIds = barrelBmSnap.docs.map((d) => d.data().barrelId).filter(Boolean);
        const barrels: BarrelProduct[] = [];
        for (let i = 0; i < barrelIds.length; i += 30) {
          const chunk = barrelIds.slice(i, i + 30);
          const q = query(collection(db, 'barrels'), where(documentId(), 'in', chunk));
          const snap = await getDocs(q);
          snap.docs.forEach((d) => barrels.push({ id: d.id, ...d.data() } as BarrelProduct));
        }
        setBarrelBookmarks(barrels);

        // ダーツブックマーク — バッチ取得（30件ずつチャンク）
        const dartBmSnap = await getDocs(collection(db, 'users', session.user.id, 'bookmarks'));
        const dartIds = dartBmSnap.docs.map((d) => d.data().dartId).filter(Boolean);
        const darts: Dart[] = [];
        for (let i = 0; i < dartIds.length; i += 30) {
          const chunk = dartIds.slice(i, i + 30);
          const q = query(collection(db, 'darts'), where(documentId(), 'in', chunk));
          const snap = await getDocs(q);
          snap.docs.forEach((d) => darts.push({ id: d.id, ...d.data() } as Dart));
        }
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
      <Breadcrumbs items={[{ label: 'ブックマーク' }]} />
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
                <BarrelCard barrel={barrel} isBookmarked={true} />
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
