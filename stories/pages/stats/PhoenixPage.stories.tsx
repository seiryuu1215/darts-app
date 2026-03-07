import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Button,
  Card,
  CardContent,
} from '@mui/material';
import SyncIcon from '@mui/icons-material/Sync';
import Breadcrumbs from '@/components/layout/Breadcrumbs';

interface PhoenixPageStoryProps {
  variant: 'connected' | 'notConnected';
}

function PhoenixPageStory({ variant }: PhoenixPageStoryProps) {
  const isConnected = variant === 'connected';

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 3, p: { xs: 1, sm: 2 } }}>
        <Breadcrumbs items={[{ label: 'Stats', href: '/stats' }, { label: 'PHOENIX' }]} />
        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
          PHOENIX レーティング変換
        </Typography>

        {/* Link Section */}
        <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="subtitle2">PHOENIX連携</Typography>
              {isConnected ? (
                <Typography variant="caption" color="text.secondary">
                  最終同期: 3/7 15:00
                </Typography>
              ) : (
                <Typography variant="caption" color="text.secondary">
                  PHOENIXアカウントを連携してスタッツを取得
                </Typography>
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {isConnected && (
                <Button variant="outlined" size="small" startIcon={<SyncIcon />}>
                  同期
                </Button>
              )}
              <Button variant={isConnected ? 'text' : 'contained'} size="small">
                {isConnected ? '設定' : '連携する'}
              </Button>
            </Box>
          </Box>
        </Paper>

        {!isConnected && (
          <Paper sx={{ textAlign: 'center', py: 8, bgcolor: 'background.default' }}>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
              PHOENIXと連携
            </Typography>
            <Typography variant="body2" color="text.secondary">
              PHOENIXアカウントを連携すると、DARTSLIVEとPHOENIXのスタッツを比較・変換できます
            </Typography>
          </Paper>
        )}

        {isConnected && (
          <>
            {/* PHOENIX Stats */}
            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="subtitle2">PHOENIXスタッツ</Typography>
                  <Chip label="A3" size="small" color="primary" />
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Rt. 12
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={4}>
                    <Typography variant="caption" color="text.secondary">
                      PPD
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      45.2
                    </Typography>
                  </Grid>
                  <Grid size={4}>
                    <Typography variant="caption" color="text.secondary">
                      MPR
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      2.35
                    </Typography>
                  </Grid>
                  <Grid size={4}>
                    <Typography variant="caption" color="text.secondary">
                      CU平均
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      680
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Conversion */}
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                プラットフォーム比較
              </Typography>
              <Grid container spacing={2}>
                <Grid size={6}>
                  <Typography variant="caption" color="text.secondary">
                    DARTSLIVE
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    Rt. 8 (BB)
                  </Typography>
                  <Typography variant="body2">PPD: 42.5 / MPR: 2.1</Typography>
                </Grid>
                <Grid size={6}>
                  <Typography variant="caption" color="text.secondary">
                    PHOENIX
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    Rt. 12 (A3)
                  </Typography>
                  <Typography variant="body2">PPD: 45.2 / MPR: 2.35</Typography>
                </Grid>
              </Grid>
            </Paper>
          </>
        )}
      </Box>
    </Container>
  );
}

const meta = {
  title: 'Pages/Stats/PhoenixPage',
  component: PhoenixPageStory,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof PhoenixPageStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Connected: Story = {
  args: { variant: 'connected' },
};

export const NotConnected: Story = {
  args: { variant: 'notConnected' },
};
