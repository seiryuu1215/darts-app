import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  MenuItem,
  Tabs,
  Tab,
  Alert,
} from '@mui/material';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import MarkdownContent from '@/components/articles/MarkdownContent';
import ProPaywall from '@/components/ProPaywall';
import { CATEGORY_LABELS } from '@/types';
import type { DiscussionCategory } from '@/types';

interface DiscussionNewPageStoryProps {
  canCreate: boolean;
}

function DiscussionNewPageStory({ canCreate }: DiscussionNewPageStoryProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<DiscussionCategory>('setting');
  const [content, setContent] = useState('');
  const [tab, setTab] = useState(0);

  if (!canCreate) {
    return (
      <Container maxWidth="md">
        <Box sx={{ mt: 3, p: { xs: 1, sm: 2 } }}>
          <Breadcrumbs items={[{ label: '掲示板', href: '/discussions' }, { label: '新規投稿' }]} />
          <ProPaywall
            title="掲示板への投稿はPROプラン限定です"
            description="PROプランにアップグレードすると、掲示板でのスレッド作成・返信ができます。"
          />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 3, p: { xs: 1, sm: 2 } }}>
        <Breadcrumbs items={[{ label: '掲示板', href: '/discussions' }, { label: '新規投稿' }]} />
        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
          新規投稿
        </Typography>

        <Alert severity="info" sx={{ mb: 2 }}>
          レーティング（Rt.8）・使用バレル（RISING SUN 6.0）が自動で表示されます
        </Alert>

        <TextField
          label="タイトル"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          fullWidth
          required
          sx={{ mb: 2 }}
        />

        <TextField
          select
          label="カテゴリ"
          value={category}
          onChange={(e) => setCategory(e.target.value as DiscussionCategory)}
          fullWidth
          sx={{ mb: 2 }}
        >
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <MenuItem key={key} value={key}>
              {label}
            </MenuItem>
          ))}
        </TextField>

        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 1 }}>
          <Tab label="編集" />
          <Tab label="プレビュー" />
        </Tabs>

        {tab === 0 ? (
          <TextField
            multiline
            rows={8}
            fullWidth
            placeholder="Markdown形式で本文を書く..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            sx={{ mb: 2 }}
          />
        ) : (
          <Box
            sx={{
              minHeight: 200,
              p: 2,
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              mb: 2,
            }}
          >
            {content ? (
              <MarkdownContent content={content} />
            ) : (
              <Typography color="text.secondary">プレビューするにはコンテンツを入力</Typography>
            )}
          </Box>
        )}

        <Button variant="contained">投稿</Button>
      </Box>
    </Container>
  );
}

const meta = {
  title: 'Pages/Discussions/DiscussionNewPage',
  component: DiscussionNewPageStory,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof DiscussionNewPageStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { canCreate: true },
};

export const Paywall: Story = {
  args: { canCreate: false },
};
