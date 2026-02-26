'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SyncIcon from '@mui/icons-material/Sync';
import DownloadIcon from '@mui/icons-material/Download';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import Chip from '@mui/material/Chip';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import type { Dart } from '@/types';
import { getFlightColor } from '@/lib/dartslive-colors';
import { calc01Rating, ppdForRating } from '@/lib/dartslive-rating';
import { canUseDartslive, canUseDartsliveApi, canExportCsv } from '@/lib/permissions';
import ProPaywall from '@/components/ProPaywall';

// Progression components
import AchievementList from '@/components/progression/AchievementList';
import XpHistoryList from '@/components/progression/XpHistoryList';
import type { AchievementSnapshot } from '@/lib/progression/xp-engine';

// Stats components
import StatsLoginDialog from '@/components/stats/StatsLoginDialog';
import StatsPageContent from '@/components/stats/StatsPageContent';
import AdminApiStatsSection from '@/components/stats/AdminApiStatsSection';

// === Types ===
interface StatsHistorySummary {
  avgRating: number | null;
  avgPpd: number | null;
  avgMpr: number | null;
  avgCondition: number | null;
  totalGames: number;
  playDays: number;
  ratingChange: number | null;
  bestRating: number | null;
  bestPpd: number | null;
  bestMpr: number | null;
  streak: number;
}

interface StatsHistoryRecord {
  id: string;
  date: string;
  rating: number | null;
  ppd: number | null;
  mpr: number | null;
  gamesPlayed: number;
  condition: number | null;
  memo: string;
  dBull: number | null;
  sBull: number | null;
}

interface DartsliveData {
  current: {
    cardName: string;
    toorina: string;
    cardImageUrl: string;
    rating: number | null;
    ratingInt: number | null;
    flight: string;
    stats01Avg: number | null;
    statsCriAvg: number | null;
    statsPraAvg: number | null;
    stats01Best: number | null;
    statsCriBest: number | null;
    statsPraBest: number | null;
    awards: Record<string, { monthly: number; total: number }>;
    homeShop?: string;
    status?: string;
    myAward?: string;
  };
  monthly: Record<string, { month: string; value: number }[]>;
  recentGames: {
    dayStats: {
      best01: number | null;
      bestCri: number | null;
      bestCountUp: number | null;
      avg01: number | null;
      avgCri: number | null;
      avgCountUp: number | null;
    };
    games: { category: string; scores: number[] }[];
    shops: string[];
  };
  prev: {
    rating: number | null;
    stats01Avg: number | null;
    statsCriAvg: number | null;
    statsPraAvg: number | null;
  } | null;
}

type MonthlyTab = 'rating' | 'zeroOne' | 'cricket' | 'countUp';

export default function StatsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const canDartslive = canUseDartslive(session?.user?.role);
  const isAdminApi = canUseDartsliveApi(session?.user?.role);

  const [dlData, setDlData] = useState<DartsliveData | null>(null);
  const [dlOpen, setDlOpen] = useState(false);
  const [dlEmail, setDlEmail] = useState('');
  const [dlPassword, setDlPassword] = useState('');
  const [dlLoading, setDlLoading] = useState(false);
  const [dlError, setDlError] = useState('');
  const [dlConsent, setDlConsent] = useState(false);
  const [monthlyTab, setMonthlyTab] = useState<MonthlyTab>('rating');
  const [gameChartCategory, setGameChartCategory] = useState<string>('');
  const [activeSoftDart, setActiveSoftDart] = useState<Dart | null>(null);
  const [dlUpdatedAt, setDlUpdatedAt] = useState<string | null>(null);
  const [periodTab, setPeriodTab] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const [periodSummary, setPeriodSummary] = useState<StatsHistorySummary | null>(null);
  const [periodRecords, setPeriodRecords] = useState<StatsHistoryRecord[]>([]);
  const [periodLoading, setPeriodLoading] = useState(false);
  const [achievements, setAchievements] = useState<string[]>([]);
  const [achievementSnapshot, setAchievementSnapshot] = useState<AchievementSnapshot | null>(null);
  const [xpHistory, setXpHistory] = useState<
    { id: string; action: string; xp: number; detail: string; createdAt: string }[]
  >([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [apiEnrichedData, setApiEnrichedData] = useState<any>(null);
  const [apiDailyHistory, setApiDailyHistory] = useState<
    {
      date: string;
      rating: number | null;
      stats01Avg: number | null;
      statsCriAvg: number | null;
      stats01Avg100?: number | null;
      statsCriAvg100?: number | null;
    }[]
  >([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [apiDartoutList, setApiDartoutList] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [apiAwardList, setApiAwardList] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [apiRecentPlays, setApiRecentPlays] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [apiCountupPlays, setApiCountupPlays] = useState<any>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    try {
      if (localStorage.getItem('dartslive_consent') === '1') setDlConsent(true);
      localStorage.removeItem('dartslive_credentials');
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!session?.user?.id) return;
    if (canDartslive) {
      const fetchCachedStats = async () => {
        try {
          const res = await fetch('/api/dartslive-stats');
          if (!res.ok) return;
          const json = await res.json();
          if (json.data) {
            setDlData(json.data);
            if (json.updatedAt) setDlUpdatedAt(json.updatedAt);
            if (json.data.recentGames?.games?.length > 0) {
              const games = json.data.recentGames.games;
              const countUp = games.find((g: { category: string }) => g.category === 'COUNT-UP');
              setGameChartCategory(countUp ? 'COUNT-UP' : games[0].category);
            }
          }
        } catch {
          /* ignore */
        }
      };
      fetchCachedStats();
    }
    const fetchActiveDart = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', session.user.id));
        if (!userDoc.exists()) return;
        const userData = userDoc.data();
        if (userData.activeSoftDartId) {
          const dartDoc = await getDoc(doc(db, 'darts', userData.activeSoftDartId));
          if (dartDoc.exists()) {
            setActiveSoftDart({ id: dartDoc.id, ...dartDoc.data() } as Dart);
          }
        }
      } catch {
        /* ignore */
      }
    };
    fetchActiveDart();

    // Progression data
    const fetchProgression = async () => {
      try {
        const res = await fetch('/api/progression');
        if (!res.ok) return;
        const json = await res.json();
        setAchievements(json.achievements ?? []);
        setAchievementSnapshot(json.achievementSnapshot ?? null);
        setXpHistory(json.history ?? []);
      } catch {
        // ignore
      }
    };
    fetchProgression();
  }, [session, canDartslive]);

  const fetchAdminApiData = async () => {
    try {
      const res = await fetch('/api/admin/dartslive-history');
      if (!res.ok) return;
      const json = await res.json();
      setApiDailyHistory(json.records ?? []);
      setApiEnrichedData(json.enriched ?? null);
      setApiDartoutList(json.dartoutList ?? null);
      setApiAwardList(json.awardList ?? null);
      setApiRecentPlays(json.recentPlays ?? null);
      setApiCountupPlays(json.countupPlays ?? null);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    if (!session?.user?.id || !isAdminApi) return;
    fetchAdminApiData();
  }, [session, isAdminApi]);

  useEffect(() => {
    if (!session?.user?.id || !canDartslive) return;
    const fetchPeriodStats = async () => {
      setPeriodLoading(true);
      try {
        const res = await fetch(`/api/stats-history?period=${periodTab}`);
        if (!res.ok) return;
        const json = await res.json();
        setPeriodSummary(json.summary ?? null);
        setPeriodRecords(json.records ?? []);
      } catch {
        /* ignore */
      } finally {
        setPeriodLoading(false);
      }
    };
    fetchPeriodStats();
  }, [session, canDartslive, periodTab]);

  const handleFetch = async () => {
    if (!dlEmail || !dlPassword) {
      setDlError('メールアドレスとパスワードを入力してください');
      return;
    }
    setDlError('');
    setDlLoading(true);
    try {
      const res = await fetch('/api/dartslive-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: dlEmail, password: dlPassword }),
      });
      const json = await res.json();
      if (!res.ok) {
        setDlError(json.error || '取得に失敗しました');
        return;
      }
      setDlData(json.data);
      setDlOpen(false);
      setDlUpdatedAt(new Date().toISOString());
      localStorage.setItem('dartslive_consent', '1');
      if (json.data.recentGames?.games?.length > 0) {
        const games = json.data.recentGames.games;
        const countUp = games.find((g: { category: string }) => g.category === 'COUNT-UP');
        setGameChartCategory(countUp ? 'COUNT-UP' : games[0].category);
      }
    } catch {
      setDlError('通信エラーが発生しました');
    } finally {
      setDlLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const c = dlData?.current;
  const flightColor = c?.flight ? getFlightColor(c.flight) : '#808080';

  // カウントアップ期待値
  const expectedCountUp = c?.stats01Avg != null ? Math.round(c.stats01Avg * 8) : null;
  const current01RtInt = c?.stats01Avg != null ? Math.floor(calc01Rating(c.stats01Avg)) : null;
  const dangerCountUp =
    current01RtInt != null ? Math.round(ppdForRating(current01RtInt - 2) * 8) : null;
  const excellentCountUp =
    current01RtInt != null ? Math.round(ppdForRating(current01RtInt + 2) * 8) : null;

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 3, p: { xs: 1, sm: 2 } }}>
        <Breadcrumbs items={[{ label: 'Stats' }]} />

        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              DARTSLIVE Stats
            </Typography>
            {canDartslive && dlUpdatedAt && (
              <Typography variant="caption" color="text.secondary">
                最終取得:{' '}
                {new Date(dlUpdatedAt).toLocaleString('ja-JP', {
                  month: 'numeric',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Typography>
            )}
          </Box>
          {canDartslive && (
            <Button
              variant={dlData ? 'outlined' : 'contained'}
              startIcon={dlLoading ? <CircularProgress size={18} color="inherit" /> : <SyncIcon />}
              onClick={() => setDlOpen(true)}
              disabled={dlLoading}
              size="small"
            >
              {dlLoading ? '取得中...' : dlData ? '更新' : 'ダーツライブ連携'}
            </Button>
          )}
        </Box>

        {/* PRO アップグレード案内 */}
        {!canDartslive && (
          <ProPaywall
            title="DARTSLIVE連携はPROプラン限定です"
            description="PROプランにアップグレードすると、DARTSLIVEアカウントと連携してスタッツの自動取得・推移グラフ・レーティング目標分析が利用できます。"
          />
        )}

        {/* 未取得 */}
        {canDartslive && !dlData && !dlLoading && (
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
              ダーツライブと連携
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              アカウント情報でログインし、メインカードのスタッツ・推移を表示します
            </Typography>
            <Button variant="contained" startIcon={<SyncIcon />} onClick={() => setDlOpen(true)}>
              連携する
            </Button>
          </Paper>
        )}

        {canDartslive && dlLoading && !dlData && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <CircularProgress sx={{ mb: 2 }} />
            <Typography color="text.secondary">ダーツライブからスタッツ取得中...</Typography>
          </Box>
        )}

        {canDartslive && dlData && c && (
          <StatsPageContent
            dlData={dlData}
            periodTab={periodTab}
            periodSummary={periodSummary}
            periodRecords={periodRecords}
            flightColor={flightColor}
            expectedCountUp={expectedCountUp}
            dangerCountUp={dangerCountUp}
            excellentCountUp={excellentCountUp}
            activeSoftDart={activeSoftDart}
            monthlyTab={monthlyTab}
            gameChartCategory={gameChartCategory}
            onMonthlyTabChange={setMonthlyTab}
            onGameChartCategoryChange={setGameChartCategory}
          />
        )}

        {/* Admin API Stats */}
        {isAdminApi && (
          <AdminApiStatsSection
            dailyHistory={apiDailyHistory}
            enrichedData={apiEnrichedData}
            onSyncComplete={fetchAdminApiData}
            dartoutList={apiDartoutList}
            awardList={apiAwardList}
            recentPlays={apiRecentPlays}
            countupPlays={apiCountupPlays}
            flight={c?.flight}
          />
        )}

        {/* Progression (折り畳み) */}
        <Accordion
          defaultExpanded={false}
          sx={{ mb: 2, borderRadius: 2, '&:before': { display: 'none' } }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                実績 & XP
              </Typography>
              {achievements.length > 0 && (
                <Chip label={`${achievements.length}件解除`} size="small" color="success" />
              )}
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 0 }}>
            <AchievementList unlockedIds={achievements} snapshot={achievementSnapshot} />
            <XpHistoryList history={xpHistory} />
          </AccordionDetails>
        </Accordion>

        {/* 13. CSV Export */}
        <Card variant="outlined" sx={{ mb: 2, borderRadius: 2 }}>
          <CardContent
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              py: '12px !important',
            }}
          >
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2">スタッツをエクスポート</Typography>
                {!canExportCsv(session?.user?.role) && (
                  <Chip label="PRO" color="primary" size="small" />
                )}
              </Box>
              <Typography variant="caption" color="text.secondary">
                全履歴をCSVファイルでダウンロード
              </Typography>
            </Box>
            <Button
              variant="outlined"
              size="small"
              startIcon={<DownloadIcon />}
              href="/api/stats-history/export"
              disabled={!canExportCsv(session?.user?.role)}
            >
              CSV出力
            </Button>
          </CardContent>
        </Card>

        {/* 14. Manual Record */}
        <Card variant="outlined" sx={{ mb: 2, borderRadius: 2 }}>
          <CardContent
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              py: '12px !important',
            }}
          >
            <Box>
              <Typography variant="body2">調子やメモを記録</Typography>
              <Typography variant="caption" color="text.secondary">
                手動でスタッツを記録・管理（LINE Botからも記録できます）
              </Typography>
            </Box>
            <Button variant="outlined" size="small" onClick={() => router.push('/stats/new')}>
              手動記録
            </Button>
          </CardContent>
        </Card>

        {/* 15. Calendar Link */}
        <Card variant="outlined" sx={{ mb: 2, borderRadius: 2 }}>
          <CardContent
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              py: '12px !important',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarMonthIcon sx={{ color: 'text.secondary' }} />
              <Box>
                <Typography variant="body2">カレンダー</Typography>
                <Typography variant="caption" color="text.secondary">
                  プレイ日・調子を日別に確認
                </Typography>
              </Box>
            </Box>
            <Button variant="outlined" size="small" component={Link} href="/stats/calendar">
              開く
            </Button>
          </CardContent>
        </Card>
      </Box>

      {/* Login Dialog */}
      {canDartslive && (
        <StatsLoginDialog
          open={dlOpen}
          onClose={() => setDlOpen(false)}
          email={dlEmail}
          setEmail={setDlEmail}
          password={dlPassword}
          setPassword={setDlPassword}
          consent={dlConsent}
          setConsent={setDlConsent}
          loading={dlLoading}
          error={dlError}
          onFetch={handleFetch}
        />
      )}
    </Container>
  );
}
