'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Container,
  Box,
  Typography,
  Paper,
  Chip,
  CircularProgress,
  Button,
  Grid,
} from '@mui/material';
import { doc, getDoc, collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import UserAvatar from '@/components/UserAvatar';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import type { User, Dart } from '@/types';
import EditIcon from '@mui/icons-material/Edit';

export default function UserProfilePage() {
  const params = useParams();
  const userId = params.id as string;
  const { data: session } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [darts, setDarts] = useState<Dart[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const isOwner = session?.user?.id === userId;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (!userDoc.exists()) {
          setNotFound(true);
          return;
        }
        const userData = userDoc.data() as User;

        // 非公開プロフィールは本人のみ閲覧可能
        if (!userData.isProfilePublic && session?.user?.id !== userId) {
          setNotFound(true);
          return;
        }

        setUser(userData);

        // ユーザーのセッティングを取得
        const dartsQuery = query(
          collection(db, 'darts'),
          where('userId', '==', userId),
          orderBy('createdAt', 'desc'),
          limit(12),
        );
        const dartsSnap = await getDocs(dartsQuery);
        setDarts(dartsSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Dart));
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [userId, session]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (notFound || !user) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography textAlign="center" color="text.secondary">
          プロフィールが見つかりませんでした
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Breadcrumbs items={[{ label: user.displayName }]} />

      {/* プロフィールカード */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <UserAvatar userId={userId} avatarUrl={user.avatarUrl} userName={user.displayName} size={72} />
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                {user.displayName}
              </Typography>
              {isOwner && (
                <Button
                  size="small"
                  startIcon={<EditIcon />}
                  component={Link}
                  href="/profile/edit"
                >
                  編集
                </Button>
              )}
            </Box>
            {user.twitterHandle && (
              <Typography
                variant="body2"
                component="a"
                href={`https://x.com/${user.twitterHandle}`}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ color: 'text.secondary', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
              >
                @{user.twitterHandle}
              </Typography>
            )}
          </Box>
        </Box>

        {/* プロフィール詳細 */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {user.height && (
            <Chip label={`${user.height}cm`} size="small" variant="outlined" />
          )}
          {user.fourStanceType && (
            <Chip label={`4スタンス: ${user.fourStanceType}`} size="small" variant="outlined" />
          )}
          {user.dominantEye && (
            <Chip label={`利き目: ${user.dominantEye === 'right' ? '右' : '左'}`} size="small" variant="outlined" />
          )}
          {user.gripType && (
            <Chip label={user.gripType} size="small" variant="outlined" />
          )}
        </Box>

        {user.throwingImage && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
            {user.throwingImage}
          </Typography>
        )}
      </Paper>

      {/* セッティング一覧 */}
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
        セッティング ({darts.length})
      </Typography>

      {darts.length === 0 ? (
        <Paper sx={{ textAlign: 'center', py: 4, bgcolor: 'background.default', border: '1px dashed', borderColor: 'divider' }}>
          <Typography color="text.secondary">セッティングがありません</Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {darts.map((dart) => (
            <Grid size={{ xs: 12, sm: 6 }} key={dart.id}>
              <Paper
                component={Link}
                href={`/darts/${dart.id}`}
                sx={{
                  display: 'flex',
                  gap: 1.5,
                  p: 1.5,
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'box-shadow 0.2s, transform 0.2s',
                  '&:hover': { boxShadow: 6, transform: 'translateY(-2px)' },
                }}
              >
                {dart.imageUrls[0] && (
                  <Box
                    component="img"
                    src={dart.imageUrls[0]}
                    alt={dart.title}
                    sx={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 1, flexShrink: 0 }}
                  />
                )}
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="subtitle2" noWrap sx={{ fontWeight: 'bold' }}>
                    {dart.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap display="block">
                    {dart.barrel.brand} {dart.barrel.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {dart.barrel.weight}g
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}
