'use client';

import { useMemo } from 'react';
import { Dialog, DialogContent, DialogActions, Button, Box, Typography } from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { GOAL_TYPE_LABELS } from '@/types';
import type { GoalType } from '@/types';

interface GoalAchievedDialogProps {
  open: boolean;
  goalType: string;
  target: number;
  xpAmount?: number;
  onClose: () => void;
}

const CONFETTI_COLORS = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'];

export default function GoalAchievedDialog({
  open,
  goalType,
  target,
  xpAmount = 50,
  onClose,
}: GoalAchievedDialogProps) {
  const label = GOAL_TYPE_LABELS[goalType as GoalType] || goalType;

  // 紙吹雪の位置・タイミングを事前計算（renderごとに変わらない）
  const confettiPieces = useMemo(
    () =>
      Array.from({ length: 20 }, (_, i) => ({
        left: `${(i * 5 + ((i * 37) % 100)) % 100}%`,
        color: CONFETTI_COLORS[i % 6],
        delay: `${(i * 0.1) % 2}s`,
        duration: `${1.5 + ((i * 0.07) % 1.5)}s`,
      })),
    [],
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogContent>
        <Box
          sx={{
            textAlign: 'center',
            py: 2,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* 紙吹雪アニメーション */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              pointerEvents: 'none',
              '& span': {
                position: 'absolute',
                display: 'block',
                width: 8,
                height: 8,
                borderRadius: '50%',
                animation: 'confetti-fall 2s ease-in-out infinite',
              },
              '@keyframes confetti-fall': {
                '0%': { transform: 'translateY(-20px) rotate(0deg)', opacity: 1 },
                '100%': { transform: 'translateY(300px) rotate(720deg)', opacity: 0 },
              },
            }}
          >
            {confettiPieces.map((piece, i) => (
              <Box
                component="span"
                key={i}
                sx={{
                  left: piece.left,
                  bgcolor: piece.color,
                  animationDelay: piece.delay,
                  animationDuration: piece.duration,
                }}
              />
            ))}
          </Box>

          <EmojiEventsIcon sx={{ fontSize: 64, color: '#FFD700', mb: 1 }} />
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
            目標達成!
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
            {label}: {target.toLocaleString()} を達成しました!
          </Typography>
          <Typography variant="body2" color="primary" sx={{ fontWeight: 'bold' }}>
            +{xpAmount} XP 獲得!
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
        <Button variant="contained" onClick={onClose} size="large">
          やったー!
        </Button>
      </DialogActions>
    </Dialog>
  );
}
