'use client';

import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
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
  FormControlLabel,
  Switch,
  InputAdornment,
  Divider,
  Paper,
  Chip,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import UserAvatar from '@/components/UserAvatar';
import PushOptIn from '@/components/notifications/PushOptIn';

export default function ProfileEditPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isAdmin = session?.user?.role === 'admin';

  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [height, setHeight] = useState('');
  const [fourStanceType, setFourStanceType] = useState('');
  const [throwingImage, setThrowingImage] = useState('');
  const [dominantEye, setDominantEye] = useState('');
  const [gripType, setGripType] = useState('');
  const [twitterHandle, setTwitterHandle] = useState('');
  const [isProfilePublic, setIsProfilePublic] = useState(true);
  const [lineUserId, setLineUserId] = useState<string | null>(null);
  const [lineNotifyEnabled, setLineNotifyEnabled] = useState(false);
  const [hasDlCredentials, setHasDlCredentials] = useState(false);
  const [linkCode, setLinkCode] = useState('');
  const [linkLoading, setLinkLoading] = useState(false);
  const [unlinkLoading, setUnlinkLoading] = useState(false);
  const [dlEmail, setDlEmail] = useState('');
  const [dlPassword, setDlPassword] = useState('');
  const [dlSaving, setDlSaving] = useState(false);
  const [dlDeleting, setDlDeleting] = useState(false);
  const [accountDeleting, setAccountDeleting] = useState(false);
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
            setTwitterHandle(data.twitterHandle || '');
            setIsProfilePublic(data.isProfilePublic !== false);
            setLineUserId(data.lineUserId || null);
            setLineNotifyEnabled(data.lineNotifyEnabled || false);
            setHasDlCredentials(!!data.dlCredentialsEncrypted);
          }
        } catch (err) {
          void err;
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
        twitterHandle: twitterHandle || null,
        isProfilePublic,
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
        <Typography variant="h5" sx={{ mb: 3 }}>
          プロフィール編集
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

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
          sx={{ mb: 2 }}
        />

        <TextField
          label="X (Twitter) アカウント"
          value={twitterHandle}
          onChange={(e) => setTwitterHandle(e.target.value.replace(/^@/, ''))}
          fullWidth
          placeholder="username"
          slotProps={{
            input: {
              startAdornment: <InputAdornment position="start">@</InputAdornment>,
            },
          }}
          sx={{ mb: 2 }}
        />

        <FormControlLabel
          control={
            <Switch
              checked={isProfilePublic}
              onChange={(e) => setIsProfilePublic(e.target.checked)}
            />
          }
          label="プロフィールを公開する"
          sx={{ mb: 3, display: 'block' }}
        />

        <Button type="submit" variant="contained" fullWidth disabled={saving} size="large">
          {saving ? '保存中...' : '保存'}
        </Button>

        {/* Push通知セクション */}
        <Divider sx={{ my: 4 }} />
        <PushOptIn />

        {isAdmin && (
          <>
            {/* LINE連携セクション */}
            <Divider sx={{ my: 4 }} />

            <Paper variant="outlined" sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 2 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2,
                }}
              >
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

                  {/* Step 1 */}
                  <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
                    <Chip
                      label="1"
                      size="small"
                      sx={{
                        minWidth: 28,
                        fontWeight: 'bold',
                        bgcolor: 'primary.main',
                        color: '#fff',
                      }}
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

                  {/* Step 2 */}
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
                              setSuccess('コードをコピーしました');
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
                          onClick={async () => {
                            setLinkLoading(true);
                            try {
                              const res = await fetch('/api/line/link', { method: 'POST' });
                              const json = await res.json();
                              if (res.ok) setLinkCode(json.code);
                              else setError(json.error || 'コード発行に失敗しました');
                            } catch {
                              setError('通信エラー');
                            } finally {
                              setLinkLoading(false);
                            }
                          }}
                        >
                          コードを発行
                        </Button>
                      )}
                    </Box>
                  </Box>

                  {/* Step 3 */}
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
                  {/* 通知設定 */}
                  <FormControlLabel
                    control={
                      <Switch
                        checked={lineNotifyEnabled}
                        onChange={async (e) => {
                          const enabled = e.target.checked;
                          setLineNotifyEnabled(enabled);
                          if (session?.user?.id) {
                            await updateDoc(doc(db, 'users', session.user.id), {
                              lineNotifyEnabled: enabled,
                              updatedAt: serverTimestamp(),
                            });
                          }
                        }}
                      />
                    }
                    label="LINE通知を有効にする"
                    sx={{ mb: 1.5, display: 'block' }}
                  />

                  {/* DARTSLIVE自動チェック */}
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
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <CheckCircleIcon sx={{ fontSize: 18, color: 'success.main' }} />
                          <Typography
                            variant="body2"
                            color="success.main"
                            sx={{ fontWeight: 'bold' }}
                          >
                            設定済み
                          </Typography>
                        </Box>
                        <Button
                          size="small"
                          color="error"
                          disabled={dlDeleting}
                          onClick={async () => {
                            if (!confirm('DARTSLIVE認証情報を削除しますか？')) return;
                            setDlDeleting(true);
                            try {
                              const res = await fetch('/api/line/save-dl-credentials', {
                                method: 'DELETE',
                              });
                              if (res.ok) {
                                setHasDlCredentials(false);
                                setSuccess('認証情報を削除しました');
                              } else setError('削除に失敗しました');
                            } catch {
                              setError('通信エラー');
                            } finally {
                              setDlDeleting(false);
                            }
                          }}
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
                          onClick={async () => {
                            setDlSaving(true);
                            try {
                              const res = await fetch('/api/line/save-dl-credentials', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ email: dlEmail, password: dlPassword }),
                              });
                              if (res.ok) {
                                setHasDlCredentials(true);
                                setDlEmail('');
                                setDlPassword('');
                                setSuccess('DARTSLIVE認証情報を保存しました');
                              } else {
                                const json = await res.json();
                                setError(json.error || '保存に失敗しました');
                              }
                            } catch {
                              setError('通信エラー');
                            } finally {
                              setDlSaving(false);
                            }
                          }}
                        >
                          {dlSaving ? '保存中...' : '保存'}
                        </Button>
                      </>
                    )}
                  </Paper>

                  {/* 連携解除 — 控えめに */}
                  <Button
                    size="small"
                    color="inherit"
                    disabled={unlinkLoading}
                    onClick={async () => {
                      if (
                        !confirm(
                          'LINE連携を解除しますか？DARTSLIVE自動チェック設定も削除されます。',
                        )
                      )
                        return;
                      setUnlinkLoading(true);
                      try {
                        const res = await fetch('/api/line/unlink', { method: 'POST' });
                        if (res.ok) {
                          setLineUserId(null);
                          setLineNotifyEnabled(false);
                          setHasDlCredentials(false);
                          setSuccess('LINE連携を解除しました');
                        } else {
                          setError('連携解除に失敗しました');
                        }
                      } catch {
                        setError('通信エラー');
                      } finally {
                        setUnlinkLoading(false);
                      }
                    }}
                    sx={{ color: 'text.secondary', fontSize: '0.75rem' }}
                  >
                    {unlinkLoading ? '解除中...' : '連携を解除する'}
                  </Button>
                </>
              )}
            </Paper>
          </>
        )}
        {/* アカウント削除セクション */}
        <Divider sx={{ my: 4 }} />

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
            disabled={accountDeleting}
            startIcon={accountDeleting ? <CircularProgress size={16} color="inherit" /> : undefined}
            onClick={async () => {
              if (
                !confirm(
                  'アカウントを削除しますか？\n\n全てのデータが完全に削除されます。この操作は取り消せません。',
                )
              )
                return;
              setAccountDeleting(true);
              try {
                const res = await fetch('/api/account/delete', { method: 'DELETE' });
                if (res.ok) {
                  await signOut({ redirect: false });
                  router.push('/login');
                } else {
                  const json = await res.json();
                  setError(json.error || 'アカウント削除に失敗しました');
                }
              } catch {
                setError('通信エラー');
              } finally {
                setAccountDeleting(false);
              }
            }}
          >
            {accountDeleting ? '削除中...' : 'アカウントを削除する'}
          </Button>
        </Paper>
      </Box>
    </Container>
  );
}
