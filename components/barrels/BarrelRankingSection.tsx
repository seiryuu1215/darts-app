'use client';

import {
  Box,
  Typography,
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Chip,
  Tabs,
  Tab,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import type { RankingPeriod } from '@/types';
import { toDartshiveAffiliateUrl, getAffiliateConfig } from '@/lib/affiliate';
import { getBarrelImageUrl } from '@/lib/image-proxy';

interface RankedBarrel {
  rank: number;
  name: string;
  imageUrl: string | null;
  productUrl: string;
  price: string;
  period?: string;
}

interface BarrelRankingSectionProps {
  ranking: RankedBarrel[];
  rankingTab: RankingPeriod;
  onTabChange: (tab: RankingPeriod) => void;
}

export default function BarrelRankingSection({
  ranking,
  rankingTab,
  onTabChange,
}: BarrelRankingSectionProps) {
  if (ranking.length === 0) return null;

  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <TrendingUpIcon color="primary" />
        <Typography variant="h6">人気バレル</Typography>
        <Typography variant="caption" color="text.secondary">
          ダーツハイブ売上ランキング
        </Typography>
      </Box>
      <Tabs
        value={rankingTab}
        onChange={(_, v) => onTabChange(v)}
        sx={{ mb: 2, minHeight: 36, '& .MuiTab-root': { minHeight: 36, py: 0.5 } }}
      >
        <Tab label="週間" value="weekly" />
        <Tab label="月間" value="monthly" />
        <Tab label="総合" value="all" />
      </Tabs>
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
        {ranking.map((item) => (
          <Card
            key={item.rank}
            sx={{
              minWidth: 150,
              maxWidth: 150,
              flexShrink: 0,
              position: 'relative',
              scrollSnapAlign: 'start',
            }}
          >
            <CardActionArea
              href={toDartshiveAffiliateUrl(item.productUrl, getAffiliateConfig())}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ height: '100%' }}
            >
              <Chip
                label={`${item.rank}位`}
                size="small"
                color="primary"
                sx={{ position: 'absolute', top: 8, left: 8, zIndex: 1, fontWeight: 'bold' }}
              />
              {item.imageUrl ? (
                <CardMedia
                  component="img"
                  height="120"
                  image={getBarrelImageUrl(item.imageUrl) ?? ''}
                  alt={item.name}
                  sx={{ objectFit: 'cover' }}
                />
              ) : (
                <Box
                  sx={{
                    height: 120,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'action.hover',
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    No Image
                  </Typography>
                </Box>
              )}
              <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                <Typography variant="caption" noWrap display="block" fontWeight="bold">
                  {item.name}
                </Typography>
                {item.price && (
                  <Typography variant="caption" color="text.secondary" noWrap display="block">
                    {item.price}
                  </Typography>
                )}
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
      </Box>
    </Box>
  );
}
