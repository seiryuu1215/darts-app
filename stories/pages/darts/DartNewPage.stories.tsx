import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Container, Box, Typography, Paper, Button } from '@mui/material';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import ProPaywall from '@/components/ProPaywall';

interface DartNewPageStoryProps {
  variant: 'fresh' | 'paywall';
}

function DartNewPageStory({ variant }: DartNewPageStoryProps) {
  if (variant === 'paywall') {
    return (
      <Container maxWidth="md">
        <Box sx={{ mt: 3, p: { xs: 1, sm: 2 } }}>
          <Breadcrumbs items={[{ label: 'ダーツ一覧', href: '/darts' }, { label: '新規登録' }]} />
          <ProPaywall
            title="セッティング登録数の上限に達しました"
            description="無料プランではセッティングを8件まで登録できます。PROプランにアップグレードすると無制限に登録できます。"
            currentUsage={{ current: 8, limit: 8, label: 'セッティング' }}
          />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 3, p: { xs: 1, sm: 2 } }}>
        <Breadcrumbs items={[{ label: 'ダーツ一覧', href: '/darts' }, { label: '新規登録' }]} />
        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
          新規セッティング登録
        </Typography>
        <Paper variant="outlined" sx={{ p: 3, mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
            バレル情報
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Paper
                variant="outlined"
                sx={{
                  width: 120,
                  height: 120,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  画像を追加
                </Typography>
              </Paper>
            </Box>
            <Typography variant="body2" color="text.secondary">
              バレル検索または手動入力でセッティングを登録します。
              チップ・シャフト・フライトは一覧から選択するか、カスタム入力できます。
            </Typography>
          </Box>
        </Paper>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="contained" disabled>
            登録
          </Button>
          <Button variant="outlined">キャンセル</Button>
        </Box>
      </Box>
    </Container>
  );
}

const meta = {
  title: 'Pages/Darts/DartNewPage',
  component: DartNewPageStory,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof DartNewPageStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Fresh: Story = {
  args: { variant: 'fresh' },
};

export const Paywall: Story = {
  args: { variant: 'paywall' },
};
