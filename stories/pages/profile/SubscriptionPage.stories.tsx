import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Container, Box, Typography, Paper, Button, Chip, Alert } from '@mui/material';

interface SubscriptionPageStoryProps {
  variant: 'active' | 'trialing' | 'canceled' | 'noSubscription';
}

function SubscriptionPageStory({ variant }: SubscriptionPageStoryProps) {
  const isPro = variant !== 'noSubscription';

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 3, p: { xs: 1, sm: 2 } }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
          サブスクリプション管理
        </Typography>

        <Paper variant="outlined" sx={{ p: 3, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              現在のプラン
            </Typography>
            <Chip
              label={isPro ? 'PRO' : 'Free'}
              color={isPro ? 'primary' : 'default'}
              size="small"
            />
          </Box>

          {variant === 'active' && (
            <>
              <Typography variant="body2" sx={{ mb: 1 }}>
                ステータス: <Chip label="有効" color="success" size="small" />
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                次回請求日: 2025年4月7日
              </Typography>
              <Button variant="outlined" size="small">
                サブスクリプションを管理
              </Button>
            </>
          )}

          {variant === 'trialing' && (
            <>
              <Typography variant="body2" sx={{ mb: 1 }}>
                ステータス: <Chip label="トライアル中" color="info" size="small" />
              </Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                無料トライアルは2025年3月14日まで。トライアル終了後は自動的に課金が開始されます。
              </Alert>
              <Button variant="outlined" size="small">
                サブスクリプションを管理
              </Button>
            </>
          )}

          {variant === 'canceled' && (
            <>
              <Typography variant="body2" sx={{ mb: 1 }}>
                ステータス: <Chip label="解約済み" color="warning" size="small" />
              </Typography>
              <Alert severity="warning" sx={{ mb: 2 }}>
                サブスクリプションは解約されています。2025年4月7日まではPRO機能をご利用いただけます。
              </Alert>
              <Button variant="contained" size="small">
                再登録する
              </Button>
            </>
          )}

          {variant === 'noSubscription' && (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                PROプランに登録すると、すべての機能が利用できます。
              </Typography>
              <Button variant="contained" size="small">
                PROプランに登録
              </Button>
            </>
          )}
        </Paper>

        <Button variant="text" size="small" sx={{ color: 'text.secondary' }}>
          料金プランを見る
        </Button>
      </Box>
    </Container>
  );
}

const meta = {
  title: 'Pages/Profile/SubscriptionPage',
  component: SubscriptionPageStory,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof SubscriptionPageStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Active: Story = {
  args: { variant: 'active' },
};

export const Trialing: Story = {
  args: { variant: 'trialing' },
};

export const Canceled: Story = {
  args: { variant: 'canceled' },
};

export const NoSubscription: Story = {
  args: { variant: 'noSubscription' },
};
