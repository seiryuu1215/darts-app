import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState, useMemo } from 'react';
import {
  Container,
  Grid,
  Typography,
  Box,
  TextField,
  Chip,
  Button,
  Paper,
  Alert,
} from '@mui/material';
import DartCard from '@/components/darts/DartCard';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import type { Dart } from '@/types';
import { MOCK_DARTS_LIST } from '../../mocks/darts';

interface DartsListPageStoryProps {
  darts: Dart[];
  mineOnly: boolean;
  currentUserId: string | null;
  hasError: boolean;
}

function DartsListPageStory({ darts, mineOnly, currentUserId, hasError }: DartsListPageStoryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showMine, setShowMine] = useState(mineOnly);

  const filtered = useMemo(() => {
    let result = darts;
    if (showMine && currentUserId) {
      result = result.filter((d) => d.userId === currentUserId);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.barrel.name.toLowerCase().includes(q) ||
          d.barrel.brand.toLowerCase().includes(q) ||
          (d.userName ?? '').toLowerCase().includes(q),
      );
    }
    return result;
  }, [darts, showMine, currentUserId, searchQuery]);

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 3, p: { xs: 1, sm: 2 } }}>
        <Breadcrumbs items={[{ label: 'ダーツ一覧' }]} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            ダーツ一覧
          </Typography>
          {currentUserId && (
            <Button variant="contained" size="small">
              新規登録
            </Button>
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="タイトル・バレル名・ブランドで検索"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ flex: 1, minWidth: 200 }}
          />
          {currentUserId && (
            <Chip
              label="マイダーツのみ"
              color={showMine ? 'primary' : 'default'}
              onClick={() => setShowMine(!showMine)}
              variant={showMine ? 'filled' : 'outlined'}
            />
          )}
        </Box>

        {hasError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            データの取得に失敗しました。
          </Alert>
        )}

        {!hasError && filtered.length === 0 && (
          <Paper sx={{ textAlign: 'center', py: 6, bgcolor: 'background.default' }}>
            <Typography color="text.secondary">
              {searchQuery ? '検索結果が見つかりません' : 'ダーツが登録されていません'}
            </Typography>
          </Paper>
        )}

        <Grid container spacing={2}>
          {filtered.map((dart) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={dart.id}>
              <DartCard dart={dart} />
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  );
}

const meta = {
  title: 'Pages/Darts/DartsListPage',
  component: DartsListPageStory,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof DartsListPageStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Loaded: Story = {
  args: {
    darts: MOCK_DARTS_LIST as unknown as Dart[],
    mineOnly: false,
    currentUserId: 'user_001',
    hasError: false,
  },
};

export const MineOnly: Story = {
  args: {
    darts: MOCK_DARTS_LIST as unknown as Dart[],
    mineOnly: true,
    currentUserId: 'user_001',
    hasError: false,
  },
};

export const Empty: Story = {
  args: { darts: [], mineOnly: false, currentUserId: 'user_001', hasError: false },
};

export const Guest: Story = {
  args: {
    darts: MOCK_DARTS_LIST as unknown as Dart[],
    mineOnly: false,
    currentUserId: null,
    hasError: false,
  },
};

export const Error: Story = {
  args: { darts: [], mineOnly: false, currentUserId: 'user_001', hasError: true },
};
