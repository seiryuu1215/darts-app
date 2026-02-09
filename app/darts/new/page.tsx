'use client';

import { Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { Container, CircularProgress, Box } from '@mui/material';
import DartForm from '@/components/darts/DartForm';
import type { Dart } from '@/types';
import { Timestamp } from 'firebase/firestore';

function NewDartContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // ドラフトモード: クエリパラメータからバレル情報をプリセット
  const draftData = useMemo(() => {
    if (searchParams.get('draft') !== '1') return undefined;
    return {
      userId: '',
      title: '',
      barrel: {
        name: searchParams.get('barrelName') || '',
        brand: searchParams.get('barrelBrand') || '',
        weight: Number(searchParams.get('barrelWeight')) || 0,
        maxDiameter: searchParams.get('barrelMaxDiameter') ? Number(searchParams.get('barrelMaxDiameter')) : null,
        length: searchParams.get('barrelLength') ? Number(searchParams.get('barrelLength')) : null,
        cut: searchParams.get('barrelCut') || '',
      },
      tip: { name: '', type: 'soft' as const, lengthMm: null, weightG: null },
      shaft: { name: '', lengthMm: null, weightG: null },
      flight: { name: '', shape: 'standard', weightG: null },
      imageUrls: [],
      description: '',
      likeCount: 0,
      isDraft: true,
      sourceBarrelId: searchParams.get('barrelId') || undefined,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    } satisfies Dart;
  }, [searchParams]);

  const draftImageUrl = searchParams.get('draft') === '1' ? searchParams.get('barrelImageUrl') : null;

  if (status === 'loading') return null;
  if (!session) return null;

  return (
    <Container maxWidth="md">
      <DartForm
        initialData={draftData}
        isDraft={!!draftData}
        draftBarrelImageUrl={draftImageUrl || undefined}
      />
    </Container>
  );
}

export default function NewDartPage() {
  return (
    <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>}>
      <NewDartContent />
    </Suspense>
  );
}
