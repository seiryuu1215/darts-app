'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Container, CircularProgress, Box, Typography } from '@mui/material';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import DartForm from '@/components/darts/DartForm';
import type { Dart } from '@/types';

export default function EditDartPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const dartId = params.id as string;
  const [dart, setDart] = useState<Dart | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    const fetchDart = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'darts', dartId));
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() } as Dart;
          if (data.userId !== session?.user?.id) {
            router.push('/');
            return;
          }
          setDart(data);
        }
      } catch (err) {
        console.error('ダーツ取得エラー:', err);
      } finally {
        setLoading(false);
      }
    };

    if (status === 'authenticated') {
      fetchDart();
    }
  }, [dartId, session, status, router]);

  if (loading || status === 'loading') {
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
    <Container maxWidth="md">
      <DartForm initialData={dart} dartId={dartId} />
    </Container>
  );
}
