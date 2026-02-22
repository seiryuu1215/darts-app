'use client';

import { useState, useMemo } from 'react';
import { Paper, Typography, Box, ToggleButtonGroup, ToggleButton } from '@mui/material';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { computeStats, buildHistogram, calculateConsistency } from '@/lib/stats-math';

interface RecentPlay {
  date: string;
  gameId: string;
  gameName: string;
  score: number;
  awards?: Record<string, number>;
}

interface ScoreDistributionCardProps {
  recentPlays: RecentPlay[];
}

export default function ScoreDistributionCard({ recentPlays }: ScoreDistributionCardProps) {
  // ゲーム名でグループ化
  const gameGroups = useMemo(() => {
    if (!recentPlays || recentPlays.length === 0) return {};
    const groups: Record<string, number[]> = {};
    for (const play of recentPlays) {
      const name = play.gameName || play.gameId;
      if (!groups[name]) groups[name] = [];
      groups[name].push(play.score);
    }
    return groups;
  }, [recentPlays]);

  const gameNames = Object.keys(gameGroups);
  const [selectedGame, setSelectedGame] = useState(gameNames[0] || '');

  const scores = gameGroups[selectedGame] || [];

  if (!recentPlays || recentPlays.length === 0 || scores.length === 0) return null;

  const stats = computeStats(scores);
  const consistency = calculateConsistency(scores);
  const binSize = scores.some((s) => s > 500) ? 50 : scores.some((s) => s > 100) ? 20 : 10;
  const histogram = buildHistogram(scores, binSize);

  // 標準偏差
  const stdDev = consistency?.stdDev ?? 0;

  return (
    <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
        スコア分布
      </Typography>

      {/* ゲーム切替 */}
      {gameNames.length > 1 && (
        <ToggleButtonGroup
          value={selectedGame}
          exclusive
          onChange={(_, v) => {
            if (v) setSelectedGame(v);
          }}
          size="small"
          sx={{ mb: 1.5, flexWrap: 'wrap' }}
        >
          {gameNames.slice(0, 6).map((name) => (
            <ToggleButton key={name} value={name} sx={{ fontSize: 11, px: 1 }}>
              {name}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      )}

      {/* 基本統計量 */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="caption" color="text.secondary">
            平均
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            {stats.avg.toFixed(1)}
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">
            中央値
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            {stats.median.toFixed(1)}
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">
            最大
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            {stats.max}
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">
            最小
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            {stats.min}
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">
            標準偏差
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            {stdDev.toFixed(1)}
          </Typography>
        </Box>
      </Box>

      {/* ヒストグラム */}
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={histogram}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis
            dataKey="range"
            fontSize={10}
            tick={{ fill: '#aaa' }}
            angle={-30}
            textAnchor="end"
            height={50}
          />
          <YAxis fontSize={11} tick={{ fill: '#aaa' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e1e1e',
              border: '1px solid #444',
              borderRadius: 6,
              color: '#ccc',
            }}
          />
          <Bar dataKey="count" name="回数" fill="#43A047" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        {scores.length}件のプレイデータ
      </Typography>
    </Paper>
  );
}
