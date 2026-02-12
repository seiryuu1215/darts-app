'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import { isPro } from '@/lib/permissions';
import { Suspense } from 'react';

interface PricingInfo {
  price: number;
  promoPrice: number;
  isPromo: boolean;
  trialDays: number;
}

const FEATURES = [
  { label: 'セッティング登録', free: '1件', pro: '無制限' },
  { label: 'DARTSLIVE連携', free: false, pro: true },
  { label: '記事投稿', free: false, pro: true },
  { label: 'バレル診断 詳細レポート', free: 'マッチ度のみ', pro: '詳細分析' },
  { label: 'スタッツ履歴', free: '30日間', pro: '無制限' },
  { label: 'CSV出力', free: false, pro: true },
];

const FAQ = [
  {
    q: '無料トライアル中に課金されますか？',
    a: 'いいえ。トライアル期間中は一切課金されません。期間終了前にいつでも解約可能です。',
  },
  {
    q: '解約はいつでもできますか？',
    a: 'はい。サブスクリプション管理ページからいつでも解約できます。解約後も現在の請求期間終了まではPRO機能をご利用いただけます。',
  },
  {
    q: '支払い方法は何が使えますか？',
    a: 'クレジットカード（Visa, Mastercard, JCB, American Express）に対応しています。決済はStripeを通じて安全に処理されます。',
  },
  {
    q: '解約後、登録済みのセッティングはどうなりますか？',
    a: '解約後もデータは保持されます。ただし、無料プランの上限（1件）を超えるセッティングは閲覧のみとなり、新規登録ができなくなります。',
  },
  {
    q: 'DARTSLIVE連携とは何ですか？',
    a: 'DARTSLIVEアカウントのスタッツ（Rating、PPD、MPR等）を自動取得し、推移グラフで可視化する機能です。LINE連携で毎日の自動通知も可能です。',
  },
];

function PricingContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [pricing, setPricing] = useState<PricingInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const userIsPro = isPro(session?.user?.role);
  const canceled = searchParams.get('canceled') === '1';

  useEffect(() => {
    fetch('/api/pricing')
      .then((res) => res.json())
      .then(setPricing)
      .catch(() => setPricing({ price: 500, promoPrice: 300, isPromo: false, trialDays: 7 }));
  }, []);

  const handleSubscribe = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'エラーが発生しました');
        return;
      }
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setError('通信エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const displayPrice = pricing?.isPromo ? pricing.promoPrice : (pricing?.price ?? 500);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold', textAlign: 'center', mb: 1 }}>
        料金プラン
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', mb: 4 }}>
        PROプランでダーツライフをもっと充実させよう
      </Typography>

      {canceled && (
        <Alert severity="info" sx={{ mb: 3 }}>
          チェックアウトがキャンセルされました。いつでもお申し込みいただけます。
        </Alert>
      )}

      {/* 価格カード */}
      <Box
        sx={{
          display: 'flex',
          gap: 3,
          mb: 4,
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'center',
        }}
      >
        {/* Free */}
        <Paper variant="outlined" sx={{ flex: 1, maxWidth: 340, p: 3, textAlign: 'center' }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Free
          </Typography>
          <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
            ¥0
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            基本機能を無料で
          </Typography>
          {!session ? (
            <Button variant="outlined" fullWidth href="/register">
              無料で始める
            </Button>
          ) : !userIsPro ? (
            <Button variant="outlined" fullWidth disabled>
              現在のプラン
            </Button>
          ) : null}
        </Paper>

        {/* PRO */}
        <Paper
          sx={{
            flex: 1,
            maxWidth: 340,
            p: 3,
            textAlign: 'center',
            border: '2px solid',
            borderColor: 'primary.main',
            position: 'relative',
          }}
        >
          <Chip
            label="おすすめ"
            color="primary"
            size="small"
            sx={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)' }}
          />
          <Typography variant="h6" sx={{ mb: 1 }}>
            PRO
          </Typography>
          <Box sx={{ mb: 1 }}>
            {pricing?.isPromo && (
              <Typography
                variant="body1"
                sx={{ textDecoration: 'line-through', color: 'text.disabled' }}
              >
                ¥{pricing.price}
              </Typography>
            )}
            <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
              ¥{displayPrice}
              <Typography component="span" variant="body1" color="text.secondary">
                /月
              </Typography>
            </Typography>
          </Box>
          {pricing?.isPromo && (
            <Chip label="プロモーション価格" color="warning" size="small" sx={{ mb: 1 }} />
          )}
          {pricing && pricing.trialDays > 0 && (
            <Chip
              label={`${pricing.trialDays}日間無料トライアル`}
              color="success"
              size="small"
              variant="outlined"
              sx={{ mb: 2 }}
            />
          )}
          {userIsPro ? (
            <Button variant="contained" fullWidth disabled>
              PRO利用中
            </Button>
          ) : session ? (
            <Button
              variant="contained"
              fullWidth
              onClick={handleSubscribe}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : null}
            >
              {loading ? '処理中...' : '無料トライアルを始める'}
            </Button>
          ) : (
            <Button variant="contained" fullWidth href="/register">
              登録してトライアル開始
            </Button>
          )}
          {error && (
            <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
              {error}
            </Typography>
          )}
        </Paper>
      </Box>

      {/* 機能比較テーブル */}
      <Typography variant="h6" sx={{ mb: 2, textAlign: 'center' }}>
        機能比較
      </Typography>
      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>機能</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                Free
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                PRO
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {FEATURES.map((f) => (
              <TableRow key={f.label}>
                <TableCell>{f.label}</TableCell>
                <TableCell align="center">
                  {typeof f.free === 'boolean' ? (
                    f.free ? (
                      <CheckIcon color="success" fontSize="small" />
                    ) : (
                      <CloseIcon color="disabled" fontSize="small" />
                    )
                  ) : (
                    <Typography variant="body2">{f.free}</Typography>
                  )}
                </TableCell>
                <TableCell align="center">
                  {typeof f.pro === 'boolean' ? (
                    f.pro ? (
                      <CheckIcon color="success" fontSize="small" />
                    ) : (
                      <CloseIcon color="disabled" fontSize="small" />
                    )
                  ) : (
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {f.pro}
                    </Typography>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* FAQ */}
      <Typography variant="h6" sx={{ mt: 5, mb: 2, textAlign: 'center' }}>
        よくある質問
      </Typography>
      <Box sx={{ mb: 4 }}>
        {FAQ.map((item, i) => (
          <Accordion
            key={i}
            variant="outlined"
            disableGutters
            sx={{ '&:before': { display: 'none' } }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle2">{item.q}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color="text.secondary">
                {item.a}
              </Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    </Container>
  );
}

export default function PricingPage() {
  return (
    <Suspense
      fallback={
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      }
    >
      <PricingContent />
    </Suspense>
  );
}
