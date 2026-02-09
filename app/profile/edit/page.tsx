'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Container,
  TextField,
  Button,
  Box,
  Typography,
  MenuItem,
  Alert,
  CircularProgress,
  IconButton,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import UserAvatar from '@/components/UserAvatar';

export default function ProfileEditPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [height, setHeight] = useState('');
  const [fourStanceType, setFourStanceType] = useState('');
  const [throwingImage, setThrowingImage] = useState('');
  const [dominantEye, setDominantEye] = useState('');
  const [gripType, setGripType] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated' && session?.user?.id) {
      const fetchProfile = async () => {
        try {
          const docSnap = await getDoc(doc(db, 'users', session.user.id));
          if (docSnap.exists()) {
            const data = docSnap.data();
            setDisplayName(data.displayName || '');
            setAvatarUrl(data.avatarUrl || null);
            setHeight(data.height?.toString() || '');
            setFourStanceType(data.fourStanceType || '');
            setThrowingImage(data.throwingImage || '');
            setDominantEye(data.dominantEye || '');
            setGripType(data.gripType || '');
          }
        } catch (err) {
          console.error('プロフィール取得エラー:', err);
        } finally {
          setLoading(false);
        }
      };
      fetchProfile();
    }
  }, [status, session, router]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !session?.user?.id) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('画像は5MB以下にしてください');
      return;
    }

    try {
      const storageRef = ref(storage, `images/avatars/${session.user.id}/${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setAvatarUrl(url);
      setError('');
    } catch (err) {
      setError('画像のアップロードに失敗しました');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) return;
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      await updateDoc(doc(db, 'users', session.user.id), {
        displayName,
        avatarUrl,
        height: height ? Number(height) : null,
        fourStanceType: fourStanceType || null,
        throwingImage,
        dominantEye: dominantEye || null,
        gripType,
        updatedAt: serverTimestamp(),
      });
      setSuccess('プロフィールを更新しました');
    } catch (err) {
      setError('更新に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  if (loading || status === 'loading') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 4, p: { xs: 2, sm: 3 } }}>
        <Typography variant="h5" sx={{ mb: 3 }}>プロフィール編集</Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <UserAvatar
            userId={session?.user?.id || ''}
            avatarUrl={avatarUrl}
            userName={displayName}
            size={64}
          />
          <Button variant="outlined" component="label" startIcon={<CloudUploadIcon />}>
            アイコン変更
            <input type="file" hidden accept="image/*" onChange={handleAvatarUpload} />
          </Button>
        </Box>

        <TextField
          label="表示名"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          fullWidth
          required
          sx={{ mb: 2 }}
        />

        <TextField
          label="身長 (cm)"
          type="number"
          value={height}
          onChange={(e) => setHeight(e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
        />

        <TextField
          label="4スタンスタイプ"
          select
          value={fourStanceType}
          onChange={(e) => setFourStanceType(e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
        >
          <MenuItem value="">未設定</MenuItem>
          <MenuItem value="A1">A1</MenuItem>
          <MenuItem value="A2">A2</MenuItem>
          <MenuItem value="B1">B1</MenuItem>
          <MenuItem value="B2">B2</MenuItem>
        </TextField>

        <TextField
          label="投げるイメージ"
          value={throwingImage}
          onChange={(e) => setThrowingImage(e.target.value)}
          fullWidth
          multiline
          rows={2}
          placeholder="例：紙飛行機を飛ばすイメージ"
          sx={{ mb: 2 }}
        />

        <TextField
          label="利き目"
          select
          value={dominantEye}
          onChange={(e) => setDominantEye(e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
        >
          <MenuItem value="">未設定</MenuItem>
          <MenuItem value="right">右</MenuItem>
          <MenuItem value="left">左</MenuItem>
        </TextField>

        <TextField
          label="グリップタイプ"
          value={gripType}
          onChange={(e) => setGripType(e.target.value)}
          fullWidth
          placeholder="例：3フィンガー、ペンシルグリップ等"
          sx={{ mb: 3 }}
        />

        <Button type="submit" variant="contained" fullWidth disabled={saving} size="large">
          {saving ? '保存中...' : '保存'}
        </Button>
      </Box>
    </Container>
  );
}
