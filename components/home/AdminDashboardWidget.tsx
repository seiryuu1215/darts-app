'use client';

import { useMemo } from 'react';
import { Paper, Typography, Box, Chip, Divider, LinearProgress } from '@mui/material';
import InsightsIcon from '@mui/icons-material/Insights';
import { COLOR_01, COLOR_CRICKET, COLOR_COUNTUP, getFlightColor } from '@/lib/dartslive-colors';
import { getRatingTarget } from '@/lib/dartslive-rating';

interface RecentPlay {
  date: string;
  gameId: string;
  gameName: string;
  score: number;
  awards?: Record<string, number>;
}

interface EnrichedData {
  maxRating: number | null;
  maxRatingDate: string | null;
  stats01Detailed: {
    avg: number | null;
    best: number | null;
    winRate: number | null;
    bullRate: number | null;
    arrangeRate: number | null;
    avgBust: number | null;
    avg100: number | null;
  } | null;
  statsCricketDetailed: {
    avg: number | null;
    best: number | null;
    winRate: number | null;
    tripleRate: number | null;
    openCloseRate: number | null;
    avg100: number | null;
  } | null;
  bestRecords:
    | { gameId: string; gameName: string; bestScore: number; bestDate: string | null }[]
    | null;
  gameAverages: { gameId: string; gameName: string; average: number; playCount: number }[] | null;
  apiSyncAt: string | null;
}

interface DailyRecord {
  date: string;
  rating: number | null;
  stats01Avg: number | null;
  statsCriAvg: number | null;
}

interface AdminDashboardWidgetProps {
  recentPlays: RecentPlay[] | null;
  enrichedData: EnrichedData | null;
  dailyHistory: DailyRecord[];
  flight?: string;
}

const GAME_COLORS: Record<string, string> = {
  '01': COLOR_01,
  'ZERO-ONE': COLOR_01,
  'STANDARD CRICKET': COLOR_CRICKET,
  CRICKET: COLOR_CRICKET,
  'COUNT-UP': COLOR_COUNTUP,
};

function getGameColor(name: string): string {
  for (const [key, color] of Object.entries(GAME_COLORS)) {
    if (name.toUpperCase().includes(key)) return color;
  }
  return '#9e9e9e';
}

export default function AdminDashboardWidget({
  recentPlays,
  enrichedData,
  dailyHistory,
  flight,
}: AdminDashboardWidgetProps) {
  // 今日のプレイ
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayPlays = useMemo(
    () => (recentPlays ?? []).filter((p) => p.date.startsWith(todayStr)),
    [recentPlays, todayStr],
  );

  // 今日のゲーム内訳
  const todayBreakdown = useMemo(() => {
    const map: Record<string, { count: number; bestScore: number }> = {};
    for (const p of todayPlays) {
      const name = p.gameName || p.gameId;
      if (!map[name]) map[name] = { count: 0, bestScore: 0 };
      map[name].count++;
      if (p.score > map[name].bestScore) map[name].bestScore = p.score;
    }
    return Object.entries(map).map(([name, data]) => ({ name, ...data }));
  }, [todayPlays]);

  // クイック目標進捗
  const currentRating = dailyHistory.length > 0 ? dailyHistory[0]?.rating : null;
  const ppd = enrichedData?.stats01Detailed?.avg ?? null;
  const mpr = enrichedData?.statsCricketDetailed?.avg ?? null;
  const target = ppd != null && mpr != null ? getRatingTarget(ppd, mpr) : null;
  const flightColor = flight ? getFlightColor(flight) : '#808080';

  // 最新5件
  const latest5 = useMemo(() => (recentPlays ?? []).slice(0, 5), [recentPlays]);

  if (!recentPlays || recentPlays.length === 0) return null;

  return (
    <Paper sx={{ p: 2, mb: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <InsightsIcon sx={{ color: COLOR_COUNTUP, fontSize: 20 }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
          APIダッシュボード
        </Typography>
        <Chip label="ADMIN" size="small" color="error" sx={{ fontSize: 10, height: 18 }} />
      </Box>

      {/* 今日のプレイサマリー */}
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          mb: 2,
          p: 1.5,
          borderRadius: 1,
          bgcolor: 'action.hover',
          flexWrap: 'wrap',
        }}
      >
        <Box>
          <Typography variant="caption" color="text.secondary">
            今日のプレイ
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            {todayPlays.length}
            <Typography component="span" variant="body2" color="text.secondary">
              {' '}
              ゲーム
            </Typography>
          </Typography>
        </Box>
        {todayPlays.length > 0 && (
          <Box>
            <Typography variant="caption" color="text.secondary">
              ベストスコア
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: COLOR_COUNTUP }}>
              {Math.max(...todayPlays.map((p) => p.score))}
            </Typography>
          </Box>
        )}
        {todayBreakdown.length > 0 && (
          <Box>
            <Typography variant="caption" color="text.secondary">
              内訳
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.3 }}>
              {todayBreakdown.map((g) => (
                <Chip
                  key={g.name}
                  label={`${g.name} ${g.count}`}
                  size="small"
                  sx={{
                    fontSize: 10,
                    height: 20,
                    bgcolor: getGameColor(g.name),
                    color: '#fff',
                  }}
                />
              ))}
            </Box>
          </Box>
        )}
      </Box>

      {/* クイック目標進捗 */}
      {target && currentRating != null && !target.ppd01Only.achieved && (
        <>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
            目標: Rt.{target.nextRating}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: flightColor,
                boxShadow: `0 0 4px ${flightColor}`,
              }}
            />
            <Typography variant="caption" color="text.secondary">
              Rt.{currentRating.toFixed(2)}
            </Typography>
            <Box sx={{ flex: 1 }}>
              <LinearProgress
                variant="determinate"
                value={((currentRating - Math.floor(currentRating)) / 1) * 100}
                sx={{
                  height: 4,
                  borderRadius: 2,
                  bgcolor: 'action.hover',
                  '& .MuiLinearProgress-bar': { borderRadius: 2, bgcolor: flightColor },
                }}
              />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5 }}>
            <Typography variant="caption" color="text.secondary">
              01: {target.ppdBalanced.achieved ? '達成' : `+${target.ppdBalanced.gap.toFixed(2)}`}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Cri: {target.mprBalanced.achieved ? '達成' : `+${target.mprBalanced.gap.toFixed(2)}`}
            </Typography>
          </Box>
        </>
      )}

      <Divider sx={{ my: 1 }} />

      {/* 最近のプレイ結果 */}
      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
        最近のプレイ
      </Typography>
      {latest5.map((play, i) => (
        <Box
          key={`${play.date}-${i}`}
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            py: 0.5,
            borderBottom: i < latest5.length - 1 ? '1px solid' : 'none',
            borderColor: 'divider',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 3,
                height: 24,
                borderRadius: 1,
                bgcolor: getGameColor(play.gameName || play.gameId),
              }}
            />
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>
                {play.gameName || play.gameId}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
                {new Date(play.date).toLocaleDateString('ja-JP', {
                  month: 'numeric',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Typography>
            </Box>
          </Box>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            {play.score}
          </Typography>
        </Box>
      ))}
    </Paper>
  );
}
