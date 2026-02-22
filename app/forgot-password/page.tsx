'use client';

import { useState } from 'react';
import { TextField, Button, Box, Alert, Typography } from '@mui/material';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setSent(true);
    } catch {
      setError('メールの送信に失敗しました。メールアドレスをご確認ください。');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <Box sx={{ maxWidth: 400, mx: 'auto', mt: { xs: 2, sm: 4 }, p: { xs: 2, sm: 3 } }}>
        <Typography variant="h5" sx={{ mb: 3, textAlign: 'center' }}>
          メールを送信しました
        </Typography>
        <Alert severity="success" sx={{ mb: 3 }}>
          パスワードリセット用のメールを送信しました。メールに記載されたリンクからパスワードを再設定してください。
        </Alert>
        <Typography variant="body2" textAlign="center">
          <Link href="/login">ログインページに戻る</Link>
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ maxWidth: 400, mx: 'auto', mt: { xs: 2, sm: 4 }, p: { xs: 2, sm: 3 } }}
    >
      <Typography variant="h5" sx={{ mb: 1, textAlign: 'center' }}>
        パスワードリセット
      </Typography>
      <Typography variant="body2" sx={{ mb: 3, textAlign: 'center', color: 'text.secondary' }}>
        登録済みのメールアドレスを入力してください。パスワードリセット用のメールをお送りします。
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
        required
        sx={{ mb: 3 }}
      />
      <Button type="submit" variant="contained" fullWidth disabled={loading} sx={{ mb: 3 }}>
        {loading ? '送信中...' : 'リセットメールを送信'}
      </Button>
      <Typography variant="body2" textAlign="center">
        <Link href="/login">ログインページに戻る</Link>
      </Typography>
    </Box>
  );
}
