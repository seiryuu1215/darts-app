'use client';

import { Paper, Box, Typography, LinearProgress } from '@mui/material';

interface ConsistencyCardProps {
  games: { category: string; scores: number[] }[];
}

const MAX_GAMES = 30;

function calculateConsistency(scores: number[]): {
  avg: number;
  stdDev: number;
  cv: number;
  score: number;
} | null {
  if (scores.length < 3) return null;

  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  if (avg === 0) return null;

  const variance = scores.reduce((sum, s) => sum + (s - avg) ** 2, 0) / scores.length;
  const stdDev = Math.sqrt(variance);
  const cv = (stdDev / avg) * 100;
  const score = Math.max(0, Math.min(100, Math.round(100 - cv)));

  return { avg, stdDev, cv, score };
}

function getConsistencyLabel(score: number): { label: string; color: string } {
  if (score >= 90) return { label: '非常に安定', color: '#4caf50' };
  if (score >= 75) return { label: '安定', color: '#8bc34a' };
  if (score >= 60) return { label: '普通', color: '#ff9800' };
  if (score >= 40) return { label: 'ムラあり', color: '#f44336' };
  return { label: '不安定', color: '#d32f2f' };
}

export default function ConsistencyCard({ games }: ConsistencyCardProps) {
  const countUpGame = games?.find((g) => g.category === 'COUNT-UP');
  if (!countUpGame || countUpGame.scores.length < 3) return null;

  // 直近30ゲームに制限
  const recentScores = countUpGame.scores.slice(0, MAX_GAMES);

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
        <Typography variant="h4" sx={{ fontWeight: 'bold', color, minWidth: 60, textAlign: 'right' }}>
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
        <Typography variant="caption" color="text.secondary" component="div" sx={{ lineHeight: 1.6 }}>
          スコアのばらつきが少ないほど高スコア。100に近いほど毎回安定したスコアが出せている状態です。
          標準偏差は平均からのズレ幅で、小さいほど安定。直近{recentScores.length}ゲームが対象です。
        </Typography>
      </Box>
    </Paper>
  );
}
