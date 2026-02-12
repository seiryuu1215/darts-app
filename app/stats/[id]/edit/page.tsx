'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import {
  Container,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  Rating,
  Divider,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function StatsEditPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const statsId = params.id as string;

  const [date, setDate] = useState('');
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated' && session?.user?.id) {
      const fetchStats = async () => {
        try {
          const docSnap = await getDoc(
            doc(db, 'users', session.user.id, 'dartsLiveStats', statsId),
          );
          if (!docSnap.exists()) {
            setError('スタッツが見つかりません');
            setLoading(false);
            return;
          }
          const data = docSnap.data();
          const d = data.date.toDate();
          setDate(
            `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
          );
          setRating(data.rating?.toString() || '');
          setGamesPlayed(data.gamesPlayed?.toString() || '');
          setPpd(data.zeroOneStats?.ppd?.toString() || '');
          setAvg(data.zeroOneStats?.avg?.toString() || '');
          setHighOff(data.zeroOneStats?.highOff?.toString() || '');
          setMpr(data.cricketStats?.mpr?.toString() || '');
          setHighScore(data.cricketStats?.highScore?.toString() || '');
          setBullRate(data.bullRate?.toString() || '');
          setHatTricks(data.hatTricks?.toString() || '');
          setCondition(data.condition || 3);
          setMemo(data.memo || '');
        } catch {
          setError('スタッツの取得に失敗しました');
        } finally {
          setLoading(false);
        }
      };
      fetchStats();
    }
  }, [status, session, router, statsId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) return;
    if (!rating || !ppd || !mpr) {
      setError('レーティング、PPD、MPRは必須です');
      return;
    }
    setError('');
    setSaving(true);

    try {
      const dateObj = new Date(date + 'T00:00:00');
      await updateDoc(doc(db, 'users', session.user.id, 'dartsLiveStats', statsId), {
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
        updatedAt: serverTimestamp(),
      });
      router.push('/stats');
    } catch {
      setError('更新に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!session?.user?.id) return;
    try {
      await deleteDoc(doc(db, 'users', session.user.id, 'dartsLiveStats', statsId));
      router.push('/stats');
    } catch {
      setError('削除に失敗しました');
    }
  };

  if (loading || status === 'loading') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 4, p: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5">スタッツ編集</Typography>
          <Button color="error" startIcon={<DeleteIcon />} onClick={() => setDeleteOpen(true)}>
            削除
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
          <Button type="submit" variant="contained" fullWidth disabled={saving} size="large">
            {saving ? '保存中...' : '更新'}
          </Button>
        </Box>
      </Box>

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>スタッツを削除</DialogTitle>
        <DialogContent>
          <DialogContentText>
            このスタッツ記録を削除しますか？この操作は取り消せません。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>キャンセル</Button>
          <Button onClick={handleDelete} color="error">
            削除
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
