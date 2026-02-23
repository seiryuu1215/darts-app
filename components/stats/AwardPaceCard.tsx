'use client';

import { useMemo } from 'react';
import { Paper, Typography, Box, Chip, LinearProgress } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import { analyzeAwards } from '@/lib/award-analysis';
import type { AwardPace, Milestone } from '@/lib/award-analysis';

interface AwardEntry {
  date: string;
  awards: Record<string, number>;
}

interface AwardPaceCardProps {
  awardList: AwardEntry[];
}

function TrendIcon({ trend }: { trend: 'up' | 'down' | 'flat' }) {
  if (trend === 'up') return <TrendingUpIcon sx={{ fontSize: 14, color: '#4caf50' }} />;
  if (trend === 'down') return <TrendingDownIcon sx={{ fontSize: 14, color: '#f44336' }} />;
  return <TrendingFlatIcon sx={{ fontSize: 14, color: '#FF9800' }} />;
}

function PaceItem({ pace }: { pace: AwardPace }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        py: 0.8,
        borderBottom: '1px solid #222',
        '&:last-child': { borderBottom: 'none' },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1 }}>
        <TrendIcon trend={pace.trend} />
        <Typography variant="body2" sx={{ fontWeight: 'bold', minWidth: 100 }}>
          {pace.awardName}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="caption" color="text.secondary">
            合計
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            {pace.totalCount.toLocaleString()}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="caption" color="text.secondary">
            月平均
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            {pace.monthlyAvg}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="caption" color="text.secondary">
            直近3ヶ月
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: pace.trendColor }}>
            {pace.recentMonthlyAvg}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

function MilestoneItem({ milestone }: { milestone: Milestone }) {
  const progress = Math.round((milestone.currentCount / milestone.targetCount) * 100);

  return (
    <Box sx={{ mb: 1.5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.3 }}>
        <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#ccc' }}>
          {milestone.awardName} → {milestone.targetCount.toLocaleString()}回
        </Typography>
        <Typography variant="caption" color="text.secondary">
          あと{milestone.remaining.toLocaleString()}回 ({milestone.estimatedDate}頃)
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{
          height: 6,
          borderRadius: 3,
          bgcolor: 'rgba(255,255,255,0.08)',
          '& .MuiLinearProgress-bar': {
            borderRadius: 3,
            bgcolor: progress >= 80 ? '#4caf50' : progress >= 50 ? '#FF9800' : '#2196f3',
          },
        }}
      />
      <Typography variant="caption" color="text.secondary" sx={{ fontSize: 9 }}>
        {milestone.currentCount.toLocaleString()} / {milestone.targetCount.toLocaleString()} (
        {progress}%) — 約{milestone.estimatedMonths}ヶ月後
      </Typography>
    </Box>
  );
}

export default function AwardPaceCard({ awardList }: AwardPaceCardProps) {
  const analysis = useMemo(() => analyzeAwards(awardList), [awardList]);

  if (!analysis) return null;

  const { paces, milestones, totalAwards, monthsCovered } = analysis;

  return (
    <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
          アワードペース＆マイルストーン
        </Typography>
        <Chip
          label={`${monthsCovered}ヶ月分`}
          size="small"
          sx={{ fontSize: 10, height: 20 }}
          variant="outlined"
        />
      </Box>

      {/* 全体サマリー */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="caption" color="text.secondary">
            総アワード数
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            {totalAwards.toLocaleString()}
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">
            月平均取得
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            {monthsCovered > 0 ? Math.round(totalAwards / monthsCovered) : 0}
          </Typography>
        </Box>
      </Box>

      {/* ペース一覧 */}
      <Box sx={{ mb: 2 }}>
        {paces.slice(0, 8).map((pace) => (
          <PaceItem key={pace.awardName} pace={pace} />
        ))}
      </Box>

      {/* マイルストーン予測 */}
      {milestones.length > 0 && (
        <>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mt: 2, mb: 1, color: '#aaa' }}>
            マイルストーン予測
          </Typography>
          {milestones.slice(0, 5).map((m) => (
            <MilestoneItem key={`${m.awardName}-${m.targetCount}`} milestone={m} />
          ))}
        </>
      )}
    </Paper>
  );
}
