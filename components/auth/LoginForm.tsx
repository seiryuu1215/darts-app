'use client';

import { useState } from 'react';
import { TextField, Button, Box, Alert, Typography, Divider } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import { signIn } from 'next-auth/react';
import Link from 'next/link';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('メールアドレスまたはパスワードが正しくありません');
      } else {
        window.location.href = '/';
      }
    } catch {
      setError('ログインに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    signIn('google', { callbackUrl: '/' });
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 400, mx: 'auto', mt: { xs: 2, sm: 4 }, p: { xs: 2, sm: 3 } }}>
      <Typography variant="h5" sx={{ mb: 3, textAlign: 'center' }}>
        ログイン
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <TextField
        label="メールアドレス"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        fullWidth
        required
        sx={{ mb: 2 }}
      />
      <TextField
        label="パスワード"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        fullWidth
        required
        sx={{ mb: 3 }}
      />
      <Button type="submit" variant="contained" fullWidth disabled={loading} sx={{ mb: 2 }}>
        {loading ? 'ログイン中...' : 'ログイン'}
      </Button>
      <Divider sx={{ my: 2 }}>または</Divider>
      <Button
        variant="outlined"
        fullWidth
        startIcon={<GoogleIcon />}
        onClick={handleGoogleLogin}
        sx={{ mb: 2 }}
      >
        Googleでログイン
      </Button>
      <Typography variant="body2" textAlign="center">
        アカウントをお持ちでない方は
        <Link href="/register">新規登録</Link>
      </Typography>
    </Box>
  );
}
