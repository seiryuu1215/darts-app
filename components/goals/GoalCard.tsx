'use client';

import {
  Box,
  Card,
  CardContent,
  LinearProgress,
  Typography,
  IconButton,
  Chip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { GOAL_TYPE_LABELS } from '@/types';
import { getProgressPercent, getRemainingDays, getDailyPace, getEstimatedDays } from '@/lib/goals';

interface GoalCardProps {
  goal: {
    id: string;
    type: string;
    period: string;
    target: number;
    current: number;
    startDate: string;
    endDate: string;
  };
  onDelete?: (id: string) => void;
}

export default function GoalCard({ goal, onDelete }: GoalCardProps) {
  const progress = getProgressPercent(goal.current, goal.target);
  const remaining = getRemainingDays(new Date(goal.endDate));
  const dailyPace = getDailyPace(goal.current, goal.target, remaining);
  const estimated = getEstimatedDays(goal.current, goal.target, new Date(goal.startDate));
  const label = GOAL_TYPE_LABELS[goal.type as keyof typeof GOAL_TYPE_LABELS] || goal.type;

  return (
    <Card
      sx={{
        borderLeft: 4,
        borderColor: 'primary.main',
        position: 'relative',
        height: '100%',
      }}
    >
      <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
        <Box
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle2" fontWeight="bold">
              {label}
            </Typography>
            <Chip
              label={goal.period === 'monthly' ? '月間' : '年間'}
              size="small"
              sx={{ height: 20, '& .MuiChip-label': { px: 0.8, fontSize: '0.65rem' } }}
            />
          </Box>
          {onDelete && (
            <IconButton size="small" onClick={() => onDelete(goal.id)} sx={{ p: 0.5 }}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, mb: 0.5 }}>
          <Typography variant="h6" fontWeight="bold">
            {goal.current.toLocaleString()}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            / {goal.target.toLocaleString()}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
            {progress}%
          </Typography>
        </Box>

        <LinearProgress
          variant="determinate"
          value={progress}
          color="primary"
          sx={{ height: 6, borderRadius: 3, mb: 0.5 }}
        />

        <Typography variant="caption" color="text.secondary">
          {remaining > 0 ? (
            <>
              残り{remaining}日{dailyPace > 0 && ` · 1日あたり約${dailyPace}`}
              {estimated != null && estimated > 0 && ` · 予測${estimated}日で達成`}
            </>
          ) : (
            '期限超過'
          )}
        </Typography>
      </CardContent>
    </Card>
  );
}
