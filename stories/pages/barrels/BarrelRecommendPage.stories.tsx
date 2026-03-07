import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Chip,
  LinearProgress,
  Button,
  TextField,
} from '@mui/material';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import { MOCK_BARREL_PRODUCTS, MOCK_QUIZ_RESULTS } from '../../mocks/barrels';

interface BarrelRecommendPageStoryProps {
  variant: 'loaded' | 'noBarrels';
  hasResults: boolean;
}

function BarrelRecommendPageStory({ variant, hasResults }: BarrelRecommendPageStoryProps) {
  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 3, p: { xs: 1, sm: 2 } }}>
        <Breadcrumbs
          items={[{ label: 'バレルDB', href: '/barrels' }, { label: 'おすすめバレル' }]}
        />
        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
          おすすめバレル
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          お気に入りのバレルから、似たスペックのバレルを見つけます
        </Typography>

        {variant === 'noBarrels' && (
          <Paper sx={{ textAlign: 'center', py: 8, bgcolor: 'background.default' }}>
            <Typography color="text.secondary" sx={{ mb: 1 }}>
              バレルのブックマークがありません
            </Typography>
            <Typography variant="body2" color="text.secondary">
              バレルDBでバレルをブックマークしてから、おすすめ機能をお試しください
            </Typography>
          </Paper>
        )}

        {variant === 'loaded' && (
          <>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              分析するバレルを選択（最大3つ）
            </Typography>
            <Grid container spacing={1} sx={{ mb: 2, maxHeight: 300, overflow: 'auto' }}>
              {MOCK_BARREL_PRODUCTS.slice(0, 4).map((bp, i) => (
                <Grid size={{ xs: 6, sm: 4 }} key={bp.id}>
                  <Card
                    variant="outlined"
                    sx={{
                      cursor: 'pointer',
                      borderColor: i < 2 ? 'primary.main' : 'divider',
                      borderWidth: i < 2 ? 2 : 1,
                    }}
                  >
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Typography variant="caption" fontWeight="bold" noWrap>
                        {bp.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {bp.brand} / {bp.weight}g
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            <TextField
              multiline
              rows={2}
              fullWidth
              placeholder="好みや条件があれば入力（任意）"
              sx={{ mb: 2 }}
            />

            <Button variant="contained" sx={{ mb: 3 }}>
              おすすめを検索
            </Button>

            {hasResults && (
              <>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  おすすめ結果
                </Typography>
                <Grid container spacing={2}>
                  {MOCK_QUIZ_RESULTS.map((result) => (
                    <Grid size={{ xs: 12, sm: 6 }} key={result.barrel.id}>
                      <Card variant="outlined">
                        <CardMedia
                          component="img"
                          height="120"
                          image={result.barrel.imageUrl ?? ''}
                        />
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="subtitle2">{result.barrel.name}</Typography>
                            <Chip label={`${result.matchPercent}%`} size="small" color="primary" />
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={result.matchPercent}
                            sx={{ mb: 1 }}
                          />
                          {result.analysis && (
                            <Typography variant="body2" color="text.secondary">
                              {result.analysis}
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </>
            )}
          </>
        )}
      </Box>
    </Container>
  );
}

const meta = {
  title: 'Pages/Barrels/BarrelRecommendPage',
  component: BarrelRecommendPageStory,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof BarrelRecommendPageStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Loaded: Story = {
  args: { variant: 'loaded', hasResults: true },
};

export const NoResults: Story = {
  args: { variant: 'loaded', hasResults: false },
};

export const NoBarrels: Story = {
  args: { variant: 'noBarrels', hasResults: false },
};
