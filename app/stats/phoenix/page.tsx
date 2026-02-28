'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Container,
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SyncIcon from '@mui/icons-material/Sync';
import LinkIcon from '@mui/icons-material/Link';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import { convertToPhoenix, type PhoenixConversion } from '@/lib/phoenix-rating';
import type { EnrichedData } from '@/lib/hooks/useStatsPage';

// ─── PHOENIX スタッツ型 ─────────────────────

interface PxCachedStats {
  rating: number | null;
  ppd: number | null;
  mpr: number | null;
  className: string | null;
  countUpAvg: number | null;
  isPayed: boolean;
  syncAt: string | null;
}

// ─── メインページ ───────────────────────────

export default function PhoenixPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [enrichedData, setEnrichedData] = useState<EnrichedData | null>(null);
  const [pxStats, setPxStats] = useState<PxCachedStats | null>(null);
  const [loading, setLoading] = useState(true);

  // PHOENIX連携ダイアログ
  const [pxDialogOpen, setPxDialogOpen] = useState(false);
  const [pxEmail, setPxEmail] = useState('');
  const [pxPassword, setPxPassword] = useState('');
  const [pxSaving, setPxSaving] = useState(false);
  const [pxSaveError, setPxSaveError] = useState<string | null>(null);

  // 同期
  const [pxSyncing, setPxSyncing] = useState(false);
  const [pxSyncError, setPxSyncError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    if (!session?.user?.id) return;
    const fetchData = async () => {
      try {
        const [dlRes, pxRes] = await Promise.all([
          fetch('/api/admin/dartslive-history'),
          fetch('/api/admin/phoenix-stats'),
        ]);
        if (dlRes.ok) {
          const dlJson = await dlRes.json();
          setEnrichedData(dlJson.enriched ?? null);
        }
        if (pxRes.ok) {
          const pxJson = await pxRes.json();
          setPxStats(pxJson.stats ?? null);
        }
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [session]);

  const handleSaveCredentials = useCallback(async () => {
    setPxSaving(true);
    setPxSaveError(null);
    try {
      const res = await fetch('/api/line/save-px-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: pxEmail, password: pxPassword }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || '保存に失敗しました');
      }
      setPxDialogOpen(false);
      setPxEmail('');
      setPxPassword('');
    } catch (err) {
      setPxSaveError(err instanceof Error ? err.message : '保存に失敗しました');
    } finally {
      setPxSaving(false);
    }
  }, [pxEmail, pxPassword]);

  const handleSync = useCallback(async () => {
    setPxSyncing(true);
    setPxSyncError(null);
    try {
      const res = await fetch('/api/admin/phoenix-sync', { method: 'POST' });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || '同期に失敗しました');
      }
      // 同期成功 → 再取得
      const pxRes = await fetch('/api/admin/phoenix-stats');
      if (pxRes.ok) {
        const pxJson = await pxRes.json();
        setPxStats(pxJson.stats ?? null);
      }
    } catch (err) {
      setPxSyncError(err instanceof Error ? err.message : '同期に失敗しました');
    } finally {
      setPxSyncing(false);
    }
  }, []);

  if (status === 'loading' || loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const ppd100 = enrichedData?.stats01Detailed?.avg100;
  const mpr100 = enrichedData?.statsCricketDetailed?.avg100;
  const hasConversionData = ppd100 != null && mpr100 != null;
  const conversion = hasConversionData ? convertToPhoenix(ppd100, mpr100) : null;

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 3, p: { xs: 1, sm: 2 } }}>
        <Breadcrumbs
          items={[{ label: 'Stats', href: '/stats' }, { label: 'PHOENIX換算' }]}
        />

        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <Button
            size="small"
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push('/stats')}
            sx={{ minWidth: 0 }}
          >
            戻る
          </Button>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            PHOENIX換算
          </Typography>
        </Box>

        {/* ─── PHOENIX連携エリア ─── */}
        <PhoenixLinkSection
          pxStats={pxStats}
          pxSyncing={pxSyncing}
          pxSyncError={pxSyncError}
          onOpenDialog={() => setPxDialogOpen(true)}
          onSync={handleSync}
        />

        {/* ─── PHOENIXスタッツカード ─── */}
        {pxStats && <PhoenixStatsCard stats={pxStats} />}

        {/* ─── プラットフォーム比較テーブル ─── */}
        {pxStats && hasConversionData && (
          <PlatformComparisonTable
            dlPpd100={ppd100}
            dlMpr100={mpr100}
            pxPpd={pxStats.ppd}
            pxMpr={pxStats.mpr}
          />
        )}

        {/* ─── 換算セクション（既存） ─── */}
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mt: 4, mb: 2 }}>
          DARTSLIVE → PHOENIX 換算（参考）
        </Typography>

        {!hasConversionData ? (
          <Paper
            sx={{
              textAlign: 'center',
              py: 8,
              px: 2,
              bgcolor: 'background.default',
              border: '1px dashed',
              borderColor: 'divider',
            }}
          >
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
              100%スタッツが未取得です
            </Typography>
            <Typography variant="body2" color="text.secondary">
              DARTSLIVE有料会員の100%スタッツ（PPD/MPR）が取得されると、PHOENIXレーティングに換算できます。
            </Typography>
          </Paper>
        ) : (
          <ConversionResult conversion={conversion!} />
        )}

        {/* ─── 認証ダイアログ ─── */}
        <Dialog open={pxDialogOpen} onClose={() => setPxDialogOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle>PHOENIX連携</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              PHOENIXのアカウント情報を入力してください。暗号化して保存されます。
            </Typography>
            {pxSaveError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {pxSaveError}
              </Alert>
            )}
            <TextField
              label="メールアドレス"
              type="email"
              fullWidth
              size="small"
              value={pxEmail}
              onChange={(e) => setPxEmail(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              label="パスワード"
              type="password"
              fullWidth
              size="small"
              value={pxPassword}
              onChange={(e) => setPxPassword(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPxDialogOpen(false)} disabled={pxSaving}>
              キャンセル
            </Button>
            <Button
              onClick={handleSaveCredentials}
              variant="contained"
              disabled={pxSaving || !pxEmail || !pxPassword}
            >
              {pxSaving ? '保存中...' : '保存'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
}

// ─── PHOENIX連携セクション ─────────────────

function PhoenixLinkSection({
  pxStats,
  pxSyncing,
  pxSyncError,
  onOpenDialog,
  onSync,
}: {
  pxStats: PxCachedStats | null;
  pxSyncing: boolean;
  pxSyncError: string | null;
  onOpenDialog: () => void;
  onSync: () => void;
}) {
  return (
    <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
          PHOENIX連携
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<LinkIcon />}
            onClick={onOpenDialog}
            sx={{ textTransform: 'none' }}
          >
            認証設定
          </Button>
          <Button
            size="small"
            variant="contained"
            startIcon={pxSyncing ? <CircularProgress size={14} /> : <SyncIcon />}
            onClick={onSync}
            disabled={pxSyncing}
            sx={{ textTransform: 'none' }}
          >
            {pxSyncing ? '同期中...' : '同期'}
          </Button>
        </Box>
      </Box>

      {pxSyncError && (
        <Alert severity="error" sx={{ mb: 1 }}>
          {pxSyncError}
        </Alert>
      )}

      {pxStats?.syncAt ? (
        <Typography variant="caption" color="text.secondary">
          最終同期: {new Date(pxStats.syncAt).toLocaleString('ja-JP')}
        </Typography>
      ) : (
        <Typography variant="caption" color="text.secondary">
          未同期 — 認証情報を設定して同期ボタンを押してください
        </Typography>
      )}
    </Paper>
  );
}

// ─── PHOENIXスタッツカード ─────────────────

function PhoenixStatsCard({ stats }: { stats: PxCachedStats }) {
  if (stats.rating == null && stats.ppd == null && stats.mpr == null) {
    return null;
  }

  return (
    <Card variant="outlined" sx={{ borderRadius: 2, mb: 2 }}>
      <CardContent>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
          PHOENIXスタッツ（実績値）
        </Typography>

        {/* Rating + Class */}
        {stats.rating != null && (
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
              Rt.{stats.rating}
            </Typography>
            {stats.className && (
              <Chip label={stats.className} sx={{ fontWeight: 'bold', fontSize: '1rem', mt: 0.5 }} />
            )}
          </Box>
        )}

        {/* PPD / MPR / CountUp */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: stats.countUpAvg != null ? '1fr 1fr 1fr' : '1fr 1fr',
            gap: 2,
          }}
        >
          {stats.ppd != null && (
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                PPD
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {stats.ppd.toFixed(2)}
              </Typography>
            </Box>
          )}
          {stats.mpr != null && (
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                MPR
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {stats.mpr.toFixed(2)}
              </Typography>
            </Box>
          )}
          {stats.countUpAvg != null && (
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                COUNT-UP Avg
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {stats.countUpAvg.toFixed(1)}
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

// ─── プラットフォーム比較テーブル ──────────

function DeltaIndicator({
  delta,
  suffix,
}: {
  delta: number | null;
  suffix: string;
}) {
  if (delta == null)
    return (
      <Typography variant="body2" color="text.secondary">
        --
      </Typography>
    );

  const color = Math.abs(delta) < 0.01 ? '#888' : delta > 0 ? '#4caf50' : '#f44336';
  const Icon = delta > 0.01 ? TrendingUpIcon : delta < -0.01 ? TrendingDownIcon : TrendingFlatIcon;

  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.3, color }}>
      <Icon sx={{ fontSize: 16 }} />
      <Typography variant="body2" sx={{ fontWeight: 'bold', color }}>
        {delta > 0 ? '+' : ''}
        {delta.toFixed(2)}
        {suffix}
      </Typography>
    </Box>
  );
}

function PlatformComparisonTable({
  dlPpd100,
  dlMpr100,
  pxPpd,
  pxMpr,
}: {
  dlPpd100: number;
  dlMpr100: number;
  pxPpd: number | null;
  pxMpr: number | null;
}) {
  const rows = [
    {
      label: 'PPD',
      dl: dlPpd100,
      px: pxPpd,
      delta: pxPpd != null ? dlPpd100 - pxPpd : null,
      suffix: '',
    },
    {
      label: 'MPR',
      dl: dlMpr100,
      px: pxMpr,
      delta: pxMpr != null ? dlMpr100 - pxMpr : null,
      suffix: '',
    },
  ];

  return (
    <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1.5 }}>
        プラットフォーム比較
      </Typography>

      {/* ヘッダー */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '60px 1fr 1fr 1fr',
          gap: 1,
          mb: 0.5,
        }}
      >
        <Box />
        <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
          DARTSLIVE (100%)
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
          PHOENIX
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
          差分 (DL - PX)
        </Typography>
      </Box>

      {/* データ行 */}
      {rows.map((row) => (
        <Box
          key={row.label}
          sx={{
            display: 'grid',
            gridTemplateColumns: '60px 1fr 1fr 1fr',
            gap: 1,
            py: 0.8,
            borderTop: '1px solid',
            borderColor: 'divider',
            alignItems: 'center',
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            {row.label}
          </Typography>
          <Typography variant="body2" sx={{ textAlign: 'center' }}>
            {row.dl.toFixed(2)}
          </Typography>
          <Typography variant="body2" sx={{ textAlign: 'center' }}>
            {row.px != null ? row.px.toFixed(2) : '--'}
          </Typography>
          <Box sx={{ textAlign: 'center' }}>
            <DeltaIndicator delta={row.delta} suffix={row.suffix} />
          </Box>
        </Box>
      ))}

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
        ※ DARTSLIVEは100%スタッツ、PHOENIXは通常スタッツのため参考比較です
      </Typography>
    </Paper>
  );
}

// ─── 換算結果（既存） ──────────────────────

function ConversionResult({ conversion }: { conversion: PhoenixConversion }) {
  const { zeroOne, cricket, overall, ppd100, mpr100 } = conversion;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* 総合 */}
      <Card variant="outlined" sx={{ borderRadius: 2 }}>
        <CardContent sx={{ textAlign: 'center', py: 3 }}>
          <Typography variant="caption" color="text.secondary">
            PHOENIX 総合レーティング
          </Typography>
          <Typography variant="h3" sx={{ fontWeight: 'bold', my: 1 }}>
            Rt.{overall.rating}
          </Typography>
          <Chip
            label={overall.class}
            sx={{
              fontWeight: 'bold',
              fontSize: '1rem',
              px: 1,
            }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            (01 Rt.{zeroOne.rating} + Cricket Rt.{cricket.rating}) / 2
          </Typography>
        </CardContent>
      </Card>

      {/* 01 / Cricket 個別 */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
        <Card variant="outlined" sx={{ borderRadius: 2 }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              01 Games
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 'bold', my: 0.5 }}>
              Rt.{zeroOne.rating}
            </Typography>
            <Chip label={zeroOne.class} size="small" sx={{ mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              PPD {ppd100.toFixed(2)}
            </Typography>
          </CardContent>
        </Card>

        <Card variant="outlined" sx={{ borderRadius: 2 }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Cricket
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 'bold', my: 0.5 }}>
              Rt.{cricket.rating}
            </Typography>
            <Chip label={cricket.class} size="small" sx={{ mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              MPR {mpr100.toFixed(2)}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* 換算元 */}
      <Card variant="outlined" sx={{ borderRadius: 2, bgcolor: 'action.hover' }}>
        <CardContent>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            換算元: DARTSLIVE 100%スタッツ
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-around' }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                PPD (100%)
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {ppd100.toFixed(2)}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                MPR (100%)
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {mpr100.toFixed(2)}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* 注記 */}
      <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
        ※ DARTSLIVE 100%スタッツ(PPD/MPR)をPHOENIXのレーティングテーブルに当てはめた参考値です
      </Typography>
    </Box>
  );
}
