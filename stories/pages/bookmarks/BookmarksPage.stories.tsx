import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { Container, Box, Typography, Paper, Grid, Tabs, Tab, Alert, Button } from '@mui/material';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import BarrelCard from '@/components/barrels/BarrelCard';
import DartCard from '@/components/darts/DartCard';
import type { BarrelProduct, Dart } from '@/types';
import { MOCK_BARREL_PRODUCTS } from '../../mocks/barrels';
import { MOCK_DARTS_LIST } from '../../mocks/darts';

interface BookmarksPageStoryProps {
  barrels: BarrelProduct[];
  darts: Dart[];
  hasError: boolean;
}

function BookmarksPageStory({ barrels, darts, hasError }: BookmarksPageStoryProps) {
  const [tab, setTab] = useState(0);

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 3, p: { xs: 1, sm: 2 } }}>
        <Breadcrumbs items={[{ label: 'ブックマーク' }]} />
        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
          ブックマーク
        </Typography>

        {/* Shop bookmarks banner */}
        <Paper variant="outlined" sx={{ p: 1.5, mb: 2, display: 'flex', alignItems: 'center' }}>
          <Typography variant="body2" sx={{ flex: 1 }}>
            ショップのブックマークはマイショップで管理
          </Typography>
          <Button size="small" variant="text">
            マイショップへ
          </Button>
        </Paper>

        {hasError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            ブックマークの取得に失敗しました
          </Alert>
        )}

        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label={`バレル (${barrels.length})`} />
          <Tab label={`セッティング (${darts.length})`} />
        </Tabs>

        {tab === 0 &&
          (barrels.length === 0 ? (
            <Paper sx={{ textAlign: 'center', py: 6, bgcolor: 'background.default' }}>
              <Typography color="text.secondary">バレルのブックマークがありません</Typography>
            </Paper>
          ) : (
            <Grid container spacing={2}>
              {barrels.map((barrel) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={barrel.id}>
                  <BarrelCard barrel={barrel} isBookmarked />
                </Grid>
              ))}
            </Grid>
          ))}

        {tab === 1 &&
          (darts.length === 0 ? (
            <Paper sx={{ textAlign: 'center', py: 6, bgcolor: 'background.default' }}>
              <Typography color="text.secondary">セッティングのブックマークがありません</Typography>
            </Paper>
          ) : (
            <Grid container spacing={2}>
              {darts.map((dart) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={dart.id}>
                  <DartCard dart={dart} />
                </Grid>
              ))}
            </Grid>
          ))}
      </Box>
    </Container>
  );
}

const meta = {
  title: 'Pages/Bookmarks/BookmarksPage',
  component: BookmarksPageStory,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof BookmarksPageStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Barrels: Story = {
  args: {
    barrels: MOCK_BARREL_PRODUCTS.slice(0, 4) as unknown as BarrelProduct[],
    darts: MOCK_DARTS_LIST.slice(0, 2) as unknown as Dart[],
    hasError: false,
  },
};

export const Darts: Story = {
  args: {
    barrels: [],
    darts: MOCK_DARTS_LIST as unknown as Dart[],
    hasError: false,
  },
};

export const BothEmpty: Story = {
  args: { barrels: [], darts: [], hasError: false },
};

export const Error: Story = {
  args: { barrels: [], darts: [], hasError: true },
};
