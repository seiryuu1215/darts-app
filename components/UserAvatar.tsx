'use client';

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

export default function UserAvatar({ userId, avatarUrl, userName, size = 40, sx, ...props }: UserAvatarProps) {
  const src = avatarUrl || generateAvatarUrl(userId);

  return (
    <Avatar
      src={src}
      alt={userName || ''}
      sx={{ width: size, height: size, ...sx }}
      {...props}
    />
  );
}
