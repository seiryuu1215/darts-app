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
  CardMedia,
  Chip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HistoryIcon from '@mui/icons-material/History';
import StraightenIcon from '@mui/icons-material/Straighten';
import BarChartIcon from '@mui/icons-material/BarChart';
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
import { useToast } from '@/components/ToastProvider';
import type { Dart } from '@/types';

import { getFlightColor, COLOR_01, COLOR_CRICKET, COLOR_COUNTUP } from '@/lib/dartslive-colors';

interface DartsliveCache {
  rating: number | null;
  flight: string;
  cardName: string;
  stats01Avg: number | null;
  statsCriAvg: number | null;
  statsPraAvg: number | null;
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
}

const featureCards: FeatureCard[] = [
  {
    title: 'バレル検索',
    description: 'ブランド・スペックで絞り込み',
    href: '/barrels',
    icon: <SearchIcon sx={{ fontSize: 40 }} />,
  },
  {
    title: 'シャフト早見表',
    description: 'シャフト重量を一覧で比較',
    href: '/reference',
    icon: <StraightenIcon sx={{ fontSize: 40 }} />,
  },
  {
    title: 'シミュレーター',
    description: 'バレル形状を可視化・比較',
    href: '/barrels/simulator',
    icon: <ViewInArIcon sx={{ fontSize: 40 }} />,
  },
  {
    title: 'バレル診断',
    description: '質問に答えておすすめを探す',
    href: '/barrels/quiz',
    icon: <QuizIcon sx={{ fontSize: 40 }} />,
  },
  {
    title: 'スタッツ',
    description: 'レーティング推移・実績を確認',
    href: '/stats',
    icon: <BarChartIcon sx={{ fontSize: 40 }} />,
    authOnly: true,
  },
  {
    title: 'おすすめツール',
    description: '併用で便利な外部ツール紹介',
    href: '/tools',
    icon: <BuildIcon sx={{ fontSize: 40 }} />,
  },
  {
    title: 'セッティング比較',
    description: '自分のセッティングを並べて比較',
    href: '/darts/compare',
    icon: <CompareArrowsIcon sx={{ fontSize: 40 }} />,
    authOnly: true,
  },
  {
    title: 'ブックマーク',
    description: '保存したバレル・セッティング',
    href: '/bookmarks',
    icon: <BookmarkIcon sx={{ fontSize: 40 }} />,
    authOnly: true,
  },
];

export default function HomePage() {
  const { data: session } = useSession();
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
          setDlCache({
            rating: c.rating,
            flight: c.flight,
            cardName: c.cardName,
            stats01Avg: c.stats01Avg,
            statsCriAvg: c.statsCriAvg,
            statsPraAvg: c.statsPraAvg,
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

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {session?.user?.id && (
        <OnboardingDialog
          open={showOnboarding}
          userId={session.user.id}
          onClose={() => setShowOnboarding(false)}
        />
      )}

      <Typography variant="h4" sx={{ mb: 3 }}>
        ダッシュボード
      </Typography>

      {/* 1. 目標 */}
      {session && <GoalSection />}

      {/* 2. レーティング — DARTSLIVE Stats Summary */}
      {session &&
        dlCache &&
        (() => {
          const fc = getFlightColor(dlCache.flight);
          return (
            <Box sx={{ mb: 4 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 1.5,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BarChartIcon color="primary" />
                  <Typography variant="h5">DARTSLIVE Stats</Typography>
                </Box>
                <Button component={Link} href="/stats" endIcon={<ArrowForwardIcon />} size="small">
                  詳細
                </Button>
              </Box>
              <Card
                component={Link}
                href="/stats"
                sx={{ textDecoration: 'none', borderRadius: 2, overflow: 'hidden' }}
              >
                <Box sx={{ display: 'flex' }}>
                  {[
                    {
                      label: `Rt`,
                      sub: dlCache.flight,
                      value: dlCache.rating?.toFixed(2) ?? '--',
                      color: fc,
                    },
                    { label: '01', value: dlCache.stats01Avg?.toFixed(2) ?? '--', color: COLOR_01 },
                    {
                      label: 'Cricket',
                      value: dlCache.statsCriAvg?.toFixed(2) ?? '--',
                      color: COLOR_CRICKET,
                    },
                    {
                      label: 'CU',
                      value: dlCache.statsPraAvg?.toFixed(0) ?? '--',
                      color: COLOR_COUNTUP,
                    },
                  ].map((item) => (
                    <Box
                      key={item.label}
                      sx={{
                        flex: 1,
                        textAlign: 'center',
                        py: 1.5,
                        minHeight: 64,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        borderTop: `3px solid ${item.color}`,
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          color: item.color,
                          fontWeight: 'bold',
                          display: 'block',
                          lineHeight: 1.2,
                        }}
                      >
                        {item.label}
                        {item.sub && (
                          <Typography
                            component="span"
                            variant="caption"
                            sx={{ ml: 0.5, opacity: 0.7 }}
                          >
                            {item.sub}
                          </Typography>
                        )}
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', lineHeight: 1.3 }}>
                        {item.value}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Card>
            </Box>
          );
        })()}

      {/* 3. 使用中セッティング */}
      {session && (
        <Box sx={{ mb: 4 }}>
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}
          >
            <Typography variant="h5">使用中セッティング</Typography>
            <Button component={Link} href="/darts/history" size="small" startIcon={<HistoryIcon />}>
              履歴
            </Button>
          </Box>
          <Grid container spacing={2}>
            {[
              { label: 'ソフト', dart: activeSoftDart, color: 'info' as const },
              { label: 'スティール', dart: activeSteelDart, color: 'default' as const },
            ].map(({ label, dart: activeDart, color }) => (
              <Grid size={{ xs: 12, sm: 6 }} key={label}>
                {activeDart ? (
                  <Card
                    component={Link}
                    href={`/darts/${activeDart.id}`}
                    sx={{
                      textDecoration: 'none',
                      display: 'flex',
                      flexDirection: 'row',
                      height: 110,
                      borderLeft: 4,
                      borderColor: color === 'info' ? 'info.main' : 'grey.500',
                    }}
                  >
                    {activeDart.imageUrls.length > 0 ? (
                      <CardMedia
                        component="img"
                        image={activeDart.imageUrls[0]}
                        alt={activeDart.title}
                        sx={{ width: 100, objectFit: 'cover', flexShrink: 0 }}
                      />
                    ) : (
                      <Box
                        component="img"
                        src="/dart-placeholder.svg"
                        alt="No Image"
                        sx={{ width: 100, height: '100%', flexShrink: 0, objectFit: 'cover' }}
                      />
                    )}
                    <CardContent
                      sx={{
                        py: 1.5,
                        px: 2,
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        minWidth: 0,
                        '&:last-child': { pb: 1.5 },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                        <CheckCircleIcon color="success" sx={{ fontSize: 16 }} />
                        <Chip
                          label={label}
                          size="small"
                          color={color}
                          sx={{ height: 20, '& .MuiChip-label': { px: 1, fontSize: '0.7rem' } }}
                        />
                      </Box>
                      <Typography variant="subtitle2" noWrap>
                        {activeDart.barrel.name}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', my: 0.3 }}>
                        <Chip
                          label={`${activeDart.barrel.weight}g`}
                          size="small"
                          variant="outlined"
                          sx={{ height: 18, '& .MuiChip-label': { px: 0.7, fontSize: '0.65rem' } }}
                        />
                        {activeDart.barrel.maxDiameter && (
                          <Chip
                            label={`Φ${activeDart.barrel.maxDiameter}mm`}
                            size="small"
                            variant="outlined"
                            sx={{
                              height: 18,
                              '& .MuiChip-label': { px: 0.7, fontSize: '0.65rem' },
                            }}
                          />
                        )}
                      </Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        noWrap
                        sx={{ opacity: 0.7 }}
                      >
                        {[activeDart.tip.name, activeDart.shaft.name, activeDart.flight.name]
                          .filter(Boolean)
                          .join(' / ')}
                      </Typography>
                    </CardContent>
                  </Card>
                ) : (
                  <Card
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      height: 110,
                      px: 2,
                      borderLeft: 4,
                      borderColor: color === 'info' ? 'info.main' : 'grey.500',
                    }}
                  >
                    <Chip label={label} size="small" color={color} sx={{ mr: 1.5 }} />
                    <Typography variant="body2" color="text.secondary">
                      未設定
                    </Typography>
                  </Card>
                )}
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* 4. ウィジェット */}
      <Grid container spacing={3} sx={{ mb: 5 }}>
        {visibleCards.map((card) => (
          <Grid size={{ xs: 6, sm: 6, md: 3 }} key={card.href}>
            <Card
              sx={{ height: '100%', '&:hover': { boxShadow: 6, transform: 'translateY(-2px)' } }}
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
                <Box sx={{ color: 'primary.main', mb: 1 }}>{card.icon}</Box>
                <CardContent sx={{ textAlign: 'center', p: 0, '&:last-child': { pb: 0 } }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {card.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {card.description}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* 5. マイセッティング */}
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

      {/* 6. 経験値 */}
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
