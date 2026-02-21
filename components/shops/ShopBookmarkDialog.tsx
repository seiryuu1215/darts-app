'use client';

import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Rating,
  Typography,
  Switch,
  FormControlLabel,
  Alert,
} from '@mui/material';

interface ShopBookmarkData {
  shopId?: string | null;
  name: string;
  address: string;
  note: string;
  rating: number | null;
  isFavorite: boolean;
}

interface ShopBookmarkDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: ShopBookmarkData) => void;
  initial?: Partial<ShopBookmarkData> | null;
  homeShop?: string | null;
}

export default function ShopBookmarkDialog({
  open,
  onClose,
  onSave,
  initial,
  homeShop,
}: ShopBookmarkDialogProps) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showHomeShop, setShowHomeShop] = useState(false);
  const [lastOpen, setLastOpen] = useState(false);

  // openがfalse→trueに変わった時にフォームをリセット（useEffectの代替）
  if (open && !lastOpen) {
    setName(initial?.name || '');
    setAddress(initial?.address || '');
    setNote(initial?.note || '');
    setRating(initial?.rating ?? null);
    setIsFavorite(initial?.isFavorite ?? false);
    setShowHomeShop(!initial?.name && !!homeShop);
  }
  if (open !== lastOpen) {
    setLastOpen(open);
  }

  const isEdit = useMemo(() => !!initial?.name, [initial]);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      shopId: initial?.shopId ?? null,
      name: name.trim(),
      address: address.trim(),
      note: note.trim(),
      rating,
      isFavorite,
    });
  };

  const handleUseHomeShop = () => {
    if (homeShop) {
      setName(homeShop);
      setShowHomeShop(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{isEdit ? 'ブックマーク編集' : 'ショップを追加'}</DialogTitle>
      <DialogContent>
        {showHomeShop && homeShop && (
          <Alert
            severity="info"
            sx={{ mb: 2 }}
            action={
              <Button size="small" onClick={handleUseHomeShop}>
                追加
              </Button>
            }
          >
            ホームショップ「{homeShop}」を追加しますか？
          </Alert>
        )}

        <TextField
          label="店名"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
          required
          sx={{ mt: 1, mb: 2 }}
        />
        <TextField
          label="住所"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          fullWidth
          required
          sx={{ mb: 2 }}
        />

        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
            評価
          </Typography>
          <Rating
            value={rating}
            onChange={(_, v) => setRating(v)}
          />
        </Box>

        <TextField
          label="感想・メモ"
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, 500))}
          fullWidth
          multiline
          rows={3}
          helperText={`${note.length}/500`}
          sx={{ mb: 2 }}
        />

        <FormControlLabel
          control={
            <Switch checked={isFavorite} onChange={(e) => setIsFavorite(e.target.checked)} />
          }
          label="お気に入り"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        <Button onClick={handleSave} variant="contained" disabled={!name.trim()}>
          {isEdit ? '更新' : '追加'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
