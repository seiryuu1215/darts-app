'use client';

import { Box, Typography, Button, Stack } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import BarChartIcon from '@mui/icons-material/BarChart';
import SettingsIcon from '@mui/icons-material/Settings';
import Link from 'next/link';

const highlights = [
  { icon: <SearchIcon />, text: 'バレル7,000種検索' },
  { icon: <BarChartIcon />, text: 'スタッツ分析' },
  { icon: <SettingsIcon />, text: 'セッティング管理' },
];

export default function GuestHero() {
  return (
    <Box
      sx={{
        textAlign: 'center',
        py: { xs: 5, md: 7 },
        mb: 4,
        borderRadius: 4,
        background:
          'linear-gradient(135deg, rgba(102,126,234,0.15) 0%, rgba(118,75,162,0.15) 100%)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <Typography
        variant="h3"
        fontWeight="bold"
        sx={{
          mb: 1,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        Darts Lab
      </Typography>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
        ダーツプレイヤーのための総合ツール
      </Typography>

      <Stack
        direction="row"
        spacing={3}
        justifyContent="center"
        flexWrap="wrap"
        sx={{ mb: 4, px: 2 }}
      >
        {highlights.map((h) => (
          <Box key={h.text} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ color: 'primary.main' }}>{h.icon}</Box>
            <Typography variant="body2" fontWeight="bold">
              {h.text}
            </Typography>
          </Box>
        ))}
      </Stack>

      <Button
        component={Link}
        href="/register"
        variant="contained"
        size="large"
        sx={{
          px: 4,
          py: 1.5,
          borderRadius: 3,
          fontWeight: 'bold',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #5a6fd6 0%, #6a4392 100%)',
          },
        }}
      >
        無料で始める
      </Button>
    </Box>
  );
}
