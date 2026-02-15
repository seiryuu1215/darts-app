'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
} from '@mui/material';
import { GOAL_TYPES, getMonthlyRange, getYearlyRange } from '@/lib/goals';
import type { GoalType, GoalPeriod } from '@/types';

const MONTHLY_LIMIT = 3;
const YEARLY_LIMIT = 1;

interface GoalSettingDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    type: GoalType;
    period: GoalPeriod;
    target: number;
    startDate: string;
    endDate: string;
  }) => void;
  activeMonthly: number;
  activeYearly: number;
}

export default function GoalSettingDialog({
  open,
  onClose,
  onSave,
  activeMonthly,
  activeYearly,
}: GoalSettingDialogProps) {
  const [type, setType] = useState<GoalType>('bulls');
  const [target, setTarget] = useState('');

  const goalDef = GOAL_TYPES.find((g) => g.type === type);
  const period = goalDef?.periods[0] || 'monthly';

  const isMonthlyFull = activeMonthly >= MONTHLY_LIMIT;
  const isYearlyFull = activeYearly >= YEARLY_LIMIT;
  const isPeriodDisabled = period === 'monthly' ? isMonthlyFull : isYearlyFull;

  const handleSave = () => {
    if (!target || Number(target) <= 0 || isPeriodDisabled) return;

    const range = period === 'monthly' ? getMonthlyRange() : getYearlyRange();

    onSave({
      type,
      period,
      target: Number(target),
      startDate: range.startDate.toISOString().split('T')[0],
      endDate: range.endDate.toISOString().split('T')[0],
    });

    setType('bulls');
    setTarget('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>目標を設定</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <FormControl fullWidth size="small">
            <InputLabel>目標タイプ</InputLabel>
            <Select
              value={type}
              label="目標タイプ"
              onChange={(e) => {
                setType(e.target.value as GoalType);
                const def = GOAL_TYPES.find((g) => g.type === e.target.value);
                const defaultTarget = def?.defaultTargets[def.periods[0] as 'monthly' | 'yearly'];
                if (defaultTarget) setTarget(String(defaultTarget));
              }}
            >
              {GOAL_TYPES.map((g) => {
                const gPeriod = g.periods[0];
                const disabled =
                  (gPeriod === 'monthly' && isMonthlyFull) ||
                  (gPeriod === 'yearly' && isYearlyFull);
                return (
                  <MenuItem key={g.type} value={g.type} disabled={disabled}>
                    {g.label} ({g.periods.includes('monthly') ? '月間' : '年間'})
                    {disabled && ' - 上限'}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>

          {isPeriodDisabled && (
            <Typography variant="caption" color="error">
              {period === 'monthly'
                ? `月間目標の上限（${MONTHLY_LIMIT}つ）に達しています`
                : `年間目標の上限（${YEARLY_LIMIT}つ）に達しています`}
            </Typography>
          )}

          <TextField
            label={`目標値${goalDef?.unit ? ` (${goalDef.unit})` : ''}`}
            type="number"
            size="small"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder={goalDef?.defaultTargets[period as 'monthly' | 'yearly']?.toString() || ''}
            disabled={isPeriodDisabled}
          />

          <Typography variant="caption" color="text.secondary">
            月間: {activeMonthly}/{MONTHLY_LIMIT} ・ 年間: {activeYearly}/{YEARLY_LIMIT}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!target || Number(target) <= 0 || isPeriodDisabled}
        >
          設定
        </Button>
      </DialogActions>
    </Dialog>
  );
}
