import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Container, Box, Typography, Paper, Chip, Button, CardMedia } from '@mui/material';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import MarkdownContent from '@/components/articles/MarkdownContent';
import type { Article } from '@/types';
import { MOCK_ARTICLE, MOCK_ARTICLE_NO_IMAGE } from '../../mocks/articles';

interface ArticleDetailPageStoryProps {
  article: Article | null;
  canEdit: boolean;
}

function ArticleDetailPageStory({ article, canEdit }: ArticleDetailPageStoryProps) {
  if (!article) {
    return (
      <Container maxWidth="md">
        <Box sx={{ mt: 3, p: { xs: 1, sm: 2 } }}>
          <Breadcrumbs items={[{ label: '記事一覧', href: '/articles' }, { label: '記事' }]} />
          <Paper sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary">
              記事が見つかりませんでした
            </Typography>
          </Paper>
        </Box>
      </Container>
    );
  }

  const dateStr = article.createdAt?.toDate
    ? article.createdAt.toDate().toLocaleDateString('ja-JP')
    : '';

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 3, p: { xs: 1, sm: 2 } }}>
        <Breadcrumbs items={[{ label: '記事一覧', href: '/articles' }, { label: article.title }]} />

        {article.coverImageUrl && (
          <CardMedia
            component="img"
            image={article.coverImageUrl}
            alt={article.title}
            sx={{ borderRadius: 2, mb: 2, maxHeight: 300, objectFit: 'cover' }}
          />
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
            {article.title}
          </Typography>
          {canEdit && (
            <Button variant="outlined" size="small">
              編集
            </Button>
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
          {article.tags.map((tag) => (
            <Chip key={tag} label={tag} size="small" variant="outlined" />
          ))}
        </Box>

        <Typography variant="caption" color="text.secondary" sx={{ mb: 3, display: 'block' }}>
          {dateStr}
          {article.userName && ` ・ ${article.userName}`}
        </Typography>

        <MarkdownContent content={article.content} />
      </Box>
    </Container>
  );
}

const meta = {
  title: 'Pages/Articles/ArticleDetailPage',
  component: ArticleDetailPageStory,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof ArticleDetailPageStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Loaded: Story = {
  args: { article: MOCK_ARTICLE as unknown as Article, canEdit: false },
};

export const NoImage: Story = {
  args: { article: MOCK_ARTICLE_NO_IMAGE as unknown as Article, canEdit: false },
};

export const AdminView: Story = {
  args: { article: MOCK_ARTICLE as unknown as Article, canEdit: true },
};

export const NotFound: Story = {
  args: { article: null, canEdit: false },
};
