'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Container,
  Box,
  Typography,
  Paper,
  Chip,
  Skeleton,
  Button,
  Grid,
  IconButton,
} from '@mui/material';
import { doc, getDoc, collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import UserAvatar from '@/components/UserAvatar';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import DartCard from '@/components/darts/DartCard';
import DartCardSkeleton from '@/components/darts/DartCardSkeleton';
import type { User, Dart } from '@/types';
import EditIcon from '@mui/icons-material/Edit';
import XIcon from '@mui/icons-material/X';
import StorefrontIcon from '@mui/icons-material/Storefront';
import HistoryIcon from '@mui/icons-material/History';

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
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Skeleton variant="circular" width={80} height={80} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="40%" height={32} />
            <Skeleton variant="text" width="60%" />
          </Box>
        </Box>
        <Grid container spacing={3}>
          {[0, 1, 2].map((i) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
              <DartCardSkeleton />
            </Grid>
          ))}
        </Grid>
      </Container>
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

  const activeDartId = user.activeSoftDartId || user.activeSteelDartId;
  const activeDart = activeDartId ? darts.find((d) => d.id === activeDartId) : null;
  const otherDarts = activeDart ? darts.filter((d) => d.id !== activeDartId) : darts;

  const profileItems = [
    user.height && { label: '身長', value: `${user.height}cm` },
    user.fourStanceType && { label: '4スタンス', value: user.fourStanceType },
    user.dominantEye && { label: '利き目', value: user.dominantEye === 'right' ? '右' : '左' },
    user.gripType && { label: 'グリップ', value: user.gripType },
    user.throwingImage && { label: 'スロー', value: user.throwingImage },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Breadcrumbs items={[{ label: user.displayName }]} />

      {/* プロフィールカード */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2.5, mb: 2 }}>
          <UserAvatar
            userId={userId}
            avatarUrl={user.avatarUrl}
            userName={user.displayName}
            size={120}
          />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                {user.displayName}
              </Typography>
              {user.role === 'admin' && <Chip label="Admin" size="small" color="error" />}
              {user.role === 'pro' && <Chip label="PRO" size="small" color="primary" />}
              {isOwner && (
                <Button size="small" startIcon={<EditIcon />} component={Link} href="/profile/edit">
                  編集
                </Button>
              )}
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
              {user.twitterHandle && (
                <IconButton
                  size="small"
                  component="a"
                  href={`https://x.com/${user.twitterHandle.replace(/^@/, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ color: 'text.secondary' }}
                >
                  <XIcon fontSize="small" />
                </IconButton>
              )}
              {user.homeShop && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <StorefrontIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    {user.homeShop}
                  </Typography>
                </Box>
              )}
              {user.dartsHistory && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <HistoryIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    ダーツ歴 {user.dartsHistory}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Box>

        {/* プロフィール詳細 — ラベル付きGrid */}
        {profileItems.length > 0 && (
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {profileItems.map((item) => (
              <Grid size={{ xs: 6, sm: 4 }} key={item.label}>
                <Typography variant="caption" color="text.secondary">
                  {item.label}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  {item.value}
                </Typography>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

      {/* アクティブダーツ */}
      {activeDart && (
        <>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
            アクティブダーツ
          </Typography>
          <Box sx={{ mb: 3, maxWidth: 400 }}>
            <DartCard dart={activeDart} />
          </Box>
        </>
      )}

      {/* セッティング一覧 */}
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
        セッティング ({darts.length})
      </Typography>

      {darts.length === 0 ? (
        <Paper
          sx={{
            textAlign: 'center',
            py: 4,
            bgcolor: 'background.default',
            border: '1px dashed',
            borderColor: 'divider',
          }}
        >
          <Typography color="text.secondary">セッティングがありません</Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {otherDarts.map((dart) => (
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
                    sx={{
                      width: 96,
                      height: 96,
                      objectFit: 'cover',
                      borderRadius: 1,
                      flexShrink: 0,
                    }}
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
                    {dart.barrel.maxDiameter && ` / ${dart.barrel.maxDiameter}mm`}
                    {dart.barrel.length && ` / ${dart.barrel.length}mm`}
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
