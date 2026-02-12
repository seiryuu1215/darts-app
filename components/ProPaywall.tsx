'use client';

import { Paper, Typography, Chip, Button, Box } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import Link from 'next/link';

interface ProPaywallProps {
  title: string;
  description: string;
}

export default function ProPaywall({ title, description }: ProPaywallProps) {
  return (
    <Paper sx={{ textAlign: 'center', py: 6, px: 3, mb: 2, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
      <LockIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
      <Typography variant="h6" sx={{ mb: 1 }}>{title}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {description}
      </Typography>
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
