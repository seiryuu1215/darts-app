'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Container,
  Grid,
  Typography,
  Box,
  TextField,
  Chip,
  Paper,
  Button,
  InputAdornment,
  Pagination,
  Alert,
} from '@mui/material';
import StraightenIcon from '@mui/icons-material/Straighten';
import QuizIcon from '@mui/icons-material/Quiz';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import RecommendIcon from '@mui/icons-material/AutoAwesome';
import Link from 'next/link';
import { collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useSession } from 'next-auth/react';
import type { BarrelProduct, Dart, RankingPeriod } from '@/types';
import BarrelCard from '@/components/barrels/BarrelCard';
import BarrelCardSkeleton from '@/components/barrels/BarrelCardSkeleton';
import BarrelRankingSection from '@/components/barrels/BarrelRankingSection';
import BarrelRecommendSection from '@/components/barrels/BarrelRecommendSection';
import BarrelFilterPanel from '@/components/barrels/BarrelFilterPanel';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import AffiliateBanner from '@/components/affiliate/AffiliateBanner';
import { BARREL_CUTS } from '@/lib/darts-parts';
import { recommendBarrels } from '@/lib/recommend-barrels';

const ITEMS_PER_PAGE = 30;

interface RankedBarrel {
  rank: number;
  name: string;
  imageUrl: string | null;
  productUrl: string;
  price: string;
  period?: string;
}

export default function BarrelsPage() {
  const { data: session } = useSession();
  const [barrels, setBarrels] = useState<BarrelProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [ranking, setRanking] = useState<RankedBarrel[]>([]);
  const [rankingTab, setRankingTab] = useState<RankingPeriod>('weekly');
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [myDarts, setMyDarts] = useState<Dart[]>([]);
  const [recommendType, setRecommendType] = useState<'soft' | 'steel'>('soft');
  const [recommendLoading, setRecommendLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [weightRange, setWeightRange] = useState<[number, number]>([18, 20]);
  const [diameterRange, setDiameterRange] = useState<[number, number]>([6.5, 7.5]);
  const [lengthRange, setLengthRange] = useState<[number, number]>([43, 48]);
  const [selectedCut, setSelectedCut] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'current' | 'discontinued'>('current');

  useEffect(() => {
    const fetchBarrels = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'barrels'));
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as BarrelProduct[];
        setBarrels(data);
      } catch {
        setError('バレルデータの読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };
    fetchBarrels();
  }, []);

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        const rq = query(
          collection(db, 'barrelRanking'),
          where('period', '==', rankingTab),
          orderBy('rank', 'asc'),
          limit(20),
        );
        const snapshot = await getDocs(rq);
        if (snapshot.size > 0) {
          setRanking(snapshot.docs.map((d) => d.data() as RankedBarrel));
          return;
        }
      } catch {
        // composite index未作成の場合はフォールバック
      }
      try {
        const fallback = query(collection(db, 'barrelRanking'), orderBy('rank', 'asc'), limit(20));
        const fbSnap = await getDocs(fallback);
        setRanking(fbSnap.docs.map((d) => d.data() as RankedBarrel));
      } catch {
        // ランキングデータがない場合は無視
      }
    };
    fetchRanking();
  }, [rankingTab]);

  useEffect(() => {
    if (!session?.user?.id) return;
    setRecommendLoading(true);
    const fetchMyDarts = async () => {
      try {
        const q = query(collection(db, 'darts'), where('userId', '==', session.user.id));
        const snapshot = await getDocs(q);
        setMyDarts(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Dart[]);
      } catch {
        // おすすめ用データ取得失敗は無視
      } finally {
        setRecommendLoading(false);
      }
    };
    const fetchBookmarks = async () => {
      try {
        const bmSnap = await getDocs(collection(db, 'users', session.user.id, 'barrelBookmarks'));
        setBookmarkedIds(new Set(bmSnap.docs.map((d) => d.id)));
      } catch {
        /* ignore */
      }
    };
    fetchMyDarts();
    fetchBookmarks();
  }, [session]);

  const brands = useMemo(() => {
    const set = new Set(barrels.map((b) => b.brand).filter(Boolean));
    return Array.from(set).sort();
  }, [barrels]);

  const cuts = useMemo(() => {
    const dbCuts = barrels
      .map((b) => b.cut)
      .filter(Boolean)
      .flatMap((c) =>
        c
          .split(/[,+＋]/)
          .map((s) => s.trim())
          .filter(Boolean),
      );
    const set = new Set([...BARREL_CUTS, ...dbCuts]);
    return Array.from(set);
  }, [barrels]);

  const getBarrelType = (name: string): 'soft' | 'steel' | '' => {
    const n = name.toLowerCase();
    if (n.includes('steel') || n.includes('スティール')) return 'steel';
    if (n.includes('2ba') || n.includes('4ba')) return 'soft';
    return '';
  };

  const filteredBarrels = useMemo(() => {
    return barrels
      .filter((b) => {
        if (statusFilter === 'current' && b.isDiscontinued === true) return false;
        if (statusFilter === 'discontinued' && b.isDiscontinued !== true) return false;
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          if (!b.name.toLowerCase().includes(q) && !b.brand.toLowerCase().includes(q)) return false;
        }
        if (selectedBrand && b.brand !== selectedBrand) return false;
        if (selectedType) {
          if (getBarrelType(b.name) !== selectedType) return false;
        }
        if (b.weight < weightRange[0] || b.weight > weightRange[1]) return false;
        if (b.maxDiameter && (b.maxDiameter < diameterRange[0] || b.maxDiameter > diameterRange[1]))
          return false;
        if (b.length && (b.length < lengthRange[0] || b.length > lengthRange[1])) return false;
        if (selectedCut && b.cut) {
          const cutTags = b.cut.split(/[,+＋]/).map((s) => s.trim());
          if (!cutTags.includes(selectedCut)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const aTime = a.scrapedAt?.seconds ?? 0;
        const bTime = b.scrapedAt?.seconds ?? 0;
        return bTime - aTime;
      });
  }, [
    barrels,
    searchQuery,
    selectedBrand,
    selectedType,
    statusFilter,
    weightRange,
    diameterRange,
    lengthRange,
    selectedCut,
  ]);

  useEffect(() => {
    setPage(1);
  }, [
    searchQuery,
    selectedBrand,
    selectedType,
    statusFilter,
    weightRange,
    diameterRange,
    lengthRange,
    selectedCut,
  ]);

  const totalPages = Math.ceil(filteredBarrels.length / ITEMS_PER_PAGE);
  const paginatedBarrels = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredBarrels.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredBarrels, page]);

  const recommendedBarrels = useMemo(() => {
    if (myDarts.length === 0 || barrels.length === 0) return [];
    return recommendBarrels(myDarts, barrels, recommendType, 50);
  }, [myDarts, barrels, recommendType]);

  const activeFilterCount = [
    selectedBrand,
    selectedType,
    statusFilter !== 'current',
    weightRange[0] !== 18 || weightRange[1] !== 20,
    diameterRange[0] !== 6.5 || diameterRange[1] !== 7.5,
    lengthRange[0] !== 43 || lengthRange[1] !== 48,
    selectedCut,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedBrand('');
    setSelectedType('');
    setStatusFilter('current');
    setWeightRange([18, 20]);
    setDiameterRange([6.5, 7.5]);
    setLengthRange([43, 48]);
    setSelectedCut('');
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Breadcrumbs items={[{ label: 'バレル検索' }]} />
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 3,
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Typography variant="h4">バレル検索</Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            component={Link}
            href="/barrels/recommend"
            variant="outlined"
            startIcon={<RecommendIcon />}
            size="small"
          >
            おすすめ
          </Button>
          <Button
            component={Link}
            href="/barrels/simulator"
            variant="outlined"
            startIcon={<StraightenIcon />}
            size="small"
          >
            シミュレーター
          </Button>
          <Button
            component={Link}
            href="/barrels/quiz"
            variant="outlined"
            startIcon={<QuizIcon />}
            size="small"
          >
            診断クイズ
          </Button>
        </Box>
      </Box>

      <BarrelRankingSection ranking={ranking} rankingTab={rankingTab} onTabChange={setRankingTab} />

      {session && myDarts.length > 0 && (
        <BarrelRecommendSection
          recommendedBarrels={recommendedBarrels}
          recommendType={recommendType}
          onTypeChange={setRecommendType}
          loading={recommendLoading}
          bookmarkedIds={bookmarkedIds}
        />
      )}

      <TextField
        placeholder="バレル名、ブランドで検索..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        fullWidth
        size="small"
        sx={{ mb: 2 }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          },
        }}
      />

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        <Button
          variant={filterOpen ? 'contained' : 'outlined'}
          startIcon={<FilterListIcon />}
          onClick={() => setFilterOpen(!filterOpen)}
          size="small"
        >
          フィルター
          {activeFilterCount > 0 && (
            <Chip
              label={activeFilterCount}
              size="small"
              color="primary"
              sx={{ ml: 1, height: 20, minWidth: 20 }}
            />
          )}
        </Button>
        {activeFilterCount > 0 && (
          <Button size="small" onClick={clearFilters}>
            クリア
          </Button>
        )}
      </Box>

      <Paper
        variant="outlined"
        sx={{
          p: 1.5,
          mb: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
          <Typography variant="h6" component="span" color="primary">
            {filteredBarrels.length.toLocaleString()}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            件ヒット
            {filteredBarrels.length !== barrels.length &&
              ` (全${barrels.length.toLocaleString()}件中)`}
          </Typography>
        </Box>
        {totalPages > 1 && (
          <Typography variant="body2" color="text.secondary">
            {(page - 1) * ITEMS_PER_PAGE + 1}〜
            {Math.min(page * ITEMS_PER_PAGE, filteredBarrels.length)}件目を表示
          </Typography>
        )}
      </Paper>

      <BarrelFilterPanel
        open={filterOpen}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        selectedType={selectedType}
        onTypeChange={setSelectedType}
        selectedBrand={selectedBrand}
        onBrandChange={setSelectedBrand}
        brands={brands}
        selectedCut={selectedCut}
        onCutChange={setSelectedCut}
        cuts={cuts}
        weightRange={weightRange}
        onWeightChange={setWeightRange}
        diameterRange={diameterRange}
        onDiameterChange={setDiameterRange}
        lengthRange={lengthRange}
        onLengthChange={setLengthRange}
      />

      {loading ? (
        <Grid container spacing={2}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Grid size={{ xs: 6, sm: 4, md: 3 }} key={i}>
              <BarrelCardSkeleton />
            </Grid>
          ))}
        </Grid>
      ) : error ? (
        <Alert severity="error" sx={{ my: 4 }}>
          {error}
        </Alert>
      ) : filteredBarrels.length === 0 ? (
        <Typography color="text.secondary" textAlign="center" sx={{ py: 8 }}>
          {barrels.length === 0
            ? 'バレルデータがありません。スクレイピングスクリプトを実行してください。'
            : '条件に一致するバレルがありません'}
        </Typography>
      ) : (
        <>
          <Grid container spacing={2}>
            {paginatedBarrels.map((barrel) => (
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={barrel.id}>
                <BarrelCard
                  barrel={barrel}
                  isBookmarked={barrel.id ? bookmarkedIds.has(barrel.id) : undefined}
                />
              </Grid>
            ))}
          </Grid>

          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, v) => {
                  setPage(v);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                color="primary"
                size="large"
                showFirstButton
                showLastButton
              />
            </Box>
          )}
        </>
      )}

      <Box sx={{ mt: 4 }}>
        <AffiliateBanner />
      </Box>
    </Container>
  );
}
