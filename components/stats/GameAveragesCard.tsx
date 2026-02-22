'use client';

import { Paper, Typography, Box } from '@mui/material';

interface GameAverage {
  gameId: string;
  gameName: string;
  average: number;
  playCount: number;
}

interface GameAveragesCardProps {
  averages: GameAverage[];
}

export default function GameAveragesCard({ averages }: GameAveragesCardProps) {
  if (!averages || averages.length === 0) return null;

  return (
    <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1.5 }}>
        ゲーム平均
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
        {averages.map((g) => (
          <Box
            key={g.gameId}
            sx={{
              flex: '1 1 140px',
              maxWidth: 200,
              p: 1.5,
              borderRadius: 1,
              bgcolor: 'action.hover',
            }}
          >
            <Typography variant="caption" color="text.secondary" noWrap>
              {g.gameName}
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              {g.average.toFixed(1)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {g.playCount}回プレイ
            </Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  );
}
