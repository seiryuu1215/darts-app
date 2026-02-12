'use client';

import { Paper, Typography, Box, Chip } from '@mui/material';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import PushPinIcon from '@mui/icons-material/PushPin';
import LockIcon from '@mui/icons-material/Lock';
import Link from 'next/link';
import UserAvatar from '@/components/UserAvatar';
import { CATEGORY_LABELS } from '@/types';
import type { Discussion } from '@/types';

interface DiscussionCardProps {
  discussion: Discussion;
}

export default function DiscussionCard({ discussion }: DiscussionCardProps) {
  const lastActivity = discussion.lastRepliedAt ?? discussion.createdAt;
  const dateStr = lastActivity?.toDate?.()?.toLocaleDateString('ja-JP') || '';

  return (
    <Paper
      variant="outlined"
      component={Link}
      href={`/discussions/${discussion.id}`}
      sx={{
        p: 2,
        display: 'block',
        textDecoration: 'none',
        color: 'inherit',
        transition: 'border-color 0.2s',
        '&:hover': { borderColor: 'primary.main' },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
        <UserAvatar
          userId={discussion.userId}
          avatarUrl={discussion.userAvatarUrl}
          userName={discussion.userName}
          size={36}
          sx={{ mt: 0.5 }}
        />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
            {discussion.isPinned && <PushPinIcon sx={{ fontSize: 16, color: 'warning.main' }} />}
            {discussion.isLocked && <LockIcon sx={{ fontSize: 16, color: 'text.secondary' }} />}
            <Typography variant="subtitle1" fontWeight="bold" noWrap sx={{ flex: 1 }}>
              {discussion.title}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              label={CATEGORY_LABELS[discussion.category]}
              size="small"
              variant="outlined"
              sx={{ fontSize: 11, height: 22 }}
            />
            <Typography variant="caption" color="text.secondary">
              {discussion.userName}
            </Typography>
            {discussion.userRating != null && (
              <Chip
                label={`Rt.${discussion.userRating}`}
                size="small"
                color="primary"
                sx={{ fontSize: 11, height: 20 }}
              />
            )}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3, ml: 'auto' }}>
              <ChatBubbleOutlineIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                {discussion.replyCount}
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              {dateStr}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}
