'use client';

import { useEffect, useState } from 'react';
import { Box, Typography, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import FlagIcon from '@mui/icons-material/Flag';
import { useSession } from 'next-auth/react';
import GoalCard from './GoalCard';
import GoalSettingDialog from './GoalSettingDialog';
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
}

export default function GoalSection() {
  const { data: session } = useSession();
  const [goals, setGoals] = useState<GoalData[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!session?.user?.id) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/goals');
        if (res.ok && !cancelled) {
          const json = await res.json();
          setGoals(json.goals || []);
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
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} onDelete={handleDelete} />
          ))}
        </Box>
      )}

      <GoalSettingDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
      />
    </Box>
  );
}
