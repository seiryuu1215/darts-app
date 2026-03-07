import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { Container, Typography, Box, Button, Paper, Tabs, Tab } from '@mui/material';
import DiscussionCard from '@/components/discussions/DiscussionCard';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import type { Discussion, DiscussionCategory } from '@/types';
import { CATEGORY_LABELS } from '@/types';
import { MOCK_DISCUSSIONS_LIST } from '../../mocks/discussions';

const ALL_CATEGORIES: ('all' | DiscussionCategory)[] = [
  'all',
  'setting',
  'rating',
  'barrel',
  'practice',
  'gear',
  'general',
];

const CATEGORY_TAB_LABELS: Record<string, string> = {
  all: 'すべて',
  ...CATEGORY_LABELS,
};

interface DiscussionsListPageStoryProps {
  discussions: Discussion[];
  canCreate: boolean;
  initialCategory: 'all' | DiscussionCategory;
}

function DiscussionsListPageStory({
  discussions,
  canCreate,
  initialCategory,
}: DiscussionsListPageStoryProps) {
  const [category, setCategory] = useState<'all' | DiscussionCategory>(initialCategory);

  const filtered =
    category === 'all' ? discussions : discussions.filter((d) => d.category === category);

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 3, p: { xs: 1, sm: 2 } }}>
        <Breadcrumbs items={[{ label: '掲示板' }]} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            掲示板
          </Typography>
          {canCreate && (
            <Button variant="contained" size="small">
              新規投稿
            </Button>
          )}
        </Box>

        <Tabs
          value={ALL_CATEGORIES.indexOf(category)}
          onChange={(_, v) => setCategory(ALL_CATEGORIES[v])}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
        >
          {ALL_CATEGORIES.map((cat) => (
            <Tab key={cat} label={CATEGORY_TAB_LABELS[cat]} sx={{ minWidth: 'auto', px: 2 }} />
          ))}
        </Tabs>

        {filtered.length === 0 && (
          <Paper sx={{ textAlign: 'center', py: 6, bgcolor: 'background.default' }}>
            <Typography color="text.secondary">投稿がありません</Typography>
          </Paper>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {filtered.map((discussion) => (
            <DiscussionCard key={discussion.id} discussion={discussion} />
          ))}
        </Box>
      </Box>
    </Container>
  );
}

const meta = {
  title: 'Pages/Discussions/DiscussionsListPage',
  component: DiscussionsListPageStory,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof DiscussionsListPageStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Loaded: Story = {
  args: {
    discussions: MOCK_DISCUSSIONS_LIST as unknown as Discussion[],
    canCreate: true,
    initialCategory: 'all',
  },
};

export const Empty: Story = {
  args: { discussions: [], canCreate: false, initialCategory: 'all' },
};

export const FilteredCategory: Story = {
  args: {
    discussions: MOCK_DISCUSSIONS_LIST as unknown as Discussion[],
    canCreate: true,
    initialCategory: 'setting',
  },
};
