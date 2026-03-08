'use client';

import { useState } from 'react';
import { Typography, Button, Paper, CircularProgress } from '@mui/material';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import ConfirmDialog from './ConfirmDialog';

interface AccountDeleteSectionProps {
  onError: (msg: string) => void;
}

export default function AccountDeleteSection({ onError }: AccountDeleteSectionProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    setConfirmOpen(false);
    try {
      const res = await fetch('/api/account/delete', { method: 'DELETE' });
      if (res.ok) {
        await signOut({ redirect: false });
        router.push('/login');
      } else {
        const json = await res.json();
        onError(json.error || 'アカウント削除に失敗しました');
      }
    } catch {
      onError('通信エラー');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Paper
        variant="outlined"
        sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 2, borderColor: 'error.main' }}
      >
        <Typography variant="h6" color="error" sx={{ mb: 1 }}>
          アカウント削除
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          アカウントを削除すると、全てのデータ（セッティング・スタッツ履歴・投稿・サブスクリプション等）が完全に削除され、復元できません。
        </Typography>
        <Button
          variant="contained"
          color="error"
          disabled={deleting}
          startIcon={deleting ? <CircularProgress size={16} color="inherit" /> : undefined}
          onClick={() => setConfirmOpen(true)}
        >
          {deleting ? '削除中...' : 'アカウントを削除する'}
        </Button>
      </Paper>

      <ConfirmDialog
        open={confirmOpen}
        title="アカウント削除の確認"
        message="アカウントを削除しますか？全てのデータが完全に削除されます。この操作は取り消せません。"
        confirmLabel="削除する"
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
