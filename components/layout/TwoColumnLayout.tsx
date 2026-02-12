'use client';

import { Container, Grid, Box } from '@mui/material';
import type { ReactNode } from 'react';

interface TwoColumnLayoutProps {
  children: ReactNode;
  sidebar?: ReactNode;
  maxWidth?: 'md' | 'lg';
}

export default function TwoColumnLayout({
  children,
  sidebar,
  maxWidth = 'lg',
}: TwoColumnLayoutProps) {
  if (!sidebar) {
    return (
      <Container maxWidth={maxWidth} sx={{ py: 4 }}>
        {children}
      </Container>
    );
  }

  return (
    <Container maxWidth={maxWidth} sx={{ py: 4 }}>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>{children}</Grid>
        <Grid size={{ xs: 12, md: 4 }} sx={{ display: { xs: 'none', md: 'block' } }}>
          <Box sx={{ position: 'sticky', top: 80 }}>{sidebar}</Box>
        </Grid>
      </Grid>
    </Container>
  );
}
