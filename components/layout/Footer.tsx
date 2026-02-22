'use client';

import { Box, Container, Grid, Typography, Link as MuiLink, Divider, Chip } from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import NextLink from 'next/link';
import {
  toDartshiveAffiliateUrl,
  toRakutenSearchUrl,
  toAmazonSearchUrl,
  getAffiliateConfig,
} from '@/lib/affiliate';

interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

function FooterSection({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <Box>
      <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1.5 }}>
        {title}
      </Typography>
      <Box component="nav" sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
        {links.map((link) =>
          link.external ? (
            <MuiLink
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              underline="hover"
              color="text.secondary"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                fontSize: 14,
                transition: 'color 0.2s',
                '&:hover': { color: 'primary.main' },
              }}
            >
              {link.label}
              <OpenInNewIcon sx={{ fontSize: 12 }} />
            </MuiLink>
          ) : (
            <MuiLink
              key={link.label}
              component={NextLink}
              href={link.href}
              underline="hover"
              color="text.secondary"
              sx={{ fontSize: 14, transition: 'color 0.2s', '&:hover': { color: 'primary.main' } }}
            >
              {link.label}
            </MuiLink>
          ),
        )}
      </Box>
    </Box>
  );
}

export default function Footer() {
  const config = getAffiliateConfig();

  const serviceLinks: FooterLink[] = [
    { label: 'セッティング一覧', href: '/darts' },
    { label: 'バレル検索', href: '/barrels' },
    { label: 'おすすめバレル', href: '/barrels/recommend' },
    { label: 'シミュレーター', href: '/barrels/simulator' },
    { label: '診断クイズ', href: '/barrels/quiz' },
    { label: '記事', href: '/articles' },
    { label: 'ディスカッション', href: '/discussions' },
    { label: 'おすすめツール', href: '/tools' },
    { label: 'レポート', href: '/reports' },
    { label: 'ショップ', href: '/shops' },
  ];

  const shopLinks: FooterLink[] = [
    {
      label: 'ダーツハイブ',
      href: toDartshiveAffiliateUrl('https://www.dartshive.jp/', config),
      external: true,
    },
    { label: 'エスダーツ', href: 'https://www.s-darts.com/', external: true },
    { label: 'MAXIM', href: 'https://www.and-maxim.com/', external: true },
    { label: 'TiTO Online', href: 'https://tito-online.com/', external: true },
    { label: '楽天ダーツ', href: toRakutenSearchUrl('ダーツ バレル', config), external: true },
    { label: 'Amazon ダーツ', href: toAmazonSearchUrl('ダーツ バレル', config), external: true },
  ];

  const aboutLinks: FooterLink[] = [
    { label: 'このサイトについて', href: '/about' },
    { label: 'プライバシーポリシー', href: '/privacy' },
    { label: '利用規約', href: '/terms' },
    { label: 'X (@seiryuu_darts)', href: 'https://x.com/seiryuu_darts', external: true },
  ];

  return (
    <Box
      component="footer"
      sx={{
        borderTop: '1px solid',
        borderColor: (theme) =>
          theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'divider',
        bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#1a1a1a' : 'transparent'),
        mt: 6,
        pt: 4,
        pb: 'calc(12px + env(safe-area-inset-bottom, 0px))',
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid size={{ xs: 6, sm: 4 }}>
            <FooterSection title="サービス" links={serviceLinks} />
          </Grid>
          <Grid size={{ xs: 6, sm: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.5 }}>
              <Typography variant="subtitle2" fontWeight="bold">
                ショップ
              </Typography>
              <Chip label="PR" size="small" variant="outlined" sx={{ fontSize: 10, height: 18 }} />
            </Box>
            <Box component="nav" sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
              {shopLinks.map((link) => (
                <MuiLink
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  underline="hover"
                  color="text.secondary"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    fontSize: 14,
                    transition: 'color 0.2s',
                    '&:hover': { color: 'primary.main' },
                  }}
                >
                  {link.label}
                  <OpenInNewIcon sx={{ fontSize: 12 }} />
                </MuiLink>
              ))}
            </Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', mt: 1.5, fontSize: 10, lineHeight: 1.5 }}
            >
              ※
              一部リンクにはアフィリエイトが含まれ、購入時に当サイトに紹介料が支払われる場合があります
            </Typography>
          </Grid>
          <Grid size={{ xs: 6, sm: 4 }}>
            <FooterSection title="About" links={aboutLinks} />
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ textAlign: 'center', display: 'block' }}
        >
          &copy; {new Date().getFullYear()} Darts Lab
        </Typography>
      </Container>
    </Box>
  );
}
