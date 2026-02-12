'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Box, Typography, Paper, TextField, Button, Alert, CircularProgress } from '@mui/material';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function AdminPricingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isAdmin = session?.user?.role === 'admin';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [proMonthlyPriceYen, setProMonthlyPriceYen] = useState(500);
  const [proPromoPriceYen, setProPromoPriceYen] = useState(300);
  const [proStripePriceId, setProStripePriceId] = useState('');
  const [proPromoStripePriceId, setProPromoStripePriceId] = useState('');
  const [promoStartDate, setPromoStartDate] = useState('');
  const [promoEndDate, setPromoEndDate] = useState('');
  const [trialDays, setTrialDays] = useState(7);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || !isAdmin) {
      router.push('/');
      return;
    }

    const fetchPricing = async () => {
      try {
        const pricingDoc = await getDoc(doc(db, 'config', 'pricing'));
        if (pricingDoc.exists()) {
          const data = pricingDoc.data();
          if (data.proMonthlyPriceYen) setProMonthlyPriceYen(data.proMonthlyPriceYen);
          if (data.proPromoPriceYen) setProPromoPriceYen(data.proPromoPriceYen);
          if (data.proStripePriceId) setProStripePriceId(data.proStripePriceId);
          if (data.proPromoStripePriceId) setProPromoStripePriceId(data.proPromoStripePriceId);
          if (data.trialDays != null) setTrialDays(data.trialDays);
          if (data.promoStartDate?.toDate) {
            setPromoStartDate(data.promoStartDate.toDate().toISOString().slice(0, 16));
          }
          if (data.promoEndDate?.toDate) {
            setPromoEndDate(data.promoEndDate.toDate().toISOString().slice(0, 16));
          }
        }
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    };

    fetchPricing();
  }, [session, status, isAdmin, router]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/admin/update-pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proMonthlyPriceYen,
          proPromoPriceYen,
          proStripePriceId: proStripePriceId || undefined,
          proPromoStripePriceId: proPromoStripePriceId || undefined,
          promoStartDate: promoStartDate || null,
          promoEndDate: promoEndDate || null,
          trialDays,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || '保存に失敗しました');
        return;
      }
      setSuccess('設定を保存しました');
    } catch {
      setError('通信エラーが発生しました');
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAdmin) return null;

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: { xs: 2, sm: 4 }, px: { xs: 2, sm: 3 } }}>
      <Typography variant="h5" sx={{ mb: 3 }}>
        料金・プロモ設定
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
          基本価格
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <TextField
            label="PRO月額 (¥)"
            type="number"
            value={proMonthlyPriceYen}
            onChange={(e) => setProMonthlyPriceYen(Number(e.target.value))}
            size="small"
            fullWidth
          />
          <TextField
            label="プロモ価格 (¥)"
            type="number"
            value={proPromoPriceYen}
            onChange={(e) => setProPromoPriceYen(Number(e.target.value))}
            size="small"
            fullWidth
          />
        </Box>
        <TextField
          label="トライアル日数"
          type="number"
          value={trialDays}
          onChange={(e) => setTrialDays(Number(e.target.value))}
          size="small"
          fullWidth
          sx={{ mb: 3 }}
        />

        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
          Stripe Price ID
        </Typography>
        <TextField
          label="通常価格 Price ID"
          value={proStripePriceId}
          onChange={(e) => setProStripePriceId(e.target.value)}
          size="small"
          fullWidth
          sx={{ mb: 2 }}
          placeholder="price_..."
        />
        <TextField
          label="プロモ価格 Price ID"
          value={proPromoStripePriceId}
          onChange={(e) => setProPromoStripePriceId(e.target.value)}
          size="small"
          fullWidth
          sx={{ mb: 3 }}
          placeholder="price_..."
        />

        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
          プロモーション期間
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <TextField
            label="開始日時"
            type="datetime-local"
            value={promoStartDate}
            onChange={(e) => setPromoStartDate(e.target.value)}
            size="small"
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            label="終了日時"
            type="datetime-local"
            value={promoEndDate}
            onChange={(e) => setPromoEndDate(e.target.value)}
            size="small"
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Box>

        <Button
          variant="contained"
          fullWidth
          onClick={handleSave}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={18} color="inherit" /> : null}
        >
          保存
        </Button>
      </Paper>
    </Box>
  );
}
