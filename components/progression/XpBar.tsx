'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Skeleton,
  Collapse,
  IconButton,
  Chip,
  Tooltip,
} from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useSession } from 'next-auth/react';
import { XP_RULES } from '@/lib/progression/xp-rules';

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

// XPルールをカテゴリ分けして表示
const XP_CATEGORIES = [
  {
    label: 'プレイ',
    rules: [
      'stats_record',
      'games_10',
      'play_streak_3',
      'play_streak_7',
      'play_streak_30',
      'condition_record',
    ],
  },
  {
    label: 'アワード',
    rules: [
      'award_hat_trick',
      'award_ton_80',
      'award_3_black',
      'award_9_mark',
      'award_low_ton',
      'award_high_ton',
    ],
  },
  {
    label: 'その他',
    rules: ['rating_milestone', 'discussion_post', 'goal_achieved'],
  },
];

export default function XpBar() {
  const { data: session } = useSession();
  const [data, setData] = useState<ProgressionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [showRules, setShowRules] = useState(false);

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
      }}
    >
      <Box
        onClick={() => setExpanded(!expanded)}
        sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }}
      >
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
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              {data.nextLevelXp != null && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  次のレベルまで {xpToNext.toLocaleString()} XP
                </Typography>
              )}
              {data.milestones && data.milestones.length > 0 && (
                <Typography variant="caption" color="text.secondary">
                  達成マイルストーン: {data.milestones.length}個
                </Typography>
              )}
            </Box>
            <Tooltip title="XP獲得条件">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowRules(!showRules);
                }}
                sx={{ ml: 1 }}
              >
                <HelpOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          <Collapse in={showRules}>
            <Box sx={{ mt: 1, pt: 1, borderTop: 1, borderColor: 'divider' }}>
              <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5 }}>
                XP獲得条件
              </Typography>
              {XP_CATEGORIES.map((cat) => (
                <Box key={cat.label} sx={{ mb: 1 }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', mb: 0.3 }}
                  >
                    {cat.label}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {cat.rules
                      .filter((id) => XP_RULES[id])
                      .map((id) => {
                        const rule = XP_RULES[id];
                        return (
                          <Chip
                            key={id}
                            label={`${rule.label} +${rule.xp}`}
                            size="small"
                            variant="outlined"
                            sx={{
                              height: 22,
                              '& .MuiChip-label': { px: 0.8, fontSize: '0.65rem' },
                            }}
                          />
                        );
                      })}
                  </Box>
                </Box>
              ))}
            </Box>
          </Collapse>
        </Box>
      </Collapse>
    </Box>
  );
}
