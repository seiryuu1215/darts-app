import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import {
  Container,
  Grid,
  Typography,
  Box,
  Card,
  CardContent,
  Paper,
  Chip,
  Button,
  LinearProgress,
} from '@mui/material';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import BarChartIcon from '@mui/icons-material/BarChart';
import SearchIcon from '@mui/icons-material/Search';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import type { Dart } from '@/types';
import DartCard from '@/components/darts/DartCard';
import { MOCK_DARTS_LIST } from '../../mocks/darts';

interface HomePageStoryProps {
  variant: 'guest' | 'authenticated' | 'withStats' | 'fullDashboard';
}

const FEATURE_CARDS = [
  { title: 'バレルDB', desc: '1000+のバレルを検索・比較', icon: <SearchIcon /> },
  { title: 'シャフト早見表', desc: 'ブランド別シャフト重量比較', icon: <CompareArrowsIcon /> },
  { title: 'シルエット比較', desc: 'バレル形状をビジュアルで比較', icon: <CompareArrowsIcon /> },
  { title: 'バレル診断', desc: '質問に答えておすすめバレル発見', icon: <SportsEsportsIcon /> },
];

function HomePageStory({ variant }: HomePageStoryProps) {
  const isGuest = variant === 'guest';
  const hasStats = variant === 'withStats' || variant === 'fullDashboard';
  const isFullDashboard = variant === 'fullDashboard';

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 3, p: { xs: 1, sm: 2 } }}>
        {/* Guest Hero */}
        {isGuest && (
          <Paper
            sx={{
              p: 4,
              mb: 3,
              textAlign: 'center',
              background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)',
              color: 'white',
              borderRadius: 3,
            }}
          >
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
              Darts Lab
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, opacity: 0.9 }}>
              ダーツプレイヤーのためのオールインワンプラットフォーム
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
              <Button variant="contained" color="inherit" sx={{ color: '#1a237e' }}>
                新規登録
              </Button>
              <Button variant="outlined" color="inherit">
                ログイン
              </Button>
            </Box>
          </Paper>
        )}

        {/* Authenticated Header */}
        {!isGuest && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              ダッシュボード
            </Typography>

            {/* XP Bar */}
            <Box sx={{ mt: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption">Lv.5 シルバー</Typography>
                <Typography variant="caption">1250 / 2000 XP</Typography>
              </Box>
              <LinearProgress variant="determinate" value={62.5} sx={{ borderRadius: 1 }} />
            </Box>
          </Box>
        )}

        {/* Stats Overview */}
        {hasStats && (
          <Card variant="outlined" sx={{ mb: 2, borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <BarChartIcon sx={{ color: 'primary.main' }} />
                <Typography variant="subtitle1" fontWeight="bold">
                  DARTSLIVE Stats
                </Typography>
                <Chip label="BB" size="small" sx={{ bgcolor: '#4caf50', color: 'white' }} />
              </Box>
              <Grid container spacing={2}>
                <Grid size={3}>
                  <Typography variant="caption" color="text.secondary">
                    Rating
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    8.0
                  </Typography>
                </Grid>
                <Grid size={3}>
                  <Typography variant="caption" color="text.secondary">
                    01 PPD
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    42.5
                  </Typography>
                </Grid>
                <Grid size={3}>
                  <Typography variant="caption" color="text.secondary">
                    Cri MPR
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    2.10
                  </Typography>
                </Grid>
                <Grid size={3}>
                  <Typography variant="caption" color="text.secondary">
                    CU Avg
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    340
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Active Settings */}
        {isFullDashboard && (
          <Card variant="outlined" sx={{ mb: 2, borderRadius: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                アクティブセッティング
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip label="ソフト: RISING SUN 6.0" size="small" color="info" />
                <Chip label="スティール: 未設定" size="small" variant="outlined" />
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Feature Cards */}
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          機能
        </Typography>
        <Grid container spacing={1.5} sx={{ mb: 3 }}>
          {FEATURE_CARDS.map((card) => (
            <Grid size={{ xs: 6, sm: 3 }} key={card.title}>
              <Card
                variant="outlined"
                sx={{
                  textAlign: 'center',
                  p: 1.5,
                  cursor: 'pointer',
                  '&:hover': { borderColor: 'primary.main' },
                }}
              >
                <Box sx={{ color: 'primary.main', mb: 0.5 }}>{card.icon}</Box>
                <Typography variant="body2" fontWeight="bold">
                  {card.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {card.desc}
                </Typography>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* My Settings */}
        {isFullDashboard && (
          <>
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}
            >
              <Typography variant="subtitle2">マイセッティング</Typography>
              <Button size="small">すべて見る</Button>
            </Box>
            <Grid container spacing={2}>
              {(MOCK_DARTS_LIST as unknown as Dart[]).slice(0, 3).map((dart) => (
                <Grid size={{ xs: 12, sm: 4 }} key={dart.id}>
                  <DartCard dart={dart} />
                </Grid>
              ))}
            </Grid>
          </>
        )}
      </Box>
    </Container>
  );
}

const meta = {
  title: 'Pages/Home/HomePage',
  component: HomePageStory,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof HomePageStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Guest: Story = {
  args: { variant: 'guest' },
};

export const Authenticated: Story = {
  args: { variant: 'authenticated' },
};

export const WithStats: Story = {
  args: { variant: 'withStats' },
};

export const FullDashboard: Story = {
  args: { variant: 'fullDashboard' },
};
