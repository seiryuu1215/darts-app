'use client';

import { useState } from 'react';
import { Box, Typography, Chip, CircularProgress, Collapse, IconButton } from '@mui/material';
import RecommendIcon from '@mui/icons-material/AutoAwesome';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import type { BarrelProduct } from '@/types';
import BarrelCard from './BarrelCard';

interface BarrelRecommendSectionProps {
  recommendedBarrels: BarrelProduct[];
  recommendType: 'soft' | 'steel';
  onTypeChange: (type: 'soft' | 'steel') => void;
  loading: boolean;
  bookmarkedIds: Set<string>;
}

export default function BarrelRecommendSection({
  recommendedBarrels,
  recommendType,
  onTypeChange,
  loading,
  bookmarkedIds,
}: BarrelRecommendSectionProps) {
  const [open, setOpen] = useState(true);

  return (
    <Box sx={{ mb: 4 }}>
      <Box
        sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, cursor: 'pointer' }}
        onClick={() => setOpen(!open)}
      >
        <RecommendIcon color="primary" />
        <Typography variant="h6">あなたへのおすすめバレル</Typography>
        <IconButton size="small">{open ? <ExpandLessIcon /> : <ExpandMoreIcon />}</IconButton>
      </Box>
      <Collapse in={open}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          登録済みのセッティングの重量・最大径・全長・カット・ブランドをもとに、近いスペックのバレルを提案しています。
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Chip
            label="ソフト"
            onClick={() => onTypeChange('soft')}
            color={recommendType === 'soft' ? 'primary' : 'default'}
            variant={recommendType === 'soft' ? 'filled' : 'outlined'}
            size="small"
          />
          <Chip
            label="スティール"
            onClick={() => onTypeChange('steel')}
            color={recommendType === 'steel' ? 'primary' : 'default'}
            variant={recommendType === 'steel' ? 'filled' : 'outlined'}
            size="small"
          />
        </Box>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={32} />
          </Box>
        ) : recommendedBarrels.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
            おすすめバレルが見つかりませんでした
          </Typography>
        ) : (
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              overflowX: 'auto',
              pb: 1,
              scrollSnapType: 'x mandatory',
              '&::-webkit-scrollbar': { height: 6 },
              '&::-webkit-scrollbar-thumb': { borderRadius: 3, bgcolor: 'action.disabled' },
            }}
          >
            {recommendedBarrels.map((barrel) => (
              <Box
                key={barrel.id}
                sx={{ minWidth: 240, maxWidth: 240, flexShrink: 0, scrollSnapAlign: 'start' }}
              >
                <BarrelCard
                  barrel={barrel}
                  isBookmarked={barrel.id ? bookmarkedIds.has(barrel.id) : false}
                />
              </Box>
            ))}
          </Box>
        )}
      </Collapse>
    </Box>
  );
}
