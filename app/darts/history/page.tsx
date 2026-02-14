'use client';

import { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Chip,
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import Link from 'next/link';
import { collection, getDocs, orderBy, query, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import type { SettingHistory } from '@/types';

function formatDate(ts: { toDate?: () => Date } | null) {
  if (!ts?.toDate) return '';
  return ts
    .toDate()
    .toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function calcDays(startTs: { toDate?: () => Date } | null, endTs: { toDate?: () => Date } | null) {
  if (!startTs?.toDate) return null;
  const start = startTs.toDate().getTime();
  const end = endTs?.toDate ? endTs.toDate().getTime() : Date.now();
  return Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
}

const PART_LABELS: Record<string, string> = {
  バレル: 'バレル変更',
  チップ: 'チップ変更',
  シャフト: 'シャフト変更',
  フライト: 'フライト変更',
};

export default function SettingHistoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [history, setHistory] = useState<SettingHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [dartType, setDartType] = useState<'soft' | 'steel'>('soft');
  const [editEntry, setEditEntry] = useState<SettingHistory | null>(null);
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editIsCurrent, setEditIsCurrent] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    if (!session?.user?.id) return;
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'users', session.user.id, 'settingHistory'),
          orderBy('startedAt', 'desc'),
        );
        const snap = await getDocs(q);
        setHistory(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as SettingHistory[]);
      } catch (err) {
        console.error('履歴取得エラー:', err);
        setFetchError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [session]);

  const openEditDialog = (entry: SettingHistory) => {
    const startTs = entry.startedAt as { toDate?: () => Date } | null;
    const endTs = entry.endedAt as { toDate?: () => Date } | null;
    setEditEntry(entry);
    setEditStartDate(startTs?.toDate ? startTs.toDate().toISOString().slice(0, 10) : '');
    setEditEndDate(endTs?.toDate ? endTs.toDate().toISOString().slice(0, 10) : '');
    setEditIsCurrent(entry.endedAt === null);
    setEditError('');
  };

  const handleSaveEdit = async () => {
    if (!session?.user?.id || !editEntry?.id) return;
    if (!editStartDate) {
      setEditError('開始日は必須です');
      return;
    }
    if (!editIsCurrent && editEndDate) {
      if (new Date(editEndDate) <= new Date(editStartDate)) {
        setEditError('終了日は開始日より後にしてください');
        return;
      }
    }
    setEditSaving(true);
    try {
      const ref = doc(db, 'users', session.user.id, 'settingHistory', editEntry.id);
      await updateDoc(ref, {
        startedAt: Timestamp.fromDate(new Date(editStartDate + 'T00:00:00')),
        endedAt: editIsCurrent
          ? null
          : editEndDate
            ? Timestamp.fromDate(new Date(editEndDate + 'T00:00:00'))
            : null,
      });
      // ローカルステートを更新
      setHistory((prev) =>
        prev.map((h) =>
          h.id === editEntry.id
            ? {
                ...h,
                startedAt: Timestamp.fromDate(new Date(editStartDate + 'T00:00:00')),
                endedAt: editIsCurrent
                  ? null
                  : editEndDate
                    ? Timestamp.fromDate(new Date(editEndDate + 'T00:00:00'))
                    : null,
              }
            : h,
        ),
      );
      setEditEntry(null);
    } catch (err) {
      console.error('期間更新エラー:', err);
      setEditError('保存に失敗しました');
    } finally {
      setEditSaving(false);
    }
  };

  if (status === 'loading') return null;
  if (!session) return null;

  const filtered = history.filter((h) => h.dartType === dartType);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Breadcrumbs items={[{ label: 'セッティング', href: '/darts' }, { label: '履歴' }]} />
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
        セッティング履歴
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        使用中セッティングの変更履歴を時系列で表示します。
      </Typography>

      {fetchError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          履歴の取得に失敗しました
        </Alert>
      )}

      <ToggleButtonGroup
        value={dartType}
        exclusive
        onChange={(_, v) => {
          if (v) setDartType(v);
        }}
        size="small"
        sx={{ mb: 3 }}
      >
        <ToggleButton value="soft">ソフト</ToggleButton>
        <ToggleButton value="steel">スティール</ToggleButton>
      </ToggleButtonGroup>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : filtered.length === 0 ? (
        <Paper
          sx={{
            textAlign: 'center',
            py: 6,
            px: 2,
            bgcolor: 'background.default',
            border: '1px dashed',
            borderColor: 'divider',
          }}
        >
          <Typography color="text.secondary">
            履歴がありません。セッティングを「使用中にする」と自動的に記録されます。
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ position: 'relative' }}>
          {filtered.map((entry, index) => {
            const isBarrelChange = entry.changeType === 'barrel';
            const isInitial = entry.changeType === 'initial';
            const isCurrent = entry.endedAt === null;
            const days = calcDays(
              entry.startedAt as { toDate?: () => Date } | null,
              entry.endedAt as { toDate?: () => Date } | null,
            );
            const dotSize = isBarrelChange ? 14 : 8;
            const dotColor = isBarrelChange ? 'primary.main' : 'grey.500';

            return (
              <Box key={entry.id} sx={{ display: 'flex', gap: 2, position: 'relative' }}>
                {/* タイムラインコネクタ */}
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    width: 20,
                    flexShrink: 0,
                  }}
                >
                  <Box
                    sx={{
                      width: dotSize,
                      height: dotSize,
                      borderRadius: '50%',
                      bgcolor: isCurrent ? 'success.main' : dotColor,
                      mt: 2.5,
                      zIndex: 1,
                    }}
                  />
                  {index < filtered.length - 1 && (
                    <Box sx={{ width: 2, flexGrow: 1, bgcolor: 'divider' }} />
                  )}
                </Box>

                {/* カード */}
                <Paper
                  sx={{
                    flex: 1,
                    p: 2,
                    mb: 2,
                    borderLeft: 3,
                    borderColor: isBarrelChange
                      ? 'primary.main'
                      : isInitial
                        ? 'success.main'
                        : 'grey.400',
                    opacity: isCurrent ? 1 : 0.85,
                  }}
                >
                  {/* 期間 */}
                  <Box
                    sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(entry.startedAt as { toDate?: () => Date } | null)} 〜{' '}
                      {isCurrent
                        ? '現在'
                        : formatDate(entry.endedAt as { toDate?: () => Date } | null)}
                      {days && ` (${days}日間)`}
                    </Typography>
                    {isCurrent && <Chip label="使用中" size="small" color="success" />}
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.preventDefault();
                        openEditDialog(entry);
                      }}
                      sx={{ ml: 'auto' }}
                    >
                      <EditIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Box>

                  {/* 変更タイプチップ */}
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
                    {isInitial && (
                      <Chip label="使用開始" size="small" variant="outlined" color="success" />
                    )}
                    {isBarrelChange && <Chip label="バレル変更" size="small" color="primary" />}
                    {entry.changeType === 'minor' &&
                      entry.changedParts
                        .filter((p) => p !== 'バレル')
                        .map((p) => (
                          <Chip
                            key={p}
                            label={PART_LABELS[p] || p}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                  </Box>

                  {/* ダーツ情報 */}
                  <Box
                    component={Link}
                    href={`/darts/${entry.dartId}`}
                    sx={{ display: 'flex', gap: 1.5, textDecoration: 'none', color: 'inherit' }}
                  >
                    {entry.imageUrl && (
                      <Box
                        component="img"
                        src={entry.imageUrl}
                        alt={entry.dartTitle}
                        sx={{
                          width: isBarrelChange || isInitial ? 64 : 48,
                          height: isBarrelChange || isInitial ? 64 : 48,
                          objectFit: 'cover',
                          borderRadius: 1,
                          flexShrink: 0,
                        }}
                      />
                    )}
                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        variant={isBarrelChange || isInitial ? 'subtitle2' : 'caption'}
                        sx={{ fontWeight: 'bold' }}
                        noWrap
                      >
                        {entry.dartTitle}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap display="block">
                        {entry.barrel.brand} {entry.barrel.name} ({entry.barrel.weight}g)
                      </Typography>
                      {(isBarrelChange || isInitial) && entry.barrel.cut && (
                        <Typography variant="caption" color="text.secondary" noWrap display="block">
                          {entry.barrel.cut}
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  {/* メモ */}
                  {entry.memo && (
                    <Typography
                      variant="body2"
                      sx={{
                        mt: 1,
                        p: 1,
                        bgcolor: 'action.hover',
                        borderRadius: 1,
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {entry.memo}
                    </Typography>
                  )}
                </Paper>
              </Box>
            );
          })}
        </Box>
      )}
      {/* 期間編集ダイアログ */}
      <Dialog
        open={!!editEntry}
        onClose={() => !editSaving && setEditEntry(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>使用期間を編集</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="開始日"
              type="date"
              value={editStartDate}
              onChange={(e) => setEditStartDate(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              disabled={editSaving}
              required
            />
            <TextField
              label="終了日"
              type="date"
              value={editEndDate}
              onChange={(e) => setEditEndDate(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              disabled={editSaving || editIsCurrent}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={editIsCurrent}
                  onChange={(e) => {
                    setEditIsCurrent(e.target.checked);
                    if (e.target.checked) setEditEndDate('');
                  }}
                  disabled={editSaving}
                />
              }
              label="現在も使用中"
            />
            {editError && (
              <Typography variant="caption" color="error">
                {editError}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditEntry(null)} disabled={editSaving}>
            キャンセル
          </Button>
          <Button onClick={handleSaveEdit} variant="contained" disabled={editSaving}>
            {editSaving ? '保存中...' : '保存'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
