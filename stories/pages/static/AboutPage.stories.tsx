import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Container, Box, Typography, Button, Paper } from '@mui/material';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import MarkdownContent from '@/components/articles/MarkdownContent';
import type { Article } from '@/types';
import { MOCK_ARTICLE_ABOUT } from '../../mocks/articles';

interface AboutPageStoryProps {
  article: Article | null;
  isAdmin: boolean;
}

function AboutPageStory({ article, isAdmin }: AboutPageStoryProps) {
  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 3, p: { xs: 1, sm: 2 } }}>
        <Breadcrumbs items={[{ label: 'Darts Labについて' }]} />

        {article ? (
          <>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
              }}
            >
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                {article.title}
              </Typography>
              {isAdmin && (
                <Button variant="outlined" size="small">
                  編集
                </Button>
              )}
            </Box>
            <MarkdownContent content={article.content} />
          </>
        ) : (
          <Paper sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
              Darts Lab
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ダーツプレイヤーのためのオールインワンプラットフォーム
            </Typography>
          </Paper>
        )}
      </Box>
    </Container>
  );
}

const meta = {
  title: 'Pages/Static/AboutPage',
  component: AboutPageStory,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof AboutPageStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithArticle: Story = {
  args: { article: MOCK_ARTICLE_ABOUT as unknown as Article, isAdmin: false },
};

export const Fallback: Story = {
  args: { article: null, isAdmin: false },
};

export const AdminView: Story = {
  args: { article: MOCK_ARTICLE_ABOUT as unknown as Article, isAdmin: true },
};
