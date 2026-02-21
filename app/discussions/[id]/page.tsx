'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Typography,
  Box,
  CircularProgress,
  Chip,
  Paper,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import PushPinIcon from '@mui/icons-material/PushPin';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import DeleteIcon from '@mui/icons-material/Delete';
import FlagIcon from '@mui/icons-material/Flag';
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import TwoColumnLayout from '@/components/layout/TwoColumnLayout';
import Sidebar from '@/components/layout/Sidebar';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import MarkdownContent from '@/components/articles/MarkdownContent';
import UserAvatar from '@/components/UserAvatar';
import ReplyForm from '@/components/discussions/ReplyForm';
import ReplyList from '@/components/discussions/ReplyList';
import { CATEGORY_LABELS } from '@/types';
import type { Discussion, DiscussionReply } from '@/types';
import {
  canEditDiscussion,
  canReplyDiscussion,
  canPinDiscussion,
  canLockDiscussion,
} from '@/lib/permissions';

export default function DiscussionDetailPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const discussionId = params.id as string;

  const [discussion, setDiscussion] = useState<Discussion | null>(null);
  const [replies, setReplies] = useState<DiscussionReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reported, setReported] = useState(false);

  const role = session?.user?.role;
  const userId = session?.user?.id;

  const fetchDiscussion = useCallback(async () => {
    try {
      const snap = await getDoc(doc(db, 'discussions', discussionId));
      if (!snap.exists()) {
        setError('スレッドが見つかりません');
        setLoading(false);
        return;
      }
      setDiscussion({ id: snap.id, ...snap.data() } as Discussion);
    } catch {
      setError('読み込みに失敗しました');
    }
  }, [discussionId]);

  const fetchReplies = useCallback(async () => {
    try {
      const q = query(
        collection(db, 'discussions', discussionId, 'replies'),
        orderBy('createdAt', 'asc'),
      );
      const snap = await getDocs(q);
      setReplies(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as DiscussionReply));
    } catch {
      console.error('返信取得エラー');
    }
  }, [discussionId]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      await Promise.all([fetchDiscussion(), fetchReplies()]);
      if (!cancelled) setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [fetchDiscussion, fetchReplies]);

  const handleTogglePin = async () => {
    if (!discussion) return;
    await updateDoc(doc(db, 'discussions', discussionId), {
      isPinned: !discussion.isPinned,
    });
    setDiscussion((prev) => prev && { ...prev, isPinned: !prev.isPinned });
  };

  const handleToggleLock = async () => {
    if (!discussion) return;
    await updateDoc(doc(db, 'discussions', discussionId), {
      isLocked: !discussion.isLocked,
    });
    setDiscussion((prev) => prev && { ...prev, isLocked: !prev.isLocked });
  };

  const handleDelete = async () => {
    if (!confirm('このスレッドを削除しますか？')) return;
    try {
      // 返信も削除
      const repliesSnap = await getDocs(collection(db, 'discussions', discussionId, 'replies'));
      await Promise.all(
        repliesSnap.docs.map((d) =>
          deleteDoc(doc(db, 'discussions', discussionId, 'replies', d.id)),
        ),
      );
      await deleteDoc(doc(db, 'discussions', discussionId));
      router.push('/discussions');
    } catch {
      setError('削除に失敗しました');
    }
  };

  const handleReplyChange = () => {
    fetchReplies();
    fetchDiscussion();
  };

  const handleReport = async () => {
    if (!userId || !discussionId) return;
    if (!confirm('このスレッドを通報しますか？')) return;
    try {
      await addDoc(collection(db, 'reports'), {
        userId,
        targetId: discussionId,
        targetType: 'discussion',
        discussionId,
        reason: '',
        createdAt: serverTimestamp(),
      });
      setReported(true);
    } catch (err) {
      console.error('通報エラー:', err);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !discussion) {
    return (
      <Box sx={{ py: 8, textAlign: 'center' }}>
        <Alert severity="error" sx={{ maxWidth: 400, mx: 'auto' }}>
          {error || 'スレッドが見つかりません'}
        </Alert>
      </Box>
    );
  }

  const canEdit = userId ? canEditDiscussion(role, discussion.userId, userId) : false;
  const canReply = canReplyDiscussion(role) && !discussion.isLocked;
  const canPin = canPinDiscussion(role);
  const canLock = canLockDiscussion(role);

  return (
    <TwoColumnLayout sidebar={<Sidebar />}>
      <Breadcrumbs
        items={[{ label: 'ディスカッション', href: '/discussions' }, { label: discussion.title }]}
      />

      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          {discussion.isPinned && <PushPinIcon sx={{ fontSize: 20, color: 'warning.main' }} />}
          {discussion.isLocked && <LockIcon sx={{ fontSize: 20, color: 'text.secondary' }} />}
          <Typography variant="h4" sx={{ flex: 1 }}>
            {discussion.title}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            label={CATEGORY_LABELS[discussion.category]}
            size="small"
            color="primary"
            variant="outlined"
          />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <UserAvatar
              userId={discussion.userId}
              avatarUrl={discussion.userAvatarUrl}
              userName={discussion.userName}
              size={24}
            />
            <Typography variant="body2">{discussion.userName}</Typography>
          </Box>
          {discussion.userRating != null && (
            <Chip
              label={`Rt.${discussion.userRating}`}
              size="small"
              color="primary"
              sx={{ fontSize: 11, height: 22 }}
            />
          )}
          {discussion.userBarrelName && (
            <Chip
              label={discussion.userBarrelName}
              size="small"
              variant="outlined"
              sx={{ fontSize: 11, height: 22 }}
            />
          )}
          <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
            {discussion.createdAt?.toDate?.()?.toLocaleDateString('ja-JP') || ''}
          </Typography>
        </Box>
      </Box>

      {/* Admin / Author actions */}
      {(canEdit || canPin || canLock) && (
        <Box sx={{ display: 'flex', gap: 0.5, mb: 2 }}>
          {canPin && (
            <Tooltip title={discussion.isPinned ? 'ピン解除' : 'ピン留め'}>
              <IconButton
                size="small"
                onClick={handleTogglePin}
                color={discussion.isPinned ? 'warning' : 'default'}
              >
                <PushPinIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {canLock && (
            <Tooltip title={discussion.isLocked ? 'ロック解除' : 'ロック'}>
              <IconButton
                size="small"
                onClick={handleToggleLock}
                color={discussion.isLocked ? 'error' : 'default'}
              >
                {discussion.isLocked ? (
                  <LockOpenIcon fontSize="small" />
                ) : (
                  <LockIcon fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
          )}
          {canEdit && (
            <Tooltip title="削除">
              <IconButton size="small" onClick={handleDelete} color="error">
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      )}

      {/* Content */}
      <Paper variant="outlined" sx={{ p: 3, mb: 1 }}>
        <MarkdownContent content={discussion.content} />
      </Paper>
      {userId && userId !== discussion.userId && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Tooltip title={reported ? '通報済み' : '通報する'}>
            <span>
              <IconButton
                size="small"
                onClick={handleReport}
                disabled={reported}
                aria-label="通報する"
              >
                <FlagIcon fontSize="small" color={reported ? 'disabled' : 'action'} />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      )}

      {/* Replies */}
      <Typography variant="h6" sx={{ mb: 1 }}>
        返信 ({discussion.replyCount})
      </Typography>
      <ReplyList discussionId={discussionId} replies={replies} onReplyDeleted={handleReplyChange} />

      {discussion.isLocked && (
        <Alert severity="info" sx={{ mt: 2 }}>
          このスレッドはロックされています。新しい返信はできません。
        </Alert>
      )}

      {canReply && <ReplyForm discussionId={discussionId} onReplyAdded={handleReplyChange} />}
    </TwoColumnLayout>
  );
}
