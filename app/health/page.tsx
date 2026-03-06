'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  Alert,
  AlertTitle,
  LinearProgress,
  Drawer,
  IconButton,
  Skeleton,
  Container,
} from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import BedtimeIcon from '@mui/icons-material/Bedtime';
import DirectionsWalkIcon from '@mui/icons-material/DirectionsWalk';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import AirIcon from '@mui/icons-material/Air';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import SyncIcon from '@mui/icons-material/Sync';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import TimerIcon from '@mui/icons-material/Timer';
import CloseIcon from '@mui/icons-material/Close';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { HealthMetric, HealthInsight } from '@/types';
import { generateHealthInsights } from '@/lib/health-analytics';
import {
  isNativePlatform,
  syncHealthData,
  syncHealthDataRange,
  requestHealthKitPermissions,
  checkHealthKitAuthorization,
  isHealthKitSetupComplete,
  markHealthKitSetupComplete,
  getLastSyncDate,
  autoSyncIfNeeded,
  type SyncProgress,
} from '@/lib/capacitor/health-sync';

// ============================================
// 定数
// ============================================

const PERIOD_OPTIONS = [
  { label: '1日', days: 1 },
  { label: '7日', days: 7 },
  { label: '14日', days: 14 },
  { label: '30日', days: 30 },
] as const;

const CATEGORY_COLORS = {
  heart: { primary: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  sleep: { primary: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
  activity: { primary: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
  vitals: { primary: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
};

// ============================================
// ユーティリティ
// ============================================

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function formatMinutesToHM(minutes: number | null): string {
  if (minutes === null) return '--';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h${m > 0 ? `${m}m` : ''}`;
}

function getTrend(current: number | null, previous: number | null): 'up' | 'down' | 'flat' | null {
  if (current === null || previous === null) return null;
  const diff = current - previous;
  const pct = Math.abs(diff / previous) * 100;
  if (pct < 2) return 'flat';
  return diff > 0 ? 'up' : 'down';
}

function TrendIcon({
  trend,
  goodDirection = 'up',
}: {
  trend: 'up' | 'down' | 'flat' | null;
  goodDirection?: 'up' | 'down';
}) {
  if (!trend || trend === 'flat')
    return <TrendingFlatIcon sx={{ fontSize: 14, color: '#71717a' }} />;
  const isGood = trend === goodDirection;
  const color = isGood ? '#22c55e' : '#ef4444';
  if (trend === 'up') return <TrendingUpIcon sx={{ fontSize: 14, color }} />;
  return <TrendingDownIcon sx={{ fontSize: 14, color }} />;
}

// ============================================
// リングチャート (SVG)
// ============================================

function RingChart({
  value,
  max,
  size = 64,
  strokeWidth = 5,
  color,
  children,
}: {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  children?: React.ReactNode;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(value / max, 1);
  const offset = circumference * (1 - progress);

  return (
    <Box
      sx={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
      }}
    >
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#333"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.7s ease-out' }}
        />
      </svg>
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

// ============================================
// 睡眠ステージバー
// ============================================

function SleepStageBar({ metric }: { metric: HealthMetric }) {
  const total = metric.timeInBedMinutes || metric.sleepDurationMinutes || 0;
  if (total === 0) return null;

  const deep = metric.sleepDeepMinutes || 0;
  const rem = metric.sleepRemMinutes || 0;
  const core = metric.sleepCoreMinutes || 0;
  const awake = metric.sleepAwakeMinutes || 0;
  const light = Math.max(0, (metric.sleepDurationMinutes || 0) - deep - rem - core);

  const stages = [
    { label: '深い', minutes: deep, color: '#6d28d9' },
    { label: 'コア', minutes: core, color: '#7c3aed' },
    { label: 'REM', minutes: rem, color: '#a78bfa' },
    { label: '浅い', minutes: light, color: '#c4b5fd' },
    { label: '覚醒', minutes: awake, color: '#3f3f46' },
  ].filter((s) => s.minutes > 0);

  return (
    <Box>
      <Box sx={{ display: 'flex', height: 24, borderRadius: 2, overflow: 'hidden' }}>
        {stages.map((stage, i) => (
          <Box
            key={i}
            sx={{
              width: `${(stage.minutes / total) * 100}%`,
              backgroundColor: stage.color,
              transition: 'all 0.5s',
            }}
          />
        ))}
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 1 }}>
        {stages.map((stage, i) => (
          <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: stage.color }} />
            <Typography variant="caption" sx={{ fontSize: 10, color: '#a1a1aa' }}>
              {stage.label} {formatMinutesToHM(stage.minutes)}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

// ============================================
// ヘルスメトリクスカード
// ============================================

function HealthCard({
  icon,
  label,
  value,
  unit,
  trend,
  trendGoodDirection = 'up',
  color,
  subLabel,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number | null;
  unit: string;
  trend?: 'up' | 'down' | 'flat' | null;
  trendGoodDirection?: 'up' | 'down';
  color: { primary: string; bg: string };
  subLabel?: string;
  onClick?: () => void;
}) {
  return (
    <Paper
      onClick={onClick}
      sx={{
        p: 1.5,
        borderRadius: 2,
        border: '1px solid',
        borderColor: `${color.primary}20`,
        bgcolor: 'rgba(24,24,27,0.8)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.1s',
        '&:active': onClick ? { transform: 'scale(0.98)' } : {},
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Box
            sx={{
              borderRadius: 1,
              p: 0.5,
              bgcolor: color.bg,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {icon}
          </Box>
          <Typography variant="caption" sx={{ fontSize: 11, color: '#a1a1aa', fontWeight: 500 }}>
            {label}
          </Typography>
        </Box>
        {trend && <TrendIcon trend={trend} goodDirection={trendGoodDirection} />}
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, color: '#fafafa' }}>
          {value ?? '--'}
        </Typography>
        <Typography variant="caption" sx={{ color: '#71717a' }}>
          {unit}
        </Typography>
      </Box>
      {subLabel && (
        <Typography variant="caption" sx={{ fontSize: 11, color: '#71717a', mt: 0.25 }}>
          {subLabel}
        </Typography>
      )}
      {onClick && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5 }}>
          <ChevronRightIcon sx={{ fontSize: 14, color: '#52525b' }} />
        </Box>
      )}
    </Paper>
  );
}

// ============================================
// カスタムTooltip
// ============================================

function ChartTooltip({
  active,
  payload,
  label,
  unit,
}: {
  active?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: Array<{ value: number; color: string }>;
  label?: string;
  unit?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <Paper sx={{ px: 1.5, py: 1, bgcolor: '#1e1e1e', border: '1px solid #444', borderRadius: 1.5 }}>
      <Typography variant="caption" sx={{ fontSize: 10, color: '#a1a1aa' }}>
        {label}
      </Typography>
      {payload.map((p, i) => (
        <Typography
          key={i}
          variant="body2"
          sx={{ fontFamily: 'monospace', fontWeight: 500, color: p.color }}
        >
          {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
          {unit && (
            <Typography
              component="span"
              variant="caption"
              sx={{ ml: 0.5, color: '#71717a', fontSize: 10 }}
            >
              {unit}
            </Typography>
          )}
        </Typography>
      ))}
    </Paper>
  );
}

// ============================================
// カテゴリセクション: 心臓
// ============================================

function HeartSection({
  metrics,
  latest,
  previousLatest,
  onDetailOpen,
}: {
  metrics: HealthMetric[];
  latest: HealthMetric | null;
  previousLatest: HealthMetric | null;
  onDetailOpen: (type: string) => void;
}) {
  const chartData = useMemo(
    () =>
      [...metrics].reverse().map((m) => ({
        date: formatDate(m.metricDate),
        rhr: m.restingHr,
        hrv: m.hrvSdnn,
      })),
    [metrics],
  );

  const color = CATEGORY_COLORS.heart;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 0.5 }}>
        <FavoriteIcon sx={{ fontSize: 16, color: color.primary }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          心臓
        </Typography>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
        <HealthCard
          icon={<FavoriteIcon sx={{ fontSize: 14, color: color.primary }} />}
          label="安静時心拍"
          value={latest?.restingHr ?? null}
          unit="bpm"
          trend={getTrend(latest?.restingHr ?? null, previousLatest?.restingHr ?? null)}
          trendGoodDirection="down"
          color={color}
          onClick={() => onDetailOpen('rhr')}
        />
        <HealthCard
          icon={<MonitorHeartIcon sx={{ fontSize: 14, color: color.primary }} />}
          label="HRV"
          value={latest?.hrvSdnn ?? null}
          unit="ms"
          trend={getTrend(latest?.hrvSdnn ?? null, previousLatest?.hrvSdnn ?? null)}
          trendGoodDirection="up"
          color={color}
          onClick={() => onDetailOpen('hrv')}
        />
      </Box>

      {chartData.length > 1 && (
        <Paper
          sx={{
            p: 1.5,
            borderRadius: 2,
            border: '1px solid rgba(255,255,255,0.05)',
            bgcolor: 'rgba(24,24,27,0.8)',
          }}
        >
          <Typography
            variant="caption"
            sx={{ fontSize: 11, color: '#71717a', mb: 1, display: 'block' }}
          >
            安静時心拍の推移
          </Typography>
          <ResponsiveContainer width="100%" height={120}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="rhrGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: '#71717a' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={['dataMin - 5', 'dataMax + 5']}
                tick={{ fontSize: 10, fill: '#71717a' }}
                axisLine={false}
                tickLine={false}
                width={30}
              />
              <Tooltip content={<ChartTooltip unit="bpm" />} />
              <Area
                type="monotone"
                dataKey="rhr"
                stroke="#ef4444"
                fill="url(#rhrGradient)"
                strokeWidth={2}
                dot={false}
                connectNulls
              />
            </AreaChart>
          </ResponsiveContainer>
        </Paper>
      )}
    </Box>
  );
}

// ============================================
// カテゴリセクション: 睡眠
// ============================================

function SleepSection({
  metrics,
  latest,
  previousLatest,
  onDetailOpen,
}: {
  metrics: HealthMetric[];
  latest: HealthMetric | null;
  previousLatest: HealthMetric | null;
  onDetailOpen: (type: string) => void;
}) {
  const chartData = useMemo(
    () =>
      [...metrics].reverse().map((m) => ({
        date: formatDate(m.metricDate),
        hours: m.sleepDurationMinutes ? Math.round((m.sleepDurationMinutes / 60) * 10) / 10 : null,
      })),
    [metrics],
  );

  const color = CATEGORY_COLORS.sleep;
  const sleepHours = latest?.sleepDurationMinutes
    ? Math.round((latest.sleepDurationMinutes / 60) * 10) / 10
    : null;
  const prevSleepHours = previousLatest?.sleepDurationMinutes
    ? Math.round((previousLatest.sleepDurationMinutes / 60) * 10) / 10
    : null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 0.5 }}>
        <BedtimeIcon sx={{ fontSize: 16, color: color.primary }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          睡眠
        </Typography>
      </Box>

      <HealthCard
        icon={<BedtimeIcon sx={{ fontSize: 14, color: color.primary }} />}
        label="睡眠時間"
        value={sleepHours}
        unit="時間"
        trend={getTrend(sleepHours, prevSleepHours)}
        trendGoodDirection="up"
        color={color}
        subLabel={
          latest?.sleepDeepMinutes
            ? `深い睡眠 ${formatMinutesToHM(latest.sleepDeepMinutes)}`
            : undefined
        }
        onClick={() => onDetailOpen('sleep')}
      />

      {latest && (latest.sleepDeepMinutes || latest.sleepRemMinutes) && (
        <Paper
          sx={{
            p: 1.5,
            borderRadius: 2,
            border: '1px solid rgba(255,255,255,0.05)',
            bgcolor: 'rgba(24,24,27,0.8)',
          }}
        >
          <Typography
            variant="caption"
            sx={{ fontSize: 11, color: '#71717a', mb: 1, display: 'block' }}
          >
            睡眠ステージ
          </Typography>
          <SleepStageBar metric={latest} />
        </Paper>
      )}

      {chartData.length > 1 && (
        <Paper
          sx={{
            p: 1.5,
            borderRadius: 2,
            border: '1px solid rgba(255,255,255,0.05)',
            bgcolor: 'rgba(24,24,27,0.8)',
          }}
        >
          <Typography
            variant="caption"
            sx={{ fontSize: 11, color: '#71717a', mb: 1, display: 'block' }}
          >
            睡眠時間の推移
          </Typography>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: '#71717a' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 'dataMax + 1']}
                tick={{ fontSize: 10, fill: '#71717a' }}
                axisLine={false}
                tickLine={false}
                width={24}
              />
              <Tooltip content={<ChartTooltip unit="h" />} />
              <Bar dataKey="hours" radius={[4, 4, 0, 0]} maxBarSize={20}>
                {chartData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.hours !== null && entry.hours < 6 ? '#7c3aed' : '#a78bfa'}
                    fillOpacity={entry.hours !== null && entry.hours < 6 ? 1 : 0.7}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      )}
    </Box>
  );
}

// ============================================
// カテゴリセクション: アクティビティ
// ============================================

function ActivitySection({
  metrics,
  latest,
  previousLatest,
  onDetailOpen,
}: {
  metrics: HealthMetric[];
  latest: HealthMetric | null;
  previousLatest: HealthMetric | null;
  onDetailOpen: (type: string) => void;
}) {
  const color = CATEGORY_COLORS.activity;
  const stepsGoal = 8000;
  const exerciseGoal = 30;
  const standGoal = 12;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 0.5 }}>
        <LocalFireDepartmentIcon sx={{ fontSize: 16, color: color.primary }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          アクティビティ
        </Typography>
      </Box>

      {/* Activity Rings */}
      {latest && (latest.steps !== null || latest.exerciseMinutes !== null) && (
        <Paper
          sx={{
            p: 2,
            borderRadius: 2,
            border: '1px solid rgba(255,255,255,0.05)',
            bgcolor: 'rgba(24,24,27,0.8)',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.75 }}>
              <RingChart
                value={latest.steps || 0}
                max={stepsGoal}
                size={72}
                strokeWidth={6}
                color="#22c55e"
              >
                <DirectionsWalkIcon sx={{ fontSize: 16, color: '#22c55e' }} />
              </RingChart>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#fafafa' }}>
                  {(latest.steps || 0).toLocaleString()}
                </Typography>
                <Typography variant="caption" sx={{ fontSize: 10, color: '#71717a' }}>
                  歩数
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.75 }}>
              <RingChart
                value={latest.exerciseMinutes || 0}
                max={exerciseGoal}
                size={72}
                strokeWidth={6}
                color="#eab308"
              >
                <TimerIcon sx={{ fontSize: 16, color: '#eab308' }} />
              </RingChart>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#fafafa' }}>
                  {latest.exerciseMinutes || 0}
                </Typography>
                <Typography variant="caption" sx={{ fontSize: 10, color: '#71717a' }}>
                  エクササイズ(分)
                </Typography>
              </Box>
            </Box>

            {latest.standHours !== null && (
              <Box
                sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.75 }}
              >
                <RingChart
                  value={latest.standHours || 0}
                  max={standGoal}
                  size={72}
                  strokeWidth={6}
                  color="#06b6d4"
                >
                  <FitnessCenterIcon sx={{ fontSize: 16, color: '#06b6d4' }} />
                </RingChart>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#fafafa' }}>
                    {latest.standHours || 0}
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: 10, color: '#71717a' }}>
                    スタンド(時間)
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
        </Paper>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
        <HealthCard
          icon={<DirectionsWalkIcon sx={{ fontSize: 14, color: color.primary }} />}
          label="歩数"
          value={latest?.steps?.toLocaleString() ?? null}
          unit="歩"
          trend={getTrend(latest?.steps ?? null, previousLatest?.steps ?? null)}
          color={color}
          onClick={() => onDetailOpen('steps')}
        />
        <HealthCard
          icon={<LocalFireDepartmentIcon sx={{ fontSize: 14, color: color.primary }} />}
          label="アクティブカロリー"
          value={latest?.activeEnergyKcal ? Math.round(latest.activeEnergyKcal) : null}
          unit="kcal"
          trend={getTrend(
            latest?.activeEnergyKcal ?? null,
            previousLatest?.activeEnergyKcal ?? null,
          )}
          color={color}
          onClick={() => onDetailOpen('calories')}
        />
      </Box>

      {/* 歩数チャート */}
      {metrics.length > 1 && (
        <Paper
          sx={{
            p: 1.5,
            borderRadius: 2,
            border: '1px solid rgba(255,255,255,0.05)',
            bgcolor: 'rgba(24,24,27,0.8)',
          }}
        >
          <Typography
            variant="caption"
            sx={{ fontSize: 11, color: '#71717a', mb: 1, display: 'block' }}
          >
            歩数の推移
          </Typography>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart
              data={[...metrics].reverse().map((m) => ({
                date: formatDate(m.metricDate),
                steps: m.steps,
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: '#71717a' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#71717a' }}
                axisLine={false}
                tickLine={false}
                width={36}
              />
              <Tooltip content={<ChartTooltip unit="歩" />} />
              <Bar
                dataKey="steps"
                fill="#22c55e"
                fillOpacity={0.7}
                radius={[4, 4, 0, 0]}
                maxBarSize={20}
              />
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      )}
    </Box>
  );
}

// ============================================
// カテゴリセクション: バイタル
// ============================================

function VitalsSection({
  latest,
  previousLatest,
}: {
  latest: HealthMetric | null;
  previousLatest: HealthMetric | null;
}) {
  const color = CATEGORY_COLORS.vitals;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 0.5 }}>
        <WaterDropIcon sx={{ fontSize: 16, color: color.primary }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          バイタル
        </Typography>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
        <HealthCard
          icon={<AirIcon sx={{ fontSize: 14, color: color.primary }} />}
          label="呼吸数"
          value={latest?.respiratoryRate ?? null}
          unit="回/分"
          trend={getTrend(latest?.respiratoryRate ?? null, previousLatest?.respiratoryRate ?? null)}
          trendGoodDirection="down"
          color={color}
        />
        <HealthCard
          icon={<WaterDropIcon sx={{ fontSize: 14, color: color.primary }} />}
          label="SpO2"
          value={latest?.bloodOxygenPct ?? null}
          unit="%"
          trend={getTrend(latest?.bloodOxygenPct ?? null, previousLatest?.bloodOxygenPct ?? null)}
          trendGoodDirection="up"
          color={color}
        />
      </Box>
    </Box>
  );
}

// ============================================
// 詳細ドロワー
// ============================================

function DetailDrawer({
  open,
  onClose,
  type,
  metrics,
}: {
  open: boolean;
  onClose: () => void;
  type: string;
  metrics: HealthMetric[];
}) {
  const config = useMemo(() => {
    switch (type) {
      case 'rhr':
        return {
          title: '安静時心拍',
          color: '#ef4444',
          unit: 'bpm',
          getValue: (m: HealthMetric) => m.restingHr,
        };
      case 'hrv':
        return {
          title: 'HRV (SDNN)',
          color: '#ef4444',
          unit: 'ms',
          getValue: (m: HealthMetric) => m.hrvSdnn,
        };
      case 'sleep':
        return {
          title: '睡眠時間',
          color: '#a78bfa',
          unit: 'h',
          getValue: (m: HealthMetric) =>
            m.sleepDurationMinutes ? Math.round((m.sleepDurationMinutes / 60) * 10) / 10 : null,
        };
      case 'steps':
        return {
          title: '歩数',
          color: '#22c55e',
          unit: '歩',
          getValue: (m: HealthMetric) => m.steps,
        };
      case 'calories':
        return {
          title: 'アクティブカロリー',
          color: '#22c55e',
          unit: 'kcal',
          getValue: (m: HealthMetric) =>
            m.activeEnergyKcal ? Math.round(m.activeEnergyKcal) : null,
        };
      default:
        return { title: '', color: '#fff', unit: '', getValue: () => null };
    }
  }, [type]);

  const chartData = useMemo(
    () =>
      [...metrics]
        .reverse()
        .map((m) => ({ date: formatDate(m.metricDate), value: config.getValue(m) })),
    [metrics, config],
  );

  const values = chartData.map((d) => d.value).filter((v): v is number => v !== null);
  const avg =
    values.length > 0
      ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10
      : null;
  const min = values.length > 0 ? Math.min(...values) : null;
  const max = values.length > 0 ? Math.max(...values) : null;

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '80vh' } }}
    >
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            {config.title}
          </Typography>
          <IconButton size="small" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          {[
            { label: '平均', value: avg },
            { label: '最小', value: min },
            { label: '最大', value: max },
          ].map((stat) => (
            <Paper key={stat.label} variant="outlined" sx={{ flex: 1, p: 1, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                {stat.label}
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                {stat.value !== null ? stat.value.toLocaleString() : '--'}
              </Typography>
            </Paper>
          ))}
        </Box>

        {chartData.length > 0 && (
          <Box sx={{ width: '100%', height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="detailGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={config.color} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={config.color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: '#71717a' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#71717a' }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                />
                <Tooltip content={<ChartTooltip unit={config.unit} />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={config.color}
                  fill="url(#detailGradient)"
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        )}
      </Box>
    </Drawer>
  );
}

// ============================================
// メインページ
// ============================================

export default function HealthPage() {
  const [metrics, setMetrics] = useState<HealthMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<number>(7);
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);
  const [setupNeeded, setSetupNeeded] = useState(false);
  const [isNative, setIsNative] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [detailType, setDetailType] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const addLog = (msg: string) => setDebugLog((prev) => [...prev, `${new Date().toLocaleTimeString()} ${msg}`]);

  // ヘルスデータ取得
  const fetchMetrics = useCallback(async (days: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/health-metrics?days=${days}`);
      if (res.ok) {
        const data = await res.json();
        setMetrics(data.metrics || []);
      }
    } catch (err) {
      console.error('Failed to fetch health metrics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 初期化
  useEffect(() => {
    const native = isNativePlatform();
    setIsNative(native);

    if (native) {
      setSetupNeeded(!isHealthKitSetupComplete());
      const ls = getLastSyncDate();
      setLastSync(ls ? ls.toLocaleString('ja-JP') : null);

      // 自動同期
      autoSyncIfNeeded().then((result) => {
        if (result?.success) {
          setLastSync(new Date().toLocaleString('ja-JP'));
          fetchMetrics(period);
        }
      });
    }

    fetchMetrics(period);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 期間変更
  useEffect(() => {
    fetchMetrics(period);
  }, [period, fetchMetrics]);

  // 初回セットアップ
  const handleSetup = async () => {
    setSyncing(true);
    setSyncError(null);
    setDebugLog([]);
    try {
      // プラグイン直接呼び出し（ヘルパー関数を経由しない）
      const { registerPlugin } = await import('@capacitor/core');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const plugin = registerPlugin<any>('HealthKitPlugin');

      addLog('1. 権限リクエスト...');
      const authResult = await plugin.requestAuthorization();
      addLog('1. 結果: ' + JSON.stringify(authResult));

      addLog('2. 今日のデータ読み取り...');
      const metrics = await plugin.readTodayMetrics();
      addLog('2. メトリクス: ' + JSON.stringify(metrics).substring(0, 200));

      if (!metrics || !metrics.metricDate) {
        setSyncError('HealthKitデータの取得に失敗しました');
        setSyncing(false);
        return;
      }

      // セットアップでは権限取得+データ読み取り確認のみ
      // Firestore書き込みはautoSyncに任せる（Firebase Auth非同期のため）
      addLog('3. セットアップ完了処理...');
      markHealthKitSetupComplete();
      setSetupNeeded(false);
      addLog('4. セットアップ完了！データ同期は自動で実行されます');
    } catch (err) {
      addLog('エラー: ' + (err instanceof Error ? err.message : String(err)));
      setSyncError(err instanceof Error ? err.message : 'セットアップに失敗しました');
    } finally {
      setSyncing(false);
      setSyncProgress(null);
    }
  };

  // 手動同期（プラグイン直接呼び出し）
  const handleSync = async () => {
    setSyncing(true);
    setSyncError(null);
    setDebugLog([]);
    try {
      const { registerPlugin } = await import('@capacitor/core');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const plugin = registerPlugin<any>('HealthKitPlugin');

      addLog('1. データ読み取り...');
      const metrics = await plugin.readTodayMetrics();
      addLog('1. 完了: ' + (metrics?.metricDate ?? 'null'));

      if (!metrics?.metricDate) {
        setSyncError('HealthKitデータの取得に失敗しました');
        return;
      }

      addLog('2. Firestore書き込み...');
      const { getAuth } = await import('firebase/auth');
      const user = getAuth().currentUser;

      if (!user) {
        // Firebase Auth未認証 — onAuthStateChangedで待つ
        addLog('2. Firebase Auth待機中...');
        const firebaseUser = await new Promise<import('firebase/auth').User | null>((resolve) => {
          const unsub = getAuth().onAuthStateChanged((u) => {
            unsub();
            resolve(u);
          });
          setTimeout(() => resolve(null), 5000); // 5秒タイムアウト
        });
        if (!firebaseUser) {
          addLog('2. Firebase未認証のためスキップ');
          setSyncError('Firebaseにログインしていません');
          return;
        }
        addLog('2. Firebase user: ' + firebaseUser.uid);
        await writeMetricsToFirestore(firebaseUser.uid, metrics);
      } else {
        addLog('2. Firebase user: ' + user.uid);
        await writeMetricsToFirestore(user.uid, metrics);
      }

      addLog('3. 同期完了！');
      setLastSync(new Date().toLocaleString('ja-JP'));
      await fetchMetrics(period);
    } catch (err) {
      addLog('エラー: ' + (err instanceof Error ? err.message : String(err)));
      setSyncError(err instanceof Error ? err.message : '同期に失敗しました');
    } finally {
      setSyncing(false);
    }
  };

  // Firestoreに直接書き込む
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const writeMetricsToFirestore = async (uid: string, metrics: any) => {
    const { doc, writeBatch, serverTimestamp } = await import('firebase/firestore');
    const { db } = await import('@/lib/firebase');
    const batch = writeBatch(db);
    const ref = doc(db, 'users', uid, 'healthMetrics', metrics.metricDate);
    batch.set(ref, { ...metrics, source: 'capacitor', syncedAt: serverTimestamp() }, { merge: true });
    await batch.commit();
  };

  const latest = metrics.length > 0 ? metrics[0] : null;
  const previousLatest = metrics.length > 1 ? metrics[1] : null;

  const insights = useMemo(() => generateHealthInsights(metrics), [metrics]);

  return (
    <Container maxWidth="sm" sx={{ py: 2, px: { xs: 1.5, sm: 2 } }}>
      {/* タイトル */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <HealthAndSafetyIcon sx={{ color: '#22c55e' }} />
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          ヘルスケア
        </Typography>
      </Box>

      {/* HealthKitセットアップ（ネイティブ限定） */}
      {isNative && setupNeeded && (
        <Paper
          sx={{ p: 2, mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'primary.main' }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
            HealthKit連携を設定
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Apple Healthのデータを同期して、体調とダーツパフォーマンスの関係を分析します。
          </Typography>
          <Button
            variant="contained"
            onClick={handleSetup}
            disabled={syncing}
            startIcon={<HealthAndSafetyIcon />}
            fullWidth
          >
            {syncing ? 'セットアップ中...' : 'HealthKitを有効化'}
          </Button>
          {syncProgress && syncProgress.phase === 'writing' && (
            <Box sx={{ mt: 1 }}>
              <LinearProgress
                variant="determinate"
                value={(syncProgress.current / syncProgress.total) * 100}
              />
              <Typography variant="caption" color="text.secondary">
                {syncProgress.current} / {syncProgress.total} 日分を同期中...
              </Typography>
            </Box>
          )}
          {syncError && (
            <Alert severity="error" sx={{ mt: 1 }}>
              {syncError}
            </Alert>
          )}
          {debugLog.length > 0 && (
            <Box
              sx={{
                mt: 1,
                p: 1,
                bgcolor: '#111',
                borderRadius: 1,
                maxHeight: 150,
                overflow: 'auto',
              }}
            >
              {debugLog.map((log, i) => (
                <Typography key={i} variant="caption" sx={{ display: 'block', fontFamily: 'monospace', color: '#0f0', fontSize: 10 }}>
                  {log}
                </Typography>
              ))}
            </Box>
          )}
        </Paper>
      )}

      {/* 同期バー（ネイティブ限定） */}
      {isNative && !setupNeeded && (
        <Box
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}
        >
          <Typography variant="caption" color="text.secondary">
            {lastSync ? `最終同期: ${lastSync}` : '未同期'}
          </Typography>
          <Button
            size="small"
            startIcon={<SyncIcon sx={{ fontSize: 14 }} />}
            onClick={handleSync}
            disabled={syncing}
            sx={{ fontSize: 12 }}
          >
            同期
          </Button>
        </Box>
      )}

      {/* デバッグログ（同期時も表示） */}
      {!setupNeeded && debugLog.length > 0 && (
        <Box sx={{ mb: 1.5, p: 1, bgcolor: '#111', borderRadius: 1, maxHeight: 150, overflow: 'auto' }}>
          {debugLog.map((log, i) => (
            <Typography key={i} variant="caption" sx={{ display: 'block', fontFamily: 'monospace', color: '#0f0', fontSize: 10 }}>
              {log}
            </Typography>
          ))}
          {syncError && <Alert severity="error" sx={{ mt: 1 }}>{syncError}</Alert>}
        </Box>
      )}

      {/* 期間セレクター */}
      <ToggleButtonGroup
        value={period}
        exclusive
        onChange={(_, v) => v !== null && setPeriod(v)}
        size="small"
        fullWidth
        sx={{ mb: 2 }}
      >
        {PERIOD_OPTIONS.map((opt) => (
          <ToggleButton key={opt.days} value={opt.days} sx={{ fontSize: 12, py: 0.5 }}>
            {opt.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      {/* ローディング */}
      {loading && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Skeleton variant="rounded" height={100} />
          <Skeleton variant="rounded" height={100} />
          <Skeleton variant="rounded" height={100} />
        </Box>
      )}

      {/* コンテンツ */}
      {!loading && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* インサイト */}
          {insights.length > 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {insights.map((insight, i) => (
                <Alert
                  key={i}
                  severity={
                    insight.severity === 'critical'
                      ? 'error'
                      : insight.severity === 'warning'
                        ? 'warning'
                        : 'info'
                  }
                  variant="outlined"
                  sx={{ borderRadius: 2 }}
                >
                  <AlertTitle sx={{ fontSize: 12 }}>
                    {insight.type === 'correlation'
                      ? '相関分析'
                      : insight.type === 'trend'
                        ? 'トレンド'
                        : '警告'}
                  </AlertTitle>
                  <Typography variant="body2" sx={{ fontSize: 13 }}>
                    {insight.messageJa}
                  </Typography>
                </Alert>
              ))}
            </Box>
          )}

          {/* データなし */}
          {metrics.length === 0 && (
            <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 2 }}>
              <HealthAndSafetyIcon sx={{ fontSize: 48, color: '#52525b', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                ヘルスデータがありません
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {isNative
                  ? 'HealthKitを連携してデータを同期してください'
                  : 'iOSアプリからHealthKitデータを同期してください'}
              </Typography>
            </Paper>
          )}

          {/* セクション */}
          {metrics.length > 0 && (
            <>
              <HeartSection
                metrics={metrics}
                latest={latest}
                previousLatest={previousLatest}
                onDetailOpen={setDetailType}
              />
              <SleepSection
                metrics={metrics}
                latest={latest}
                previousLatest={previousLatest}
                onDetailOpen={setDetailType}
              />
              <ActivitySection
                metrics={metrics}
                latest={latest}
                previousLatest={previousLatest}
                onDetailOpen={setDetailType}
              />
              <VitalsSection latest={latest} previousLatest={previousLatest} />
            </>
          )}
        </Box>
      )}

      {/* 詳細ドロワー */}
      <DetailDrawer
        open={detailType !== null}
        onClose={() => setDetailType(null)}
        type={detailType || ''}
        metrics={metrics}
      />
    </Container>
  );
}
