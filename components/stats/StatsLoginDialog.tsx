'use client';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  TextField,
  Alert,
  FormControlLabel,
  Checkbox,
  CircularProgress,
} from '@mui/material';
import SyncIcon from '@mui/icons-material/Sync';
import Link from 'next/link';

interface StatsLoginDialogProps {
  open: boolean;
  onClose: () => void;
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  consent: boolean;
  setConsent: (v: boolean) => void;
  loading: boolean;
  error: string;
  onFetch: () => void;
}

export default function StatsLoginDialog({
  open,
  onClose,
  email,
  setEmail,
  password,
  setPassword,
  consent,
  setConsent,
  loading,
  error,
  onFetch,
}: StatsLoginDialogProps) {
  return (
    <Dialog open={open} onClose={() => !loading && onClose()} maxWidth="xs" fullWidth>
      <DialogTitle>ダーツライブ連携</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          ダーツライブのアカウント情報でログインし、メインカードのスタッツを取得します。認証情報はサーバーで一時的に使用され、保存されません。
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <TextField
          label="メールアドレス"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          fullWidth
          disabled={loading}
          sx={{ mb: 2, mt: 1 }}
        />
        <TextField
          label="パスワード"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          fullWidth
          disabled={loading}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onFetch();
            }
          }}
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              size="small"
            />
          }
          label={
            <Typography variant="body2">
              <Link href="/terms" target="_blank" style={{ textDecoration: 'underline' }}>
                利用規約（第6条）
              </Link>
              に同意する
            </Typography>
          }
          sx={{ mt: 1.5, display: 'block' }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          キャンセル
        </Button>
        <Button
          onClick={onFetch}
          variant="contained"
          disabled={loading || !consent}
          startIcon={loading ? <CircularProgress size={18} /> : <SyncIcon />}
        >
          {loading ? '取得中...' : '取得'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
