'use client';

import { Box, Typography, IconButton, Divider } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useSession } from 'next-auth/react';
import type { Comment } from '@/types';
import UserAvatar from '@/components/UserAvatar';

interface CommentListProps {
  dartId: string;
  comments: Comment[];
  onCommentDeleted: () => void;
}

export default function CommentList({ dartId, comments, onCommentDeleted }: CommentListProps) {
  const { data: session } = useSession();

  const handleDelete = async (commentId: string) => {
    try {
      await deleteDoc(doc(db, 'darts', dartId, 'comments', commentId));
      onCommentDeleted();
    } catch (err) {
      console.error('コメント削除エラー:', err);
    }
  };

  if (comments.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        コメントはまだありません
      </Typography>
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      {comments.map((comment, index) => (
        <Box key={comment.id}>
          {index > 0 && <Divider sx={{ my: 1 }} />}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
              <UserAvatar
                userId={comment.userId}
                avatarUrl={comment.userAvatarUrl}
                userName={comment.userName}
                size={28}
                sx={{ mt: 0.5 }}
              />
              <Box>
                <Typography variant="subtitle2">{comment.userName}</Typography>
                <Typography variant="body2">{comment.text}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {comment.createdAt?.toDate?.()?.toLocaleDateString('ja-JP') || ''}
                </Typography>
              </Box>
            </Box>
            {session?.user?.id === comment.userId && (
              <IconButton size="small" onClick={() => handleDelete(comment.id!)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        </Box>
      ))}
    </Box>
  );
}
