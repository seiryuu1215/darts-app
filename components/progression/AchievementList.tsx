'use client';

import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Chip,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  CATEGORY_META,
  getAchievementsByCategory,
  type AchievementCategory,
  type AchievementDefinition,
} from '@/lib/progression/achievements';
import type { AchievementSnapshot } from '@/lib/progression/xp-engine';

interface AchievementListProps {
  unlockedIds: string[];
  snapshot?: AchievementSnapshot | null;
}

function getCategoryValue(category: AchievementCategory, snapshot: AchievementSnapshot): number {
  switch (category) {
    case 'games':
      return snapshot.totalGames;
    case 'streak':
      return snapshot.currentStreak;
    case 'rating':
      return snapshot.highestRating ?? 0;
    case 'hat_trick':
      return snapshot.hatTricksTotal;
    case 'ton80':
      return snapshot.ton80;
    case 'bulls':
      return snapshot.dBullTotal + snapshot.sBullTotal;
    case 'low_ton':
      return snapshot.lowTon;
    case 'high_ton':
      return snapshot.highTon;
    case 'three_bed':
      return snapshot.threeInABed;
    case 'white_horse':
      return snapshot.whiteHorse;
    case 'level':
      return snapshot.level;
  }
}

function getCategoryProgress(
  achievements: AchievementDefinition[],
  snapshot: AchievementSnapshot | null,
  unlockedIds: string[],
) {
  const achieved = achievements.filter((a) => unlockedIds.includes(a.id)).length;
  const total = achievements.length;

  if (!snapshot) return { current: 0, nextThreshold: null, achieved, total };

  const currentValue = getCategoryValue(achievements[0].category, snapshot);
  const nextAchievement = achievements.find(
    (a) => !unlockedIds.includes(a.id) && a.threshold > currentValue,
  );
  const nextThreshold = nextAchievement?.threshold ?? null;

  return { current: currentValue, nextThreshold, achieved, total };
}

export default function AchievementList({ unlockedIds, snapshot }: AchievementListProps) {
  const categoryMap = getAchievementsByCategory();

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        実績
      </Typography>
      {Array.from(categoryMap.entries()).map(([category, achievements]) => {
        const meta = CATEGORY_META[category];
        const progress = getCategoryProgress(achievements, snapshot ?? null, unlockedIds);

        return (
          <Accordion
            key={category}
            disableGutters
            sx={{
              '&:before': { display: 'none' },
              mb: 1,
              borderRadius: 1,
              overflow: 'hidden',
            }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                <Typography sx={{ fontSize: '1.1rem' }}>{meta.icon}</Typography>
                <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
                  {meta.label}
                </Typography>
                <Chip
                  label={`${progress.achieved}/${progress.total}`}
                  size="small"
                  color={progress.achieved === progress.total ? 'success' : 'default'}
                  variant={progress.achieved > 0 ? 'filled' : 'outlined'}
                />
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0 }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {achievements.map((achievement) => {
                  const unlocked = unlockedIds.includes(achievement.id);
                  const isNext =
                    snapshot &&
                    !unlocked &&
                    getCategoryValue(category, snapshot) < achievement.threshold &&
                    achievements
                      .filter((a) => !unlockedIds.includes(a.id))
                      .sort((a, b) => a.threshold - b.threshold)[0]?.id === achievement.id;

                  return (
                    <Box
                      key={achievement.id}
                      sx={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        py: 0.5,
                        opacity: unlocked ? 1 : 0.5,
                      }}
                    >
                      <Typography sx={{ fontSize: '0.9rem', minWidth: 24 }}>
                        {unlocked ? achievement.icon : '⬜'}
                      </Typography>
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: unlocked ? 'bold' : 'normal',
                            color: unlocked ? 'text.primary' : 'text.secondary',
                          }}
                        >
                          {achievement.name}
                        </Typography>
                        {isNext && snapshot && (
                          <Box sx={{ mt: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">
                              {getCategoryValue(category, snapshot).toLocaleString()} /{' '}
                              {achievement.threshold.toLocaleString()}
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={Math.min(
                                100,
                                (getCategoryValue(category, snapshot) / achievement.threshold) *
                                  100,
                              )}
                              sx={{ height: 6, borderRadius: 3, mt: 0.5 }}
                            />
                          </Box>
                        )}
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Box>
  );
}
