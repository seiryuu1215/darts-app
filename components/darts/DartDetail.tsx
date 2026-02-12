'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Chip,
  Button,
  Paper,
  ImageList,
  ImageListItem,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  TextField,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import {
  doc,
  deleteDoc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  orderBy,
  query,
  updateDoc,
  increment,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Dart, Comment, Memo } from '@/types';
import { addDoc } from 'firebase/firestore';
import CommentList from '@/components/comment/CommentList';
import CommentForm from '@/components/comment/CommentForm';
import UserAvatar from '@/components/UserAvatar';
import { calcDartTotals, hasCompleteSpecs } from '@/lib/calc-totals';
import StraightenIcon from '@mui/icons-material/Straighten';
import SearchIcon from '@mui/icons-material/Search';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { getShopLinks } from '@/lib/affiliate';

interface DartDetailProps {
  dart: Dart;
  dartId: string;
}

export default function DartDetail({ dart, dartId }: DartDetailProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState(dart.likeCount || 0);
  const [isActiveDart, setIsActiveDart] = useState(false);
  const [memos, setMemos] = useState<Memo[]>([]);
  const [newMemoText, setNewMemoText] = useState('');
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [historyMemo, setHistoryMemo] = useState('');
  const [historyLoading, setHistoryLoading] = useState(false);
  const isOwner = session?.user?.id === dart.userId;
  const activeField = dart.tip.type === 'soft' ? 'activeSoftDartId' : 'activeSteelDartId';

  const fetchComments = useCallback(async () => {
    try {
      const q = query(
        collection(db, 'darts', dartId, 'comments'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      setComments(
        snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Comment[]
      );
    } catch (err) {
      console.error('コメント取得エラー:', err);
    }
  }, [dartId]);

  const fetchMemos = useCallback(async () => {
    if (!session?.user?.id || !isOwner) return;
    try {
      const q = query(
        collection(db, 'darts', dartId, 'memos'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      setMemos(
        snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((m) => (m as Memo).userId === session.user.id) as Memo[]
      );
    } catch (err) {
      console.error('メモ取得エラー:', err);
    }
  }, [dartId, session, isOwner]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  useEffect(() => {
    fetchMemos();
  }, [fetchMemos]);

  useEffect(() => {
    if (!session?.user?.id) return;
    const checkStatus = async () => {
      const likeDoc = await getDoc(doc(db, 'users', session.user.id, 'likes', dartId));
      setLiked(likeDoc.exists());
      const bmDoc = await getDoc(doc(db, 'users', session.user.id, 'bookmarks', dartId));
      setBookmarked(bmDoc.exists());
      if (isOwner) {
        const userDoc = await getDoc(doc(db, 'users', session.user.id));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setIsActiveDart(data?.[activeField] === dartId);
        }
      }
    };
    checkStatus();
  }, [session, dartId, isOwner, activeField]);

  const handleLike = async () => {
    if (!session?.user?.id) return;
    const likeRef = doc(db, 'users', session.user.id, 'likes', dartId);
    const dartRef = doc(db, 'darts', dartId);
    if (liked) {
      await deleteDoc(likeRef);
      await updateDoc(dartRef, { likeCount: increment(-1) });
      setLikeCount((p) => p - 1);
    } else {
      await setDoc(likeRef, { dartId, createdAt: serverTimestamp() });
      await updateDoc(dartRef, { likeCount: increment(1) });
      setLikeCount((p) => p + 1);
    }
    setLiked(!liked);
  };

  const handleBookmark = async () => {
    if (!session?.user?.id) return;
    const bmRef = doc(db, 'users', session.user.id, 'bookmarks', dartId);
    if (bookmarked) {
      await deleteDoc(bmRef);
    } else {
      await setDoc(bmRef, { dartId, createdAt: serverTimestamp() });
    }
    setBookmarked(!bookmarked);
  };

  const handleToggleActive = async () => {
    if (!session?.user?.id || !isOwner) return;
    if (isActiveDart) {
      // 使用中を解除 → 現在の履歴エントリを閉じる
      const histRef = collection(db, 'users', session.user.id, 'settingHistory');
      const q = query(histRef, orderBy('startedAt', 'desc'));
      const snap = await getDocs(q);
      const current = snap.docs.find(
        (d) => d.data().dartId === dartId && d.data().endedAt === null
      );
      if (current) {
        await updateDoc(doc(db, 'users', session.user.id, 'settingHistory', current.id), {
          endedAt: serverTimestamp(),
        });
      }
      await setDoc(doc(db, 'users', session.user.id), { [activeField]: null }, { merge: true });
      setIsActiveDart(false);
    } else {
      // 使用中にする → ダイアログを開く
      setHistoryMemo('');
      setHistoryDialogOpen(true);
    }
  };

  const handleConfirmActivate = async () => {
    if (!session?.user?.id) return;
    setHistoryLoading(true);
    try {
      const userId = session.user.id;
      const userRef = doc(db, 'users', userId);
      const histRef = collection(db, 'users', userId, 'settingHistory');

      // 現在のアクティブダーツを取得
      const userDoc = await getDoc(userRef);
      const currentActiveId = userDoc.data()?.[activeField] as string | null;

      let changeType: 'initial' | 'barrel' | 'minor' = 'initial';
      const changedParts: string[] = [];
      let prevDart: Dart | null = null;

      if (currentActiveId) {
        // 前のアクティブダーツの履歴を閉じる
        const q = query(histRef, orderBy('startedAt', 'desc'));
        const snap = await getDocs(q);
        const currentEntry = snap.docs.find(
          (d) => d.data().dartId === currentActiveId && d.data().endedAt === null
        );
        if (currentEntry) {
          await updateDoc(doc(db, 'users', userId, 'settingHistory', currentEntry.id), {
            endedAt: serverTimestamp(),
          });
        }

        // 差分検出
        const prevDartDoc = await getDoc(doc(db, 'darts', currentActiveId));
        if (prevDartDoc.exists()) {
          prevDart = prevDartDoc.data() as Dart;
          if (prevDart.barrel.name !== dart.barrel.name || prevDart.barrel.brand !== dart.barrel.brand) {
            changeType = 'barrel';
            changedParts.push('バレル');
          } else {
            changeType = 'minor';
          }
          if (prevDart.tip.name !== dart.tip.name) changedParts.push('チップ');
          if (prevDart.shaft.name !== dart.shaft.name) changedParts.push('シャフト');
          if (prevDart.flight.name !== dart.flight.name) changedParts.push('フライト');
        }
      }

      // 新しい履歴エントリ作成
      await addDoc(histRef, {
        dartId,
        dartType: dart.tip.type,
        dartTitle: dart.title,
        barrel: dart.barrel,
        tip: dart.tip,
        shaft: dart.shaft,
        flight: dart.flight,
        imageUrl: dart.imageUrls[0] || null,
        startedAt: serverTimestamp(),
        endedAt: null,
        changeType,
        changedParts,
        memo: historyMemo.trim(),
        createdAt: serverTimestamp(),
      });

      // アクティブダーツを更新
      await setDoc(userRef, { [activeField]: dartId }, { merge: true });
      setIsActiveDart(true);
      setHistoryDialogOpen(false);
    } catch (err) {
      console.error('履歴記録エラー:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleAddMemo = async () => {
    if (!session?.user?.id || !newMemoText.trim()) return;
    await addDoc(collection(db, 'darts', dartId, 'memos'), {
      userId: session.user.id,
      text: newMemoText.trim(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    setNewMemoText('');
    fetchMemos();
  };

  const handleDeleteMemo = async (memoId: string) => {
    await deleteDoc(doc(db, 'darts', dartId, 'memos', memoId));
    fetchMemos();
  };

  const handleDelete = async () => {
    try {
      await deleteDoc(doc(db, 'darts', dartId));
      router.push('/');
    } catch (err) {
      console.error('削除エラー:', err);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <UserAvatar userId={dart.userId} avatarUrl={dart.userAvatarUrl} userName={dart.userName} size={36} />
          <Typography variant="subtitle1">{dart.userName || '匿名'}</Typography>
        </Box>
        {isOwner && (
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button variant="outlined" size="small" startIcon={<EditIcon />} component={Link} href={`/darts/${dartId}/edit`}>
              編集
            </Button>
            <Button variant="outlined" size="small" color="error" startIcon={<DeleteIcon />} onClick={() => setDeleteOpen(true)}>
              削除
            </Button>
            <Button
              variant={isActiveDart ? 'contained' : 'outlined'}
              size="small"
              color={isActiveDart ? 'success' : 'primary'}
              startIcon={isActiveDart ? <CheckCircleIcon /> : <RadioButtonUncheckedIcon />}
              onClick={handleToggleActive}
            >
              {isActiveDart
                ? `${dart.tip.type === 'soft' ? 'ソフト' : 'スティール'}使用中 ✓`
                : `${dart.tip.type === 'soft' ? 'ソフト' : 'スティール'}で使用中にする`}
            </Button>
            {/* バレル比較はチップ・シャフト・フライトの数値が全て揃っている場合のみ表示 */}
            {hasCompleteSpecs(dart) && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<CompareArrowsIcon />}
                component={Link}
                href={`/darts/compare?left=${dartId}`}
              >
                セッティング比較
              </Button>
            )}
          </Box>
        )}
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Typography variant="h4">
          {dart.title}
        </Typography>
        {dart.isDraft && (
          <Chip label="ドラフト" size="small" color="warning" />
        )}
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <IconButton onClick={handleLike} color={liked ? 'error' : 'default'} disabled={!session}>
          {liked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
        </IconButton>
        <Typography variant="body2">{likeCount}</Typography>
        <IconButton onClick={handleBookmark} color={bookmarked ? 'primary' : 'default'} disabled={!session}>
          {bookmarked ? <BookmarkIcon /> : <BookmarkBorderIcon />}
        </IconButton>
      </Box>

      {dart.imageUrls.length > 0 && (
        <ImageList cols={dart.imageUrls.length > 1 ? 2 : 1} gap={8} sx={{ mb: 2, maxWidth: 500, mx: 'auto', mt: 0 }}>
          {dart.imageUrls.map((url, i) => (
            <ImageListItem key={i}>
              <img src={url} alt={`${dart.title} - ${i + 1}`} style={{ borderRadius: 8, maxHeight: 240, objectFit: 'cover' }} />
            </ImageListItem>
          ))}
        </ImageList>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>セットアップ</Typography>

        {/* セッティング込みトータル（全パーツのスペックが揃っている場合のみ） */}
        {(() => {
          if (!hasCompleteSpecs(dart)) return null;
          const totals = calcDartTotals(dart);
          return (totals.totalLength || totals.totalWeight) ? (
            <Box sx={{ mb: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>セッティング込み</Typography>
              <Typography variant="h5" color="primary">
                {[
                  totals.totalLength && `${totals.totalLength.toFixed(1)}mm`,
                  totals.totalWeight && `${totals.totalWeight.toFixed(1)}g`,
                ].filter(Boolean).join(' / ')}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                ({[
                  totals.totalLength && `${dart.tip.type === 'steel' ? 'ポイント' : 'チップ'}${dart.tip.lengthMm || 0} + バレル${dart.barrel.length || 0} + シャフト${(() => {
                    if (dart.flight.isCondorAxe) return dart.flight.condorAxeShaftLengthMm || 0;
                    return dart.shaft.lengthMm || 0;
                  })()}mm`,
                  totals.totalWeight && (dart.tip.type === 'steel'
                    ? `バレル（ポイント込み）${dart.barrel.weight || 0} + シャフト${dart.shaft.weightG || 0} + フライト${dart.flight.weightG || 0}g`
                    : `チップ${dart.tip.weightG || 0} + バレル${dart.barrel.weight || 0} + シャフト${dart.shaft.weightG || 0} + フライト${dart.flight.weightG || 0}g`),
                ].filter(Boolean).join(' | ')})
              </Typography>
            </Box>
          ) : null;
        })()}

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">バレル</Typography>
          <Typography>{dart.barrel.brand} {dart.barrel.name} ({dart.barrel.weight}g)</Typography>
          {(dart.barrel.maxDiameter || dart.barrel.length || dart.barrel.cut) && (
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
              {dart.barrel.maxDiameter && <Chip label={`最大径 ${dart.barrel.maxDiameter}mm`} size="small" variant="outlined" />}
              {dart.barrel.length && <Chip label={`全長 ${dart.barrel.length}mm`} size="small" variant="outlined" />}
              {dart.barrel.cut && dart.barrel.cut.split(/[,+＋]/).filter(Boolean).map((c) => (
                <Chip key={c.trim()} label={c.trim()} size="small" variant="outlined" />
              ))}
            </Box>
          )}
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">{dart.tip.type === 'steel' ? 'ポイント' : 'チップ'}</Typography>
          <Typography component="div">
            {dart.tip.name}
            <Chip label={dart.tip.type === 'soft' ? 'ソフト' : 'スティール'} size="small" sx={{ ml: 1 }} />
          </Typography>
          {(dart.tip.lengthMm || dart.tip.weightG) && (
            <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
              {dart.tip.lengthMm && <Chip label={`${dart.tip.lengthMm}mm`} size="small" variant="outlined" />}
              {dart.tip.weightG && <Chip label={`${dart.tip.weightG}g`} size="small" variant="outlined" />}
            </Box>
          )}
        </Box>

        {dart.flight.isCondorAxe ? (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">シャフト & フライト（CONDOR AXE一体型）</Typography>
            <Typography component="div">{dart.flight.name}</Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
              {dart.flight.condorAxeShaftLengthMm && <Chip label={`シャフト長 ${dart.flight.condorAxeShaftLengthMm}mm`} size="small" variant="outlined" />}
              {dart.flight.weightG && <Chip label={`${dart.flight.weightG}g`} size="small" variant="outlined" />}
              <Chip label="一体型" size="small" color="info" />
            </Box>
          </Box>
        ) : (
          <>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">シャフト</Typography>
              <Typography component="div">{dart.shaft.name}</Typography>
              {(dart.shaft.lengthMm || dart.shaft.weightG) && (
                <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                  {dart.shaft.lengthMm && <Chip label={`${dart.shaft.lengthMm}mm`} size="small" variant="outlined" />}
                  {dart.shaft.weightG && <Chip label={`${dart.shaft.weightG}g`} size="small" variant="outlined" />}
                </Box>
              )}
            </Box>

            <Box>
              <Typography variant="subtitle2" color="text.secondary">フライト</Typography>
              <Typography component="div">
                {dart.flight.name}
                {dart.flight.shape && (
                  <Chip
                    label={
                      dart.flight.shape === 'standard' ? 'スタンダード' :
                      dart.flight.shape === 'slim' ? 'スリム' :
                      dart.flight.shape === 'kite' ? 'シェイプ' :
                      dart.flight.shape === 'small' ? 'スモール' : 'ティアドロップ'
                    }
                    size="small"
                    sx={{ ml: 1 }}
                  />
                )}
              </Typography>
              {dart.flight.weightG && (
                <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                  <Chip label={`${dart.flight.weightG}g`} size="small" variant="outlined" />
                </Box>
              )}
            </Box>
          </>
        )}
      </Paper>

      {/* このバレルを探す */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
          <ShoppingCartIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'text-bottom' }} />
          このバレルを探す
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {(() => {
            const barrelProduct = {
              id: dart.sourceBarrelId || '',
              name: dart.barrel.name,
              brand: dart.barrel.brand,
              weight: dart.barrel.weight,
              maxDiameter: dart.barrel.maxDiameter,
              length: dart.barrel.length,
              cut: dart.barrel.cut,
              imageUrl: null,
              productUrl: `https://www.dartshive.jp/`,
              source: 'dartshive' as const,
              scrapedAt: dart.createdAt,
            };
            return getShopLinks(barrelProduct).map((link) => (
              <Button
                key={link.shop}
                size="small"
                variant="outlined"
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {link.label}
              </Button>
            ));
          })()}
          <Button
            size="small"
            variant="outlined"
            startIcon={<StraightenIcon />}
            component={Link}
            href={`/barrels/simulator?barrel=${encodeURIComponent(dart.barrel.name)}`}
          >
            シミュレーター
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<SearchIcon />}
            component={Link}
            href="/barrels/recommend"
          >
            似たバレル
          </Button>
        </Box>
      </Paper>

      {dart.description && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>説明</Typography>
          <Typography whiteSpace="pre-wrap">{dart.description}</Typography>
        </Paper>
      )}

      {isOwner && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>メモ</Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="練習メモや課題を記録..."
              value={newMemoText}
              onChange={(e) => setNewMemoText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAddMemo();
                }
              }}
            />
            <Button variant="contained" onClick={handleAddMemo} disabled={!newMemoText.trim()}>
              追加
            </Button>
          </Box>
          {memos.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              メモはまだありません
            </Typography>
          ) : (
            memos.map((memo) => (
              <Box
                key={memo.id}
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  py: 1,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Box>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{memo.text}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {memo.createdAt?.toDate?.().toLocaleString('ja-JP') || ''}
                  </Typography>
                </Box>
                <IconButton size="small" onClick={() => handleDeleteMemo(memo.id!)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            ))
          )}
        </Paper>
      )}

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6">コメント ({comments.length})</Typography>
        <CommentForm dartId={dartId} onCommentAdded={fetchComments} />
        <CommentList dartId={dartId} comments={comments} onCommentDeleted={fetchComments} />
      </Paper>

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>削除の確認</DialogTitle>
        <DialogContent>
          <DialogContentText>
            「{dart.title}」を削除しますか？この操作は取り消せません。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>キャンセル</Button>
          <Button onClick={handleDelete} color="error">削除</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={historyDialogOpen} onClose={() => !historyLoading && setHistoryDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>セッティング変更を記録</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            「{dart.title}」を使用中にします。変更理由を記録できます（任意）。
          </DialogContentText>
          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={2}
            placeholder="変更理由（例: もう少し重めにしたかった）"
            value={historyMemo}
            onChange={(e) => setHistoryMemo(e.target.value)}
            disabled={historyLoading}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryDialogOpen(false)} disabled={historyLoading}>キャンセル</Button>
          <Button onClick={handleConfirmActivate} variant="contained" disabled={historyLoading}>
            {historyLoading ? '記録中...' : '確定'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
