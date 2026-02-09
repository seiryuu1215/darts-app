'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Container,
  Grid,
  Typography,
  Box,
  Button,
  CircularProgress,
  TextField,
  InputAdornment,
  Chip,
  Collapse,
  IconButton,
} from '@mui/material';
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useSession } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import DartCard from '@/components/darts/DartCard';
import BarrelCard from '@/components/barrels/BarrelCard';
import type { Dart, BarrelProduct } from '@/types';
import { recommendBarrels } from '@/lib/recommend-barrels';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import PeopleIcon from '@mui/icons-material/People';
import RecommendIcon from '@mui/icons-material/AutoAwesome';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

export default function DartsListPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const mineOnly = searchParams.get('mine') === '1';
  const [darts, setDarts] = useState<Dart[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [fetchError, setFetchError] = useState<string | null>(null);

  // おすすめ関連
  const [myDarts, setMyDarts] = useState<Dart[]>([]);
  const [allBarrels, setAllBarrels] = useState<BarrelProduct[]>([]);
  const [recommendType, setRecommendType] = useState<'soft' | 'steel'>('soft');
  const [recommendOpen, setRecommendOpen] = useState(true);
  const [recommendLoading, setRecommendLoading] = useState(false);

  useEffect(() => {
    const fetchDarts = async () => {
      setFetchError(null);
      try {
        let q;
        if (mineOnly && session?.user?.id) {
          q = query(collection(db, 'darts'), where('userId', '==', session.user.id), orderBy('createdAt', 'desc'));
        } else {
          q = query(collection(db, 'darts'), orderBy('createdAt', 'desc'));
        }
        const snapshot = await getDocs(q);
        const dartsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Dart[];
        setDarts(dartsData);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('ダーツ取得エラー:', err);
        setFetchError(message);
      } finally {
        setLoading(false);
      }
    };
    fetchDarts();
  }, [mineOnly, session]);

  // ログインユーザーの自分のダーツ + 全バレルを取得（おすすめ用）
  useEffect(() => {
    if (!session?.user?.id) return;
    setRecommendLoading(true);

    const fetchMyDarts = async () => {
      try {
        const q = query(collection(db, 'darts'), where('userId', '==', session.user.id));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Dart[];
        setMyDarts(data);
      } catch (err) {
        console.error('マイダーツ取得エラー:', err);
      }
    };

    const fetchBarrels = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'barrels'));
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as BarrelProduct[];
        setAllBarrels(data);
      } catch (err) {
        console.error('バレル取得エラー:', err);
      }
    };

    Promise.all([fetchMyDarts(), fetchBarrels()]).finally(() => setRecommendLoading(false));
  }, [session]);

  const filteredDarts = useMemo(() => {
    if (!searchQuery.trim()) return darts;
    const q = searchQuery.toLowerCase();
    return darts.filter(
      (dart) =>
        dart.title.toLowerCase().includes(q) ||
        dart.barrel.name.toLowerCase().includes(q) ||
        dart.barrel.brand.toLowerCase().includes(q) ||
        (dart.userName && dart.userName.toLowerCase().includes(q))
    );
  }, [darts, searchQuery]);

  const recommendedBarrels = useMemo(() => {
    if (myDarts.length === 0 || allBarrels.length === 0) return [];
    return recommendBarrels(myDarts, allBarrels, recommendType, 10);
  }, [myDarts, allBarrels, recommendType]);

  const handleToggleMine = () => {
    if (mineOnly) {
      router.push('/darts');
    } else {
      router.push('/darts?mine=1');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'stretch', sm: 'center' },
        gap: 2,
        mb: 3,
      }}>
        <Typography variant="h4">{mineOnly ? 'マイセッティング' : 'みんなのセッティング'}</Typography>
        {session && (
          <Button
            variant="contained"
            component={Link}
            href="/darts/new"
            startIcon={<AddIcon />}
          >
            新規登録
          </Button>
        )}
      </Box>

      <TextField
        placeholder="タイトル、バレル名、ブランドで検索..."
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

      {/* マイセッティング絞り込みボタン */}
      {session && (
        <Box sx={{ mb: 3 }}>
          <Chip
            icon={mineOnly ? <PersonIcon /> : <PeopleIcon />}
            label={mineOnly ? '自分のセッティングのみ' : 'みんなのセッティング'}
            onClick={handleToggleMine}
            color={mineOnly ? 'primary' : 'default'}
            variant={mineOnly ? 'filled' : 'outlined'}
          />
        </Box>
      )}

      {/* おすすめバレルセクション */}
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
              <Box sx={{
                display: 'flex',
                gap: 2,
                overflowX: 'auto',
                pb: 1,
                scrollSnapType: 'x mandatory',
                '&::-webkit-scrollbar': { height: 6 },
                '&::-webkit-scrollbar-thumb': { borderRadius: 3, bgcolor: 'action.disabled' },
              }}>
                {recommendedBarrels.map((barrel) => (
                  <Box key={barrel.id} sx={{ minWidth: 240, maxWidth: 240, flexShrink: 0, scrollSnapAlign: 'start' }}>
                    <BarrelCard barrel={barrel} />
                  </Box>
                ))}
              </Box>
            )}
          </Collapse>
        </Box>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : fetchError ? (
        <Box sx={{ py: 6, px: 2, textAlign: 'center' }}>
          <Typography color="error" sx={{ mb: 1 }}>データの取得に失敗しました</Typography>
          <Typography variant="body2" color="text.secondary" component="pre" sx={{ textAlign: 'left', overflow: 'auto', maxWidth: '100%' }}>
            {fetchError}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            .env.local の NEXT_PUBLIC_FIREBASE_* と、起動ポートに合わせた NEXTAUTH_URL を確認してください。
          </Typography>
        </Box>
      ) : filteredDarts.length === 0 ? (
        <Typography color="text.secondary" textAlign="center" sx={{ py: 8 }}>
          {searchQuery ? '検索結果が見つかりませんでした' : 'まだダーツが登録されていません'}
        </Typography>
      ) : (
        <Grid container spacing={3}>
          {filteredDarts.map((dart) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={dart.id}>
              <DartCard dart={dart} />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}
