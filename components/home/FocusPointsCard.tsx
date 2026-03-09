'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  TextField,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useDemoGuard } from '@/hooks/useDemoGuard';

const MAX_FOCUS_POINTS = 3;

interface FocusPoint {
  id: string;
  text: string;
  order: number;
}

interface FocusPointsCardProps {
  userId: string;
}

export default function FocusPointsCard({ userId }: FocusPointsCardProps) {
  const { isDemo, guardedAction } = useDemoGuard();
  const [points, setPoints] = useState<FocusPoint[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [newText, setNewText] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const colRef = collection(db, `users/${userId}/focusPoints`);
    const q = query(colRef, orderBy('order', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      setPoints(
        snap.docs.map((d) => ({
          id: d.id,
          text: d.data().text as string,
          order: d.data().order as number,
        })),
      );
    });
    return unsub;
  }, [userId]);

  const handleAdd = () =>
    guardedAction(async () => {
      if (!newText.trim() || points.length >= MAX_FOCUS_POINTS) return;
      setSaving(true);
      setError(null);
      try {
        await addDoc(collection(db, `users/${userId}/focusPoints`), {
          text: newText.trim(),
          order: points.length,
          createdAt: serverTimestamp(),
        });
        setNewText('');
        setAddOpen(false);
      } catch (e) {
        console.error('focusPoints addDoc error:', e);
        setError('保存に失敗しました。再度お試しください。');
      } finally {
        setSaving(false);
      }
    });

  const handleReorder = (index: number, direction: 'up' | 'down') =>
    guardedAction(async () => {
      const swapIndex = direction === 'up' ? index - 1 : index + 1;
      if (swapIndex < 0 || swapIndex >= points.length) return;
      const batch = writeBatch(db);
      const a = points[index];
      const b = points[swapIndex];
      batch.update(doc(db, `users/${userId}/focusPoints`, a.id), { order: b.order });
      batch.update(doc(db, `users/${userId}/focusPoints`, b.id), { order: a.order });
      await batch.commit();
    });

  const handleDelete = (id: string) =>
    guardedAction(async () => {
      setConfirmDeleteId(null);
      await deleteDoc(doc(db, `users/${userId}/focusPoints`, id));
    });

  return (
    <Box sx={{ mb: 3 }} data-tour-id="focus-points">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TrackChangesIcon color="primary" />
          <Typography variant="h5">意識ポイント</Typography>
        </Box>
        {points.length < MAX_FOCUS_POINTS && !isDemo && (
          <Button size="small" startIcon={<AddIcon />} onClick={() => setAddOpen(true)}>
            追加
          </Button>
        )}
      </Box>

      {points.length === 0 ? (
        <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 4 }}>
          練習で意識するポイントを設定しよう（最大{MAX_FOCUS_POINTS}つ）
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {points.map((point, idx) => (
            <Card
              key={point.id}
              sx={{
                borderLeft: 4,
                borderColor: 'warning.main',
                height: '100%',
              }}
            >
              <CardContent
                sx={{
                  py: 1.5,
                  px: 2,
                  '&:last-child': { pb: 1.5 },
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                }}
              >
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  color="warning.main"
                  sx={{ minWidth: 24, textAlign: 'center' }}
                >
                  {idx + 1}
                </Typography>
                <Typography variant="body2" sx={{ flex: 1 }}>
                  {point.text}
                </Typography>
                {!isDemo && points.length > 1 && (
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    {idx > 0 && (
                      <IconButton
                        size="small"
                        onClick={() => handleReorder(idx, 'up')}
                        aria-label="上に移動"
                        sx={{ p: 0, fontSize: 16 }}
                      >
                        <ArrowUpwardIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    )}
                    {idx < points.length - 1 && (
                      <IconButton
                        size="small"
                        onClick={() => handleReorder(idx, 'down')}
                        aria-label="下に移動"
                        sx={{ p: 0, fontSize: 16 }}
                      >
                        <ArrowDownwardIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    )}
                  </Box>
                )}
                <IconButton
                  size="small"
                  onClick={() => setConfirmDeleteId(point.id)}
                  color="success"
                  aria-label="達成済みにする"
                  sx={{ p: 0.5 }}
                >
                  <CheckCircleOutlineIcon />
                </IconButton>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* 追加ダイアログ */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>意識ポイントを追加</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            size="small"
            placeholder="例: グリップを柔らかく"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newText.trim() && !saving) handleAdd();
            }}
            sx={{ mt: 1 }}
            slotProps={{ htmlInput: { maxLength: 50 } }}
          />
          {error && (
            <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
              {error}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddOpen(false)}>キャンセル</Button>
          <Button variant="contained" onClick={handleAdd} disabled={!newText.trim() || saving}>
            追加
          </Button>
        </DialogActions>
      </Dialog>

      {/* 達成確認ダイアログ */}
      <Dialog
        open={confirmDeleteId !== null}
        onClose={() => setConfirmDeleteId(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>意識ポイントを達成</DialogTitle>
        <DialogContent>
          <Typography>無意識にできるようになりましたか？</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteId(null)}>まだ</Button>
          <Button
            variant="contained"
            color="success"
            onClick={() => confirmDeleteId && handleDelete(confirmDeleteId)}
          >
            できた！
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
