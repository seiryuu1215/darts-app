'use client';

import { Paper, Box, Typography, Button, Chip, useTheme } from '@mui/material';
import Grid from '@mui/material/Grid';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

const PR_BRANDS = [
  {
    name: 'JOKER DRIVER',
    description: '日本製高精度バレル',
    url: 'https://www.jokerdriver.com/',
    color: '#1a1a1a',
  },
  {
    name: 'JOKER DRIVER ULTIMATE',
    description: 'プレミアムライン',
    url: 'https://jokerdriver-ultimate.com/',
    color: '#8B6914',
  },
  {
    name: 'POINT ARM',
    description: 'ポイントアーム搭載バレル',
    url: 'https://one-mode.jp/',
    color: '#2E7D32',
  },
];

export default function PRSiteSection() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        mb: 2,
        borderRadius: 2,
        background: isDark
          ? 'linear-gradient(135deg, rgba(25,118,210,0.08), rgba(220,0,78,0.08))'
          : 'linear-gradient(135deg, rgba(25,118,210,0.04), rgba(220,0,78,0.04))',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.5 }}>
        <Typography variant="subtitle2" fontWeight="bold">
          おすすめブランド
        </Typography>
        <Chip label="PR" size="small" variant="outlined" sx={{ fontSize: 10, height: 18 }} />
      </Box>
      <Grid container spacing={1.5}>
        {PR_BRANDS.map((brand) => (
          <Grid key={brand.name} size={{ xs: 12, sm: 4 }}>
            <Paper
              variant="outlined"
              sx={{
                p: 1.5,
                textAlign: 'center',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                  {brand.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {brand.description}
                </Typography>
              </Box>
              <Button
                size="small"
                href={brand.url}
                target="_blank"
                rel="noopener noreferrer"
                endIcon={<OpenInNewIcon sx={{ fontSize: 14 }} />}
                sx={{ mt: 1, textTransform: 'none', fontSize: '0.75rem' }}
              >
                詳細
              </Button>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
}
