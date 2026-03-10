'use client';

import { useState } from 'react';
import { Avatar, type AvatarProps } from '@mui/material';

interface UserAvatarProps extends Omit<AvatarProps, 'src'> {
  userId: string;
  avatarUrl?: string | null;
  userName?: string;
  size?: number;
}

function generateAvatarUrl(userId: string): string {
  // DiceBear Adventurer Neutral - 動物風のかわいいアバター
  return `https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=${encodeURIComponent(userId)}`;
}

function getInitials(name?: string): string {
  if (!name) return '?';
  return name.slice(0, 1).toUpperCase();
}

export default function UserAvatar({
  userId,
  avatarUrl,
  userName,
  size = 40,
  sx,
  ...props
}: UserAvatarProps) {
  const [imgError, setImgError] = useState(false);
  const src = avatarUrl || generateAvatarUrl(userId);

  return (
    <Avatar
      src={imgError ? undefined : src}
      alt={userName || ''}
      sx={{ width: size, height: size, fontSize: size * 0.45, ...sx }}
      slotProps={{ img: { onError: () => setImgError(true) } }}
      {...props}
    >
      {getInitials(userName)}
    </Avatar>
  );
}
