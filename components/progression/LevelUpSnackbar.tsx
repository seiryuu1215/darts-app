'use client';

import { Snackbar, Alert } from '@mui/material';

interface LevelUpSnackbarProps {
  open: boolean;
  level: number;
  rank: string;
  onClose: () => void;
}

export default function LevelUpSnackbar({ open, level, rank, onClose }: LevelUpSnackbarProps) {
  return (
    <Snackbar
      open={open}
      autoHideDuration={4000}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      <Alert onClose={onClose} severity="success" variant="filled" sx={{ width: '100%' }}>
        Level UP! Lv.{level} {rank} に到達しました!
      </Alert>
    </Snackbar>
  );
}
