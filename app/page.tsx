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
  CircularProgress,
  Button,
  CardMedia,
  Chip,
} from '@mui/material';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import SearchIcon from '@mui/icons-material/Search';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import StraightenIcon from '@mui/icons-material/Straighten';
import ArticleIcon from '@mui/icons-material/Article';
import BarChartIcon from '@mui/icons-material/BarChart';
import { collection, getDocs, orderBy, query, limit, doc, getDoc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import DartCard from '@/components/darts/DartCard';
import ArticleCard from '@/components/articles/ArticleCard';
import type { Dart, Article } from '@/types';

// DARTSLIVE colors
const COLOR_01 = '#e53935';
const COLOR_CRICKET = '#1e88e5';
const COLOR_COUNTUP = '#43a047';
const FLIGHT_COLORS: Record<string, string> = {
  C: '#9e9e9e', CC: '#78909c', B: '#66bb6a', BB: '#29b6f6',
  A: '#ab47bc', AA: '#ff7043', SA: '#e53935',
};

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
    title: 'みんなのセッティング',
    description: '他のプレイヤーのセッティングを見る',
    href: '/darts',
    icon: <FormatListBulletedIcon sx={{ fontSize: 40 }} />,
  },
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
    title: '記事',
    description: 'ダーツの知見・ノウハウ記事',
    href: '/articles',
    icon: <ArticleIcon sx={{ fontSize: 40 }} />,
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
  const [recentDarts, setRecentDarts] = useState<Dart[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSoftDart, setActiveSoftDart] = useState<Dart | null>(null);
  const [activeSteelDart, setActiveSteelDart] = useState<Dart | null>(null);
  const [myDarts, setMyDarts] = useState<Dart[]>([]);
  const [featuredArticles, setFeaturedArticles] = useState<Article[]>([]);
  const [dlCache, setDlCache] = useState<DartsliveCache | null>(null);

  useEffect(() => {
    if (!session?.user?.id) return;
    const fetchActiveDarts = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', session.user.id));
        if (!userDoc.exists()) return;
        const userData = userDoc.data();
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
        console.error('使用中セッティング取得エラー:', err);
      }
    };
    const fetchMyDarts = async () => {
      try {
        const q = query(
          collection(db, 'darts'),
          where('userId', '==', session.user.id),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        setMyDarts(
          snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Dart[]
        );
      } catch (err) {
        console.error('マイセッティング取得エラー:', err);
      }
    };
    const fetchDlCache = async () => {
      try {
        const cacheDoc = await getDoc(doc(db, 'users', session.user.id, 'dartsliveCache', 'latest'));
        if (cacheDoc.exists()) setDlCache(cacheDoc.data() as DartsliveCache);
      } catch { /* ignore */ }
    };
    fetchActiveDarts();
    fetchMyDarts();
    fetchDlCache();
  }, [session]);

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const q = query(
          collection(db, 'darts'),
          orderBy('createdAt', 'desc'),
          limit(10)
        );
        const snapshot = await getDocs(q);
        setRecentDarts(
          snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Dart[]
        );
      } catch (err) {
        console.error('最新セッティング取得エラー:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecent();
  }, []);

  // おすすめ記事取得
  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const q = query(
          collection(db, 'articles'),
          where('isFeatured', '==', true),
          where('isDraft', '==', false)
        );
        const snapshot = await getDocs(q);
        setFeaturedArticles(
          snapshot.docs
            .map((d) => ({ id: d.id, ...d.data() }) as Article)
            .slice(0, 3)
        );
      } catch {
        // おすすめ記事がない場合は無視
      }
    };
    fetchFeatured();
  }, []);

  const visibleCards = featureCards.filter(
    (card) => !card.authOnly || session
  );

  // みんなのセッティング: 自分のを除外
  const othersRecentDarts = session?.user?.id
    ? recentDarts.filter((d) => d.userId !== session.user.id).slice(0, 3)
    : recentDarts.slice(0, 3);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        ダッシュボード
      </Typography>

      {session && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ mb: 2 }}>使用中セッティング</Typography>
          <Grid container spacing={2}>
            {([
              { label: 'ソフト', dart: activeSoftDart, color: 'info' as const },
              { label: 'スティール', dart: activeSteelDart, color: 'default' as const },
            ]).map(({ label, dart: activeDart, color }) => (
              <Grid size={{ xs: 12, sm: 6 }} key={label}>
                {activeDart ? (
                  <Card
                    component={Link}
                    href={`/darts/${activeDart.id}`}
                    sx={{ textDecoration: 'none', display: 'flex', flexDirection: 'row', height: 100, borderLeft: 4, borderColor: color === 'info' ? 'info.main' : 'grey.500' }}
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
                    <CardContent sx={{ py: 1.5, px: 2, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0, '&:last-child': { pb: 1.5 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                        <CheckCircleIcon color="success" sx={{ fontSize: 16 }} />
                        <Chip label={label} size="small" color={color} sx={{ height: 20, '& .MuiChip-label': { px: 1, fontSize: '0.7rem' } }} />
                      </Box>
                      <Typography variant="subtitle2" noWrap>{activeDart.title}</Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {activeDart.barrel.brand} {activeDart.barrel.name} ({activeDart.barrel.weight}g)
                      </Typography>
                    </CardContent>
                  </Card>
                ) : (
                  <Card sx={{ display: 'flex', alignItems: 'center', height: 100, px: 2, borderLeft: 4, borderColor: color === 'info' ? 'info.main' : 'grey.500' }}>
                    <Chip label={label} size="small" color={color} sx={{ mr: 1.5 }} />
                    <Typography variant="body2" color="text.secondary">未設定</Typography>
                  </Card>
                )}
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* DARTSLIVE Stats Summary */}
      {session && dlCache && (
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BarChartIcon color="primary" />
              <Typography variant="h5">DARTSLIVE Stats</Typography>
            </Box>
            <Button component={Link} href="/stats" endIcon={<ArrowForwardIcon />} size="small">詳細</Button>
          </Box>
          <Card
            component={Link}
            href="/stats"
            sx={{
              textDecoration: 'none',
              p: 2,
              borderRadius: 2,
              background: `linear-gradient(135deg, ${FLIGHT_COLORS[dlCache.flight] || '#ff9800'}15, transparent)`,
              border: `1px solid ${FLIGHT_COLORS[dlCache.flight] || '#ff9800'}33`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Chip
                label={`Rt ${dlCache.rating?.toFixed(2) ?? '--'}`}
                size="small"
                sx={{
                  bgcolor: FLIGHT_COLORS[dlCache.flight] || '#ff9800',
                  color: '#fff',
                  fontWeight: 'bold',
                }}
              />
              <Chip label={dlCache.flight} size="small" variant="outlined" sx={{ borderColor: FLIGHT_COLORS[dlCache.flight], color: FLIGHT_COLORS[dlCache.flight] }} />
              {dlCache.prevRating != null && dlCache.rating != null && dlCache.rating !== dlCache.prevRating && (
                <Typography variant="caption" sx={{ color: dlCache.rating > dlCache.prevRating ? '#4caf50' : '#f44336', fontWeight: 'bold' }}>
                  {dlCache.rating > dlCache.prevRating ? '+' : ''}{(dlCache.rating - dlCache.prevRating).toFixed(2)}
                </Typography>
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Box>
                <Typography variant="caption" sx={{ color: COLOR_01, fontWeight: 'bold' }}>01</Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  {dlCache.stats01Avg?.toFixed(2) ?? '--'}
                  {dlCache.prevStats01Avg != null && dlCache.stats01Avg != null && dlCache.stats01Avg !== dlCache.prevStats01Avg && (
                    <Typography component="span" variant="caption" sx={{ color: dlCache.stats01Avg > dlCache.prevStats01Avg ? '#4caf50' : '#f44336', ml: 0.5 }}>
                      {dlCache.stats01Avg > dlCache.prevStats01Avg ? '+' : ''}{(dlCache.stats01Avg - dlCache.prevStats01Avg).toFixed(2)}
                    </Typography>
                  )}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: COLOR_CRICKET, fontWeight: 'bold' }}>CRICKET</Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  {dlCache.statsCriAvg?.toFixed(2) ?? '--'}
                  {dlCache.prevStatsCriAvg != null && dlCache.statsCriAvg != null && dlCache.statsCriAvg !== dlCache.prevStatsCriAvg && (
                    <Typography component="span" variant="caption" sx={{ color: dlCache.statsCriAvg > dlCache.prevStatsCriAvg ? '#4caf50' : '#f44336', ml: 0.5 }}>
                      {dlCache.statsCriAvg > dlCache.prevStatsCriAvg ? '+' : ''}{(dlCache.statsCriAvg - dlCache.prevStatsCriAvg).toFixed(2)}
                    </Typography>
                  )}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: COLOR_COUNTUP, fontWeight: 'bold' }}>COUNT-UP</Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  {dlCache.statsPraAvg?.toFixed(0) ?? '--'}
                  {dlCache.prevStatsPraAvg != null && dlCache.statsPraAvg != null && dlCache.statsPraAvg !== dlCache.prevStatsPraAvg && (
                    <Typography component="span" variant="caption" sx={{ color: dlCache.statsPraAvg > dlCache.prevStatsPraAvg ? '#4caf50' : '#f44336', ml: 0.5 }}>
                      {dlCache.statsPraAvg > dlCache.prevStatsPraAvg ? '+' : ''}{(dlCache.statsPraAvg - dlCache.prevStatsPraAvg).toFixed(0)}
                    </Typography>
                  )}
                </Typography>
              </Box>
            </Box>
          </Card>
        </Box>
      )}

      <Grid container spacing={3} sx={{ mb: 5 }}>
        {visibleCards.map((card) => (
          <Grid size={{ xs: 6, sm: 6, md: 3 }} key={card.href}>
            <Card sx={{ height: '100%' }}>
              <CardActionArea
                component={Link}
                href={card.href}
                sx={{ height: '100%', p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
              >
                <Box sx={{ color: 'primary.main', mb: 1 }}>
                  {card.icon}
                </Box>
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

      {/* おすすめ記事 */}
      {featuredArticles.length > 0 && (
        <Box sx={{ mb: 5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AutoAwesomeIcon color="primary" />
              <Typography variant="h5">おすすめ記事</Typography>
            </Box>
            <Button
              component={Link}
              href="/articles"
              endIcon={<ArrowForwardIcon />}
            >
              すべての記事
            </Button>
          </Box>
          <Grid container spacing={3}>
            {featuredArticles.map((article) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={article.id}>
                <ArticleCard article={article} />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {session && myDarts.length > 0 && (
        <Box sx={{ mb: 5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5">マイセッティング</Typography>
            <Button
              component={Link}
              href="/darts?mine=1"
              endIcon={<ArrowForwardIcon />}
            >
              すべて見る
            </Button>
          </Box>
          <Grid container spacing={3}>
            {myDarts.filter((d: Dart) => !d.isDraft).slice(0, 3).map((dart) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={dart.id}>
                <DartCard dart={dart} />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">みんなのセッティング</Typography>
        <Button
          component={Link}
          href="/darts"
          endIcon={<ArrowForwardIcon />}
        >
          もっと見る
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : othersRecentDarts.length === 0 ? (
        <Typography color="text.secondary" textAlign="center" sx={{ py: 8 }}>
          まだセッティングが登録されていません
        </Typography>
      ) : (
        <Grid container spacing={3}>
          {othersRecentDarts.map((dart) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={dart.id}>
              <DartCard dart={dart} />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}
