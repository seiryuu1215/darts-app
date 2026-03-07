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
} from '@mui/material';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import MarkdownContent from '@/components/articles/MarkdownContent';

const TAG_OPTIONS = ['練習法', 'レーティング', '初心者向け', 'バレル', '機材選び', 'フライト'];

function ArticleNewPageStory() {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [content, setContent] = useState('');
  const [tab, setTab] = useState(0);

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 3, p: { xs: 1, sm: 2 } }}>
        <Breadcrumbs items={[{ label: '記事一覧', href: '/articles' }, { label: '新規作成' }]} />
        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
          記事を書く
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
          helperText={`/articles/${slug || 'auto-generated'}`}
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
            placeholder="Markdown形式で記事を書く..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            sx={{ mb: 2 }}
          />
        ) : (
          <Box sx={{ minHeight: 300, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
            {content ? (
              <MarkdownContent content={content} />
            ) : (
              <Typography color="text.secondary">プレビューするにはコンテンツを入力</Typography>
            )}
          </Box>
        )}

        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
          <Button variant="contained">公開</Button>
          <Button variant="outlined">下書き保存</Button>
        </Box>
      </Box>
    </Container>
  );
}

const meta = {
  title: 'Pages/Articles/ArticleNewPage',
  component: ArticleNewPageStory,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof ArticleNewPageStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
