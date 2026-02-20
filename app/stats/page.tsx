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
  CardMedia,
  CircularProgress,
  Paper,
} from '@mui/material';
import SyncIcon from '@mui/icons-material/Sync';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DownloadIcon from '@mui/icons-material/Download';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import type { Dart } from '@/types';
import { getFlightColor, COLOR_COUNTUP } from '@/lib/dartslive-colors';
import { calc01Rating, ppdForRating } from '@/lib/dartslive-rating';
import { canUseDartslive, canExportCsv } from '@/lib/permissions';
import ProPaywall from '@/components/ProPaywall';

// Progression components
import AchievementList from '@/components/progression/AchievementList';
import XpHistoryList from '@/components/progression/XpHistoryList';
import type { AchievementSnapshot } from '@/lib/progression/xp-engine';

// Stats components
import PlayerProfileCard from '@/components/stats/PlayerProfileCard';
import RatingHeroCard from '@/components/stats/RatingHeroCard';
import PeriodStatsPanel from '@/components/stats/PeriodStatsPanel';
import GameStatsCards from '@/components/stats/GameStatsCards';
import BullStatsCard from '@/components/stats/BullStatsCard';
import CountUpDeltaChart from '@/components/stats/CountUpDeltaChart';
import RatingTargetCard from '@/components/stats/RatingTargetCard';
import MonthlyTrendChart from '@/components/stats/MonthlyTrendChart';
import RecentGamesChart from '@/components/stats/RecentGamesChart';
import RecentDaySummary from '@/components/stats/RecentDaySummary';
import AwardsTable from '@/components/stats/AwardsTable';
import PRSiteSection from '@/components/stats/PRSiteSection';
import StatsLoginDialog from '@/components/stats/StatsLoginDialog';
import AwardEfficiencyCard from '@/components/stats/AwardEfficiencyCard';
import RatingMomentumCard from '@/components/stats/RatingMomentumCard';
import ConsistencyCard from '@/components/stats/ConsistencyCard';
import N01ImportCard from '@/components/stats/N01ImportCard';

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
  const prev = dlData?.prev;
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
          <>
            {/* 1. Player Profile */}
            <PlayerProfileCard
              cardName={c.cardName}
              cardImageUrl={c.cardImageUrl}
              toorina={c.toorina}
              homeShop={c.homeShop}
              myAward={c.myAward}
              status={c.status}
              flightColor={flightColor}
            />

            {/* 2. Rating Hero */}
            <RatingHeroCard
              rating={c.rating}
              ratingPrev={prev?.rating ?? null}
              flight={c.flight}
              flightColor={flightColor}
              streak={periodSummary?.streak ?? 0}
              showStreak={periodTab === 'all'}
            />

            {/* 3. Period Stats */}
            <PeriodStatsPanel
              periodTab={periodTab}
              onPeriodChange={setPeriodTab}
              loading={periodLoading}
              summary={periodSummary}
              records={periodRecords}
              prevPpd={prev?.stats01Avg ?? null}
              prevMpr={prev?.statsCriAvg ?? null}
            />

            {/* 3b. Award Efficiency */}
            <AwardEfficiencyCard
              awards={c.awards}
              totalGames={periodSummary?.totalGames ?? 0}
            />

            {/* 4. Game Stats Cards */}
            <GameStatsCards
              stats01Avg={c.stats01Avg}
              stats01Best={c.stats01Best}
              statsCriAvg={c.statsCriAvg}
              statsCriBest={c.statsCriBest}
              statsPraAvg={c.statsPraAvg}
              statsPraBest={c.statsPraBest}
              prev01Avg={prev?.stats01Avg ?? null}
              prevCriAvg={prev?.statsCriAvg ?? null}
              prevPraAvg={prev?.statsPraAvg ?? null}
              expectedCountUp={expectedCountUp}
            />

            {/* 5. Bull Stats */}
            <BullStatsCard
              awards={c.awards}
              bullHistory={periodRecords
                .filter((r) => r.dBull != null || r.sBull != null)
                .map((r) => ({ date: r.date, dBull: r.dBull, sBull: r.sBull }))}
            />

            {/* 6. COUNT-UP Delta */}
            <CountUpDeltaChart games={dlData.recentGames.games} avgScore={c.statsPraAvg} />

            {/* 6b. Consistency */}
            <ConsistencyCard games={dlData.recentGames.games} />

            {/* 7. Rating Target */}
            {c.stats01Avg != null && c.statsCriAvg != null && (
              <RatingTargetCard
                stats01Avg={c.stats01Avg}
                statsCriAvg={c.statsCriAvg}
                flightColor={flightColor}
              />
            )}

            {/* 7b. Rating Momentum */}
            <RatingMomentumCard
              monthlyRatings={dlData.monthly?.rating ?? []}
              currentRating={c.rating}
            />

            {/* 8. Monthly Trend */}
            <MonthlyTrendChart
              monthly={dlData.monthly}
              monthlyTab={monthlyTab}
              onTabChange={setMonthlyTab}
              flightColor={flightColor}
            />

            {/* 9. Recent Games */}
            <RecentGamesChart
              games={dlData.recentGames.games}
              gameChartCategory={gameChartCategory}
              onCategoryChange={setGameChartCategory}
              expectedCountUp={expectedCountUp}
              dangerCountUp={dangerCountUp}
              excellentCountUp={excellentCountUp}
            />

            {/* 10. Recent Day Summary */}
            <RecentDaySummary
              dayStats={dlData.recentGames.dayStats}
              shops={dlData.recentGames.shops}
            />

            {/* 11. Awards Table */}
            <AwardsTable awards={c.awards} />

            {/* 12. Active Dart */}
            {activeSoftDart && (
              <Card
                component={Link}
                href={`/darts/${activeSoftDart.id}`}
                sx={{
                  textDecoration: 'none',
                  display: 'flex',
                  flexDirection: 'row',
                  mb: 2,
                  height: 72,
                  borderRadius: 2,
                  borderLeft: `3px solid ${flightColor}`,
                }}
              >
                {activeSoftDart.imageUrls.length > 0 ? (
                  <CardMedia
                    component="img"
                    image={activeSoftDart.imageUrls[0]}
                    alt={activeSoftDart.title}
                    sx={{ width: 72, objectFit: 'cover', flexShrink: 0 }}
                  />
                ) : (
                  <Box
                    component="img"
                    src="/dart-placeholder.svg"
                    alt=""
                    sx={{ width: 72, flexShrink: 0, objectFit: 'cover' }}
                  />
                )}
                <CardContent
                  sx={{
                    py: 1,
                    px: 1.5,
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    minWidth: 0,
                    '&:last-child': { pb: 1 },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <CheckCircleIcon sx={{ fontSize: 14, color: COLOR_COUNTUP }} />
                    <Typography variant="caption" color="text.secondary">
                      使用中セッティング
                    </Typography>
                  </Box>
                  <Typography variant="subtitle2" noWrap>
                    {activeSoftDart.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {activeSoftDart.barrel.brand} {activeSoftDart.barrel.name} (
                    {activeSoftDart.barrel.weight}g)
                  </Typography>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* 13. CSV Export */}
        {canExportCsv(session?.user?.role) && (
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
                <Typography variant="body2">スタッツをエクスポート</Typography>
                <Typography variant="caption" color="text.secondary">
                  全履歴をCSVファイルでダウンロード
                </Typography>
              </Box>
              <Button
                variant="outlined"
                size="small"
                startIcon={<DownloadIcon />}
                href="/api/stats-history/export"
              >
                CSV出力
              </Button>
            </CardContent>
          </Card>
        )}

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

        {/* 15. n01 Import */}
        <N01ImportCard />

        {/* 16. PR Site Section */}
        <PRSiteSection />

        {/* 16. Progression */}
        <Box sx={{ mt: 4 }}>
          <AchievementList unlockedIds={achievements} snapshot={achievementSnapshot} />
          <XpHistoryList history={xpHistory} />
        </Box>
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
