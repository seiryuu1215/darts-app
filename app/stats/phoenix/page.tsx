'use client';

import { useEffect, useState } from 'react';
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
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import { convertToPhoenix, type PhoenixConversion } from '@/lib/phoenix-rating';
import type { EnrichedData } from '@/lib/hooks/useStatsPage';

export default function PhoenixPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [enrichedData, setEnrichedData] = useState<EnrichedData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    if (!session?.user?.id) return;
    const fetchData = async () => {
      try {
        const res = await fetch('/api/admin/dartslive-history');
        if (!res.ok) return;
        const json = await res.json();
        setEnrichedData(json.enriched ?? null);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [session]);

  if (status === 'loading' || loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const ppd100 = enrichedData?.stats01Detailed?.avg100;
  const mpr100 = enrichedData?.statsCricketDetailed?.avg100;
  const hasData = ppd100 != null && mpr100 != null;
  const conversion = hasData ? convertToPhoenix(ppd100, mpr100) : null;

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

        {!hasData ? (
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
      </Box>
    </Container>
  );
}

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
