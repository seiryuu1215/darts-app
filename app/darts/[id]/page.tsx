'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { CircularProgress, Box, Container, Typography } from '@mui/material';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import DartDetail from '@/components/darts/DartDetail';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import type { Dart } from '@/types';

export default function DartDetailPage() {
  const params = useParams();
  const dartId = params.id as string;
  const [dart, setDart] = useState<Dart | null>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Breadcrumbs
        items={[
          { label: 'セッティング', href: '/darts' },
          { label: dart.title },
        ]}
      />
      <DartDetail dart={dart} dartId={dartId} />
    </Container>
  );
}
