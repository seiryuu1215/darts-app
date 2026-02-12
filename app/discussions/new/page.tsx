'use client';

import { Suspense, useState, useEffect } from 'react';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  MenuItem,
  Tabs,
  Tab,
  CircularProgress,
} from '@mui/material';
import { collection, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import MarkdownContent from '@/components/articles/MarkdownContent';
import { canCreateDiscussion } from '@/lib/permissions';
import { DISCUSSION_CATEGORIES, CATEGORY_LABELS } from '@/types';
import type { DiscussionCategory } from '@/types';

function NewDiscussionContent() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<DiscussionCategory>('general');
  const [content, setContent] = useState('');
  const [previewTab, setPreviewTab] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [userBarrelName, setUserBarrelName] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user?.id) return;
    const uid = session.user.id;

    // Rt を取得
    getDoc(doc(db, 'users', uid))
      .then((snap) => {
        if (!snap.exists()) return;
        const data = snap.data();
        // dlStats.rating or statsHistory の最新
        if (data.dlStats?.rating) {
          setUserRating(data.dlStats.rating);
        }
        // activeSoftDartId からバレル名を取得
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

  if (status === 'loading') return null;
  if (!canCreateDiscussion(session?.user?.role)) {
    router.replace('/discussions');
    return null;
  }

  const handleSubmit = async () => {
    if (!session?.user?.id) return;
    if (!title.trim()) {
      setError('タイトルは必須です');
      return;
    }
    if (!content.trim()) {
      setError('本文は必須です');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const discussionId = doc(collection(db, 'discussions')).id;
      await setDoc(doc(db, 'discussions', discussionId), {
        title: title.trim(),
        content,
        category,
        userId: session.user.id,
        userName: session.user.name || '',
        userAvatarUrl: session.user.image || null,
        userRating,
        userBarrelName,
        isPinned: false,
        isLocked: false,
        replyCount: 0,
        lastRepliedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      router.push(`/discussions/${discussionId}`);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('保存に失敗しました');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Breadcrumbs
        items={[{ label: 'ディスカッション', href: '/discussions' }, { label: '新規スレッド' }]}
      />
      <Typography variant="h4" sx={{ mb: 3 }}>
        新規スレッド
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TextField
        label="タイトル"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        fullWidth
        required
        sx={{ mb: 2 }}
      />

      <TextField
        label="カテゴリ"
        value={category}
        onChange={(e) => setCategory(e.target.value as DiscussionCategory)}
        select
        fullWidth
        sx={{ mb: 2 }}
      >
        {DISCUSSION_CATEGORIES.map((cat) => (
          <MenuItem key={cat} value={cat}>
            {CATEGORY_LABELS[cat]}
          </MenuItem>
        ))}
      </TextField>

      <Box sx={{ mb: 2 }}>
        <Tabs value={previewTab} onChange={(_, v) => setPreviewTab(v)}>
          <Tab label="編集" />
          <Tab label="プレビュー" />
        </Tabs>
      </Box>

      {previewTab === 0 ? (
        <TextField
          label="本文（マークダウン）"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          fullWidth
          multiline
          minRows={10}
          sx={{ mb: 3, '& .MuiInputBase-root': { fontFamily: 'monospace' } }}
        />
      ) : (
        <Box
          sx={{
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            p: 3,
            mb: 3,
            minHeight: 200,
          }}
        >
          {content ? (
            <MarkdownContent content={content} />
          ) : (
            <Typography color="text.secondary">プレビューする内容がありません</Typography>
          )}
        </Box>
      )}

      {(userRating != null || userBarrelName) && (
        <Alert severity="info" sx={{ mb: 2 }}>
          投稿時に自動付与: {userRating != null && `Rt.${userRating}`}
          {userRating != null && userBarrelName && ' / '}
          {userBarrelName && `使用バレル: ${userBarrelName}`}
        </Alert>
      )}

      <Button variant="contained" onClick={handleSubmit} disabled={loading} size="large">
        {loading ? '投稿中...' : '投稿する'}
      </Button>
    </Container>
  );
}

export default function NewDiscussionPage() {
  return (
    <Suspense
      fallback={
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      }
    >
      <NewDiscussionContent />
    </Suspense>
  );
}
