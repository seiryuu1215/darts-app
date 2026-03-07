import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Rating,
  Divider,
  Paper,
} from '@mui/material';
import Breadcrumbs from '@/components/layout/Breadcrumbs';

interface StatsEditPageStoryProps {
  found: boolean;
}

function StatsEditPageStory({ found }: StatsEditPageStoryProps) {
  const [rating, setRating] = useState('8');
  const [games, setGames] = useState('15');
  const [ppd, setPpd] = useState('42.5');
  const [mpr, setMpr] = useState('2.1');
  const [condition, setCondition] = useState<number | null>(4);
  const [memo, setMemo] = useState('今日は調子が良かった。ブルに安定して入った。');

  if (!found) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ mt: 3, p: { xs: 1, sm: 2 } }}>
          <Breadcrumbs items={[{ label: 'Stats', href: '/stats' }, { label: '編集' }]} />
          <Paper sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary">
              記録が見つかりませんでした
            </Typography>
          </Paper>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 3, p: { xs: 1, sm: 2 } }}>
        <Breadcrumbs items={[{ label: 'Stats', href: '/stats' }, { label: '編集' }]} />
        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
          スタッツ編集
        </Typography>

        <TextField
          label="日付"
          type="date"
          value="2025-02-21"
          fullWidth
          sx={{ mb: 2 }}
          slotProps={{ inputLabel: { shrink: true } }}
        />

        <TextField
          label="レーティング"
          type="number"
          value={rating}
          onChange={(e) => setRating(e.target.value)}
          fullWidth
          required
          sx={{ mb: 2 }}
        />

        <TextField
          label="ゲーム数"
          type="number"
          value={games}
          onChange={(e) => setGames(e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
        />

        <Divider sx={{ my: 2 }}>01 Stats</Divider>

        <TextField
          label="PPD"
          type="number"
          value={ppd}
          onChange={(e) => setPpd(e.target.value)}
          fullWidth
          required
          sx={{ mb: 2 }}
        />

        <Divider sx={{ my: 2 }}>Cricket Stats</Divider>

        <TextField
          label="MPR"
          type="number"
          value={mpr}
          onChange={(e) => setMpr(e.target.value)}
          fullWidth
          required
          sx={{ mb: 2 }}
        />

        <Divider sx={{ my: 2 }}>コンディション</Divider>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Typography variant="body2">調子:</Typography>
          <Rating value={condition} onChange={(_, v) => setCondition(v)} max={5} />
        </Box>

        <TextField
          label="メモ"
          multiline
          rows={3}
          fullWidth
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          sx={{ mb: 3 }}
        />

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="contained" sx={{ flex: 1 }}>
            保存
          </Button>
          <Button variant="outlined" color="error">
            削除
          </Button>
        </Box>
      </Box>
    </Container>
  );
}

const meta = {
  title: 'Pages/Stats/StatsEditPage',
  component: StatsEditPageStory,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof StatsEditPageStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Loaded: Story = {
  args: { found: true },
};

export const NotFound: Story = {
  args: { found: false },
};
