'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Container,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  Rating,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import SyncIcon from '@mui/icons-material/Sync';
import { collection, doc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function StatsNewPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [date, setDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  });
  const [rating, setRating] = useState('');
  const [gamesPlayed, setGamesPlayed] = useState('');
  const [ppd, setPpd] = useState('');
  const [avg, setAvg] = useState('');
  const [highOff, setHighOff] = useState('');
  const [mpr, setMpr] = useState('');
  const [highScore, setHighScore] = useState('');
  const [bullRate, setBullRate] = useState('');
  const [hatTricks, setHatTricks] = useState('');
  const [condition, setCondition] = useState<number | null>(3);
  const [memo, setMemo] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // ダーツライブ取得用
  const [dlOpen, setDlOpen] = useState(false);
  const [dlEmail, setDlEmail] = useState('');
  const [dlPassword, setDlPassword] = useState('');
  const [dlLoading, setDlLoading] = useState(false);
  const [dlError, setDlError] = useState('');
  const [dlSuccess, setDlSuccess] = useState('');

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  const handleFetchFromDartslive = async () => {
    if (!dlEmail || !dlPassword) {
      setDlError('メールアドレスとパスワードを入力してください');
      return;
    }
    setDlError('');
    setDlSuccess('');
    setDlLoading(true);

    try {
      const res = await fetch('/api/dartslive-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: dlEmail, password: dlPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        setDlError(data.error || '取得に失敗しました');
        return;
      }

      // フォームに自動入力
      const d = data.data;
      const c = d.current;
      if (c.rating != null) setRating(c.rating.toString());
      if (c.stats01Avg != null) setPpd(c.stats01Avg.toString());
      if (c.statsCriAvg != null) setMpr(c.statsCriAvg.toString());
      if (c.awards?.['HAT TRICK']) setHatTricks(c.awards['HAT TRICK'].total.toString());

      setDlSuccess(`取得完了 (${c.cardName || 'カード'})`);
      setTimeout(() => {
        setDlOpen(false);
        setDlSuccess('');
      }, 1500);
    } catch {
      setDlError('通信エラーが発生しました');
    } finally {
      setDlLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) return;
    if (!rating || !ppd || !mpr) {
      setError('レーティング、PPD、MPRは必須です');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const statsRef = doc(collection(db, 'users', session.user.id, 'dartsLiveStats'));
      const dateObj = new Date(date + 'T00:00:00');

      await setDoc(statsRef, {
        date: Timestamp.fromDate(dateObj),
        rating: Number(rating),
        gamesPlayed: Number(gamesPlayed) || 0,
        zeroOneStats: {
          ppd: Number(ppd),
          avg: avg ? Number(avg) : null,
          highOff: highOff ? Number(highOff) : null,
        },
        cricketStats: {
          mpr: Number(mpr),
          highScore: highScore ? Number(highScore) : null,
        },
        bullRate: bullRate ? Number(bullRate) : null,
        hatTricks: hatTricks ? Number(hatTricks) : null,
        condition: (condition || 3) as 1 | 2 | 3 | 4 | 5,
        memo,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      router.push('/stats');
    } catch {
      setError('保存に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 4, p: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5">スタッツ記録</Typography>
          <Button
            variant="outlined"
            startIcon={<SyncIcon />}
            onClick={() => setDlOpen(true)}
            size="small"
          >
            ダーツライブから取得
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          label="日付"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          fullWidth
          required
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ mb: 3 }}
        />

        <Typography variant="h6" sx={{ mb: 1 }}>
          基本スタッツ
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <TextField
            label="レーティング"
            type="number"
            value={rating}
            onChange={(e) => setRating(e.target.value)}
            required
            sx={{ flex: 1 }}
            inputProps={{ step: '0.01' }}
          />
          <TextField
            label="ゲーム数"
            type="number"
            value={gamesPlayed}
            onChange={(e) => setGamesPlayed(e.target.value)}
            sx={{ flex: 1 }}
            inputProps={{ min: 0 }}
          />
        </Box>

        <Divider sx={{ mb: 2 }} />
        <Typography variant="h6" sx={{ mb: 1 }}>
          01スタッツ
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
          <TextField
            label="PPD"
            type="number"
            value={ppd}
            onChange={(e) => setPpd(e.target.value)}
            required
            sx={{ flex: 1 }}
            inputProps={{ step: '0.01' }}
          />
          <TextField
            label="アベレージ"
            type="number"
            value={avg}
            onChange={(e) => setAvg(e.target.value)}
            sx={{ flex: 1 }}
            inputProps={{ step: '0.01' }}
          />
        </Box>
        <TextField
          label="ハイオフ（最高上がり）"
          type="number"
          value={highOff}
          onChange={(e) => setHighOff(e.target.value)}
          fullWidth
          sx={{ mb: 3 }}
          inputProps={{ min: 0 }}
        />

        <Divider sx={{ mb: 2 }} />
        <Typography variant="h6" sx={{ mb: 1 }}>
          クリケットスタッツ
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <TextField
            label="MPR"
            type="number"
            value={mpr}
            onChange={(e) => setMpr(e.target.value)}
            required
            sx={{ flex: 1 }}
            inputProps={{ step: '0.01' }}
          />
          <TextField
            label="ハイスコア"
            type="number"
            value={highScore}
            onChange={(e) => setHighScore(e.target.value)}
            sx={{ flex: 1 }}
            inputProps={{ min: 0 }}
          />
        </Box>

        <Divider sx={{ mb: 2 }} />
        <Typography variant="h6" sx={{ mb: 1 }}>
          詳細スタッツ
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <TextField
            label="ブル率 (%)"
            type="number"
            value={bullRate}
            onChange={(e) => setBullRate(e.target.value)}
            sx={{ flex: 1 }}
            inputProps={{ step: '0.1', min: 0, max: 100 }}
          />
          <TextField
            label="ハットトリック数"
            type="number"
            value={hatTricks}
            onChange={(e) => setHatTricks(e.target.value)}
            sx={{ flex: 1 }}
            inputProps={{ min: 0 }}
          />
        </Box>

        <Divider sx={{ mb: 2 }} />
        <Typography variant="h6" sx={{ mb: 1 }}>
          調子
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <Rating value={condition} onChange={(_, v) => setCondition(v)} max={5} />
          <Typography variant="body2" color="text.secondary">
            {condition === 1 && '絶不調'}
            {condition === 2 && '不調'}
            {condition === 3 && '普通'}
            {condition === 4 && '好調'}
            {condition === 5 && '絶好調'}
          </Typography>
        </Box>

        <TextField
          label="メモ"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          fullWidth
          multiline
          rows={3}
          placeholder="今日の気づきや課題など..."
          sx={{ mb: 3 }}
        />

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" fullWidth onClick={() => router.push('/stats')}>
            キャンセル
          </Button>
          <Button type="submit" variant="contained" fullWidth disabled={loading} size="large">
            {loading ? '保存中...' : '保存'}
          </Button>
        </Box>
      </Box>

      {/* ダーツライブ取得ダイアログ */}
      <Dialog open={dlOpen} onClose={() => !dlLoading && setDlOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>ダーツライブからスタッツ取得</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            ダーツライブのアカウント情報でログインし、メインカードのスタッツを自動取得します。認証情報はサーバーに保存されません。
          </Typography>
          {dlError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {dlError}
            </Alert>
          )}
          {dlSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {dlSuccess}
            </Alert>
          )}
          <TextField
            label="メールアドレス"
            type="email"
            value={dlEmail}
            onChange={(e) => setDlEmail(e.target.value)}
            fullWidth
            disabled={dlLoading}
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            label="パスワード"
            type="password"
            value={dlPassword}
            onChange={(e) => setDlPassword(e.target.value)}
            fullWidth
            disabled={dlLoading}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDlOpen(false)} disabled={dlLoading}>
            キャンセル
          </Button>
          <Button
            onClick={handleFetchFromDartslive}
            variant="contained"
            disabled={dlLoading}
            startIcon={dlLoading ? <CircularProgress size={18} /> : <SyncIcon />}
          >
            {dlLoading ? '取得中...' : '取得'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
