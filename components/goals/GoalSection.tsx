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
  achievable?: boolean;
}

export default function GoalSection() {
  const { data: session } = useSession();
  const [goals, setGoals] = useState<GoalData[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeDaily, setActiveDaily] = useState(0);
  const [activeMonthly, setActiveMonthly] = useState(0);
  const [activeYearly, setActiveYearly] = useState(0);
  const [celebrateGoal, setCelebrateGoal] = useState<{ type: string; target: number; xpAmount: number } | null>(null);

  useEffect(() => {
    if (!session?.user?.id) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/goals');
        if (res.ok && !cancelled) {
          const json = await res.json();
          setGoals(json.goals || []);
          setActiveDaily(json.activeDaily ?? 0);
          setActiveMonthly(json.activeMonthly ?? 0);
          setActiveYearly(json.activeYearly ?? 0);
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
  }): Promise<string | null> => {
    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setRefreshKey((k) => k + 1);
        return null;
      }
      const json = await res.json();
      return json.error || '目標の作成に失敗しました';
    } catch {
      return '通信エラーが発生しました';
    }
  };

  const handleAchieve = async (id: string) => {
    try {
      const res = await fetch('/api/goals/achieve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goalId: id }),
      });
      if (res.ok) {
        const json = await res.json();
        setCelebrateGoal({
          type: json.goalType,
          target: json.target,
          xpAmount: json.xpAwarded,
        });
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
              <GoalCard goal={goal} onDelete={handleDelete} onAchieve={handleAchieve} />
            </Grid>
          ))}
        </Grid>
      )}

      <GoalSettingDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        activeDaily={activeDaily}
        activeMonthly={activeMonthly}
        activeYearly={activeYearly}
      />

      <GoalAchievedDialog
        open={!!celebrateGoal}
        goalType={celebrateGoal?.type || ''}
        target={celebrateGoal?.target || 0}
        xpAmount={celebrateGoal?.xpAmount || 50}
        onClose={() => setCelebrateGoal(null)}
      />
    </Box>
  );
}
