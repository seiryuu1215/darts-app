'use client';

import { Paper, Typography, Box } from '@mui/material';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { getDartoutLabel } from '@/lib/dartout-labels';

interface DartoutItem {
  score: number;
  count: number;
}

interface DartoutAnalysisCardProps {
  dartoutList: DartoutItem[];
}

export default function DartoutAnalysisCard({ dartoutList }: DartoutAnalysisCardProps) {
  if (!dartoutList || dartoutList.length === 0) return null;

  // スコア降順→上位10件
  const sorted = [...dartoutList].sort((a, b) => b.count - a.count).slice(0, 10);

  const totalFinishes = dartoutList.reduce((sum, d) => sum + d.count, 0);
  const topFinish = sorted[0];
  const avgFinishScore = dartoutList.reduce((sum, d) => sum + d.score * d.count, 0) / totalFinishes;

  const chartData = sorted.map((d) => {
    const label = getDartoutLabel(d.score);
    return {
      name: label ? `${d.score} (${label})` : `${d.score}`,
      count: d.count,
    };
  });

  return (
    <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
        フィニッシュ分析
      </Typography>

      {/* サマリー */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="caption" color="text.secondary">
            総フィニッシュ
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            {totalFinishes}
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">
            最多フィニッシュ
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            {topFinish.score}
            {getDartoutLabel(topFinish.score) && ` (${getDartoutLabel(topFinish.score)})`}
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">
            平均フィニッシュスコア
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            {avgFinishScore.toFixed(1)}
          </Typography>
        </Box>
      </Box>

      {/* 横棒グラフ */}
      <ResponsiveContainer width="100%" height={Math.max(200, sorted.length * 32)}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
          <XAxis type="number" fontSize={11} tick={{ fill: '#aaa' }} />
          <YAxis type="category" dataKey="name" width={100} fontSize={11} tick={{ fill: '#ccc' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e1e1e',
              border: '1px solid #444',
              borderRadius: 6,
              color: '#ccc',
            }}
          />
          <Bar dataKey="count" name="回数" radius={[0, 4, 4, 0]}>
            {chartData.map((_, idx) => (
              <Cell key={idx} fill={idx === 0 ? '#FF9800' : '#666'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Paper>
  );
}
