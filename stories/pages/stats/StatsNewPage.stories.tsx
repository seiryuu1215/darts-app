import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { Container, Box, Typography, TextField, Button, Rating, Divider } from '@mui/material';
import Breadcrumbs from '@/components/layout/Breadcrumbs';

const CONDITION_LABELS: Record<number, string> = {
  1: '悪い',
  2: 'いまいち',
  3: '普通',
  4: '好調',
  5: '絶好調',
};

interface StatsNewPageStoryProps {
  prefillRating: number | null;
  prefillPpd: number | null;
}

function StatsNewPageStory({ prefillRating, prefillPpd }: StatsNewPageStoryProps) {
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [rating, setRating] = useState(prefillRating?.toString() ?? '');
  const [games, setGames] = useState('');
  const [ppd, setPpd] = useState(prefillPpd?.toString() ?? '');
  const [avg, setAvg] = useState('');
  const [mpr, setMpr] = useState('');
  const [condition, setCondition] = useState<number | null>(3);
  const [memo, setMemo] = useState('');

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 3, p: { xs: 1, sm: 2 } }}>
        <Breadcrumbs items={[{ label: 'Stats', href: '/stats' }, { label: '手動記録' }]} />
        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
          スタッツを記録
        </Typography>

        <TextField
          label="日付"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
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

        <TextField
          label="Average"
          type="number"
          value={avg}
          onChange={(e) => setAvg(e.target.value)}
          fullWidth
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
          {condition && (
            <Typography variant="caption" color="text.secondary">
              {CONDITION_LABELS[condition]}
            </Typography>
          )}
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

        <Button variant="contained" fullWidth>
          記録する
        </Button>
      </Box>
    </Container>
  );
}

const meta = {
  title: 'Pages/Stats/StatsNewPage',
  component: StatsNewPageStory,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof StatsNewPageStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Fresh: Story = {
  args: { prefillRating: null, prefillPpd: null },
};

export const DartslivePreFill: Story = {
  args: { prefillRating: 8, prefillPpd: 42.5 },
};
