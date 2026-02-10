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
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import RecommendIcon from '@mui/icons-material/AutoAwesome';
import Link from 'next/link';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { BarrelProduct } from '@/types';
import BarrelCard from '@/components/barrels/BarrelCard';
import { BARREL_CUTS } from '@/lib/darts-parts';

const ITEMS_PER_PAGE = 30;

interface RankedBarrel {
  rank: number;
  name: string;
  imageUrl: string | null;
  productUrl: string;
  price: string;
}

export default function BarrelsPage() {
  const [barrels, setBarrels] = useState<BarrelProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [ranking, setRanking] = useState<RankedBarrel[]>([]);

  // フィルター状態
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [weightRange, setWeightRange] = useState<[number, number]>([18, 20]);
  const [diameterRange, setDiameterRange] = useState<[number, number]>([6.5, 7.5]);
  const [lengthRange, setLengthRange] = useState<[number, number]>([43, 48]);
  const [selectedCut, setSelectedCut] = useState('');
  const [selectedType, setSelectedType] = useState('');

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
        const rq = query(collection(db, 'barrelRanking'), orderBy('rank', 'asc'), limit(50));
        const snapshot = await getDocs(rq);
        setRanking(snapshot.docs.map((d) => d.data() as RankedBarrel));
      } catch {
        // ランキングデータがない場合は無視
      }
    };
    fetchRanking();
  }, []);

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
      .flatMap((c) => c.split(/[,+＋]/).map((s) => s.trim()).filter(Boolean));
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
      if (b.maxDiameter && (b.maxDiameter < diameterRange[0] || b.maxDiameter > diameterRange[1])) return false;
      if (b.length && (b.length < lengthRange[0] || b.length > lengthRange[1])) return false;
      if (selectedCut && b.cut) {
        const cutTags = b.cut.split(/[,+＋]/).map((s) => s.trim());
        if (!cutTags.includes(selectedCut)) return false;
      }
      return true;
    });
  }, [barrels, searchQuery, selectedBrand, selectedType, weightRange, diameterRange, lengthRange, selectedCut]);

  // フィルター変更時にページを1に戻す
  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedBrand, selectedType, weightRange, diameterRange, lengthRange, selectedCut]);

  // ページネーション
  const totalPages = Math.ceil(filteredBarrels.length / ITEMS_PER_PAGE);
  const paginatedBarrels = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredBarrels.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredBarrels, page]);

  const activeFilterCount = [
    selectedBrand,
    selectedType,
    weightRange[0] !== 18 || weightRange[1] !== 20,
    diameterRange[0] !== 6.5 || diameterRange[1] !== 7.5,
    lengthRange[0] !== 43 || lengthRange[1] !== 48,
    selectedCut,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedBrand('');
    setSelectedType('');
    setWeightRange([18, 20]);
    setDiameterRange([6.5, 7.5]);
    setLengthRange([43, 48]);
    setSelectedCut('');
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h4">バレル検索</Typography>
        <Button
          component={Link}
          href="/barrels/recommend"
          variant="outlined"
          startIcon={<RecommendIcon />}
        >
          おすすめを探す
        </Button>
      </Box>

      {/* 人気バレルランキング */}
      {ranking.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <TrendingUpIcon color="primary" />
            <Typography variant="h6">人気バレル</Typography>
            <Typography variant="caption" color="text.secondary">ダーツハイブ売上ランキング</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 1, scrollSnapType: 'x mandatory', '&::-webkit-scrollbar': { height: 6 }, '&::-webkit-scrollbar-thumb': { borderRadius: 3, bgcolor: 'action.disabled' } }}>
            {ranking.map((item) => (
              <Card key={item.rank} sx={{ minWidth: 150, maxWidth: 150, flexShrink: 0, position: 'relative', scrollSnapAlign: 'start' }}>
                <CardActionArea
                  href={item.productUrl}
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
                      image={item.imageUrl}
                      alt={item.name}
                      sx={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <Box sx={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'action.hover' }}>
                      <Typography variant="caption" color="text.secondary">No Image</Typography>
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
            <Chip label={activeFilterCount} size="small" color="primary" sx={{ ml: 1, height: 20, minWidth: 20 }} />
          )}
        </Button>
        {activeFilterCount > 0 && (
          <Button size="small" onClick={clearFilters}>クリア</Button>
        )}
      </Box>

      {/* ヒット件数表示 */}
      <Paper variant="outlined" sx={{ p: 1.5, mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
          <Typography variant="h6" component="span" color="primary">
            {filteredBarrels.length.toLocaleString()}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            件ヒット
            {filteredBarrels.length !== barrels.length && ` (全${barrels.length.toLocaleString()}件中)`}
          </Typography>
        </Box>
        {totalPages > 1 && (
          <Typography variant="body2" color="text.secondary">
            {(page - 1) * ITEMS_PER_PAGE + 1}〜{Math.min(page * ITEMS_PER_PAGE, filteredBarrels.length)}件目を表示
          </Typography>
        )}
      </Paper>

      <Collapse in={filterOpen}>
        <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl fullWidth size="small">
                <InputLabel>タイプ</InputLabel>
                <Select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} label="タイプ">
                  <MenuItem value="">すべて</MenuItem>
                  <MenuItem value="soft">ソフト (2BA/4BA)</MenuItem>
                  <MenuItem value="steel">スティール</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl fullWidth size="small">
                <InputLabel>ブランド</InputLabel>
                <Select value={selectedBrand} onChange={(e) => setSelectedBrand(e.target.value)} label="ブランド">
                  <MenuItem value="">すべて</MenuItem>
                  {brands.map((brand) => (
                    <MenuItem key={brand} value={brand}>{brand}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl fullWidth size="small">
                <InputLabel>カット</InputLabel>
                <Select value={selectedCut} onChange={(e) => setSelectedCut(e.target.value)} label="カット">
                  <MenuItem value="">すべて</MenuItem>
                  {cuts.map((cut) => (
                    <MenuItem key={cut} value={cut}>{cut}</MenuItem>
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
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : filteredBarrels.length === 0 ? (
        <Typography color="text.secondary" textAlign="center" sx={{ py: 8 }}>
          {barrels.length === 0 ? 'バレルデータがありません。スクレイピングスクリプトを実行してください。' : '条件に一致するバレルがありません'}
        </Typography>
      ) : (
        <>
          <Grid container spacing={2}>
            {paginatedBarrels.map((barrel) => (
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={barrel.id}>
                <BarrelCard barrel={barrel} />
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
    </Container>
  );
}
