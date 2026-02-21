'use client';

import { Box, Grid, Typography, Card, CardContent, CardMedia, Button, Chip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HistoryIcon from '@mui/icons-material/History';
import Link from 'next/link';
import type { Dart } from '@/types';

interface ActiveSettingsProps {
  activeSoftDart: Dart | null;
  activeSteelDart: Dart | null;
}

export default function ActiveSettings({ activeSoftDart, activeSteelDart }: ActiveSettingsProps) {
  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">使用中セッティング</Typography>
        <Button component={Link} href="/darts/history" size="small" startIcon={<HistoryIcon />}>
          履歴
        </Button>
      </Box>
      <Grid container spacing={2}>
        {[
          { label: 'ソフト', dart: activeSoftDart, color: 'info' as const },
          { label: 'スティール', dart: activeSteelDart, color: 'default' as const },
        ].map(({ label, dart: activeDart, color }) => (
          <Grid size={{ xs: 12, sm: 6 }} key={label}>
            {activeDart ? (
              <Card
                component={Link}
                href={`/darts/${activeDart.id}`}
                sx={{
                  textDecoration: 'none',
                  display: 'flex',
                  flexDirection: 'row',
                  height: 110,
                  borderLeft: 4,
                  borderColor: color === 'info' ? 'info.main' : 'grey.500',
                }}
              >
                {activeDart.imageUrls.length > 0 ? (
                  <CardMedia
                    component="img"
                    image={activeDart.imageUrls[0]}
                    alt={activeDart.title}
                    sx={{ width: 100, objectFit: 'cover', flexShrink: 0 }}
                  />
                ) : (
                  <Box
                    component="img"
                    src="/dart-placeholder.svg"
                    alt="No Image"
                    sx={{ width: 100, height: '100%', flexShrink: 0, objectFit: 'cover' }}
                  />
                )}
                <CardContent
                  sx={{
                    py: 1.5,
                    px: 2,
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    minWidth: 0,
                    '&:last-child': { pb: 1.5 },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                    <CheckCircleIcon color="success" sx={{ fontSize: 16 }} />
                    <Chip
                      label={label}
                      size="small"
                      color={color}
                      sx={{ height: 20, '& .MuiChip-label': { px: 1, fontSize: '0.7rem' } }}
                    />
                  </Box>
                  <Typography variant="subtitle2" noWrap>
                    {activeDart.barrel.name}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', my: 0.3 }}>
                    <Chip
                      label={`${activeDart.barrel.weight}g`}
                      size="small"
                      variant="outlined"
                      sx={{ height: 18, '& .MuiChip-label': { px: 0.7, fontSize: '0.65rem' } }}
                    />
                    {activeDart.barrel.maxDiameter && (
                      <Chip
                        label={`Φ${activeDart.barrel.maxDiameter}mm`}
                        size="small"
                        variant="outlined"
                        sx={{
                          height: 18,
                          '& .MuiChip-label': { px: 0.7, fontSize: '0.65rem' },
                        }}
                      />
                    )}
                  </Box>
                  <Typography variant="caption" color="text.secondary" noWrap sx={{ opacity: 0.7 }}>
                    {[activeDart.tip.name, activeDart.shaft.name, activeDart.flight.name]
                      .filter(Boolean)
                      .join(' / ')}
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              <Card
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  height: 110,
                  px: 2,
                  borderLeft: 4,
                  borderColor: color === 'info' ? 'info.main' : 'grey.500',
                }}
              >
                <Chip label={label} size="small" color={color} sx={{ mr: 1.5 }} />
                <Typography variant="body2" color="text.secondary">
                  未設定
                </Typography>
              </Card>
            )}
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
