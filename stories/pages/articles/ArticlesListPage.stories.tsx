import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Container, Grid, Typography, Box, Button, Paper } from '@mui/material';
import ArticleCard from '@/components/articles/ArticleCard';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import type { Article } from '@/types';
import { MOCK_ARTICLES_LIST } from '../../mocks/articles';

interface ArticlesListPageStoryProps {
  articles: Article[];
  canWrite: boolean;
}

function ArticlesListPageStory({ articles, canWrite }: ArticlesListPageStoryProps) {
  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 3, p: { xs: 1, sm: 2 } }}>
        <Breadcrumbs items={[{ label: '記事一覧' }]} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            記事一覧
          </Typography>
          {canWrite && (
            <Button variant="contained" size="small">
              記事を書く
            </Button>
          )}
        </Box>

        {articles.length === 0 && (
          <Paper sx={{ textAlign: 'center', py: 6, bgcolor: 'background.default' }}>
            <Typography color="text.secondary">記事がありません</Typography>
          </Paper>
        )}

        <Grid container spacing={2}>
          {articles.map((article) => (
            <Grid size={{ xs: 12, sm: 6 }} key={article.id}>
              <ArticleCard article={article} />
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  );
}

const meta = {
  title: 'Pages/Articles/ArticlesListPage',
  component: ArticlesListPageStory,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof ArticlesListPageStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Loaded: Story = {
  args: { articles: MOCK_ARTICLES_LIST as unknown as Article[], canWrite: false },
};

export const Empty: Story = {
  args: { articles: [], canWrite: false },
};

export const CanWrite: Story = {
  args: { articles: MOCK_ARTICLES_LIST as unknown as Article[], canWrite: true },
};
