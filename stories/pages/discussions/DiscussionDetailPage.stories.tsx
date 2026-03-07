import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Container, Box, Typography, Paper, Chip, TextField, Button, Divider } from '@mui/material';
import PushPinIcon from '@mui/icons-material/PushPin';
import LockIcon from '@mui/icons-material/Lock';
import UserAvatar from '@/components/UserAvatar';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import MarkdownContent from '@/components/articles/MarkdownContent';
import type { Discussion, DiscussionReply } from '@/types';
import { CATEGORY_LABELS } from '@/types';
import { MOCK_DISCUSSION, MOCK_DISCUSSION_LOCKED } from '../../mocks/discussions';
import { MOCK_REPLIES } from '../../mocks/discussions';

interface DiscussionDetailPageStoryProps {
  discussion: Discussion | null;
  replies: DiscussionReply[];
  isLocked: boolean;
}

function DiscussionDetailPageStory({
  discussion,
  replies,
  isLocked,
}: DiscussionDetailPageStoryProps) {
  if (!discussion) {
    return (
      <Container maxWidth="md">
        <Box sx={{ mt: 3, p: { xs: 1, sm: 2 } }}>
          <Breadcrumbs items={[{ label: '掲示板', href: '/discussions' }, { label: 'スレッド' }]} />
          <Paper sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary">
              スレッドが見つかりませんでした
            </Typography>
          </Paper>
        </Box>
      </Container>
    );
  }

  const dateStr = discussion.createdAt?.toDate
    ? discussion.createdAt.toDate().toLocaleDateString('ja-JP')
    : '';
  const locked = isLocked || discussion.isLocked;

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 3, p: { xs: 1, sm: 2 } }}>
        <Breadcrumbs
          items={[{ label: '掲示板', href: '/discussions' }, { label: discussion.title }]}
        />

        {/* Header */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
            {discussion.isPinned && <PushPinIcon sx={{ fontSize: 18, color: 'warning.main' }} />}
            {locked && <LockIcon sx={{ fontSize: 18, color: 'text.secondary' }} />}
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              {discussion.title}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip label={CATEGORY_LABELS[discussion.category]} size="small" variant="outlined" />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <UserAvatar
                userId={discussion.userId}
                avatarUrl={discussion.userAvatarUrl}
                userName={discussion.userName}
                size={24}
              />
              <Typography variant="caption" color="text.secondary">
                {discussion.userName}
              </Typography>
            </Box>
            {discussion.userRating != null && (
              <Chip label={`Rt.${discussion.userRating}`} size="small" color="primary" />
            )}
            <Typography variant="caption" color="text.secondary">
              {dateStr}
            </Typography>
          </Box>
        </Box>

        {/* Content */}
        <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
          <MarkdownContent content={discussion.content} />
        </Paper>

        {/* Replies */}
        <Typography variant="h6" sx={{ mb: 2 }}>
          返信 ({replies.length})
        </Typography>

        {replies.length === 0 && (
          <Paper sx={{ textAlign: 'center', py: 4, bgcolor: 'background.default', mb: 2 }}>
            <Typography color="text.secondary">まだ返信がありません</Typography>
          </Paper>
        )}

        {replies.map((reply, i) => {
          const replyDate = reply.createdAt?.toDate
            ? reply.createdAt.toDate().toLocaleDateString('ja-JP')
            : '';
          return (
            <Box key={reply.id ?? i}>
              <Box sx={{ display: 'flex', gap: 1.5, py: 2 }}>
                <UserAvatar
                  userId={reply.userId}
                  avatarUrl={reply.userAvatarUrl}
                  userName={reply.userName}
                  size={32}
                />
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography variant="body2" fontWeight="bold">
                      {reply.userName}
                    </Typography>
                    {reply.userRating != null && (
                      <Chip
                        label={`Rt.${reply.userRating}`}
                        size="small"
                        color="primary"
                        sx={{ height: 20, fontSize: 11 }}
                      />
                    )}
                    <Typography variant="caption" color="text.secondary">
                      {replyDate}
                    </Typography>
                  </Box>
                  <Typography variant="body2">{reply.text}</Typography>
                </Box>
              </Box>
              {i < replies.length - 1 && <Divider />}
            </Box>
          );
        })}

        {/* Reply Form */}
        {!locked ? (
          <Box sx={{ mt: 3 }}>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              返信する
            </Typography>
            <TextField multiline rows={3} fullWidth placeholder="返信を入力..." sx={{ mb: 1 }} />
            <Button variant="contained" size="small">
              送信
            </Button>
          </Box>
        ) : (
          <Paper sx={{ textAlign: 'center', py: 2, mt: 2, bgcolor: 'action.hover' }}>
            <Typography variant="body2" color="text.secondary">
              このスレッドはロックされています
            </Typography>
          </Paper>
        )}
      </Box>
    </Container>
  );
}

const meta = {
  title: 'Pages/Discussions/DiscussionDetailPage',
  component: DiscussionDetailPageStory,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof DiscussionDetailPageStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithReplies: Story = {
  args: {
    discussion: MOCK_DISCUSSION as unknown as Discussion,
    replies: MOCK_REPLIES as unknown as DiscussionReply[],
    isLocked: false,
  },
};

export const Locked: Story = {
  args: {
    discussion: MOCK_DISCUSSION_LOCKED as unknown as Discussion,
    replies: MOCK_REPLIES as unknown as DiscussionReply[],
    isLocked: true,
  },
};

export const Empty: Story = {
  args: {
    discussion: MOCK_DISCUSSION as unknown as Discussion,
    replies: [],
    isLocked: false,
  },
};

export const NotFound: Story = {
  args: { discussion: null, replies: [], isLocked: false },
};
