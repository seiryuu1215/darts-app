'use client';

import { useState, useEffect } from 'react';
import { TextField, Button, Box } from '@mui/material';
import {
  collection,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  increment,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useSession } from 'next-auth/react';

interface ReplyFormProps {
  discussionId: string;
  onReplyAdded: () => void;
}

export default function ReplyForm({ discussionId, onReplyAdded }: ReplyFormProps) {
  const { data: session } = useSession();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [userBarrelName, setUserBarrelName] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user?.id) return;
    const uid = session.user.id;

    getDoc(doc(db, 'users', uid))
      .then((snap) => {
        if (!snap.exists()) return;
        const data = snap.data();
        if (data.dlStats?.rating) {
          setUserRating(data.dlStats.rating);
        }
        const dartId = data.activeSoftDartId;
        if (dartId) {
          getDoc(doc(db, 'darts', dartId))
            .then((dartSnap) => {
              if (dartSnap.exists()) {
                const dart = dartSnap.data();
                setUserBarrelName(dart.barrel?.name || dart.title || null);
              }
            })
            .catch(() => {});
        }
      })
      .catch(() => {});
  }, [session?.user?.id]);

  if (!session) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !session.user?.id) return;
    setLoading(true);

    try {
      await addDoc(collection(db, 'discussions', discussionId, 'replies'), {
        userId: session.user.id,
        userName: session.user.name || '',
        userAvatarUrl: session.user.image || null,
        userRating,
        userBarrelName,
        text: text.trim(),
        createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db, 'discussions', discussionId), {
        replyCount: increment(1),
        lastRepliedAt: serverTimestamp(),
      });
      setText('');
      onReplyAdded();
    } catch (err) {
      console.error('返信投稿エラー:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
      <TextField
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="返信を入力..."
        fullWidth
        multiline
        minRows={3}
        sx={{ mb: 1 }}
      />
      <Button type="submit" variant="contained" disabled={loading || !text.trim()}>
        {loading ? '投稿中...' : '返信する'}
      </Button>
    </Box>
  );
}
