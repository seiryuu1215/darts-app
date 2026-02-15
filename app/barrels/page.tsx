'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Container,
  Grid,
  Typography,
  Box,
  TextField,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Paper,
  CircularProgress,
  Button,
  Collapse,
  InputAdornment,
  Pagination,
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  IconButton,
  Tabs,
  Tab,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import StraightenIcon from '@mui/icons-material/Straighten';
import QuizIcon from '@mui/icons-material/Quiz';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import RecommendIcon from '@mui/icons-material/AutoAwesome';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import Link from 'next/link';
import { collection, getDocs, query, orderBy, limit, where, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useSession } from 'next-auth/react';
import type { BarrelProduct, Dart, RankingPeriod } from '@/types';
import BarrelCard from '@/components/barrels/BarrelCard';
import BarrelCardSkeleton from '@/components/barrels/BarrelCardSkeleton';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import AffiliateBanner from '@/components/affiliate/AffiliateBanner';
import { BARREL_CUTS } from '@/lib/darts-parts';
import { recommendBarrels } from '@/lib/recommend-barrels';
import { toDartshiveAffiliateUrl, getAffiliateConfig } from '@/lib/affiliate';
import { getBarrelImageUrl } from '@/lib/image-proxy';

const ITEMS_PER_PAGE = 30;

interface RankedBarrel {
  rank: number;
  name: string;
  imageUrl: string | null;
  productUrl: string;
  price: string;
}

export default function BarrelsPage() {
  const { data: session } = useSession();
  const [barrels, setBarrels] = useState<BarrelProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [ranking, setRanking] = useState<RankedBarrel[]>([]);
  const [rankingTab, setRankingTab] = useState<RankingPeriod>('weekly');

  // ブックマーク状態（1回のfetchで取得）
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  // おすすめ関連
  const [myDarts, setMyDarts] = useState<Dart[]>([]);
  const [recommendType, setRecommendType] = useState<'soft' | 'steel'>('soft');
  const [recommendOpen, setRecommendOpen] = useState(true);
  const [recommendLoading, setRecommendLoading] = useState(false);

  // フィルター状態
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
      } catch (err) {
        console.error('バレル取得エラー:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBarrels();

    // ランキング取得
    const fetchRanking = async () => {
      try {
        const rq = query(collection(db, 'barrelRanking'), orderBy('rank', 'asc'), limit(20));
        const snapshot = await getDocs(rq);
        setRanking(snapshot.docs.map((d) => d.data() as RankedBarrel));
      } catch {
        // ランキングデータがない場合は無視
      }
    };
    fetchRanking();
  }, []);

  // ログインユーザーの自分のダーツを取得（おすすめ用）+ ブックマーク一括取得
  useEffect(() => {
    if (!session?.user?.id) return;
    setRecommendLoading(true);
    const fetchMyDarts = async () => {
      try {
        const q = query(collection(db, 'darts'), where('userId', '==', session.user.id));
        const snapshot = await getDocs(q);
        setMyDarts(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Dart[]);
      } catch (err) {
        console.error('マイダーツ取得エラー:', err);
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

  // ブランド一覧（動的生成）
  const brands = useMemo(() => {
    const set = new Set(barrels.map((b) => b.brand).filter(Boolean));
    return Array.from(set).sort();
  }, [barrels]);

  // カット一覧（プリセット + DBに存在するカット、個別タグに展開）
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

  // 商品名からソフト/スティールを判定
  const getBarrelType = (name: string): 'soft' | 'steel' | '' => {
    const n = name.toLowerCase();
    if (n.includes('steel') || n.includes('スティール')) return 'steel';
    if (n.includes('2ba') || n.includes('4ba')) return 'soft';
    return '';
  };

  // フィルタリング
  const filteredBarrels = useMemo(() => {
    return barrels.filter((b) => {
      // 販売状態フィルタ
      if (statusFilter === 'current' && b.isDiscontinued === true) return false;
      if (statusFilter === 'discontinued' && b.isDiscontinued !== true) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!b.name.toLowerCase().includes(q) && !b.brand.toLowerCase().includes(q)) return false;
      }
      if (selectedBrand && b.brand !== selectedBrand) return false;
      if (selectedType) {
        const barrelType = getBarrelType(b.name);
        if (barrelType !== selectedType) return false;
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

  // フィルター変更時にページを1に戻す
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

  // ページネーション
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

      {/* 人気バレルランキング */}
      {ranking.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <TrendingUpIcon color="primary" />
            <Typography variant="h6">人気バレル</Typography>
            <Typography variant="caption" color="text.secondary">
              ダーツハイブ売上ランキング
            </Typography>
          </Box>
          <Tabs
            value={rankingTab}
            onChange={(_, v) => setRankingTab(v)}
            sx={{ mb: 2, minHeight: 36, '& .MuiTab-root': { minHeight: 36, py: 0.5 } }}
          >
            <Tab label="週間" value="weekly" />
            <Tab label="月間" value="monthly" />
            <Tab label="総合" value="all" />
          </Tabs>
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              overflowX: 'auto',
              pb: 1,
              scrollSnapType: 'x mandatory',
              '&::-webkit-scrollbar': { height: 6 },
              '&::-webkit-scrollbar-thumb': { borderRadius: 3, bgcolor: 'action.disabled' },
            }}
          >
            {ranking.map((item) => (
              <Card
                key={item.rank}
                sx={{
                  minWidth: 150,
                  maxWidth: 150,
                  flexShrink: 0,
                  position: 'relative',
                  scrollSnapAlign: 'start',
                }}
              >
                <CardActionArea
                  href={toDartshiveAffiliateUrl(item.productUrl, getAffiliateConfig())}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ height: '100%' }}
                >
                  <Chip
                    label={`${item.rank}位`}
                    size="small"
                    color="primary"
                    sx={{ position: 'absolute', top: 8, left: 8, zIndex: 1, fontWeight: 'bold' }}
                  />
                  {item.imageUrl ? (
                    <CardMedia
                      component="img"
                      height="120"
                      image={getBarrelImageUrl(item.imageUrl) ?? ''}
                      alt={item.name}
                      sx={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <Box
                      sx={{
                        height: 120,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: 'action.hover',
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        No Image
                      </Typography>
                    </Box>
                  )}
                  <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                    <Typography variant="caption" noWrap display="block" fontWeight="bold">
                      {item.name}
                    </Typography>
                    {item.price && (
                      <Typography variant="caption" color="text.secondary" noWrap display="block">
                        {item.price}
                      </Typography>
                    )}
                  </CardContent>
                </CardActionArea>
              </Card>
            ))}
          </Box>
        </Box>
      )}

      {/* あなたへのおすすめバレル */}
      {session && myDarts.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Box
            sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, cursor: 'pointer' }}
            onClick={() => setRecommendOpen(!recommendOpen)}
          >
            <RecommendIcon color="primary" />
            <Typography variant="h6">あなたへのおすすめバレル</Typography>
            <IconButton size="small">
              {recommendOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
          <Collapse in={recommendOpen}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              登録済みのセッティングの重量・最大径・全長・カット・ブランドをもとに、近いスペックのバレルを提案しています。
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Chip
                label="ソフト"
                onClick={() => setRecommendType('soft')}
                color={recommendType === 'soft' ? 'primary' : 'default'}
                variant={recommendType === 'soft' ? 'filled' : 'outlined'}
                size="small"
              />
              <Chip
                label="スティール"
                onClick={() => setRecommendType('steel')}
                color={recommendType === 'steel' ? 'primary' : 'default'}
                variant={recommendType === 'steel' ? 'filled' : 'outlined'}
                size="small"
              />
            </Box>
            {recommendLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={32} />
              </Box>
            ) : recommendedBarrels.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                おすすめバレルが見つかりませんでした
              </Typography>
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  gap: 2,
                  overflowX: 'auto',
                  pb: 1,
                  scrollSnapType: 'x mandatory',
                  '&::-webkit-scrollbar': { height: 6 },
                  '&::-webkit-scrollbar-thumb': { borderRadius: 3, bgcolor: 'action.disabled' },
                }}
              >
                {recommendedBarrels.map((barrel) => (
                  <Box
                    key={barrel.id}
                    sx={{ minWidth: 240, maxWidth: 240, flexShrink: 0, scrollSnapAlign: 'start' }}
                  >
                    <BarrelCard
                      barrel={barrel}
                      isBookmarked={barrel.id ? bookmarkedIds.has(barrel.id) : false}
                    />
                  </Box>
                ))}
              </Box>
            )}
          </Collapse>
        </Box>
      )}

      <TextField
        placeholder="バレル名、ブランドで検索..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        fullWidth
        size="small"
        sx={{ mb: 2 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
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

      {/* ヒット件数表示 */}
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

      <Collapse in={filterOpen}>
        <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" gutterBottom>
              販売状態
            </Typography>
            <ToggleButtonGroup
              value={statusFilter}
              exclusive
              onChange={(_, v) => {
                if (v !== null) setStatusFilter(v);
              }}
              size="small"
            >
              <ToggleButton value="all">すべて</ToggleButton>
              <ToggleButton value="current">現行品のみ</ToggleButton>
              <ToggleButton value="discontinued">廃盤のみ</ToggleButton>
            </ToggleButtonGroup>
          </Box>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl fullWidth size="small">
                <InputLabel>タイプ</InputLabel>
                <Select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  label="タイプ"
                >
                  <MenuItem value="">すべて</MenuItem>
                  <MenuItem value="soft">ソフト (2BA/4BA)</MenuItem>
                  <MenuItem value="steel">スティール</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl fullWidth size="small">
                <InputLabel>ブランド</InputLabel>
                <Select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  label="ブランド"
                >
                  <MenuItem value="">すべて</MenuItem>
                  {brands.map((brand) => (
                    <MenuItem key={brand} value={brand}>
                      {brand}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl fullWidth size="small">
                <InputLabel>カット</InputLabel>
                <Select
                  value={selectedCut}
                  onChange={(e) => setSelectedCut(e.target.value)}
                  label="カット"
                >
                  <MenuItem value="">すべて</MenuItem>
                  {cuts.map((cut) => (
                    <MenuItem key={cut} value={cut}>
                      {cut}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Typography variant="body2" gutterBottom>
                重量: {weightRange[0]}g 〜 {weightRange[1]}g
              </Typography>
              <Slider
                value={weightRange}
                onChange={(_, v) => setWeightRange(v as [number, number])}
                min={10}
                max={30}
                step={0.5}
                valueLabelDisplay="auto"
                valueLabelFormat={(v) => `${v}g`}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Typography variant="body2" gutterBottom>
                最大径: {diameterRange[0]}mm 〜 {diameterRange[1]}mm
              </Typography>
              <Slider
                value={diameterRange}
                onChange={(_, v) => setDiameterRange(v as [number, number])}
                min={4}
                max={10}
                step={0.1}
                valueLabelDisplay="auto"
                valueLabelFormat={(v) => `${v}mm`}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Typography variant="body2" gutterBottom>
                全長: {lengthRange[0]}mm 〜 {lengthRange[1]}mm
              </Typography>
              <Slider
                value={lengthRange}
                onChange={(_, v) => setLengthRange(v as [number, number])}
                min={20}
                max={60}
                step={0.5}
                valueLabelDisplay="auto"
                valueLabelFormat={(v) => `${v}mm`}
              />
            </Grid>
          </Grid>
        </Paper>
      </Collapse>

      {loading ? (
        <Grid container spacing={2}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Grid size={{ xs: 6, sm: 4, md: 3 }} key={i}>
              <BarrelCardSkeleton />
            </Grid>
          ))}
        </Grid>
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
