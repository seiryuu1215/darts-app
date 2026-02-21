'use client';

import { useState } from 'react';
import { Box, Typography, IconButton, Divider, Chip, Tooltip } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import FlagIcon from '@mui/icons-material/Flag';
import {
  doc,
  deleteDoc,
  updateDoc,
  increment,
  collection,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useSession } from 'next-auth/react';
import UserAvatar from '@/components/UserAvatar';
import type { DiscussionReply } from '@/types';

interface ReplyListProps {
  discussionId: string;
  replies: DiscussionReply[];
  onReplyDeleted: () => void;
}

export default function ReplyList({ discussionId, replies, onReplyDeleted }: ReplyListProps) {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'admin';
  const [reportedIds, setReportedIds] = useState<Set<string>>(new Set());

  const handleReport = async (replyId: string) => {
    if (!session?.user?.id) return;
    if (!confirm('この返信を通報しますか？')) return;
    try {
      await addDoc(collection(db, 'reports'), {
        userId: session.user.id,
        targetId: replyId,
        targetType: 'reply',
        discussionId,
        reason: '',
        createdAt: serverTimestamp(),
      });
      setReportedIds((prev) => new Set(prev).add(replyId));
    } catch (err) {
      console.error('通報エラー:', err);
    }
  };

  const handleDelete = async (replyId: string) => {
    try {
      await deleteDoc(doc(db, 'discussions', discussionId, 'replies', replyId));
      await updateDoc(doc(db, 'discussions', discussionId), {
        replyCount: increment(-1),
      });
      onReplyDeleted();
    } catch (err) {
      console.error('返信削除エラー:', err);
    }
  };

  if (replies.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        まだ返信はありません
      </Typography>
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      {replies.map((reply, index) => (
        <Box key={reply.id}>
          {index > 0 && <Divider sx={{ my: 1.5 }} />}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
              <UserAvatar
                userId={reply.userId}
                avatarUrl={reply.userAvatarUrl}
                userName={reply.userName}
                size={32}
                sx={{ mt: 0.5 }}
              />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                  <Typography variant="subtitle2">{reply.userName}</Typography>
                  {reply.userRating != null && (
                    <Chip
                      label={`Rt.${reply.userRating}`}
                      size="small"
                      color="primary"
                      sx={{ fontSize: 10, height: 18 }}
                    />
                  )}
                  {reply.userBarrelName && (
                    <Chip
                      label={reply.userBarrelName}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: 10, height: 18 }}
                    />
                  )}
                </Box>
                <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
                  {reply.text}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {reply.createdAt?.toDate?.()?.toLocaleDateString('ja-JP') || ''}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {session?.user?.id && session.user.id !== reply.userId && (
                <Tooltip title={reportedIds.has(reply.id!) ? '通報済み' : '通報する'}>
                  <span>
                    <IconButton
                      size="small"
                      onClick={() => handleReport(reply.id!)}
                      disabled={reportedIds.has(reply.id!)}
                      aria-label="通報する"
                    >
                      <FlagIcon
                        fontSize="small"
                        color={reportedIds.has(reply.id!) ? 'disabled' : 'action'}
                      />
                    </IconButton>
                  </span>
                </Tooltip>
              )}
              {(session?.user?.id === reply.userId || isAdmin) && (
                <IconButton
                  size="small"
                  onClick={() => handleDelete(reply.id!)}
                  aria-label="返信を削除"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
          </Box>
        </Box>
      ))}
    </Box>
  );
}
