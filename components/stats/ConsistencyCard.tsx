'use client';

import { Paper, Box, Typography, LinearProgress } from '@mui/material';
import { calculateConsistency, getConsistencyLabel } from '@/lib/stats-math';

interface ConsistencyCardProps {
  games: { category: string; scores: number[] }[];
}

const MAX_GAMES = 30;

export default function ConsistencyCard({ games }: ConsistencyCardProps) {
  const countUpGame = games?.find((g) => g.category === 'COUNT-UP');
  if (!countUpGame || countUpGame.scores.length < 3) return null;

  // 直近30ゲームに制限（時系列順: 末尾が最新）
  const recentScores = countUpGame.scores.slice(-MAX_GAMES);

  const result = calculateConsistency(recentScores);
  if (!result) return null;

  const { avg, stdDev, score } = result;
  const { label, color } = getConsistencyLabel(score);

  return (
    <Paper sx={{ p: 2, mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1.5 }}>
        COUNT-UP 一貫性
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              一貫性スコア
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 'bold', color }}>
              {label}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={score}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: 'action.hover',
              '& .MuiLinearProgress-bar': {
                backgroundColor: color,
                borderRadius: 4,
              },
            }}
          />
        </Box>
        <Typography
          variant="h4"
          sx={{ fontWeight: 'bold', color, minWidth: 60, textAlign: 'right' }}
        >
          {score}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1.5 }}>
        <Paper variant="outlined" sx={{ flex: 1, minWidth: 80, p: 1, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            平均スコア
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            {Math.round(avg)}
          </Typography>
        </Paper>
        <Paper variant="outlined" sx={{ flex: 1, minWidth: 80, p: 1, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            標準偏差
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            {stdDev.toFixed(1)}
          </Typography>
        </Paper>
        <Paper variant="outlined" sx={{ flex: 1, minWidth: 80, p: 1, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            対象ゲーム数
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            {recentScores.length}
          </Typography>
        </Paper>
      </Box>

      <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
        <Typography
          variant="caption"
          color="text.secondary"
          component="div"
          sx={{ lineHeight: 1.6 }}
        >
          スコアのばらつきが少ないほど高スコア。100に近いほど毎回安定したスコアが出せている状態です。
          標準偏差は平均からのズレ幅で、小さいほど安定。直近{recentScores.length}ゲームが対象です。
        </Typography>
      </Box>
    </Paper>
  );
}
