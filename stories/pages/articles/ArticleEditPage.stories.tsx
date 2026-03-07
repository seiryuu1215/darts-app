import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Chip,
  Tabs,
  Tab,
  Autocomplete,
  Paper,
} from '@mui/material';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import MarkdownContent from '@/components/articles/MarkdownContent';
import type { Article } from '@/types';
import { MOCK_ARTICLE } from '../../mocks/articles';

const TAG_OPTIONS = ['練習法', 'レーティング', '初心者向け', 'バレル', '機材選び', 'フライト'];

interface ArticleEditPageStoryProps {
  article: Article | null;
}

function ArticleEditPageStory({ article }: ArticleEditPageStoryProps) {
  const [title, setTitle] = useState(article?.title ?? '');
  const [slug, setSlug] = useState(article?.slug ?? '');
  const [tags, setTags] = useState<string[]>(article?.tags ?? []);
  const [content, setContent] = useState(article?.content ?? '');
  const [tab, setTab] = useState(0);

  if (!article) {
    return (
      <Container maxWidth="md">
        <Box sx={{ mt: 3, p: { xs: 1, sm: 2 } }}>
          <Breadcrumbs items={[{ label: '記事一覧', href: '/articles' }, { label: '編集' }]} />
          <Paper sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary">
              記事が見つかりませんでした
            </Typography>
          </Paper>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 3, p: { xs: 1, sm: 2 } }}>
        <Breadcrumbs
          items={[
            { label: '記事一覧', href: '/articles' },
            { label: article.title, href: `/articles/${article.slug}` },
            { label: '編集' },
          ]}
        />
        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
          記事を編集
        </Typography>

        <TextField
          label="タイトル"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          fullWidth
          required
          sx={{ mb: 2 }}
        />

        <TextField
          label="スラッグ (URL)"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          fullWidth
          size="small"
          sx={{ mb: 2 }}
        />

        <Autocomplete
          multiple
          freeSolo
          options={TAG_OPTIONS}
          value={tags}
          onChange={(_, v) => setTags(v)}
          renderTags={(value, getTagProps) =>
            value.map((tag, i) => (
              <Chip {...getTagProps({ index: i })} key={tag} label={tag} size="small" />
            ))
          }
          renderInput={(params) => (
            <TextField {...params} label="タグ" size="small" sx={{ mb: 2 }} />
          )}
        />

        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 1 }}>
          <Tab label="編集" />
          <Tab label="プレビュー" />
        </Tabs>

        {tab === 0 ? (
          <TextField
            multiline
            rows={12}
            fullWidth
            value={content}
            onChange={(e) => setContent(e.target.value)}
            sx={{ mb: 2 }}
          />
        ) : (
          <Box sx={{ minHeight: 300, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
            {content ? (
              <MarkdownContent content={content} />
            ) : (
              <Typography color="text.secondary">コンテンツがありません</Typography>
            )}
          </Box>
        )}

        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
          <Button variant="contained">保存</Button>
          <Button variant="outlined">キャンセル</Button>
        </Box>
      </Box>
    </Container>
  );
}

const meta = {
  title: 'Pages/Articles/ArticleEditPage',
  component: ArticleEditPageStory,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof ArticleEditPageStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Loaded: Story = {
  args: { article: MOCK_ARTICLE as unknown as Article },
};

export const NotFound: Story = {
  args: { article: null },
};
