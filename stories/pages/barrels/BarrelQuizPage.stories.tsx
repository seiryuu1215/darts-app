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
} from '@mui/material';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import { MOCK_QUIZ_RESULTS } from '../../mocks/barrels';

interface BarrelQuizPageStoryProps {
  variant: 'answering' | 'results';
}

function BarrelQuizPageStory({ variant }: BarrelQuizPageStoryProps) {
  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 3, p: { xs: 1, sm: 2 } }}>
        <Breadcrumbs items={[{ label: 'バレルDB', href: '/barrels' }, { label: 'バレル診断' }]} />
        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
          バレル診断
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          いくつかの質問に答えるだけで、あなたにピッタリのバレルを見つけます
        </Typography>

        {variant === 'answering' && (
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
              Q1. あなたのプレイスタイルは？
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {[
                '初心者（Cフライト以下）',
                '中級者（B〜Aフライト）',
                '上級者（AAフライト以上）',
              ].map((label) => (
                <Paper
                  key={label}
                  variant="outlined"
                  sx={{
                    p: 2,
                    cursor: 'pointer',
                    '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
                  }}
                >
                  <Typography variant="body2">{label}</Typography>
                </Paper>
              ))}
            </Box>
            <LinearProgress variant="determinate" value={20} sx={{ mt: 3 }} />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
              1 / 5
            </Typography>
          </Paper>
        )}

        {variant === 'results' && (
          <>
            <Typography variant="h6" sx={{ mb: 2 }}>
              おすすめバレル
            </Typography>
            <Grid container spacing={2}>
              {MOCK_QUIZ_RESULTS.map((result) => (
                <Grid size={{ xs: 12, sm: 6 }} key={result.barrel.id}>
                  <Card variant="outlined">
                    <CardMedia
                      component="img"
                      height="140"
                      image={result.barrel.imageUrl ?? ''}
                      alt={result.barrel.name}
                    />
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="subtitle2">{result.barrel.name}</Typography>
                        <Chip label={`${result.matchPercent}%`} size="small" color="primary" />
                      </Box>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {result.barrel.brand} / {result.barrel.weight}g
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={result.matchPercent}
                        sx={{ mt: 1, mb: 1 }}
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
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Button variant="outlined">もう一度診断する</Button>
            </Box>
          </>
        )}
      </Box>
    </Container>
  );
}

const meta = {
  title: 'Pages/Barrels/BarrelQuizPage',
  component: BarrelQuizPageStory,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof BarrelQuizPageStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Answering: Story = {
  args: { variant: 'answering' },
};

export const Results: Story = {
  args: { variant: 'results' },
};
