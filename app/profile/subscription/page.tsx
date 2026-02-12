'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { isPro } from '@/lib/permissions';
import Link from 'next/link';
import { Suspense } from 'react';

interface SubInfo {
  subscriptionStatus: string | null;
  subscriptionCurrentPeriodEnd: string | null;
  subscriptionTrialEnd: string | null;
  subscriptionId: string | null;
}

function SubscriptionContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [subInfo, setSubInfo] = useState<SubInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const success = searchParams.get('success') === '1';

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (!session?.user?.id) return;
    const fetchSub = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', session.user.id));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setSubInfo({
            subscriptionStatus: data.subscriptionStatus || null,
            subscriptionCurrentPeriodEnd:
              data.subscriptionCurrentPeriodEnd?.toDate?.()?.toISOString() || null,
            subscriptionTrialEnd: data.subscriptionTrialEnd?.toDate?.()?.toISOString() || null,
            subscriptionId: data.subscriptionId || null,
          });
        }
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    };
    fetchSub();
  }, [session]);

  const handlePortal = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      /* ignore */
    } finally {
      setPortalLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const userIsPro = isPro(session?.user?.role);
  const isTrialing = subInfo?.subscriptionStatus === 'trialing';
  const isCanceled = subInfo?.subscriptionStatus === 'canceled';
  const isPastDue = subInfo?.subscriptionStatus === 'past_due';
  const isManualPro = userIsPro && !subInfo?.subscriptionId;

  const periodEnd = subInfo?.subscriptionCurrentPeriodEnd
    ? new Date(subInfo.subscriptionCurrentPeriodEnd)
    : null;
  const trialEnd = subInfo?.subscriptionTrialEnd ? new Date(subInfo.subscriptionTrialEnd) : null;

  const trialDaysLeft = trialEnd
    ? Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
    : 0;

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
        サブスクリプション
      </Typography>

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          PROプランへのアップグレードが完了しました！
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            現在のプラン
          </Typography>
          <Chip
            label={userIsPro ? 'PRO' : 'Free'}
            color={userIsPro ? 'primary' : 'default'}
            size="small"
          />
        </Box>

        {isManualPro && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            管理者によりPROプランが付与されています。
          </Typography>
        )}

        {isTrialing && trialEnd && (
          <Box sx={{ mb: 2 }}>
            <Chip
              label={`無料トライアル中（残り${trialDaysLeft}日）`}
              color="info"
              size="small"
              variant="outlined"
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              トライアル終了日: {trialEnd.toLocaleDateString('ja-JP')}
            </Typography>
          </Box>
        )}

        {subInfo?.subscriptionStatus === 'active' && !isTrialing && periodEnd && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            次回請求日: {periodEnd.toLocaleDateString('ja-JP')}
          </Typography>
        )}

        {isCanceled && periodEnd && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            解約済みです。PROアクセスは {periodEnd.toLocaleDateString('ja-JP')} まで利用できます。
          </Alert>
        )}

        {isPastDue && (
          <Alert severity="error" sx={{ mb: 2 }}>
            支払いに問題があります。お支払い方法をご確認ください。
          </Alert>
        )}

        {/* アクション */}
        {subInfo?.subscriptionId && (
          <Button
            variant="outlined"
            fullWidth
            onClick={handlePortal}
            disabled={portalLoading}
            startIcon={portalLoading ? <CircularProgress size={18} /> : null}
            sx={{ mb: 1 }}
          >
            サブスクリプション管理
          </Button>
        )}

        {!userIsPro && (
          <Button variant="contained" fullWidth component={Link} href="/pricing">
            PROプランにアップグレード
          </Button>
        )}
      </Paper>
    </Container>
  );
}

export default function SubscriptionPage() {
  return (
    <Suspense
      fallback={
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      }
    >
      <SubscriptionContent />
    </Suspense>
  );
}
