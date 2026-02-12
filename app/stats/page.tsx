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
  ToggleButton,
  ToggleButtonGroup,
  Alert,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  FormControlLabel,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
} from '@mui/material';
import SyncIcon from '@mui/icons-material/Sync';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import type { Dart } from '@/types';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  ReferenceLine,
  ComposedChart,
  Cell,
} from 'recharts';

import LockIcon from '@mui/icons-material/Lock';
import { getFlightColor, COLOR_01, COLOR_CRICKET, COLOR_COUNTUP } from '@/lib/dartslive-colors';
import { getRatingTarget, calc01Rating, ppdForRating } from '@/lib/dartslive-rating';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import { canUseDartslive } from '@/lib/permissions';

function DiffLabel({ current, prev, fixed = 2 }: { current: number | null | undefined; prev: number | null | undefined; fixed?: number }) {
  if (current == null || prev == null) return null;
  const diff = current - prev;
  if (diff === 0) return <Typography component="span" variant="caption" sx={{ color: 'text.secondary', ml: 0.5 }}>±0</Typography>;
  const color = diff > 0 ? '#4caf50' : '#f44336';
  return (
    <Typography component="span" variant="caption" sx={{ color, ml: 0.5, fontWeight: 'bold' }}>
      {diff > 0 ? '+' : ''}{diff.toFixed(fixed)}
    </Typography>
  );
}

// === Types ===
interface DartsliveData {
  current: {
    cardName: string;
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

const MONTHLY_CONFIG_BASE: Record<MonthlyTab, { label: string; color: string }> = {
  rating: { label: 'RATING', color: '#808080' },
  zeroOne: { label: '01 GAMES', color: COLOR_01 },
  cricket: { label: 'CRICKET', color: COLOR_CRICKET },
  countUp: { label: 'COUNT-UP', color: COLOR_COUNTUP },
};

const AWARD_ORDER = [
  'LOW TON', 'HIGH TON', 'HAT TRICK', 'TON 80', '3 IN A BED',
  '3 - BLACK', 'WHITE HRS', '9 COUNT', '8 COUNT', '7 COUNT', '6 COUNT', '5 COUNT',
];

export default function StatsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const canDartslive = canUseDartslive(session?.user?.role);
  // テーマ対応チャートカラー
  const chartGrid = isDark ? '#333' : '#ddd';
  const chartText = isDark ? '#ccc' : '#666';
  const chartTooltipBg = isDark ? '#1e1e1e' : '#fff';
  const chartTooltipBorder = isDark ? '#444' : '#ddd';
  const chartAvgLine = isDark ? '#90caf9' : '#1565c0';

  const [dlData, setDlData] = useState<DartsliveData | null>(null);
  const [dlOpen, setDlOpen] = useState(false);
  const [dlEmail, setDlEmail] = useState('');
  const [dlPassword, setDlPassword] = useState('');
  const [dlLoading, setDlLoading] = useState(false);
  const [dlError, setDlError] = useState('');
  const [dlSaveCredentials, setDlSaveCredentials] = useState(true);
  const [dlConsent, setDlConsent] = useState(false);
  const [dlHasSaved, setDlHasSaved] = useState(false);
  const [monthlyTab, setMonthlyTab] = useState<MonthlyTab>('rating');
  const [gameChartCategory, setGameChartCategory] = useState<string>('');
  const [activeSoftDart, setActiveSoftDart] = useState<Dart | null>(null);
  const [dlUpdatedAt, setDlUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // localStorageからDARTSLIVE認証情報・同意状態を復元
  useEffect(() => {
    try {
      const saved = localStorage.getItem('dartslive_credentials');
      if (saved) {
        const { email, password } = JSON.parse(saved);
        if (email) setDlEmail(email);
        if (password) setDlPassword(password);
        setDlHasSaved(true);
      }
      if (localStorage.getItem('dartslive_consent') === '1') {
        setDlConsent(true);
      }
    } catch { /* ignore */ }
  }, []);

  // キャッシュ済みスタッツ + 使用中ダーツを取得
  useEffect(() => {
    if (!session?.user?.id) return;

    // キャッシュからスタッツをロード（pro/admin のみ）
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
        } catch { /* ignore */ }
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
      } catch { /* ignore */ }
    };

    fetchActiveDart();
  }, [session, canDartslive]);

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
      if (!res.ok) { setDlError(json.error || '取得に失敗しました'); return; }
      setDlData(json.data);
      setDlOpen(false);
      setDlUpdatedAt(new Date().toISOString());
      // 同意状態を保存
      localStorage.setItem('dartslive_consent', '1');
      // 認証情報をlocalStorageに保存/削除
      if (dlSaveCredentials) {
        localStorage.setItem('dartslive_credentials', JSON.stringify({ email: dlEmail, password: dlPassword }));
        setDlHasSaved(true);
      } else {
        localStorage.removeItem('dartslive_credentials');
        setDlHasSaved(false);
      }
      if (json.data.recentGames?.games?.length > 0) {
        const games = json.data.recentGames.games;
        const countUp = games.find((g: { category: string }) => g.category === 'COUNT-UP');
        setGameChartCategory(countUp ? 'COUNT-UP' : games[0].category);
      }
    } catch { setDlError('通信エラーが発生しました'); } finally { setDlLoading(false); }
  };

  if (status === 'loading') {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;
  }

  const c = dlData?.current;
  const prev = dlData?.prev;
  const flightColor = c?.flight ? getFlightColor(c.flight) : '#808080';
  const monthlyConfig = { ...MONTHLY_CONFIG_BASE, rating: { label: 'RATING', color: flightColor } };
  const monthlyChartData = dlData?.monthly[monthlyTab]?.slice().reverse() || [];
  const selectedGame = dlData?.recentGames?.games?.find((g) => g.category === gameChartCategory);
  const gameChartData = selectedGame?.scores.map((score, i) => {
    const avg = selectedGame.scores.slice(0, i + 1).reduce((a, b) => a + b, 0) / (i + 1);
    return { game: i + 1, score, avg: Math.round(avg * 100) / 100 };
  }) || [];
  // ゲームカテゴリの色
  const getGameColor = (cat: string) => {
    if (cat.includes('CRICKET') && !cat.includes('COUNT')) return COLOR_CRICKET;
    if (cat.includes('COUNT')) return COLOR_COUNTUP;
    return COLOR_01;
  };

  // カウントアップ期待値 = 01平均スタッツ(PPR) × 8ラウンド
  const expectedCountUp = c?.stats01Avg != null ? Math.round(c.stats01Avg * 8) : null;
  // Rt-2相当のカウントアップスコア（例: Rt.10→PPD80→640, Rt.8→PPD70→560）
  const current01RtInt = c?.stats01Avg != null ? Math.floor(calc01Rating(c.stats01Avg)) : null;
  const dangerCountUp = current01RtInt != null
    ? Math.round(ppdForRating(current01RtInt - 2) * 8)
    : null;
  // Rt+2相当のカウントアップスコア（例: Rt.10→Rt.12→PPD90→720）
  const excellentCountUp = current01RtInt != null
    ? Math.round(ppdForRating(current01RtInt + 2) * 8)
    : null;
  const isCountUpCategory = gameChartCategory.includes('COUNT');

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 3, p: { xs: 1, sm: 2 } }}>
        <Breadcrumbs items={[{ label: 'Stats' }]} />
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>DARTSLIVE Stats</Typography>
            {canDartslive && dlUpdatedAt && (
              <Typography variant="caption" color="text.secondary">
                最終取得: {new Date(dlUpdatedAt).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </Typography>
            )}
          </Box>
          {canDartslive && (
            <Button
              variant={dlData ? 'outlined' : 'contained'}
              startIcon={dlLoading ? <CircularProgress size={18} color="inherit" /> : <SyncIcon />}
              onClick={() => (dlData && dlEmail && dlPassword ? handleFetch() : setDlOpen(true))}
              disabled={dlLoading}
              size="small"
            >
              {dlLoading ? '取得中...' : dlData ? '更新' : 'ダーツライブ連携'}
            </Button>
          )}
        </Box>

        {/* PRO アップグレード案内（general ユーザー） */}
        {!canDartslive && (
          <Paper sx={{ textAlign: 'center', py: 6, px: 3, mb: 2, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
            <LockIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography variant="h6" sx={{ mb: 1 }}>DARTSLIVE連携はPROプラン限定です</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              PROプランにアップグレードすると、DARTSLIVEアカウントと連携してスタッツの自動取得・推移グラフ・レーティング目標分析が利用できます。
            </Typography>
            <Chip label="PRO" color="primary" size="small" />
            {process.env.NEXT_PUBLIC_BMC_USERNAME && (
              <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  Darts Lab の開発を応援しませんか？
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  href={`https://buymeacoffee.com/${process.env.NEXT_PUBLIC_BMC_USERNAME}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ textTransform: 'none', borderRadius: 2, color: '#FFDD00', borderColor: '#FFDD00', '&:hover': { borderColor: '#e6c800', bgcolor: '#FFDD0011' } }}
                >
                  Buy Me a Coffee
                </Button>
              </Box>
            )}
          </Paper>
        )}

        {/* 未取得 */}
        {canDartslive && !dlData && !dlLoading && (
          <Paper sx={{ textAlign: 'center', py: 8, px: 2, bgcolor: 'background.default', border: '1px dashed', borderColor: 'divider' }}>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>ダーツライブと連携</Typography>
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
            {/* === Rating & Flight Hero === */}
            <Paper
              sx={{
                p: 2.5, mb: 2, borderRadius: 3,
                background: `linear-gradient(135deg, ${flightColor}22, ${flightColor}08)`,
                border: `1px solid ${flightColor}44`,
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">{c.cardName}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mt: 0.5 }}>
                    <Typography variant="h3" sx={{ fontWeight: 'bold', color: flightColor, lineHeight: 1 }}>
                      {c.rating?.toFixed(2) ?? '--'}
                    </Typography>
                    <DiffLabel current={c.rating} prev={prev?.rating} />
                  </Box>
                  <Typography variant="caption" color="text.secondary">RATING</Typography>
                </Box>
                <Chip
                  label={`FLIGHT ${c.flight}`}
                  sx={{
                    bgcolor: flightColor,
                    color: '#fff',
                    fontWeight: 'bold',
                    fontSize: '0.9rem',
                    height: 32,
                  }}
                />
              </Box>
            </Paper>

            {/* === 3カテゴリ Stats Cards === */}
            <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
              {/* 01 */}
              <Paper sx={{ flex: 1, p: 1.5, borderRadius: 2, borderTop: `3px solid ${COLOR_01}` }}>
                <Typography variant="caption" sx={{ color: COLOR_01, fontWeight: 'bold' }}>01 GAMES</Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold', mt: 0.5 }}>
                  {c.stats01Avg?.toFixed(2) ?? '--'}
                </Typography>
                <DiffLabel current={c.stats01Avg} prev={prev?.stats01Avg} />
              </Paper>
              {/* Cricket */}
              <Paper sx={{ flex: 1, p: 1.5, borderRadius: 2, borderTop: `3px solid ${COLOR_CRICKET}` }}>
                <Typography variant="caption" sx={{ color: COLOR_CRICKET, fontWeight: 'bold' }}>CRICKET</Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold', mt: 0.5 }}>
                  {c.statsCriAvg?.toFixed(2) ?? '--'}
                </Typography>
                <DiffLabel current={c.statsCriAvg} prev={prev?.statsCriAvg} />
              </Paper>
              {/* COUNT-UP */}
              <Paper sx={{ flex: 1, p: 1.5, borderRadius: 2, borderTop: `3px solid ${COLOR_COUNTUP}` }}>
                <Typography variant="caption" sx={{ color: COLOR_COUNTUP, fontWeight: 'bold' }}>COUNT-UP</Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold', mt: 0.5 }}>
                  {c.statsPraAvg?.toFixed(0) ?? '--'}
                </Typography>
                <DiffLabel current={c.statsPraAvg} prev={prev?.statsPraAvg} fixed={0} />
                {expectedCountUp != null && (
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                    期待値: {expectedCountUp}
                  </Typography>
                )}
              </Paper>
            </Box>

            {/* === 次のレーティング目標 === */}
            {c.stats01Avg != null && c.statsCriAvg != null && (() => {
              const target = getRatingTarget(c.stats01Avg, c.statsCriAvg);
              return (
                <Paper sx={{ p: 2, mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.5 }}>
                    <ArrowUpwardIcon sx={{ fontSize: 18, color: flightColor }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      次の目標: Rt.{target.nextRating}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                      01 Rt: {target.current01Rt.toFixed(2)} / Cri Rt: {target.currentCriRt.toFixed(2)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <Paper variant="outlined" sx={{ flex: 1, p: 1.5, borderColor: COLOR_01 + '44' }}>
                      <Typography variant="caption" sx={{ color: COLOR_01, fontWeight: 'bold' }}>
                        01だけで上げる場合
                      </Typography>
                      {target.ppd01Only.achieved ? (
                        <Typography variant="body1" sx={{ mt: 0.5, color: 'success.main', fontWeight: 'bold' }}>
                          達成済み
                        </Typography>
                      ) : (
                        <>
                          <Typography variant="h6" sx={{ fontWeight: 'bold', mt: 0.5 }}>
                            PPD {target.ppd01Only.target.toFixed(2)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            あと +{target.ppd01Only.gap.toFixed(2)} 必要
                          </Typography>
                        </>
                      )}
                    </Paper>
                    <Paper variant="outlined" sx={{ flex: 1, p: 1.5, borderColor: COLOR_CRICKET + '44' }}>
                      <Typography variant="caption" sx={{ color: COLOR_CRICKET, fontWeight: 'bold' }}>
                        Cricketだけで上げる場合
                      </Typography>
                      {target.mprCriOnly.achieved ? (
                        <Typography variant="body1" sx={{ mt: 0.5, color: 'success.main', fontWeight: 'bold' }}>
                          達成済み
                        </Typography>
                      ) : (
                        <>
                          <Typography variant="h6" sx={{ fontWeight: 'bold', mt: 0.5 }}>
                            MPR {target.mprCriOnly.target.toFixed(2)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            あと +{target.mprCriOnly.gap.toFixed(2)} 必要
                          </Typography>
                        </>
                      )}
                    </Paper>
                  </Box>
                  {/* 均等に上げる場合 */}
                  <Paper variant="outlined" sx={{ p: 1.5, mt: 1.5, borderColor: 'divider' }}>
                    <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                      均等に上げる場合
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          PPD{' '}
                          {target.ppdBalanced.achieved ? (
                            <Typography component="span" sx={{ color: 'success.main' }}>達成済み</Typography>
                          ) : (
                            <>
                              {target.ppdBalanced.target.toFixed(2)}
                              <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                                (+{target.ppdBalanced.gap.toFixed(2)})
                              </Typography>
                            </>
                          )}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          MPR{' '}
                          {target.mprBalanced.achieved ? (
                            <Typography component="span" sx={{ color: 'success.main' }}>達成済み</Typography>
                          ) : (
                            <>
                              {target.mprBalanced.target.toFixed(2)}
                              <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                                (+{target.mprBalanced.gap.toFixed(2)})
                              </Typography>
                            </>
                          )}
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                  {target.ppd01Only.achieved && target.mprCriOnly.achieved && (
                    <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 1 }}>
                      最大レーティングに到達しています
                    </Typography>
                  )}
                </Paper>
              );
            })()}

            {/* === 使用中ソフトダーツ === */}
            {activeSoftDart && (
              <Card
                component={Link}
                href={`/darts/${activeSoftDart.id}`}
                sx={{
                  textDecoration: 'none', display: 'flex', flexDirection: 'row', mb: 2,
                  height: 72, borderRadius: 2, borderLeft: `3px solid ${flightColor}`,
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
                  <Box component="img" src="/dart-placeholder.svg" alt="" sx={{ width: 72, flexShrink: 0, objectFit: 'cover' }} />
                )}
                <CardContent sx={{ py: 1, px: 1.5, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0, '&:last-child': { pb: 1 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <CheckCircleIcon sx={{ fontSize: 14, color: COLOR_COUNTUP }} />
                    <Typography variant="caption" color="text.secondary">使用中セッティング</Typography>
                  </Box>
                  <Typography variant="subtitle2" noWrap>{activeSoftDart.title}</Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {activeSoftDart.barrel.brand} {activeSoftDart.barrel.name} ({activeSoftDart.barrel.weight}g)
                  </Typography>
                </CardContent>
              </Card>
            )}

            {/* === 月間推移グラフ === */}
            {monthlyChartData.length > 0 && (
              <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>月間推移</Typography>
                  <ToggleButtonGroup value={monthlyTab} exclusive onChange={(_, v) => { if (v) setMonthlyTab(v); }} size="small">
                    <ToggleButton value="rating" sx={{ '&.Mui-selected': { color: flightColor } }}>Rt</ToggleButton>
                    <ToggleButton value="zeroOne" sx={{ '&.Mui-selected': { color: COLOR_01 } }}>01</ToggleButton>
                    <ToggleButton value="cricket" sx={{ '&.Mui-selected': { color: COLOR_CRICKET } }}>Cri</ToggleButton>
                    <ToggleButton value="countUp" sx={{ '&.Mui-selected': { color: COLOR_COUNTUP } }}>CU</ToggleButton>
                  </ToggleButtonGroup>
                </Box>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={monthlyChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
                    <XAxis dataKey="month" fontSize={11} tick={{ fill: chartText }} />
                    <YAxis domain={['auto', 'auto']} fontSize={11} tick={{ fill: chartText }} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="value"
                      name={monthlyConfig[monthlyTab].label}
                      stroke={monthlyConfig[monthlyTab].color}
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: monthlyConfig[monthlyTab].color }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Paper>
            )}

            {/* === 直近ゲーム結果 === */}
            {dlData.recentGames.games.length > 0 && (
              <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>直近ゲーム結果</Typography>
                  <ToggleButtonGroup value={gameChartCategory} exclusive onChange={(_, v) => { if (v) setGameChartCategory(v); }} size="small">
                    {dlData.recentGames.games.map((g) => (
                      <ToggleButton key={g.category} value={g.category} sx={{ '&.Mui-selected': { color: getGameColor(g.category) } }}>
                        {g.category === 'STANDARD CRICKET' ? 'Cricket' : g.category === 'COUNT-UP' ? 'CU' : g.category === 'CRICKET COUNT-UP' ? 'CCU' : g.category}
                      </ToggleButton>
                    ))}
                  </ToggleButtonGroup>
                </Box>
                {gameChartData.length > 0 && (() => {
                  const gameAvg = selectedGame ? selectedGame.scores.reduce((a, b) => a + b, 0) / selectedGame.scores.length : 0;
                  const baseColor = getGameColor(gameChartCategory);
                  // COUNT-UP: 期待値基準、それ以外: ゲーム内平均基準
                  const threshold = isCountUpCategory && expectedCountUp != null ? expectedCountUp : gameAvg;
                  const dangerThreshold = isCountUpCategory ? dangerCountUp : null;
                  const excellentThreshold = isCountUpCategory ? excellentCountUp : null;
                  const getBarColor = (score: number) => {
                    if (excellentThreshold != null && score >= excellentThreshold) return '#2e7d32'; // Rt+2以上: 濃い緑
                    if (score >= threshold) return '#4caf50'; // 基準以上: 緑
                    if (dangerThreshold != null && score <= dangerThreshold) return '#f44336'; // Rt-2以下: 赤
                    return `${baseColor}66`; // 通常: 薄いカテゴリ色
                  };
                  return (
                    <ResponsiveContainer width="100%" height={230}>
                      <ComposedChart data={gameChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
                        <XAxis dataKey="game" fontSize={11} tick={{ fill: chartText }} />
                        <YAxis domain={['auto', 'auto']} fontSize={11} tick={{ fill: chartText }} />
                        <Tooltip
                          contentStyle={{ backgroundColor: chartTooltipBg, border: `1px solid ${chartTooltipBorder}`, borderRadius: 6 }}
                          labelFormatter={(v) => `Game ${v}`}
                        />
                        <Legend
                          iconType="plainline"
                          wrapperStyle={{ fontSize: 11, paddingTop: 4 }}
                        />
                        <Bar dataKey="score" name="スコア" opacity={0.8} radius={[2, 2, 0, 0]}>
                          {gameChartData.map((entry, i) => (
                            <Cell key={i} fill={getBarColor(entry.score)} />
                          ))}
                        </Bar>
                        <Line
                          type="monotone"
                          dataKey="avg"
                          name="累計平均"
                          stroke={chartAvgLine}
                          strokeWidth={2}
                          dot={false}
                        />
                        {isCountUpCategory && expectedCountUp != null && (
                          <ReferenceLine
                            y={expectedCountUp}
                            stroke="#ff9800"
                            strokeDasharray="6 3"
                            label={{ value: `Rt期待値 ${expectedCountUp}`, position: 'right', fill: '#ff9800', fontSize: 10 }}
                          />
                        )}
                        <ReferenceLine
                          y={gameAvg}
                          stroke={baseColor}
                          strokeDasharray="4 4"
                          strokeOpacity={0.6}
                          label={{ value: `平均 ${isCountUpCategory ? Math.round(gameAvg) : gameAvg.toFixed(2)}`, position: 'left', fill: baseColor, fontSize: 10 }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  );
                })()}
                {/* 色凡例 */}
                {isCountUpCategory && expectedCountUp != null && (
                  <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mt: 1, mb: 0.5 }}>
                    {excellentCountUp != null && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#2e7d32' }} />
                        <Typography variant="caption" color="text.secondary">Rt+2以上 ({excellentCountUp}+)</Typography>
                      </Box>
                    )}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#4caf50' }} />
                      <Typography variant="caption" color="text.secondary">期待値以上 ({expectedCountUp}+)</Typography>
                    </Box>
                    {dangerCountUp != null && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#f44336' }} />
                        <Typography variant="caption" color="text.secondary">Rt-2以下 ({dangerCountUp}以下)</Typography>
                      </Box>
                    )}
                  </Box>
                )}
                {/* Scores chips */}
                {selectedGame && (() => {
                  const gameAvg = selectedGame.scores.reduce((a, b) => a + b, 0) / selectedGame.scores.length;
                  const threshold = isCountUpCategory && expectedCountUp != null ? expectedCountUp : gameAvg;
                  const chipDanger = isCountUpCategory ? dangerCountUp : null;
                  const chipExcellent = isCountUpCategory ? excellentCountUp : null;
                  return (
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 1 }}>
                      {selectedGame.scores.map((s, i) => {
                        const isExcellent = chipExcellent != null && s >= chipExcellent;
                        const isGood = !isExcellent && s >= threshold;
                        const isDanger = chipDanger != null && s <= chipDanger;
                        const chipColor = isExcellent ? '#2e7d32' : isGood ? '#4caf50' : isDanger ? '#f44336' : undefined;
                        return (
                          <Chip
                            key={i}
                            label={gameChartCategory.includes('CRICKET') && !gameChartCategory.includes('COUNT') ? s.toFixed(2) : s}
                            size="small"
                            variant={chipColor ? 'filled' : 'outlined'}
                            sx={{
                              bgcolor: chipColor ? `${chipColor}22` : undefined,
                              borderColor: chipColor ?? 'divider',
                              color: chipColor ?? 'text.secondary',
                              fontWeight: chipColor ? 'bold' : 'normal',
                            }}
                          />
                        );
                      })}
                    </Box>
                  );
                })()}
              </Paper>
            )}

            {/* === 直近プレイ日サマリー === */}
            {dlData.recentGames.dayStats.avg01 !== null && (
              <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>直近プレイ日</Typography>
                {dlData.recentGames.shops.length > 0 && (
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                    {dlData.recentGames.shops.join(' → ')}
                  </Typography>
                )}
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: COLOR_01 }}>01 AVG / BEST</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      {dlData.recentGames.dayStats.avg01?.toFixed(2)} / {dlData.recentGames.dayStats.best01?.toFixed(2)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: COLOR_CRICKET }}>Cricket AVG / BEST</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      {dlData.recentGames.dayStats.avgCri?.toFixed(2)} / {dlData.recentGames.dayStats.bestCri?.toFixed(2)}
                    </Typography>
                  </Box>
                  {dlData.recentGames.dayStats.avgCountUp !== null && (
                    <Box>
                      <Typography variant="caption" sx={{ color: COLOR_COUNTUP }}>COUNT-UP AVG / BEST</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                        {dlData.recentGames.dayStats.avgCountUp?.toFixed(0)} / {dlData.recentGames.dayStats.bestCountUp}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Paper>
            )}

            {/* === Awards === */}
            {Object.keys(c.awards).length > 0 && (
              <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>Award & Feats</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>Award</TableCell>
                        <TableCell align="right">今月</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>累計</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {AWARD_ORDER.filter((key) => c.awards[key]).map((key) => (
                        <TableRow key={key}>
                          <TableCell>{key}</TableCell>
                          <TableCell align="right">{c.awards[key].monthly.toLocaleString()}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold' }}>{c.awards[key].total.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                      {c.awards['D-BULL'] && (
                        <>
                          <TableRow>
                            <TableCell>D-BULL</TableCell>
                            <TableCell align="right">{c.awards['D-BULL'].monthly.toLocaleString()}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>{c.awards['D-BULL'].total.toLocaleString()}</TableCell>
                          </TableRow>
                          {c.awards['S-BULL'] && (
                            <TableRow>
                              <TableCell>S-BULL</TableCell>
                              <TableCell align="right">{c.awards['S-BULL'].monthly.toLocaleString()}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 'bold' }}>{c.awards['S-BULL'].total.toLocaleString()}</TableCell>
                            </TableRow>
                          )}
                        </>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            )}

          </>
        )}

        {/* 手動記録リンク（全ユーザー共通） */}
        <Card variant="outlined" sx={{ mb: 3, borderRadius: 2 }}>
          <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: '12px !important' }}>
            <Box>
              <Typography variant="body2">調子やメモを記録</Typography>
              <Typography variant="caption" color="text.secondary">手動でスタッツを記録・管理</Typography>
            </Box>
            <Button variant="outlined" size="small" onClick={() => router.push('/stats/new')}>手動記録</Button>
          </CardContent>
        </Card>
      </Box>

      {/* ログインダイアログ（pro/admin のみ） */}
      {canDartslive && <Dialog open={dlOpen} onClose={() => !dlLoading && setDlOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>ダーツライブ連携</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            ダーツライブのアカウント情報でログインし、メインカードのスタッツを取得します。
            {dlSaveCredentials && '認証情報はこの端末のブラウザにのみ保存されます。'}
          </Typography>
          {dlError && <Alert severity="error" sx={{ mb: 2 }}>{dlError}</Alert>}
          <TextField label="メールアドレス" type="email" value={dlEmail} onChange={(e) => setDlEmail(e.target.value)} fullWidth disabled={dlLoading} sx={{ mb: 2, mt: 1 }} />
          <TextField label="パスワード" type="password" value={dlPassword} onChange={(e) => setDlPassword(e.target.value)} fullWidth disabled={dlLoading} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleFetch(); } }} />
          <FormControlLabel
            control={<Checkbox checked={dlConsent} onChange={(e) => setDlConsent(e.target.checked)} size="small" />}
            label={<Typography variant="body2"><Link href="/terms" target="_blank" style={{ textDecoration: 'underline' }}>利用規約（第6条）</Link>に同意する</Typography>}
            sx={{ mt: 1.5, display: 'block' }}
          />
          <FormControlLabel
            control={<Checkbox checked={dlSaveCredentials} onChange={(e) => setDlSaveCredentials(e.target.checked)} size="small" />}
            label="この端末に認証情報を保存する"
            sx={{ mt: 0.5 }}
          />
          {dlHasSaved && (
            <Button
              size="small"
              color="error"
              onClick={() => {
                localStorage.removeItem('dartslive_credentials');
                setDlEmail('');
                setDlPassword('');
                setDlHasSaved(false);
              }}
              sx={{ ml: 1 }}
            >
              保存済み情報を削除
            </Button>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDlOpen(false)} disabled={dlLoading}>キャンセル</Button>
          <Button onClick={handleFetch} variant="contained" disabled={dlLoading || !dlConsent} startIcon={dlLoading ? <CircularProgress size={18} /> : <SyncIcon />}>
            {dlLoading ? '取得中...' : '取得'}
          </Button>
        </DialogActions>
      </Dialog>}
    </Container>
  );
}
