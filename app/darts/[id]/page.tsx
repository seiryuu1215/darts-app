'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { CircularProgress, Box, Container, Typography } from '@mui/material';
import { doc, getDoc, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import DartDetail from '@/components/darts/DartDetail';
import TwoColumnLayout from '@/components/layout/TwoColumnLayout';
import Sidebar from '@/components/layout/Sidebar';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import type { Dart, BarrelProduct } from '@/types';
import { scoreBarrel, type UserPreference } from '@/lib/recommend-barrels';

export default function DartDetailPage() {
  const params = useParams();
  const dartId = params.id as string;
  const [dart, setDart] = useState<Dart | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedBarrels, setRelatedBarrels] = useState<BarrelProduct[]>([]);

  useEffect(() => {
    const fetchDart = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'darts', dartId));
        if (docSnap.exists()) {
          setDart({ id: docSnap.id, ...docSnap.data() } as Dart);
        }
      } catch (err) {
        console.error('ダーツ取得エラー:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDart();
  }, [dartId]);

  // 関連バレル取得
  useEffect(() => {
    if (!dart) return;
    const fetchRelated = async () => {
      try {
        const snap = await getDocs(
          query(collection(db, 'barrels'), orderBy('scrapedAt', 'desc'), limit(200)),
        );
        const barrels = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as BarrelProduct);
        const pref: UserPreference = {
          avgWeight: dart.barrel.weight,
          avgDiameter: dart.barrel.maxDiameter ?? 7.0,
          avgLength: dart.barrel.length ?? 45,
          favoriteCuts: dart.barrel.cut ? dart.barrel.cut.split(/[,+＋]/).map((c) => c.trim()).filter(Boolean) : [],
          favoriteBrands: [dart.barrel.brand],
          ownedBarrelNames: [dart.barrel.name],
          keywords: [],
          weightOffset: 0,
          diameterOffset: 0,
          lengthOffset: 0,
        };
        const scored = barrels
          .filter((b) => b.name !== dart.barrel.name)
          .map((b) => ({ barrel: b, score: scoreBarrel(b, pref) }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 5)
          .map((s) => s.barrel);
        setRelatedBarrels(scored);
      } catch {
        // ignore
      }
    };
    fetchRelated();
  }, [dart]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!dart) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography textAlign="center" color="text.secondary">
          ダーツが見つかりませんでした
        </Typography>
      </Container>
    );
  }

  const sidebar = (
    <Sidebar
      showPopularBarrels
      showRecentArticles
      showShopBanners
      relatedBarrels={relatedBarrels}
    />
  );

  return (
    <TwoColumnLayout sidebar={sidebar}>
      <Breadcrumbs
        items={[
          { label: 'セッティング', href: '/darts' },
          { label: dart.title },
        ]}
      />
      <DartDetail dart={dart} dartId={dartId} />
    </TwoColumnLayout>
  );
}
