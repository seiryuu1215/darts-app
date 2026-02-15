'use client';

import { Box, Typography, Card, CardContent, Grid } from '@mui/material';
import { ACHIEVEMENTS } from '@/lib/progression/achievements';

interface AchievementListProps {
  unlockedIds: string[];
}

export default function AchievementList({ unlockedIds }: AchievementListProps) {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        実績
      </Typography>
      <Grid container spacing={1.5}>
        {ACHIEVEMENTS.map((achievement) => {
          const unlocked = unlockedIds.includes(achievement.id);
          return (
            <Grid size={{ xs: 6, sm: 4 }} key={achievement.id}>
              <Card
                variant="outlined"
                sx={{
                  opacity: unlocked ? 1 : 0.4,
                  bgcolor: unlocked ? 'background.paper' : 'action.disabledBackground',
                  transition: 'opacity 0.2s',
                }}
              >
                <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                  <Typography variant="h6" sx={{ fontSize: '1.2rem', mb: 0.5 }}>
                    {achievement.icon}
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block' }}>
                    {achievement.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                    {achievement.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}
