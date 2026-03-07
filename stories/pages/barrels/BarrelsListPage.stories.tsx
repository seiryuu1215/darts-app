import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  InputAdornment,
  Chip,
  Button,
  Pagination,
  Tabs,
  Tab,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import BarrelCard from '@/components/barrels/BarrelCard';
import type { BarrelProduct } from '@/types';
import { MOCK_BARREL_PRODUCTS } from '../../mocks/barrels';

interface BarrelsListPageStoryProps {
  barrels: BarrelProduct[];
  variant: 'loaded' | 'withFilters' | 'withRanking' | 'empty';
}

function BarrelsListPageStory({ barrels, variant }: BarrelsListPageStoryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [rankTab, setRankTab] = useState(0);
  const showRanking = variant === 'withRanking';
  const showFilters = variant === 'withFilters';

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 3, p: { xs: 1, sm: 2 } }}>
        <Breadcrumbs items={[{ label: 'バレルDB' }]} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            バレルDB
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" size="small" startIcon={<FilterListIcon />}>
              フィルター
            </Button>
          </Box>
        </Box>

        <TextField
          size="small"
          placeholder="バレル名・ブランドで検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            },
          }}
        />

        {/* Filters */}
        {showFilters && (
          <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip label="TARGET" onDelete={() => {}} color="primary" size="small" />
              <Chip label="18-20g" onDelete={() => {}} color="primary" size="small" />
              <Chip label="リングカット" onDelete={() => {}} color="primary" size="small" />
              <Button size="small" color="error">
                フィルタークリア
              </Button>
            </Box>
          </Paper>
        )}

        {/* Ranking */}
        {showRanking && (
          <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              人気ランキング
            </Typography>
            <Tabs value={rankTab} onChange={(_, v) => setRankTab(v)} sx={{ mb: 1, minHeight: 36 }}>
              <Tab label="週間" sx={{ minHeight: 36, py: 0 }} />
              <Tab label="月間" sx={{ minHeight: 36, py: 0 }} />
            </Tabs>
            <Grid container spacing={1}>
              {barrels.slice(0, 3).map((bp, i) => (
                <Grid size={{ xs: 12, sm: 4 }} key={bp.id}>
                  <Paper
                    variant="outlined"
                    sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}
                  >
                    <Chip label={`${i + 1}位`} size="small" color="primary" />
                    <Box>
                      <Typography variant="body2" fontWeight="bold" noWrap>
                        {bp.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {bp.brand}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Paper>
        )}

        {/* Results */}
        {barrels.length === 0 ? (
          <Paper sx={{ textAlign: 'center', py: 8, bgcolor: 'background.default' }}>
            <Typography color="text.secondary">条件に一致するバレルが見つかりません</Typography>
          </Paper>
        ) : (
          <>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              {barrels.length}件のバレル
            </Typography>
            <Grid container spacing={2}>
              {barrels.map((bp) => (
                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={bp.id}>
                  <BarrelCard barrel={bp} />
                </Grid>
              ))}
            </Grid>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination count={5} page={1} />
            </Box>
          </>
        )}
      </Box>
    </Container>
  );
}

const meta = {
  title: 'Pages/Barrels/BarrelsListPage',
  component: BarrelsListPageStory,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof BarrelsListPageStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Loaded: Story = {
  args: {
    barrels: MOCK_BARREL_PRODUCTS as unknown as BarrelProduct[],
    variant: 'loaded',
  },
};

export const WithFilters: Story = {
  args: {
    barrels: MOCK_BARREL_PRODUCTS.slice(0, 3) as unknown as BarrelProduct[],
    variant: 'withFilters',
  },
};

export const WithRanking: Story = {
  args: {
    barrels: MOCK_BARREL_PRODUCTS as unknown as BarrelProduct[],
    variant: 'withRanking',
  },
};

export const Empty: Story = {
  args: { barrels: [], variant: 'loaded' },
};
