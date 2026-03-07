'use client';

import { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  Chip,
  IconButton,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

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
  const [points, setPoints] = useState<FocusPoint[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [newText, setNewText] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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

  const handleAdd = async () => {
    if (!newText.trim() || points.length >= MAX_FOCUS_POINTS) return;
    setSaving(true);
    try {
      await addDoc(collection(db, `users/${userId}/focusPoints`), {
        text: newText.trim(),
        order: points.length,
        createdAt: serverTimestamp(),
      });
      setNewText('');
      setAddOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setConfirmDeleteId(null);
    await deleteDoc(doc(db, `users/${userId}/focusPoints`, id));
  };

  return (
    <Paper sx={{ p: 2, mb: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TrackChangesIcon fontSize="small" color="primary" />
          <Typography variant="subtitle1" fontWeight="bold">
            練習の意識ポイント
          </Typography>
        </Box>
        {points.length < MAX_FOCUS_POINTS && (
          <IconButton size="small" onClick={() => setAddOpen(true)} color="primary">
            <AddIcon />
          </IconButton>
        )}
      </Box>

      {points.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
          練習で意識するポイントを設定しましょう（最大{MAX_FOCUS_POINTS}つ）
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {points.map((point) => (
            <Chip
              key={point.id}
              label={point.text}
              deleteIcon={<CheckCircleIcon />}
              onDelete={() => setConfirmDeleteId(point.id)}
              sx={{
                height: 'auto',
                py: 0.5,
                '& .MuiChip-label': { whiteSpace: 'normal', lineHeight: 1.4 },
                '& .MuiChip-deleteIcon': { color: 'success.main' },
              }}
            />
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
            sx={{ mt: 1 }}
            slotProps={{ htmlInput: { maxLength: 50 } }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddOpen(false)}>キャンセル</Button>
          <Button variant="contained" onClick={handleAdd} disabled={!newText.trim() || saving}>
            追加
          </Button>
        </DialogActions>
      </Dialog>

      {/* 削除確認ダイアログ */}
      <Dialog
        open={confirmDeleteId !== null}
        onClose={() => setConfirmDeleteId(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>意識ポイントを削除</DialogTitle>
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
    </Paper>
  );
}
