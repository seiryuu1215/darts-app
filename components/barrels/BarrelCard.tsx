'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  IconButton,
  Button,
  Chip,
} from '@mui/material';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BuildIcon from '@mui/icons-material/Build';
import AffiliateButton from '@/components/affiliate/AffiliateButton';
import { doc, setDoc, deleteDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import type { BarrelProduct } from '@/types';

interface BarrelCardProps {
  barrel: BarrelProduct;
  isBookmarked?: boolean;
}

export default function BarrelCard({ barrel, isBookmarked }: BarrelCardProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [bookmarked, setBookmarked] = useState(isBookmarked ?? false);
  // isBookmarked prop が変わったら同期
  if (isBookmarked !== undefined && isBookmarked !== bookmarked) {
    setBookmarked(isBookmarked);
  }

  useEffect(() => {
    // 親からisBookmarkedが提供されている場合はfetchスキップ
    if (isBookmarked !== undefined) return;
    if (!session?.user?.id || !barrel.id) return;
    const check = async () => {
      const bmDoc = await getDoc(doc(db, 'users', session.user.id, 'barrelBookmarks', barrel.id!));
      setBookmarked(bmDoc.exists());
    };
    check();
  }, [session, barrel.id, isBookmarked]);

  const handleBookmark = async () => {
    if (!session?.user?.id || !barrel.id) return;
    const bmRef = doc(db, 'users', session.user.id, 'barrelBookmarks', barrel.id);
    if (bookmarked) {
      await deleteDoc(bmRef);
    } else {
      await setDoc(bmRef, { barrelId: barrel.id, createdAt: serverTimestamp() });
    }
    setBookmarked(!bookmarked);
  };

  const handleDraft = () => {
    if (!barrel.id) return;
    const params = new URLSearchParams({
      draft: '1',
      barrelId: barrel.id,
      barrelName: barrel.name,
      barrelBrand: barrel.brand,
      barrelWeight: barrel.weight.toString(),
      ...(barrel.maxDiameter && { barrelMaxDiameter: barrel.maxDiameter.toString() }),
      ...(barrel.length && { barrelLength: barrel.length.toString() }),
      ...(barrel.cut && { barrelCut: barrel.cut }),
      ...(barrel.imageUrl && { barrelImageUrl: barrel.imageUrl }),
    });
    router.push(`/darts/new?${params.toString()}`);
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        '&:hover': { boxShadow: 6, transform: 'translateY(-2px)' },
      }}
    >
      {barrel.isDiscontinued && (
        <Chip
          label="販売終了の可能性"
          size="small"
          variant="outlined"
          sx={{
            position: 'absolute',
            top: 8,
            left: 8,
            zIndex: 1,
            fontSize: 10,
            height: 22,
            bgcolor: 'background.paper',
            opacity: 0.9,
          }}
        />
      )}
      {barrel.imageUrl ? (
        <CardMedia
          component="img"
          height="160"
          image={barrel.imageUrl}
          alt={barrel.name}
          sx={{ objectFit: 'cover', ...(barrel.isDiscontinued && { opacity: 0.6 }) }}
        />
      ) : (
        <Box
          component="img"
          src="/dart-placeholder.svg"
          alt="No Image"
          sx={{
            height: 160,
            width: '100%',
            objectFit: 'cover',
            ...(barrel.isDiscontinued && { opacity: 0.6 }),
          }}
        />
      )}
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom noWrap>
          {barrel.name}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {barrel.brand}
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
          <Chip label={`${barrel.weight}g`} size="small" color="primary" variant="outlined" />
          {barrel.maxDiameter && (
            <Chip label={`最大径 ${barrel.maxDiameter}mm`} size="small" variant="outlined" />
          )}
          {barrel.length && (
            <Chip label={`全長 ${barrel.length}mm`} size="small" variant="outlined" />
          )}
          {barrel.cut &&
            barrel.cut
              .split(/[,+＋]/)
              .filter(Boolean)
              .map((c) => <Chip key={c.trim()} label={c.trim()} size="small" variant="outlined" />)}
        </Box>
      </CardContent>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          px: 1,
          pb: 1,
          flexWrap: 'wrap',
        }}
      >
        <AffiliateButton barrel={barrel} size="small" />
        {session && (
          <Button
            size="small"
            startIcon={<BuildIcon />}
            onClick={handleDraft}
            sx={{ whiteSpace: 'nowrap' }}
          >
            セッティング
          </Button>
        )}
        {session && (
          <IconButton
            size="small"
            onClick={handleBookmark}
            color={bookmarked ? 'primary' : 'default'}
            aria-label={bookmarked ? 'ブックマーク解除' : 'ブックマーク'}
            sx={{ ml: 'auto' }}
          >
            {bookmarked ? <BookmarkIcon /> : <BookmarkBorderIcon />}
          </IconButton>
        )}
      </Box>
    </Card>
  );
}
