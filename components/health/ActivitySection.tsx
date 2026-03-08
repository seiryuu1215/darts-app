'use client';

import { Box, Paper, Typography } from '@mui/material';
import DirectionsWalkIcon from '@mui/icons-material/DirectionsWalk';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import TimerIcon from '@mui/icons-material/Timer';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { HealthMetric } from '@/types';
import { CATEGORY_COLORS } from './constants';
import { formatDate, getTrend } from './utils';
import { HealthCard } from './HealthCard';
import { ChartTooltip } from './ChartTooltip';
import { RingChart } from './RingChart';

export function ActivitySection({
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
