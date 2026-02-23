'use client';

import { useMemo } from 'react';
import { Paper, Typography, Box } from '@mui/material';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { getDartoutLabel } from '@/lib/dartout-labels';
import { analyzeDartout } from '@/lib/dartout-analysis';

interface DartoutItem {
  score: number;
  count: number;
}

interface DartoutAnalysisCardProps {
  dartoutList: DartoutItem[];
}

const TOOLTIP_STYLE = {
  backgroundColor: '#1e1e1e',
  border: '1px solid #444',
  borderRadius: 6,
  color: '#ccc',
};

export default function DartoutAnalysisCard({ dartoutList }: DartoutAnalysisCardProps) {
  const analysis = useMemo(
    () => (dartoutList && dartoutList.length > 0 ? analyzeDartout(dartoutList) : null),
    [dartoutList],
  );

  if (!dartoutList || dartoutList.length === 0) return null;

  // カウント降順→上位10件
  const sorted = [...dartoutList].sort((a, b) => b.count - a.count).slice(0, 10);
  const topFinish = sorted[0];

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
        フィニッシュナンバー分析
      </Typography>

      {/* サマリー */}
      <Box sx={{ display: 'flex', gap: 2, mb: 1.5, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="caption" color="text.secondary">
            総フィニッシュ
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            {analysis?.totalFinishes ?? 0}
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">
            最多ナンバー
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            {topFinish.score}
            {getDartoutLabel(topFinish.score) && ` (${getDartoutLabel(topFinish.score)})`}
          </Typography>
        </Box>
        {analysis && (
          <Box>
            <Typography variant="caption" color="text.secondary">
              Bullフィニッシュ率
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
              {analysis.bullFinishPercentage}%
            </Typography>
          </Box>
        )}
      </Box>

      {/* 横棒グラフ（TOP10） */}
      <ResponsiveContainer width="100%" height={Math.max(200, sorted.length * 32)}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
          <XAxis type="number" fontSize={11} tick={{ fill: '#aaa' }} />
          <YAxis type="category" dataKey="name" width={100} fontSize={11} tick={{ fill: '#ccc' }} />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Bar dataKey="count" name="回数" radius={[0, 4, 4, 0]}>
            {chartData.map((_, idx) => (
              <Cell key={idx} fill={idx === 0 ? '#FF9800' : '#666'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* タイプ別集計 */}
      {analysis && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 1,
            mt: 1.5,
            p: 1.5,
            borderRadius: 1,
            bgcolor: 'rgba(255,255,255,0.03)',
            border: '1px solid #333',
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              ダブル率
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              {analysis.typeBreakdown.doubleRate}%
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              シングル率
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              {analysis.typeBreakdown.singleRate}%
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Bull率
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
              {analysis.typeBreakdown.bullRate}%
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              トリプル率
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              {analysis.typeBreakdown.tripleRate}%
            </Typography>
          </Box>
        </Box>
      )}
    </Paper>
  );
}
