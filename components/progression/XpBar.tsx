'use client';

import { useEffect, useState } from 'react';
import { Box, Typography, LinearProgress, Skeleton } from '@mui/material';
import { useSession } from 'next-auth/react';

interface ProgressionData {
  xp: number;
  level: number;
  rank: string;
  currentLevelXp: number;
  nextLevelXp: number | null;
}

export default function XpBar() {
  const { data: session } = useSession();
  const [data, setData] = useState<ProgressionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }
    const fetchProgression = async () => {
      try {
        const res = await fetch('/api/progression');
        if (!res.ok) return;
        const json = await res.json();
        setData(json);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchProgression();
  }, [session]);

  if (!session || loading) {
    return loading && session ? <Skeleton variant="rounded" height={64} sx={{ mb: 2 }} /> : null;
  }

  if (!data) return null;

  const progressPercent =
    data.nextLevelXp != null
      ? ((data.xp - data.currentLevelXp) / (data.nextLevelXp - data.currentLevelXp)) * 100
      : 100;

  const xpToNext = data.nextLevelXp != null ? data.nextLevelXp - data.xp : 0;

  return (
    <Box
      sx={{
        mb: 2,
        p: 2,
        borderRadius: 2,
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'divider',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
            Lv.{data.level}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {data.rank}
          </Typography>
        </Box>
        <Typography variant="caption" color="text.secondary">
          {data.xp.toLocaleString()} XP
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={Math.min(progressPercent, 100)}
        sx={{
          height: 8,
          borderRadius: 4,
          bgcolor: 'action.hover',
          '& .MuiLinearProgress-bar': { borderRadius: 4 },
        }}
      />
      {data.nextLevelXp != null && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
          次のレベルまで {xpToNext.toLocaleString()} XP
        </Typography>
      )}
    </Box>
  );
}
