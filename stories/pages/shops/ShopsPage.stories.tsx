import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Chip,
  Button,
  Pagination,
  ToggleButton,
  ToggleButtonGroup,
  Rating,
  Fab,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ViewListIcon from '@mui/icons-material/ViewList';
import MapIcon from '@mui/icons-material/Map';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import ProPaywall from '@/components/ProPaywall';
import { MOCK_SHOP_BOOKMARKS } from '../../mocks/shops';

type MockShop = (typeof MOCK_SHOP_BOOKMARKS)[number];

interface ShopsPageStoryProps {
  variant: 'listView' | 'mapView' | 'filtered' | 'empty' | 'proPaywall';
  shops: MockShop[];
}

function ShopCard({ shop }: { shop: MockShop }) {
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="subtitle2" fontWeight="bold">
          {shop.name}
        </Typography>
        {shop.isFavorite && <Chip label="お気に入り" size="small" color="warning" />}
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
        {shop.address}
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
        最寄り: {shop.nearestStation}
      </Typography>
      <Box sx={{ display: 'flex', gap: 0.5, mb: 1, flexWrap: 'wrap' }}>
        {shop.tags.map((tag) => (
          <Chip key={tag} label={tag} size="small" variant="outlined" />
        ))}
        {shop.machineCount && (
          <>
            {shop.machineCount.dl3 > 0 && (
              <Chip label={`DL3×${shop.machineCount.dl3}`} size="small" color="primary" />
            )}
            {shop.machineCount.dl2 > 0 && (
              <Chip label={`DL2×${shop.machineCount.dl2}`} size="small" />
            )}
          </>
        )}
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {shop.rating != null && <Rating value={shop.rating} readOnly size="small" />}
        {shop.visitCount > 0 && (
          <Chip
            label={`${shop.visitCount}回訪問`}
            size="small"
            variant="outlined"
            sx={{ fontSize: 11 }}
          />
        )}
      </Box>
      {shop.note && (
        <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic', color: 'text.secondary' }}>
          {shop.note}
        </Typography>
      )}
    </Paper>
  );
}

function ShopsPageStory({ variant, shops }: ShopsPageStoryProps) {
  const [viewMode, setViewMode] = useState<'list' | 'map'>(variant === 'mapView' ? 'map' : 'list');

  if (variant === 'proPaywall') {
    return (
      <Container maxWidth="md">
        <Box sx={{ mt: 3, p: { xs: 1, sm: 2 } }}>
          <Breadcrumbs items={[{ label: 'マイショップ' }]} />
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
            マイショップ
          </Typography>
          <ProPaywall
            title="マイショップは5件まで無料"
            description="PROプランにアップグレードすると、無制限にショップをブックマークできます。"
            currentUsage={{ current: 5, limit: 5, label: 'マイショップ' }}
          />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 3, p: { xs: 1, sm: 2 } }}>
        <Breadcrumbs items={[{ label: 'マイショップ' }]} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            マイショップ
          </Typography>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, v) => v && setViewMode(v)}
            size="small"
          >
            <ToggleButton value="list">
              <ViewListIcon sx={{ fontSize: 18 }} />
            </ToggleButton>
            <ToggleButton value="map">
              <MapIcon sx={{ fontSize: 18 }} />
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Filters */}
        {variant === 'filtered' && (
          <Box sx={{ display: 'flex', gap: 0.5, mb: 2, flexWrap: 'wrap' }}>
            <Chip label="禁煙" onDelete={() => {}} color="primary" size="small" />
            <Chip label="JR山手線" onDelete={() => {}} color="primary" size="small" />
            <Chip label="お気に入り" onDelete={() => {}} color="primary" size="small" />
          </Box>
        )}

        {viewMode === 'map' ? (
          <Paper
            sx={{
              height: 400,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'action.hover',
              borderRadius: 2,
              mb: 2,
            }}
          >
            <Typography color="text.secondary">地図表示（{shops.length}件のショップ）</Typography>
          </Paper>
        ) : shops.length === 0 ? (
          <Paper sx={{ textAlign: 'center', py: 8, bgcolor: 'background.default' }}>
            <Typography color="text.secondary" sx={{ mb: 1 }}>
              ショップが登録されていません
            </Typography>
            <Button variant="contained" size="small" startIcon={<AddIcon />}>
              ショップを追加
            </Button>
          </Paper>
        ) : (
          <>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {shops.map((shop) => (
                <ShopCard key={shop.id} shop={shop} />
              ))}
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination count={1} page={1} />
            </Box>
          </>
        )}

        {/* FAB */}
        {shops.length > 0 && (
          <Fab color="primary" size="medium" sx={{ position: 'fixed', bottom: 24, right: 24 }}>
            <AddIcon />
          </Fab>
        )}
      </Box>
    </Container>
  );
}

const meta = {
  title: 'Pages/Shops/ShopsPage',
  component: ShopsPageStory,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof ShopsPageStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ListView: Story = {
  args: {
    variant: 'listView',
    shops: MOCK_SHOP_BOOKMARKS,
  },
};

export const MapView: Story = {
  args: {
    variant: 'mapView',
    shops: MOCK_SHOP_BOOKMARKS,
  },
};

export const Filtered: Story = {
  args: {
    variant: 'filtered',
    shops: MOCK_SHOP_BOOKMARKS.filter((s) => s.isFavorite),
  },
};

export const Empty: Story = {
  args: { variant: 'empty', shops: [] },
};

export const PaywallView: Story = {
  args: { variant: 'proPaywall', shops: [] },
};
