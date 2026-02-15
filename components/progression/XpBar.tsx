'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Skeleton,
  Collapse,
} from '@mui/material';
import { useSession } from 'next-auth/react';

interface ProgressionData {
  xp: number;
  level: number;
  rank: string;
  currentLevelXp: number;
  nextLevelXp: number | null;
  rankIcon: string;
  rankColor: string;
  milestones: string[];
}

export default function XpBar() {
  const { data: session } = useSession();
  const [data, setData] = useState<ProgressionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

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
    return loading && session ? <Skeleton variant="rounded" height={48} sx={{ mb: 2 }} /> : null;
  }

  if (!data) return null;

  const progressPercent =
    data.nextLevelXp != null
      ? ((data.xp - data.currentLevelXp) / (data.nextLevelXp - data.currentLevelXp)) * 100
      : 100;

  const xpToNext = data.nextLevelXp != null ? data.nextLevelXp - data.xp : 0;
  const rankColor = data.rankColor || '#1976d2';

  return (
    <Box
      onClick={() => setExpanded(!expanded)}
      sx={{
        mb: 2,
        px: 2,
        py: 1.5,
        borderRadius: 2,
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'divider',
        borderLeft: 4,
        borderLeftColor: rankColor,
        cursor: 'pointer',
        transition: 'box-shadow 0.2s',
        '&:hover': { boxShadow: 2 },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography sx={{ fontSize: '1.2rem', lineHeight: 1 }}>{data.rankIcon || '🎯'}</Typography>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 'bold', color: rankColor }}>
              Lv.{data.level}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {data.rank}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={Math.min(progressPercent, 100)}
            sx={{
              height: 4,
              borderRadius: 2,
              mt: 0.5,
              bgcolor: 'action.hover',
              '& .MuiLinearProgress-bar': {
                borderRadius: 2,
                bgcolor: rankColor,
              },
            }}
          />
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
          {data.xp.toLocaleString()} XP
        </Typography>
      </Box>

      <Collapse in={expanded}>
        <Box sx={{ mt: 1.5, pt: 1, borderTop: 1, borderColor: 'divider' }}>
          {data.nextLevelXp != null && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              次のレベルまで {xpToNext.toLocaleString()} XP
            </Typography>
          )}
          {data.milestones && data.milestones.length > 0 && (
            <Typography variant="caption" color="text.secondary">
              達成マイルストーン: {data.milestones.length}個
            </Typography>
          )}
        </Box>
      </Collapse>
    </Box>
  );
}
