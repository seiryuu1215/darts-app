'use client';

import { useEffect, useState } from 'react';
import { Box, Typography, Button, Grid } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import FlagIcon from '@mui/icons-material/Flag';
import { useSession } from 'next-auth/react';
import GoalCard from './GoalCard';
import GoalSettingDialog from './GoalSettingDialog';
import GoalAchievedDialog from './GoalAchievedDialog';
import type { GoalType, GoalPeriod } from '@/types';

interface GoalData {
  id: string;
  type: string;
  period: string;
  target: number;
  current: number;
  startDate: string;
  endDate: string;
  achievedAt: string | null;
  xpAwarded: boolean;
  newlyAchieved?: boolean;
}

export default function GoalSection() {
  const { data: session } = useSession();
  const [goals, setGoals] = useState<GoalData[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeMonthly, setActiveMonthly] = useState(0);
  const [activeYearly, setActiveYearly] = useState(0);
  const [celebrateGoal, setCelebrateGoal] = useState<GoalData | null>(null);

  useEffect(() => {
    if (!session?.user?.id) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/goals');
        if (res.ok && !cancelled) {
          const json = await res.json();
          setGoals(json.goals || []);
          setActiveMonthly(json.activeMonthly ?? 0);
          setActiveYearly(json.activeYearly ?? 0);

          // 新たに達成された目標をお祝い表示
          const newlyAchieved = (json.goals || []).find(
            (g: GoalData) => g.newlyAchieved,
          );
          if (newlyAchieved) {
            setCelebrateGoal(newlyAchieved);
          }
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session, refreshKey]);

  const handleSave = async (data: {
    type: GoalType;
    period: GoalPeriod;
    target: number;
    startDate: string;
    endDate: string;
  }) => {
    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setRefreshKey((k) => k + 1);
      }
    } catch {
      // ignore
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/goals?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setRefreshKey((k) => k + 1);
      }
    } catch {
      // ignore
    }
  };

  if (!session) return null;

  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FlagIcon color="primary" />
          <Typography variant="h5">目標</Typography>
        </Box>
        <Button size="small" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
          追加
        </Button>
      </Box>

      {goals.length === 0 ? (
        <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 4 }}>
          目標を設定して進捗を追跡しよう
        </Typography>
      ) : (
        <Grid container spacing={1.5}>
          {goals.map((goal) => (
            <Grid size={{ xs: 12, sm: 6 }} key={goal.id}>
              <GoalCard goal={goal} onDelete={handleDelete} />
            </Grid>
          ))}
        </Grid>
      )}

      <GoalSettingDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        activeMonthly={activeMonthly}
        activeYearly={activeYearly}
      />

      <GoalAchievedDialog
        open={!!celebrateGoal}
        goalType={celebrateGoal?.type || ''}
        target={celebrateGoal?.target || 0}
        onClose={() => setCelebrateGoal(null)}
      />
    </Box>
  );
}
