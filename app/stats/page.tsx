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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import SyncIcon from '@mui/icons-material/Sync';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
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
} from 'recharts';

// === Color constants ===
const COLOR_01 = '#e53935';       // 01 - 赤
const COLOR_CRICKET = '#1e88e5';  // Cricket - 青
const COLOR_COUNTUP = '#43a047';  // Count-Up - 緑
const COLOR_RATING = '#ff9800';   // Rating accent

// Flight colors (DARTSLIVE inspired)
const FLIGHT_COLORS: Record<string, string> = {
  C: '#9e9e9e',
  CC: '#78909c',
  B: '#66bb6a',
  BB: '#29b6f6',
  A: '#ab47bc',
  AA: '#ff7043',
  SA: '#e53935',
};

function getFlightColor(flight: string): string {
  return FLIGHT_COLORS[flight] || '#ff9800';
}

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

const MONTHLY_CONFIG: Record<MonthlyTab, { label: string; color: string }> = {
  rating: { label: 'RATING', color: COLOR_RATING },
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

  const [dlData, setDlData] = useState<DartsliveData | null>(null);
  const [dlOpen, setDlOpen] = useState(false);
  const [dlEmail, setDlEmail] = useState('');
  const [dlPassword, setDlPassword] = useState('');
  const [dlLoading, setDlLoading] = useState(false);
  const [dlError, setDlError] = useState('');
  const [monthlyTab, setMonthlyTab] = useState<MonthlyTab>('rating');
  const [gameChartCategory, setGameChartCategory] = useState<string>('');
  const [activeSoftDart, setActiveSoftDart] = useState<Dart | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // キャッシュ済みスタッツ + 使用中ダーツを取得
  useEffect(() => {
    if (!session?.user?.id) return;

    // キャッシュからスタッツをロード
    const fetchCachedStats = async () => {
      try {
        const res = await fetch('/api/dartslive-stats');
        if (!res.ok) return;
        const json = await res.json();
        if (json.data) {
          setDlData(json.data);
          if (json.data.recentGames?.games?.length > 0) {
            setGameChartCategory(json.data.recentGames.games[0].category);
          }
        }
      } catch { /* ignore */ }
    };

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

    fetchCachedStats();
    fetchActiveDart();
  }, [session]);

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
      if (json.data.recentGames?.games?.length > 0) {
        setGameChartCategory(json.data.recentGames.games[0].category);
      }
    } catch { setDlError('通信エラーが発生しました'); } finally { setDlLoading(false); }
  };

  if (status === 'loading') {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;
  }

  const c = dlData?.current;
  const prev = dlData?.prev;
  const flightColor = c?.flight ? getFlightColor(c.flight) : COLOR_RATING;
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

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 3, p: { xs: 1, sm: 2 } }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>DARTSLIVE Stats</Typography>
          <Button
            variant={dlData ? 'outlined' : 'contained'}
            startIcon={dlLoading ? <CircularProgress size={18} color="inherit" /> : <SyncIcon />}
            onClick={() => (dlData && dlEmail && dlPassword ? handleFetch() : setDlOpen(true))}
            disabled={dlLoading}
            size="small"
          >
            {dlLoading ? '取得中...' : dlData ? '更新' : 'ダーツライブ連携'}
          </Button>
        </Box>

        {/* 未取得 */}
        {!dlData && !dlLoading && (
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

        {dlLoading && !dlData && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <CircularProgress sx={{ mb: 2 }} />
            <Typography color="text.secondary">ダーツライブからスタッツ取得中...</Typography>
          </Box>
        )}

        {dlData && c && (
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
              </Paper>
            </Box>

            {/* === 使用中ソフトダーツ === */}
            {activeSoftDart && (
              <Card
                component={Link}
                href={`/darts/${activeSoftDart.id}`}
                sx={{
                  textDecoration: 'none', display: 'flex', flexDirection: 'row', mb: 2,
                  height: 72, borderRadius: 2, borderLeft: `3px solid ${COLOR_RATING}`,
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
                    <ToggleButton value="rating" sx={{ '&.Mui-selected': { color: COLOR_RATING } }}>Rt</ToggleButton>
                    <ToggleButton value="zeroOne" sx={{ '&.Mui-selected': { color: COLOR_01 } }}>01</ToggleButton>
                    <ToggleButton value="cricket" sx={{ '&.Mui-selected': { color: COLOR_CRICKET } }}>Cri</ToggleButton>
                    <ToggleButton value="countUp" sx={{ '&.Mui-selected': { color: COLOR_COUNTUP } }}>CU</ToggleButton>
                  </ToggleButtonGroup>
                </Box>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={monthlyChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis dataKey="month" fontSize={11} />
                    <YAxis domain={['auto', 'auto']} fontSize={11} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="value"
                      name={MONTHLY_CONFIG[monthlyTab].label}
                      stroke={MONTHLY_CONFIG[monthlyTab].color}
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: MONTHLY_CONFIG[monthlyTab].color }}
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
                {gameChartData.length > 0 && (
                  <ResponsiveContainer width="100%" height={230}>
                    <ComposedChart data={gameChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                      <XAxis dataKey="game" fontSize={11} />
                      <YAxis domain={['auto', 'auto']} fontSize={11} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="score" name="スコア" fill={getGameColor(gameChartCategory)} opacity={0.7} />
                      <Line type="monotone" dataKey="avg" name="累計平均" stroke="#fff" strokeWidth={2} dot={false} />
                      {selectedGame && (
                        <ReferenceLine
                          y={selectedGame.scores.reduce((a, b) => a + b, 0) / selectedGame.scores.length}
                          stroke={getGameColor(gameChartCategory)}
                          strokeDasharray="5 5"
                        />
                      )}
                    </ComposedChart>
                  </ResponsiveContainer>
                )}
                {/* Scores chips */}
                {selectedGame && (
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 1 }}>
                    {selectedGame.scores.map((s, i) => {
                      const avg = selectedGame.scores.reduce((a, b) => a + b, 0) / selectedGame.scores.length;
                      return (
                        <Chip
                          key={i}
                          label={gameChartCategory.includes('CRICKET') && !gameChartCategory.includes('COUNT') ? s.toFixed(2) : s}
                          size="small"
                          variant={s >= avg ? 'filled' : 'outlined'}
                          sx={{
                            bgcolor: s >= avg ? `${getGameColor(gameChartCategory)}22` : undefined,
                            borderColor: getGameColor(gameChartCategory),
                            color: s >= avg ? getGameColor(gameChartCategory) : 'text.secondary',
                            fontWeight: s >= avg * 1.1 ? 'bold' : 'normal',
                          }}
                        />
                      );
                    })}
                  </Box>
                )}
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

            {/* 手動記録リンク */}
            <Card variant="outlined" sx={{ mb: 3, borderRadius: 2 }}>
              <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: '12px !important' }}>
                <Box>
                  <Typography variant="body2">調子やメモを記録</Typography>
                  <Typography variant="caption" color="text.secondary">手動でスタッツを記録・管理</Typography>
                </Box>
                <Button variant="outlined" size="small" onClick={() => router.push('/stats/new')}>手動記録</Button>
              </CardContent>
            </Card>
          </>
        )}
      </Box>

      {/* ログインダイアログ */}
      <Dialog open={dlOpen} onClose={() => !dlLoading && setDlOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>ダーツライブ連携</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            ダーツライブのアカウント情報でログインし、メインカードのスタッツを取得します。認証情報はサーバーに保存されません。
          </Typography>
          {dlError && <Alert severity="error" sx={{ mb: 2 }}>{dlError}</Alert>}
          <TextField label="メールアドレス" type="email" value={dlEmail} onChange={(e) => setDlEmail(e.target.value)} fullWidth disabled={dlLoading} sx={{ mb: 2, mt: 1 }} />
          <TextField label="パスワード" type="password" value={dlPassword} onChange={(e) => setDlPassword(e.target.value)} fullWidth disabled={dlLoading} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleFetch(); } }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDlOpen(false)} disabled={dlLoading}>キャンセル</Button>
          <Button onClick={handleFetch} variant="contained" disabled={dlLoading} startIcon={dlLoading ? <CircularProgress size={18} /> : <SyncIcon />}>
            {dlLoading ? '取得中...' : '取得'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
