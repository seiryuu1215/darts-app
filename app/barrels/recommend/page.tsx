'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  CircularProgress,
  Button,
  Card,
  CardMedia,
  CardContent,
  Chip,
  Checkbox,
  TextField,
  InputAdornment,
  Paper,
  LinearProgress,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import BarrelCard from '@/components/barrels/BarrelCard';
import { recommendFromBarrelsWithAnalysis, getBarrelType } from '@/lib/recommend-barrels';
import type { BarrelAnalysis } from '@/lib/recommend-barrels';
import type { BarrelProduct } from '@/types';

export default function RecommendPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [bookmarkIds, setBookmarkIds] = useState<Set<string>>(new Set());
  const [allBarrels, setAllBarrels] = useState<BarrelProduct[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<BarrelAnalysis[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [preferenceText, setPreferenceText] = useState('');
  const [selectedType, setSelectedType] = useState<string>('soft');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (!session?.user?.id) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        // ブックマークID取得
        const barrelBmSnap = await getDocs(collection(db, 'users', session.user.id, 'barrelBookmarks'));
        const bmIds = new Set(barrelBmSnap.docs.map((d) => d.data().barrelId as string));
        setBookmarkIds(bmIds);

        // 全バレル取得
        const snapshot = await getDocs(collection(db, 'barrels'));
        const barrels = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as BarrelProduct[];
        setAllBarrels(barrels);
      } catch (err) {
        console.error('データ取得エラー:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [session]);

  // ブックマーク優先 + 検索フィルター付きバレル一覧
  const displayBarrels = useMemo(() => {
    let filtered = allBarrels;
    if (selectedType) {
      filtered = filtered.filter((b) => {
        const t = getBarrelType(b.name);
        return t === selectedType || t === '';
      });
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (b) => b.name.toLowerCase().includes(q) || b.brand.toLowerCase().includes(q)
      );
    }
    // ブックマーク済みを上に
    return [...filtered].sort((a, b) => {
      const aBookmarked = a.id ? bookmarkIds.has(a.id) : false;
      const bBookmarked = b.id ? bookmarkIds.has(b.id) : false;
      if (aBookmarked && !bBookmarked) return -1;
      if (!aBookmarked && bBookmarked) return 1;
      return 0;
    });
  }, [allBarrels, bookmarkIds, searchQuery, selectedType]);

  const bookmarkedCount = useMemo(() => {
    if (!searchQuery.trim()) return bookmarkIds.size;
    return displayBarrels.filter((b) => b.id && bookmarkIds.has(b.id)).length;
  }, [displayBarrels, bookmarkIds, searchQuery]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < 3) {
        next.add(id);
      }
      return next;
    });
  };

  const handleSearch = async () => {
    setSearching(true);
    try {
      const selectedBarrels = allBarrels.filter((b) => b.id && selectedIds.has(b.id));
      const candidateBarrels = selectedType
        ? allBarrels.filter((b) => {
            const t = getBarrelType(b.name);
            return t === selectedType || t === '';
          })
        : allBarrels;
      const analyzed = recommendFromBarrelsWithAnalysis(selectedBarrels, candidateBarrels, 30, preferenceText || undefined);
      setResults(analyzed);
    } catch (err) {
      console.error('おすすめ検索エラー:', err);
    } finally {
      setSearching(false);
    }
  };

  if (status === 'loading') return null;
  if (!session) return null;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 1 }}>おすすめバレルを探す</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        好みのバレルを1〜3個選ぶと、重量・最大径・全長・カット・ブランドを分析して似たスペックのバレルを提案します。
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
            <Typography variant="h6">バレルを1〜3個選択</Typography>
            <Chip
              label={`${selectedIds.size} / 3`}
              color={selectedIds.size === 3 ? 'success' : 'default'}
              size="small"
            />
          </Box>

          <FormControl size="small" sx={{ mb: 2, minWidth: 180 }}>
            <InputLabel>タイプ</InputLabel>
            <Select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setSelectedIds(new Set());
                setResults(null);
              }}
              label="タイプ"
            >
              <MenuItem value="">すべて</MenuItem>
              <MenuItem value="soft">ソフト (2BA/4BA)</MenuItem>
              <MenuItem value="steel">スティール</MenuItem>
            </Select>
          </FormControl>

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

          {bookmarkedCount > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
              <BookmarkIcon fontSize="small" color="primary" />
              <Typography variant="body2" color="text.secondary">
                ブックマーク済み ({bookmarkedCount}件)
              </Typography>
            </Box>
          )}

          <Grid container spacing={1.5} sx={{ mb: 3, maxHeight: 480, overflowY: 'auto' }}>
            {displayBarrels.map((barrel, index) => {
              const isBookmarked = barrel.id ? bookmarkIds.has(barrel.id) : false;
              const isSelected = barrel.id ? selectedIds.has(barrel.id) : false;
              // ブックマーク → 非ブックマーク境界にDivider表示
              const showDivider = index > 0 && !isBookmarked && bookmarkedCount > 0 &&
                displayBarrels[index - 1]?.id && bookmarkIds.has(displayBarrels[index - 1].id!);

              return (
                <Grid size={{ xs: 6, sm: 4, md: 3 }} key={barrel.id} sx={showDivider ? { pt: 1 } : undefined}>
                  {showDivider && (
                    <Divider sx={{ mb: 1.5 }}>
                      <Typography variant="caption" color="text.secondary">すべてのバレル</Typography>
                    </Divider>
                  )}
                  <Card
                    onClick={() => barrel.id && toggleSelect(barrel.id)}
                    sx={{
                      cursor: 'pointer',
                      border: 2,
                      borderColor: isSelected ? 'primary.main' : 'transparent',
                      opacity: !isSelected && selectedIds.size >= 3 ? 0.5 : 1,
                      transition: 'all 0.2s',
                      position: 'relative',
                    }}
                  >
                    <Checkbox
                      checked={isSelected}
                      sx={{ position: 'absolute', top: 4, right: 4, zIndex: 1 }}
                      size="small"
                    />
                    {isBookmarked && (
                      <BookmarkIcon
                        sx={{ position: 'absolute', top: 8, left: 8, zIndex: 1, fontSize: 18 }}
                        color="primary"
                      />
                    )}
                    {barrel.imageUrl ? (
                      <CardMedia
                        component="img"
                        height="100"
                        image={barrel.imageUrl}
                        alt={barrel.name}
                        sx={{ objectFit: 'cover' }}
                      />
                    ) : (
                      <Box sx={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'action.hover' }}>
                        <Typography variant="caption" color="text.secondary">No Image</Typography>
                      </Box>
                    )}
                    <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                      <Typography variant="caption" noWrap display="block" fontWeight="bold">
                        {barrel.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap display="block">
                        {barrel.brand} / {barrel.weight}g
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>

          <TextField
            placeholder="好みを入力（例: もう少し重く、細めがいい）"
            value={preferenceText}
            onChange={(e) => setPreferenceText(e.target.value)}
            fullWidth
            size="small"
            sx={{ mb: 2 }}
          />

          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<SearchIcon />}
              disabled={selectedIds.size === 0 || searching}
              onClick={handleSearch}
            >
              {searching ? 'おすすめを検索中...' : 'おすすめを探す'}
            </Button>
          </Box>
        </>
      )}

      {results !== null && (
        <>
          <Typography variant="h6" sx={{ mb: 2 }}>おすすめバレル</Typography>
          {results.length === 0 ? (
            <Typography color="text.secondary" textAlign="center" sx={{ py: 4 }}>
              類似バレルが見つかりませんでした
            </Typography>
          ) : (
            <Grid container spacing={3}>
              {results.map((analysis) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={analysis.barrel.id}>
                  <Box>
                    <BarrelCard barrel={analysis.barrel} />
                    {/* 分析カード */}
                    <Paper variant="outlined" sx={{ mt: -0.5, borderTopLeftRadius: 0, borderTopRightRadius: 0, p: 1.5 }}>
                      {/* 一致度バー */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant="caption" fontWeight="bold" sx={{ minWidth: 48 }}>
                          一致度
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={analysis.matchPercent}
                          sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                          color={analysis.matchPercent >= 70 ? 'success' : analysis.matchPercent >= 40 ? 'primary' : 'warning'}
                        />
                        <Typography variant="caption" fontWeight="bold" sx={{ minWidth: 32, textAlign: 'right' }}>
                          {analysis.matchPercent}%
                        </Typography>
                      </Box>

                      {/* スペック差分チップ */}
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                        {analysis.diffs.weightDiff != null && (
                          <Chip
                            label={`重量 ${analysis.diffs.weightDiff > 0 ? '+' : ''}${analysis.diffs.weightDiff}g`}
                            size="small"
                            variant="outlined"
                            color={Math.abs(analysis.diffs.weightDiff) <= 0.5 ? 'success' : Math.abs(analysis.diffs.weightDiff) <= 2 ? 'default' : 'warning'}
                          />
                        )}
                        {analysis.diffs.diameterDiff != null && (
                          <Chip
                            label={`径 ${analysis.diffs.diameterDiff > 0 ? '+' : ''}${analysis.diffs.diameterDiff.toFixed(1)}mm`}
                            size="small"
                            variant="outlined"
                            color={Math.abs(analysis.diffs.diameterDiff) <= 0.2 ? 'success' : Math.abs(analysis.diffs.diameterDiff) <= 0.5 ? 'default' : 'warning'}
                          />
                        )}
                        {analysis.diffs.lengthDiff != null && (
                          <Chip
                            label={`長さ ${analysis.diffs.lengthDiff > 0 ? '+' : ''}${analysis.diffs.lengthDiff}mm`}
                            size="small"
                            variant="outlined"
                            color={Math.abs(analysis.diffs.lengthDiff) <= 1 ? 'success' : Math.abs(analysis.diffs.lengthDiff) <= 3 ? 'default' : 'warning'}
                          />
                        )}
                        {analysis.diffs.cutMatch !== 'none' && (
                          <Chip
                            label={analysis.diffs.cutMatch === 'exact' ? 'カット一致' : 'カット近似'}
                            size="small"
                            variant="outlined"
                            color={analysis.diffs.cutMatch === 'exact' ? 'success' : 'info'}
                          />
                        )}
                        {analysis.diffs.brandMatch && (
                          <Chip label="同ブランド" size="small" variant="outlined" color="info" />
                        )}
                      </Box>

                      {/* 感覚の違い */}
                      <Box>
                        {analysis.insights.map((insight, i) => (
                          <Typography key={i} variant="caption" display="block" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                            ・{insight}
                          </Typography>
                        ))}
                      </Box>
                    </Paper>
                  </Box>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}
    </Container>
  );
}
