'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Chip,
} from '@mui/material';
import type { ShopList } from '@/types';

const COLORS = ['default', 'primary', 'secondary', 'success', 'warning', 'error'] as const;

const COLOR_LABELS: Record<string, string> = {
  default: 'グレー',
  primary: 'ブルー',
  secondary: 'パープル',
  success: 'グリーン',
  warning: 'オレンジ',
  error: 'レッド',
};

interface ShopListDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: { name: string; color: string }) => void;
  initial?: Partial<ShopList> | null;
}

export default function ShopListDialog({
  open,
  onClose,
  onSave,
  initial,
}: ShopListDialogProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('default');
  const [lastOpen, setLastOpen] = useState(false);

  if (open && !lastOpen) {
    setName(initial?.name || '');
    setColor(initial?.color || 'default');
  }
  if (open !== lastOpen) {
    setLastOpen(open);
  }

  const isEdit = !!initial?.name;

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), color });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{isEdit ? 'リスト編集' : '新規リスト作成'}</DialogTitle>
      <DialogContent>
        <TextField
          label="リスト名"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
          required
          sx={{ mt: 1, mb: 2 }}
          placeholder="例: 投げ放題の店"
        />

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          カラー
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          {COLORS.map((c) => (
            <Chip
              key={c}
              label={COLOR_LABELS[c]}
              size="small"
              color={c}
              variant={color === c ? 'filled' : 'outlined'}
              onClick={() => setColor(c)}
            />
          ))}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        <Button onClick={handleSave} variant="contained" disabled={!name.trim()}>
          {isEdit ? '更新' : '作成'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
