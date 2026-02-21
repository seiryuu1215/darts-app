'use client';

import { Paper, Typography, Chip, Button, Box, LinearProgress } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import Link from 'next/link';

interface ProPaywallProps {
  title: string;
  description: string;
  variant?: 'full' | 'compact';
  currentUsage?: { current: number; limit: number; label: string };
}

export default function ProPaywall({
  title,
  description,
  variant = 'full',
  currentUsage,
}: ProPaywallProps) {
  if (variant === 'compact') {
    return (
      <Paper
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          py: 1.5,
          px: 2,
          mb: 2,
          bgcolor: 'background.default',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
        }}
      >
        <LockIcon sx={{ fontSize: 20, color: 'text.disabled', flexShrink: 0 }} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            {title}
          </Typography>
          {currentUsage && (
            <Box sx={{ mt: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                {currentUsage.label}: {currentUsage.current}/{currentUsage.limit}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={Math.min((currentUsage.current / currentUsage.limit) * 100, 100)}
                sx={{ mt: 0.5, height: 4, borderRadius: 2 }}
              />
            </Box>
          )}
        </Box>
        <Chip label="PRO" color="primary" size="small" sx={{ flexShrink: 0 }} />
        <Button
          variant="outlined"
          size="small"
          component={Link}
          href="/pricing"
          sx={{ borderRadius: 2, flexShrink: 0 }}
        >
          詳細
        </Button>
      </Paper>
    );
  }

  return (
    <Paper
      sx={{
        textAlign: 'center',
        py: 6,
        px: 3,
        mb: 2,
        bgcolor: 'background.default',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
      }}
    >
      <LockIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
      <Typography variant="h6" sx={{ mb: 1 }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {description}
      </Typography>
      {currentUsage && (
        <Box sx={{ mb: 2, maxWidth: 240, mx: 'auto' }}>
          <Typography variant="caption" color="text.secondary">
            {currentUsage.label}: {currentUsage.current}/{currentUsage.limit}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={Math.min((currentUsage.current / currentUsage.limit) * 100, 100)}
            sx={{ mt: 0.5, height: 6, borderRadius: 3 }}
          />
        </Box>
      )}
      <Chip label="PRO" color="primary" size="small" sx={{ mb: 1 }} />
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
        1週間の無料トライアルで全機能をお試しください
      </Typography>
      <Box>
        <Button
          variant="contained"
          size="small"
          component={Link}
          href="/pricing"
          sx={{ borderRadius: 2 }}
        >
          PROプランを見る
        </Button>
      </Box>
    </Paper>
  );
}
