'use client';

import { useState } from 'react';
import {
  Typography,
  Box,
  Button,
  Paper,
  TextField,
  Chip,
  IconButton,
  FormControlLabel,
  Switch,
  CircularProgress,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import ConfirmDialog from './ConfirmDialog';

interface LineLinkSectionProps {
  userId: string;
  lineUserId: string | null;
  lineNotifyEnabled: boolean;
  hasDlCredentials: boolean;
  onLineUserIdChange: (id: string | null) => void;
  onLineNotifyChange: (enabled: boolean) => void;
  onDlCredentialsChange: (has: boolean) => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export default function LineLinkSection({
  userId,
  lineUserId,
  lineNotifyEnabled,
  hasDlCredentials,
  onLineUserIdChange,
  onLineNotifyChange,
  onDlCredentialsChange,
  onSuccess,
  onError,
}: LineLinkSectionProps) {
  const [linkCode, setLinkCode] = useState('');
  const [linkLoading, setLinkLoading] = useState(false);
  const [unlinkLoading, setUnlinkLoading] = useState(false);
  const [dlEmail, setDlEmail] = useState('');
  const [dlPassword, setDlPassword] = useState('');
  const [dlSaving, setDlSaving] = useState(false);
  const [dlDeleting, setDlDeleting] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: 'deleteDl' | 'unlink' | null;
  }>({ open: false, action: null });

  const handleLinkCode = async () => {
    setLinkLoading(true);
    try {
      const res = await fetch('/api/line/link', { method: 'POST' });
      const json = await res.json();
      if (res.ok) setLinkCode(json.code);
      else onError(json.error || 'コード発行に失敗しました');
    } catch {
      onError('通信エラー');
    } finally {
      setLinkLoading(false);
    }
  };

  const handleSaveDlCredentials = async () => {
    setDlSaving(true);
    try {
      const res = await fetch('/api/line/save-dl-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: dlEmail, password: dlPassword }),
      });
      if (res.ok) {
        onDlCredentialsChange(true);
        setDlEmail('');
        setDlPassword('');
        onSuccess('DARTSLIVE認証情報を保存しました');
      } else {
        const json = await res.json();
        onError(json.error || '保存に失敗しました');
      }
    } catch {
      onError('通信エラー');
    } finally {
      setDlSaving(false);
    }
  };

  const handleDeleteDlCredentials = async () => {
    setDlDeleting(true);
    try {
      const res = await fetch('/api/line/save-dl-credentials', { method: 'DELETE' });
      if (res.ok) {
        onDlCredentialsChange(false);
        onSuccess('認証情報を削除しました');
      } else onError('削除に失敗しました');
    } catch {
      onError('通信エラー');
    } finally {
      setDlDeleting(false);
      setConfirmDialog({ open: false, action: null });
    }
  };

  const handleUnlink = async () => {
    setUnlinkLoading(true);
    try {
      const res = await fetch('/api/line/unlink', { method: 'POST' });
      if (res.ok) {
        onLineUserIdChange(null);
        onLineNotifyChange(false);
        onDlCredentialsChange(false);
        onSuccess('LINE連携を解除しました');
      } else {
        onError('連携解除に失敗しました');
      }
    } catch {
      onError('通信エラー');
    } finally {
      setUnlinkLoading(false);
      setConfirmDialog({ open: false, action: null });
    }
  };

  const handleConfirm = () => {
    if (confirmDialog.action === 'deleteDl') handleDeleteDlCredentials();
    else if (confirmDialog.action === 'unlink') handleUnlink();
  };

  return (
    <>
      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">LINE連携</Typography>
          {lineUserId && (
            <Chip icon={<CheckCircleIcon />} label="連携済み" color="success" size="small" />
          )}
        </Box>

        {!lineUserId ? (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
              毎朝DARTSLIVEのスタッツを自動チェックして、プレイがあればLINEに通知します。
            </Typography>

            <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
              <Chip
                label="1"
                size="small"
                sx={{ minWidth: 28, fontWeight: 'bold', bgcolor: 'primary.main', color: '#fff' }}
              />
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                  友だち追加
                </Typography>
                <Button
                  variant="contained"
                  size="small"
                  href="https://line.me/R/ti/p/@411qccwd"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    bgcolor: '#06c755',
                    '&:hover': { bgcolor: '#05b34c' },
                    textTransform: 'none',
                  }}
                >
                  LINE で友だち追加
                </Button>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
              <Chip
                label="2"
                size="small"
                sx={{
                  minWidth: 28,
                  fontWeight: 'bold',
                  bgcolor: linkCode ? 'primary.main' : 'action.disabledBackground',
                  color: linkCode ? '#fff' : 'text.secondary',
                }}
              />
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                  連携コードを発行
                </Typography>
                {linkCode ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography
                      variant="h5"
                      sx={{
                        fontFamily: 'monospace',
                        fontWeight: 'bold',
                        letterSpacing: '0.15em',
                        color: 'primary.main',
                      }}
                    >
                      {linkCode}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => {
                        navigator.clipboard.writeText(linkCode);
                        onSuccess('コードをコピーしました');
                      }}
                    >
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                    <Typography variant="caption" color="text.secondary">
                      10分間有効
                    </Typography>
                  </Box>
                ) : (
                  <Button
                    variant="outlined"
                    size="small"
                    disabled={linkLoading}
                    startIcon={linkLoading ? <CircularProgress size={16} /> : undefined}
                    onClick={handleLinkCode}
                  >
                    コードを発行
                  </Button>
                )}
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Chip
                label="3"
                size="small"
                sx={{
                  minWidth: 28,
                  fontWeight: 'bold',
                  bgcolor: 'action.disabledBackground',
                  color: 'text.secondary',
                }}
              />
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                  Botにコードを送信
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  発行した8桁のコードをLINE Botのトーク画面に送信すると連携完了です。
                </Typography>
              </Box>
            </Box>
          </>
        ) : (
          <>
            <FormControlLabel
              control={
                <Switch
                  checked={lineNotifyEnabled}
                  onChange={async (e) => {
                    const enabled = e.target.checked;
                    onLineNotifyChange(enabled);
                    await updateDoc(doc(db, 'users', userId), {
                      lineNotifyEnabled: enabled,
                      updatedAt: serverTimestamp(),
                    });
                  }}
                />
              }
              label="LINE通知を有効にする"
              sx={{ mb: 1.5, display: 'block' }}
            />

            <Paper variant="outlined" sx={{ p: 2, borderRadius: 1.5, mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                DARTSLIVE 自動チェック
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mb: 1.5 }}
              >
                毎朝10時にDARTSLIVEをチェックし、プレイがあればLINEに通知します。
              </Typography>

              {hasDlCredentials ? (
                <Box
                  sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <CheckCircleIcon sx={{ fontSize: 18, color: 'success.main' }} />
                    <Typography variant="body2" color="success.main" sx={{ fontWeight: 'bold' }}>
                      設定済み
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    color="error"
                    disabled={dlDeleting}
                    onClick={() => setConfirmDialog({ open: true, action: 'deleteDl' })}
                  >
                    {dlDeleting ? '削除中...' : '認証情報を削除'}
                  </Button>
                </Box>
              ) : (
                <>
                  <TextField
                    label="DARTSLIVEメールアドレス"
                    type="email"
                    value={dlEmail}
                    onChange={(e) => setDlEmail(e.target.value)}
                    fullWidth
                    size="small"
                    sx={{ mb: 1.5 }}
                  />
                  <TextField
                    label="DARTSLIVEパスワード"
                    type="password"
                    value={dlPassword}
                    onChange={(e) => setDlPassword(e.target.value)}
                    fullWidth
                    size="small"
                    sx={{ mb: 1 }}
                  />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', mb: 1.5 }}
                  >
                    認証情報は暗号化して保存されます。連携解除時に削除されます。
                  </Typography>
                  <Button
                    variant="contained"
                    size="small"
                    disabled={dlSaving || !dlEmail || !dlPassword}
                    startIcon={dlSaving ? <CircularProgress size={16} /> : undefined}
                    onClick={handleSaveDlCredentials}
                  >
                    {dlSaving ? '保存中...' : '保存'}
                  </Button>
                </>
              )}
            </Paper>

            <Button
              size="small"
              color="inherit"
              disabled={unlinkLoading}
              onClick={() => setConfirmDialog({ open: true, action: 'unlink' })}
              sx={{ color: 'text.secondary', fontSize: '0.75rem' }}
            >
              {unlinkLoading ? '解除中...' : '連携を解除する'}
            </Button>
          </>
        )}
      </Paper>

      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.action === 'deleteDl' ? 'DARTSLIVE認証情報の削除' : 'LINE連携の解除'}
        message={
          confirmDialog.action === 'deleteDl'
            ? 'DARTSLIVE認証情報を削除しますか？'
            : 'LINE連携を解除しますか？DARTSLIVE自動チェック設定も削除されます。'
        }
        confirmLabel="削除"
        onConfirm={handleConfirm}
        onCancel={() => setConfirmDialog({ open: false, action: null })}
      />
    </>
  );
}
