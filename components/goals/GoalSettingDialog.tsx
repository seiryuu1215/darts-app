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
import { GOAL_TYPES, getDailyRange, getMonthlyRange, getYearlyRange } from '@/lib/goals';
import type { GoalType, GoalPeriod } from '@/types';

const DAILY_LIMIT = 3;
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
  }) => Promise<string | null>;
  activeDaily: number;
  activeMonthly: number;
  activeYearly: number;
}

export default function GoalSettingDialog({
  open,
  onClose,
  onSave,
  activeDaily,
  activeMonthly,
  activeYearly,
}: GoalSettingDialogProps) {
  const [type, setType] = useState<GoalType>('bulls');
  const [period, setPeriod] = useState<GoalPeriod>('daily');
  const [target, setTarget] = useState('');
  const [error, setError] = useState('');

  const goalDef = GOAL_TYPES.find((g) => g.type === type);
  const availablePeriods = goalDef?.periods ?? ['monthly'];

  const isDailyFull = activeDaily >= DAILY_LIMIT;
  const isMonthlyFull = activeMonthly >= MONTHLY_LIMIT;
  const isYearlyFull = activeYearly >= YEARLY_LIMIT;
  const isPeriodDisabled =
    period === 'daily' ? isDailyFull : period === 'monthly' ? isMonthlyFull : isYearlyFull;

  const handleSave = async () => {
    if (!target || Number(target) <= 0 || isPeriodDisabled) return;
    setError('');

    const range =
      period === 'daily'
        ? getDailyRange()
        : period === 'monthly'
          ? getMonthlyRange()
          : getYearlyRange();

    const err = await onSave({
      type,
      period,
      target: Number(target),
      startDate: range.startDate.toISOString(),
      endDate: range.endDate.toISOString(),
    });

    if (err) {
      setError(err);
      return;
    }

    setType('bulls');
    setPeriod('daily');
    setTarget('');
    setError('');
    onClose();
  };

  const handleTypeChange = (newType: GoalType) => {
    setType(newType);
    const def = GOAL_TYPES.find((g) => g.type === newType);
    if (def) {
      // 新タイプで現在の期間が使えなければ最初の期間に切り替え
      const newPeriod = def.periods.includes(period) ? period : def.periods[0];
      setPeriod(newPeriod);
      const defaultTarget = def.defaultTargets[newPeriod as keyof typeof def.defaultTargets];
      if (defaultTarget) setTarget(String(defaultTarget));
    }
  };

  const handlePeriodChange = (newPeriod: GoalPeriod) => {
    setPeriod(newPeriod);
    if (goalDef) {
      const defaultTarget = goalDef.defaultTargets[newPeriod as keyof typeof goalDef.defaultTargets];
      if (defaultTarget) setTarget(String(defaultTarget));
    }
  };

  const periodLabel = (p: GoalPeriod) =>
    p === 'daily' ? '日間' : p === 'monthly' ? '月間' : '年間';

  const isPeriodOptionDisabled = (p: GoalPeriod) =>
    (p === 'daily' && isDailyFull) ||
    (p === 'monthly' && isMonthlyFull) ||
    (p === 'yearly' && isYearlyFull);

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
              onChange={(e) => handleTypeChange(e.target.value as GoalType)}
            >
              {GOAL_TYPES.map((g) => (
                <MenuItem key={g.type} value={g.type}>
                  {g.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {availablePeriods.length > 1 && (
            <FormControl fullWidth size="small">
              <InputLabel>期間</InputLabel>
              <Select
                value={period}
                label="期間"
                onChange={(e) => handlePeriodChange(e.target.value as GoalPeriod)}
              >
                {availablePeriods.map((p) => (
                  <MenuItem key={p} value={p} disabled={isPeriodOptionDisabled(p)}>
                    {periodLabel(p)}
                    {isPeriodOptionDisabled(p) && ' - 上限'}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {isPeriodDisabled && (
            <Typography variant="caption" color="error">
              {periodLabel(period)}目標の上限（
              {period === 'daily' ? DAILY_LIMIT : period === 'monthly' ? MONTHLY_LIMIT : YEARLY_LIMIT}
              つ）に達しています
            </Typography>
          )}

          <TextField
            label={`目標値${goalDef?.unit ? ` (${goalDef.unit})` : ''}`}
            type="number"
            size="small"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder={
              goalDef?.defaultTargets[period as keyof typeof goalDef.defaultTargets]?.toString() || ''
            }
            disabled={isPeriodDisabled}
          />

          {error && (
            <Typography variant="caption" color="error">
              {error}
            </Typography>
          )}

          <Typography variant="caption" color="text.secondary">
            日間: {activeDaily}/{DAILY_LIMIT} ・ 月間: {activeMonthly}/{MONTHLY_LIMIT} ・ 年間:{' '}
            {activeYearly}/{YEARLY_LIMIT}
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
