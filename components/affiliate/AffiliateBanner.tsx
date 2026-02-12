'use client';

import { Box, Typography, Button, Paper, Chip } from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { toDartshiveAffiliateUrl, toRakutenSearchUrl, toAmazonSearchUrl, getAffiliateConfig } from '@/lib/affiliate';

interface AffiliateBannerProps {
  variant?: 'shop-links' | 'barrel-search';
  barrelName?: string;
}

/**
 * Prominent affiliate banner for placement in articles and key pages.
 * - "shop-links": General darts shop links
 * - "barrel-search": Search for a specific barrel across shops
 */
export default function AffiliateBanner({
  variant = 'shop-links',
  barrelName,
}: AffiliateBannerProps) {
  const config = getAffiliateConfig();

  if (variant === 'barrel-search' && barrelName) {
    const shops = [
      { label: 'ダーツハイブ', url: toDartshiveAffiliateUrl(`https://www.dartshive.jp/search/?q=${encodeURIComponent(barrelName)}`, config), color: '#e74c3c' },
      { label: '楽天', url: toRakutenSearchUrl(barrelName, config), color: '#bf0000' },
      { label: 'Amazon', url: toAmazonSearchUrl(barrelName, config), color: '#ff9900' },
    ];

    return (
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          background: (theme) =>
            theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(25,118,210,0.08), rgba(220,0,78,0.08))'
              : 'linear-gradient(135deg, rgba(25,118,210,0.04), rgba(220,0,78,0.04))',
          borderColor: 'primary.main',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.5 }}>
          <Typography variant="subtitle2" fontWeight="bold">
            このバレルをショップで探す
          </Typography>
          <Chip label="PR" size="small" variant="outlined" sx={{ fontSize: 10, height: 18 }} />
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {shops.map((shop) => (
            <Button
              key={shop.label}
              variant="contained"
              size="small"
              href={shop.url}
              target="_blank"
              rel="noopener noreferrer"
              endIcon={<OpenInNewIcon sx={{ fontSize: 14 }} />}
              sx={{
                bgcolor: shop.color,
                '&:hover': { bgcolor: shop.color, filter: 'brightness(0.9)' },
                textTransform: 'none',
                fontWeight: 'bold',
              }}
            >
              {shop.label}
            </Button>
          ))}
        </Box>
      </Paper>
    );
  }

  // Default: general shop links
  const shops = [
    { label: 'ダーツハイブ', desc: '品揃え豊富', url: toDartshiveAffiliateUrl('https://www.dartshive.jp/', config) },
    { label: '楽天市場', desc: 'ポイントが貯まる', url: toRakutenSearchUrl('ダーツ バレル', config) },
    { label: 'Amazon', desc: '翌日配送', url: toAmazonSearchUrl('ダーツ バレル', config) },
  ];

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        background: (theme) =>
          theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, rgba(25,118,210,0.08), rgba(220,0,78,0.08))'
            : 'linear-gradient(135deg, rgba(25,118,210,0.04), rgba(220,0,78,0.04))',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.5 }}>
        <Typography variant="subtitle2" fontWeight="bold">
          ダーツ用品を探す
        </Typography>
        <Chip label="PR" size="small" variant="outlined" sx={{ fontSize: 10, height: 18 }} />
      </Box>
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
        {shops.map((shop) => (
          <Button
            key={shop.label}
            variant="outlined"
            size="small"
            href={shop.url}
            target="_blank"
            rel="noopener noreferrer"
            endIcon={<OpenInNewIcon sx={{ fontSize: 14 }} />}
            sx={{ textTransform: 'none' }}
          >
            <Box sx={{ textAlign: 'left' }}>
              <Typography variant="body2" fontWeight="bold" component="span">
                {shop.label}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                {shop.desc}
              </Typography>
            </Box>
          </Button>
        ))}
      </Box>
    </Paper>
  );
}
