'use client';

import { Suspense, useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Container, CircularProgress, Box, Button } from '@mui/material';
import DartForm from '@/components/darts/DartForm';
import ProPaywall from '@/components/ProPaywall';
import type { Dart } from '@/types';
import {
  Timestamp,
  doc,
  getDoc,
  collection,
  query,
  where,
  getCountFromServer,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getSettingsLimit, SETTINGS_LIMIT_GENERAL } from '@/lib/permissions';

function NewDartContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const copyFromId = searchParams.get('copyFrom');
  const [copyData, setCopyData] = useState<Dart | null>(null);
  const [copyLoading, setCopyLoading] = useState(!!copyFromId);
  const [limitReached, setLimitReached] = useState(false);
  const [limitChecking, setLimitChecking] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // セッティング登録数の上限チェック
  useEffect(() => {
    if (!session?.user?.id) return;
    const limit = getSettingsLimit(session.user.role);
    if (limit === null) {
      setLimitChecking(false);
      return;
    }
    const checkLimit = async () => {
      try {
        const q = query(collection(db, 'darts'), where('userId', '==', session.user.id));
        const snapshot = await getCountFromServer(q);
        if (snapshot.data().count >= limit) {
          setLimitReached(true);
        }
      } catch {
        /* ignore */
      } finally {
        setLimitChecking(false);
      }
    };
    checkLimit();
  }, [session]);

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
        maxDiameter: searchParams.get('barrelMaxDiameter')
          ? Number(searchParams.get('barrelMaxDiameter'))
          : null,
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

  const draftImageUrl =
    searchParams.get('draft') === '1' ? searchParams.get('barrelImageUrl') : null;

  if (status === 'loading' || copyLoading || limitChecking) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }
  if (!session) return null;

  if (limitReached) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <ProPaywall
          title="セッティング登録数の上限に達しました"
          description={`無料プランではセッティングを最大${SETTINGS_LIMIT_GENERAL}件まで登録できます。PROプランにアップグレードすると無制限に登録できます。`}
        />
        <Box sx={{ textAlign: 'center' }}>
          <Button variant="outlined" size="small" onClick={() => router.push('/darts')}>
            セッティング一覧へ戻る
          </Button>
        </Box>
      </Container>
    );
  }

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
    <Suspense
      fallback={
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      }
    >
      <NewDartContent />
    </Suspense>
  );
}
