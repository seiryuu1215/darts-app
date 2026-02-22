'use client';

import { Box, ButtonBase, Typography } from '@mui/material';
import BarChartIcon from '@mui/icons-material/BarChart';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import StorefrontIcon from '@mui/icons-material/Storefront';
import ArticleIcon from '@mui/icons-material/Article';
import Link from 'next/link';

const actions = [
  { label: 'スタッツ', href: '/stats', icon: <BarChartIcon /> },
  { label: 'セッティング追加', href: '/darts/new', icon: <AddCircleOutlineIcon /> },
  { label: 'ショップ', href: '/shops', icon: <StorefrontIcon /> },
  { label: '記事', href: '/articles', icon: <ArticleIcon /> },
];

export default function QuickActions() {
  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1.5,
        mb: 4,
        overflowX: 'auto',
        pb: 0.5,
        '&::-webkit-scrollbar': { display: 'none' },
      }}
    >
      {actions.map((action) => (
        <ButtonBase
          key={action.href}
          component={Link}
          href={action.href}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 0.5,
            px: 2,
            py: 1.5,
            borderRadius: 2,
            bgcolor: 'action.hover',
            minWidth: 80,
            flexShrink: 0,
            '&:hover': { bgcolor: 'action.selected' },
          }}
        >
          <Box sx={{ color: 'primary.main' }}>{action.icon}</Box>
          <Typography variant="caption" sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>
            {action.label}
          </Typography>
        </ButtonBase>
      ))}
    </Box>
  );
}
