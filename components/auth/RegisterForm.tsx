'use client';

import { useState } from 'react';
import { TextField, Button, Box, Alert, Typography } from '@mui/material';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { signIn } from 'next-auth/react';
import Link from 'next/link';

const isRegistrationDisabled = process.env.NEXT_PUBLIC_REGISTRATION_DISABLED === 'true';

export default function RegisterForm() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName });

      await setDoc(doc(db, 'users', user.uid), {
        displayName,
        email,
        photoURL: null,
        role: 'general',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await signIn('credentials', {
        email,
        password,
        callbackUrl: '/',
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('登録に失敗しました');
      }
    } finally {
      setLoading(false);
    }
  };

  if (isRegistrationDisabled) {
    return (
      <Box sx={{ maxWidth: 400, mx: 'auto', mt: { xs: 2, sm: 4 }, p: { xs: 2, sm: 3 } }}>
        <Typography variant="h5" sx={{ mb: 3, textAlign: 'center' }}>
          新規登録
        </Typography>
        <Alert severity="info" sx={{ mb: 3 }}>
          現在新規登録を停止しています。
        </Alert>
        <Typography variant="body2" textAlign="center">
          アカウントをお持ちの方は
          <Link href="/login">ログイン</Link>
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
      <Typography variant="h5" sx={{ mb: 3, textAlign: 'center' }}>
        新規登録
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <TextField
        label="表示名"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        fullWidth
        required
        sx={{ mb: 2 }}
      />
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
        inputProps={{ minLength: 6 }}
      />
      <Button type="submit" variant="contained" fullWidth disabled={loading} sx={{ mb: 2 }}>
        {loading ? '登録中...' : '登録'}
      </Button>
      <Typography variant="body2" textAlign="center">
        アカウントをお持ちの方は
        <Link href="/login">ログイン</Link>
      </Typography>
    </Box>
  );
}
