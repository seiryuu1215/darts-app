'use client';

import React from 'react';
import { Card, CardContent, CardMedia, Typography, Box, Chip } from '@mui/material';
import Link from 'next/link';
import type { Dart } from '@/types';
import UserAvatar from '@/components/UserAvatar';
import { useSession } from 'next-auth/react';
import { calcDartTotals, hasCompleteSpecs } from '@/lib/calc-totals';

interface DartCardProps {
  dart: Dart;
}

const DartCard = React.memo(function DartCard({ dart }: DartCardProps) {
  const { data: session } = useSession();
  const isOwner = session?.user?.id === dart.userId;
  const totals = calcDartTotals(dart);
  const showTotals = hasCompleteSpecs(dart);

  return (
    <Card
      component={Link}
      href={`/darts/${dart.id}`}
      sx={{
        textDecoration: 'none',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        '&:hover': { boxShadow: 6, transform: 'translateY(-2px)' },
      }}
    >
      {dart.imageUrls.length > 0 ? (
        <CardMedia
          component="img"
          height="140"
          image={dart.imageUrls[0]}
          alt={dart.title}
          sx={{ objectFit: 'cover' }}
        />
      ) : (
        <Box
          component="img"
          src="/dart-placeholder.svg"
          alt="No Image"
          sx={{ height: 140, width: '100%', objectFit: 'cover' }}
        />
      )}
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <UserAvatar
            userId={dart.userId}
            avatarUrl={dart.userAvatarUrl}
            userName={dart.userName}
            size={24}
          />
          <Typography variant="caption" color="text.secondary" noWrap>
            {dart.userName || '匿名'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
          <Typography variant="h6" gutterBottom noWrap sx={{ flex: 1 }}>
            {dart.title}
          </Typography>
          <Chip
            label={dart.tip.type === 'soft' ? 'ソフト' : 'スティール'}
            size="small"
            color={dart.tip.type === 'soft' ? 'info' : 'default'}
            variant="outlined"
          />
          {dart.isDraft ? (
            <Chip label="ドラフト" size="small" color="warning" />
          ) : isOwner ? (
            <Chip label="マイセッティング" size="small" color="success" variant="outlined" />
          ) : null}
        </Box>
        <Typography variant="body2" color="text.secondary">
          {dart.barrel.brand} {dart.barrel.name}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {dart.barrel.weight}g{dart.barrel.maxDiameter && ` / 最大径${dart.barrel.maxDiameter}mm`}
          {dart.barrel.length && ` / 全長${dart.barrel.length}mm`}
        </Typography>
        {dart.barrel.cut && (
          <Typography variant="caption" display="block" color="text.secondary">
            {dart.barrel.cut
              .split(/[,+＋]/)
              .filter(Boolean)
              .map((c) => c.trim())
              .join(' / ')}
          </Typography>
        )}
        {showTotals && (totals.totalLength || totals.totalWeight) && (
          <Box sx={{ mt: 1 }}>
            <Chip
              label={`セッティング込み ${[
                totals.totalLength && `${totals.totalLength.toFixed(1)}mm`,
                totals.totalWeight && `${totals.totalWeight.toFixed(1)}g`,
              ]
                .filter(Boolean)
                .join(' / ')}`}
              size="small"
              color="primary"
              variant="outlined"
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
});

export default DartCard;
