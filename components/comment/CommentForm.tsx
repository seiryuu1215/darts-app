'use client';

import { useState } from 'react';
import { TextField, Button, Box } from '@mui/material';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useSession } from 'next-auth/react';

interface CommentFormProps {
  dartId: string;
  onCommentAdded: () => void;
}

export default function CommentForm({ dartId, onCommentAdded }: CommentFormProps) {
  const { data: session } = useSession();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  if (!session) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);

    try {
      await addDoc(collection(db, 'darts', dartId, 'comments'), {
        userId: session.user?.id,
        userName: session.user?.name || 'Anonymous',
        text: text.trim(),
        createdAt: serverTimestamp(),
      });
      setText('');
      onCommentAdded();
    } catch (err) {
      console.error('コメント投稿エラー:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', gap: 1, mt: 2 }}>
      <TextField
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="コメントを入力..."
        size="small"
        fullWidth
      />
      <Button type="submit" variant="contained" disabled={loading || !text.trim()}>
        投稿
      </Button>
    </Box>
  );
}
