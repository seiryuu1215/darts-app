'use client';

import { useState } from 'react';
import { TextField, Button, Box } from '@mui/material';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useSession } from 'next-auth/react';
import { useDemoGuard } from '@/hooks/useDemoGuard';

interface CommentFormProps {
  dartId: string;
  onCommentAdded: () => void;
}

export default function CommentForm({ dartId, onCommentAdded }: CommentFormProps) {
  const { data: session } = useSession();
  const { isDemo, guardedAction } = useDemoGuard();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  if (!session) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    guardedAction(doSubmit);
  };

  const doSubmit = async () => {
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
      console.error(err);
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
      <Button type="submit" variant="contained" disabled={loading || !text.trim() || isDemo}>
        投稿
      </Button>
    </Box>
  );
}
