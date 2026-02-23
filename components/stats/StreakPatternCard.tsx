'use client';

import { useMemo } from 'react';
import { Paper, Typography, Box, Chip } from '@mui/material';
import WhatshotIcon from '@mui/icons-material/Whatshot';

interface DailyRecord {
  date: string;
  rating: number | null;
  stats01Avg: number | null;
  statsCriAvg: number | null;
}

interface StreakPatternCardProps {
  dailyHistory: DailyRecord[];
}

interface StreakInfo {
  type: 'rise' | 'fall' | 'plateau';
  length: number;
  startDate: string;
  endDate: string;
}

interface PatternAnalysis {
  currentStreak: StreakInfo | null;
  longestRise: StreakInfo | null;
  longestFall: StreakInfo | null;
  longestPlateau: StreakInfo | null;
  hotStreak: { length: number; maxRating: number; period: string } | null;
  recoverySpeed: number | null; // 下降から回復までの平均日数
  activeDays: number;
  totalDays: number;
  playFrequency: number; // 週あたりのプレイ日数
}

function analyzeStreaks(records: DailyRecord[]): PatternAnalysis | null {
  const sorted = [...records]
    .filter((r) => r.rating != null)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (sorted.length < 5) return null;

  const streaks: StreakInfo[] = [];
  let currentType: 'rise' | 'fall' | 'plateau' = 'plateau';
  let streakStart = 0;

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1].rating!;
    const curr = sorted[i].rating!;
    const diff = curr - prev;

    let type: 'rise' | 'fall' | 'plateau';
    if (diff > 0.05) type = 'rise';
    else if (diff < -0.05) type = 'fall';
    else type = 'plateau';

    if (type !== currentType && i > 0) {
      streaks.push({
        type: currentType,
        length: i - streakStart,
        startDate: sorted[streakStart].date,
        endDate: sorted[i - 1].date,
      });
      streakStart = i;
      currentType = type;
    }
  }
  // 最後のストリーク
  streaks.push({
    type: currentType,
    length: sorted.length - streakStart,
    startDate: sorted[streakStart].date,
    endDate: sorted[sorted.length - 1].date,
  });

  const rises = streaks.filter((s) => s.type === 'rise');
  const falls = streaks.filter((s) => s.type === 'fall');
  const plateaus = streaks.filter((s) => s.type === 'plateau');

  const longestRise =
    rises.length > 0 ? rises.reduce((a, b) => (b.length > a.length ? b : a)) : null;
  const longestFall =
    falls.length > 0 ? falls.reduce((a, b) => (b.length > a.length ? b : a)) : null;
  const longestPlateau =
    plateaus.length > 0 ? plateaus.reduce((a, b) => (b.length > a.length ? b : a)) : null;

  // ホットストリーク: 連続上昇でレーティングが最も上がった期間
  let hotStreak: PatternAnalysis['hotStreak'] = null;
  if (longestRise) {
    const startIdx = sorted.findIndex((r) => r.date === longestRise.startDate);
    const endIdx = sorted.findIndex((r) => r.date === longestRise.endDate);
    if (startIdx >= 0 && endIdx >= 0) {
      const maxRating = Math.max(...sorted.slice(startIdx, endIdx + 1).map((r) => r.rating!));
      hotStreak = {
        length: longestRise.length,
        maxRating,
        period: `${longestRise.startDate.replace(/^\d{4}-/, '')} ~ ${longestRise.endDate.replace(/^\d{4}-/, '')}`,
      };
    }
  }

  // リカバリー速度: 下降ストリーク後、元のレーティングに戻るまでの日数
  const recoveryDays: number[] = [];
  for (let i = 0; i < streaks.length; i++) {
    if (streaks[i].type === 'fall' && i + 1 < streaks.length) {
      const fallEnd = sorted.findIndex((r) => r.date === streaks[i].endDate);
      if (fallEnd >= 0) {
        const preRating = sorted[fallEnd - streaks[i].length]?.rating;
        if (preRating != null) {
          // 次のストリーク以降で元に戻る日を探す
          for (let j = fallEnd + 1; j < sorted.length; j++) {
            if (sorted[j].rating! >= preRating) {
              recoveryDays.push(j - fallEnd);
              break;
            }
          }
        }
      }
    }
  }
  const recoverySpeed =
    recoveryDays.length > 0
      ? Math.round(recoveryDays.reduce((a, b) => a + b, 0) / recoveryDays.length)
      : null;

  // プレイ頻度
  const firstDate = new Date(sorted[0].date);
  const lastDate = new Date(sorted[sorted.length - 1].date);
  const totalDays = Math.max(
    1,
    Math.ceil((lastDate.getTime() - firstDate.getTime()) / (24 * 60 * 60 * 1000)),
  );
  const weeks = totalDays / 7;
  const playFrequency = Math.round((sorted.length / weeks) * 10) / 10;

  return {
    currentStreak: streaks[streaks.length - 1],
    longestRise,
    longestFall,
    longestPlateau,
    hotStreak,
    recoverySpeed,
    activeDays: sorted.length,
    totalDays,
    playFrequency,
  };
}

function StreakChip({ streak, label }: { streak: StreakInfo; label: string }) {
  const colorMap = { rise: '#4caf50', fall: '#f44336', plateau: '#FF9800' };
  return (
    <Box
      sx={{
        p: 1,
        borderRadius: 1,
        bgcolor: `${colorMap[streak.type]}11`,
        border: `1px solid ${colorMap[streak.type]}33`,
        textAlign: 'center',
        minWidth: 90,
      }}
    >
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body1" sx={{ fontWeight: 'bold', color: colorMap[streak.type] }}>
        {streak.length}日
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ fontSize: 9 }}>
        {streak.startDate.replace(/^\d{4}-/, '')} ~ {streak.endDate.replace(/^\d{4}-/, '')}
      </Typography>
    </Box>
  );
}

export default function StreakPatternCard({ dailyHistory }: StreakPatternCardProps) {
  const analysis = useMemo(() => analyzeStreaks(dailyHistory), [dailyHistory]);

  if (!analysis) return null;

  const currentStreakColor =
    analysis.currentStreak?.type === 'rise'
      ? '#4caf50'
      : analysis.currentStreak?.type === 'fall'
        ? '#f44336'
        : '#FF9800';

  const currentStreakLabel =
    analysis.currentStreak?.type === 'rise'
      ? '連続上昇中'
      : analysis.currentStreak?.type === 'fall'
        ? '連続下降中'
        : '横ばい';

  return (
    <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
          ストリーク＆パターン
        </Typography>
        {analysis.currentStreak && (
          <Chip
            label={`${currentStreakLabel} ${analysis.currentStreak.length}日`}
            size="small"
            sx={{
              fontSize: 10,
              height: 20,
              bgcolor: `${currentStreakColor}22`,
              color: currentStreakColor,
              border: `1px solid ${currentStreakColor}`,
            }}
          />
        )}
      </Box>

      {/* プレイ頻度 */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="caption" color="text.secondary">
            アクティブ日数
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            {analysis.activeDays}日 / {analysis.totalDays}日
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">
            週あたりプレイ
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            {analysis.playFrequency}日/週
          </Typography>
        </Box>
        {analysis.recoverySpeed != null && (
          <Box>
            <Typography variant="caption" color="text.secondary">
              平均リカバリー
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
              {analysis.recoverySpeed}日
            </Typography>
          </Box>
        )}
      </Box>

      {/* ストリーク記録 */}
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1.5 }}>
        {analysis.longestRise && <StreakChip streak={analysis.longestRise} label="最長上昇" />}
        {analysis.longestFall && <StreakChip streak={analysis.longestFall} label="最長下降" />}
        {analysis.longestPlateau && (
          <StreakChip streak={analysis.longestPlateau} label="最長横ばい" />
        )}
      </Box>

      {/* ホットストリーク */}
      {analysis.hotStreak && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            p: 1,
            borderRadius: 1,
            bgcolor: 'rgba(255,152,0,0.1)',
            border: '1px solid rgba(255,152,0,0.3)',
          }}
        >
          <WhatshotIcon sx={{ color: '#FF9800' }} />
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              ホットストリーク: {analysis.hotStreak.length}日連続上昇
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {analysis.hotStreak.period} (最高 Rt.{analysis.hotStreak.maxRating.toFixed(2)})
            </Typography>
          </Box>
        </Box>
      )}
    </Paper>
  );
}
