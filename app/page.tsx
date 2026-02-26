'use client';

import { useEffect, useState } from 'react';
import {
  Container,
  Grid,
  Typography,
  Box,
  Card,
  CardActionArea,
  CardContent,
  Button,
  CircularProgress,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import StraightenIcon from '@mui/icons-material/Straighten';
import ViewInArIcon from '@mui/icons-material/ViewInAr';
import QuizIcon from '@mui/icons-material/Quiz';
import BuildIcon from '@mui/icons-material/Build';
import { collection, getDocs, orderBy, query, doc, getDoc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import DartCard from '@/components/darts/DartCard';
import OnboardingDialog from '@/components/OnboardingDialog';
import XpBar from '@/components/progression/XpBar';
import GoalSection from '@/components/goals/GoalSection';
import XpNotificationDialog from '@/components/notifications/XpNotificationDialog';
import LevelUpSnackbar from '@/components/progression/LevelUpSnackbar';
import StorefrontIcon from '@mui/icons-material/Storefront';
import StatsOverviewCard from '@/components/home/StatsOverviewCard';
import ActiveSettings from '@/components/home/ActiveSettings';
import GuestHero from '@/components/home/GuestHero';
import { useToast } from '@/components/ToastProvider';
import type { Dart } from '@/types';

interface PrevMonthStats {
  dBullMonthly: number;
  sBullMonthly: number;
  lowTonMonthly: number;
  hatTricksMonthly: number;
  playDays: number;
}

interface DartsliveCache {
  rating: number | null;
  flight: string;
  cardName: string;
  stats01Avg: number | null;
  statsCriAvg: number | null;
  statsPraAvg: number | null;
  dBullMonthly: number;
  sBullMonthly: number;
  lowTonMonthly: number;
  hatTricksMonthly: number;
  currentMonthPlayDays: number;
  prevMonthStats: PrevMonthStats | null;
  prevRating: number | null;
  prevStats01Avg: number | null;
  prevStatsCriAvg: number | null;
  prevStatsPraAvg: number | null;
}

interface FeatureCard {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  authOnly?: boolean;
  accent: string;
}

const featureCards: FeatureCard[] = [
  {
    title: 'バレル検索',
    description: 'ブランド・スペックで絞り込み',
    href: '/barrels',
    icon: <SearchIcon sx={{ fontSize: 36 }} />,
    accent: '#818cf8',
  },
  {
    title: 'シャフト早見表',
    description: 'シャフト重量を一覧で比較',
    href: '/reference',
    icon: <StraightenIcon sx={{ fontSize: 36 }} />,
    accent: '#f472b6',
  },
  {
    title: 'シミュレーター',
    description: 'バレル形状を可視化・比較',
    href: '/barrels/simulator',
    icon: <ViewInArIcon sx={{ fontSize: 36 }} />,
    accent: '#38bdf8',
  },
  {
    title: 'バレル診断',
    description: '質問に答えておすすめを探す',
    href: '/barrels/quiz',
    icon: <QuizIcon sx={{ fontSize: 36 }} />,
    accent: '#34d399',
  },
  {
    title: 'おすすめツール',
    description: '併用で便利な外部ツール紹介',
    href: '/tools',
    icon: <BuildIcon sx={{ fontSize: 36 }} />,
    accent: '#a78bfa',
  },
  {
    title: 'ショップ',
    description: '近くのダーツショップを探す',
    href: '/shops',
    icon: <StorefrontIcon sx={{ fontSize: 36 }} />,
    accent: '#fbbf24',
  },
  {
    title: 'セッティング比較',
    description: '自分のセッティングを並べて比較',
    href: '/darts/compare',
    icon: <CompareArrowsIcon sx={{ fontSize: 36 }} />,
    authOnly: true,
    accent: '#fb923c',
  },
  {
    title: 'ブックマーク',
    description: '保存したバレル・セッティング',
    href: '/bookmarks',
    icon: <BookmarkIcon sx={{ fontSize: 36 }} />,
    authOnly: true,
    accent: '#60a5fa',
  },
];

export default function HomePage() {
  const { data: session, status } = useSession();
  const { showToast } = useToast();
  const [activeSoftDart, setActiveSoftDart] = useState<Dart | null>(null);
  const [activeSteelDart, setActiveSteelDart] = useState<Dart | null>(null);
  const [myDarts, setMyDarts] = useState<Dart[]>([]);
  const [dlCache, setDlCache] = useState<DartsliveCache | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [xpNotifications, setXpNotifications] = useState<
    {
      id: string;
      type: string;
      title: string;
      details: { action: string; xp: number; label: string }[];
      totalXp: number;
    }[]
  >([]);
  const [showXpNotification, setShowXpNotification] = useState(false);
  const [levelUpInfo, setLevelUpInfo] = useState<{ level: number; rank: string } | null>(null);

  // 通知取得
  useEffect(() => {
    if (!session?.user?.id) return;
    (async () => {
      try {
        const res = await fetch('/api/notifications');
        if (!res.ok) return;
        const json = await res.json();
        if (json.notifications?.length > 0) {
          setXpNotifications(json.notifications);
          setShowXpNotification(true);
        }
      } catch {
        showToast('通知の取得に失敗しました');
      }
    })();
  }, [session, showToast]);

  const handleCloseXpNotification = async () => {
    setShowXpNotification(false);
    const ids = xpNotifications.map((n) => n.id);
    if (ids.length > 0) {
      try {
        await fetch('/api/notifications', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids }),
        });
      } catch {
        showToast('通知の既読処理に失敗しました');
      }
    }
  };

  // ユーザーデータ統合取得（オンボーディング判定 + アクティブダーツ）
  useEffect(() => {
    if (!session?.user?.id) return;
    const fetchUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', session.user.id));
        if (!userDoc.exists()) return;
        const userData = userDoc.data();

        // オンボーディング判定
        if (!userData.onboardingCompleted) {
          setShowOnboarding(true);
        }

        // アクティブダーツ取得
        if (userData.activeSoftDartId) {
          const dartDoc = await getDoc(doc(db, 'darts', userData.activeSoftDartId));
          if (dartDoc.exists()) {
            setActiveSoftDart({ id: dartDoc.id, ...dartDoc.data() } as Dart);
          }
        } else {
          setActiveSoftDart(null);
        }
        if (userData.activeSteelDartId) {
          const dartDoc = await getDoc(doc(db, 'darts', userData.activeSteelDartId));
          if (dartDoc.exists()) {
            setActiveSteelDart({ id: dartDoc.id, ...dartDoc.data() } as Dart);
          }
        } else {
          setActiveSteelDart(null);
        }
      } catch (err) {
        console.error('ユーザーデータ取得エラー:', err);
      }
    };
    const fetchMyDarts = async () => {
      try {
        const q = query(
          collection(db, 'darts'),
          where('userId', '==', session.user.id),
          orderBy('createdAt', 'desc'),
        );
        const snapshot = await getDocs(q);
        setMyDarts(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Dart[]);
      } catch (err) {
        console.error('マイセッティング取得エラー:', err);
      }
    };
    const fetchDlCache = async () => {
      try {
        const res = await fetch('/api/dartslive-stats');
        if (!res.ok) return;
        const json = await res.json();
        if (json.data?.current) {
          const c = json.data.current;
          const prev = json.data.prev;
          const awards = c.awards || {};
          setDlCache({
            rating: c.rating,
            flight: c.flight,
            cardName: c.cardName,
            stats01Avg: c.stats01Avg,
            statsCriAvg: c.statsCriAvg,
            statsPraAvg: c.statsPraAvg,
            dBullMonthly: awards['D-BULL']?.monthly ?? c.bullStats?.dBullMonthly ?? 0,
            sBullMonthly:
              awards['S-BULL']?.monthly ?? c.sBullMonthly ?? c.bullStats?.sBullMonthly ?? 0,
            lowTonMonthly: awards['LOW TON']?.monthly ?? c.lowTonMonthly ?? 0,
            hatTricksMonthly:
              awards['HAT TRICK']?.monthly ??
              awards['Hat Trick']?.monthly ??
              c.hatTricksMonthly ??
              0,
            currentMonthPlayDays: json.data.currentMonthPlayDays ?? 0,
            prevMonthStats: json.data.prevMonthStats ?? null,
            prevRating: prev?.rating ?? null,
            prevStats01Avg: prev?.stats01Avg ?? null,
            prevStatsCriAvg: prev?.statsCriAvg ?? null,
            prevStatsPraAvg: prev?.statsPraAvg ?? null,
          });
        }
      } catch {
        showToast('スタッツの取得に失敗しました');
      }
    };
    fetchUserData();
    fetchMyDarts();
    fetchDlCache();
  }, [session, showToast]);

  const visibleCards = featureCards.filter((card) => !card.authOnly || session);

  if (status === 'loading') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {session?.user?.id && (
        <OnboardingDialog
          open={showOnboarding}
          userId={session.user.id}
          onClose={() => setShowOnboarding(false)}
        />
      )}

      {session ? (
        <Typography variant="h4" sx={{ mb: 3 }}>
          ダッシュボード
        </Typography>
      ) : (
        <GuestHero />
      )}

      {/* 1. 目標 */}
      {session && <GoalSection />}

      {/* 2. DARTSLIVEスタッツ */}
      {session &&
        dlCache &&
        dlCache.rating != null &&
        dlCache.stats01Avg != null &&
        dlCache.statsCriAvg != null && (
          <StatsOverviewCard
            rating={dlCache.rating}
            flight={dlCache.flight}
            stats01Avg={dlCache.stats01Avg}
            statsCriAvg={dlCache.statsCriAvg}
            statsPraAvg={dlCache.statsPraAvg}
            prevRating={dlCache.prevRating}
            prevStats01Avg={dlCache.prevStats01Avg}
            prevStatsCriAvg={dlCache.prevStatsCriAvg}
            prevStatsPraAvg={dlCache.prevStatsPraAvg}
            dBullMonthly={dlCache.dBullMonthly}
            sBullMonthly={dlCache.sBullMonthly}
            lowTonMonthly={dlCache.lowTonMonthly}
            hatTricksMonthly={dlCache.hatTricksMonthly}
            currentMonthPlayDays={dlCache.currentMonthPlayDays}
            prevMonthStats={dlCache.prevMonthStats}
          />
        )}

      {/* 3. 使用中セッティング */}
      {session && (
        <ActiveSettings activeSoftDart={activeSoftDart} activeSteelDart={activeSteelDart} />
      )}

      {/* 5. 機能カード */}
      <Grid container spacing={2} sx={{ mb: 5 }}>
        {visibleCards.map((card) => (
          <Grid size={{ xs: 6, sm: 6, md: 3 }} key={card.href}>
            <Card
              sx={{
                height: '100%',
                borderLeft: `3px solid ${card.accent}`,
                '&:hover': { boxShadow: 6, transform: 'translateY(-2px)' },
                transition: 'all 0.2s ease-in-out',
              }}
            >
              <CardActionArea
                component={Link}
                href={card.href}
                sx={{
                  height: '100%',
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Box sx={{ color: card.accent, mb: 1 }}>{card.icon}</Box>
                <CardContent sx={{ textAlign: 'center', p: 0, '&:last-child': { pb: 0 } }}>
                  <Typography variant="subtitle2" fontWeight="bold">
                    {card.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {card.description}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* 6. マイセッティング */}
      {session && myDarts.length > 0 && (
        <Box sx={{ mb: 5 }}>
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}
          >
            <Typography variant="h5">マイセッティング</Typography>
            <Button component={Link} href="/darts?mine=1" endIcon={<ArrowForwardIcon />}>
              すべて見る
            </Button>
          </Box>
          <Grid container spacing={3}>
            {myDarts
              .filter((d: Dart) => !d.isDraft)
              .slice(0, 3)
              .map((dart) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={dart.id}>
                  <DartCard dart={dart} />
                </Grid>
              ))}
          </Grid>
        </Box>
      )}

      {/* 7. 経験値 */}
      {session && <XpBar />}

      <XpNotificationDialog
        open={showXpNotification}
        notifications={xpNotifications}
        onClose={handleCloseXpNotification}
      />

      {levelUpInfo && (
        <LevelUpSnackbar
          open={!!levelUpInfo}
          level={levelUpInfo.level}
          rank={levelUpInfo.rank}
          onClose={() => setLevelUpInfo(null)}
        />
      )}
    </Container>
  );
}
