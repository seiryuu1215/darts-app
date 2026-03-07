import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { Box, Typography, Paper, TextField, Button, Alert, Divider } from '@mui/material';

interface AdminPricingPageStoryProps {
  isAdmin: boolean;
}

function AdminPricingPageStory({ isAdmin }: AdminPricingPageStoryProps) {
  const [price, setPrice] = useState('580');
  const [promoPrice, setPromoPrice] = useState('480');
  const [trialDays, setTrialDays] = useState('7');
  const [stripePriceId, setStripePriceId] = useState('price_1ABC...');
  const [promoStripePriceId, setPromoStripePriceId] = useState('price_2DEF...');
  const [promoStart, setPromoStart] = useState('2025-04-01T00:00');
  const [promoEnd, setPromoEnd] = useState('2025-04-30T23:59');

  if (!isAdmin) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">管理者権限が必要です</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
        料金・プロモ設定
      </Typography>

      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 2 }}>
          基本料金
        </Typography>

        <TextField
          label="PRO月額 (円)"
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
        />

        <TextField
          label="プロモ価格 (円)"
          type="number"
          value={promoPrice}
          onChange={(e) => setPromoPrice(e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
        />

        <TextField
          label="トライアル日数"
          type="number"
          value={trialDays}
          onChange={(e) => setTrialDays(e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
        />

        <Divider sx={{ my: 2 }}>Stripe設定</Divider>

        <TextField
          label="Stripe Price ID（通常）"
          value={stripePriceId}
          onChange={(e) => setStripePriceId(e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
        />

        <TextField
          label="Stripe Price ID（プロモ）"
          value={promoStripePriceId}
          onChange={(e) => setPromoStripePriceId(e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
        />

        <Divider sx={{ my: 2 }}>プロモーション期間</Divider>

        <TextField
          label="開始日時"
          type="datetime-local"
          value={promoStart}
          onChange={(e) => setPromoStart(e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
          slotProps={{ inputLabel: { shrink: true } }}
        />

        <TextField
          label="終了日時"
          type="datetime-local"
          value={promoEnd}
          onChange={(e) => setPromoEnd(e.target.value)}
          fullWidth
          sx={{ mb: 3 }}
          slotProps={{ inputLabel: { shrink: true } }}
        />

        <Button variant="contained" fullWidth>
          保存
        </Button>
      </Paper>
    </Box>
  );
}

const meta = {
  title: 'Pages/Admin/AdminPricingPage',
  component: AdminPricingPageStory,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof AdminPricingPageStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Loaded: Story = {
  args: { isAdmin: true },
};

export const NotAdmin: Story = {
  args: { isAdmin: false },
};
