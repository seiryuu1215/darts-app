'use client';

import { Suspense, useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Container, CircularProgress, Box } from '@mui/material';
import DartForm from '@/components/darts/DartForm';
import type { Dart } from '@/types';
import { Timestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

function NewDartContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const copyFromId = searchParams.get('copyFrom');
  const [copyData, setCopyData] = useState<Dart | null>(null);
  const [copyLoading, setCopyLoading] = useState(!!copyFromId);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // コピー元のダーツデータを取得
  useEffect(() => {
    if (!copyFromId) return;
    const fetchCopySource = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'darts', copyFromId));
        if (docSnap.exists()) {
          const data = docSnap.data() as Dart;
          setCopyData({
            ...data,
            title: `${data.title}（コピー）`,
            imageUrls: [],
          });
        }
      } catch {
        // コピー元が見つからない場合は空フォームで開く
      } finally {
        setCopyLoading(false);
      }
    };
    fetchCopySource();
  }, [copyFromId]);

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

  if (status === 'loading' || copyLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }
  if (!session) return null;

  const initialData = copyData || draftData;

  return (
    <Container maxWidth="md">
      <DartForm
        initialData={initialData}
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
