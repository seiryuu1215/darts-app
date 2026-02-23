'use client';

import { useMemo } from 'react';
import { Paper, Typography, Box } from '@mui/material';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
} from 'recharts';
import { getDartoutLabel } from '@/lib/dartout-labels';
import { analyzeDartout } from '@/lib/dartout-analysis';

interface DartoutItem {
  score: number;
  count: number;
}

interface DartoutAnalysisCardProps {
  dartoutList: DartoutItem[];
  arrangeRate?: number | null;
}

const TOOLTIP_STYLE = {
  backgroundColor: '#1e1e1e',
  border: '1px solid #444',
  borderRadius: 6,
  color: '#ccc',
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mt: 2.5, mb: 1, color: '#aaa' }}>
      {children}
    </Typography>
  );
}

export default function DartoutAnalysisCard({
  dartoutList,
  arrangeRate,
}: DartoutAnalysisCardProps) {
  const analysis = useMemo(
    () => (dartoutList && dartoutList.length > 0 ? analyzeDartout(dartoutList) : null),
    [dartoutList],
  );

  if (!dartoutList || dartoutList.length === 0) return null;

  // スコア降順→上位10件
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
        フィニッシュ分析
      </Typography>

      {/* サマリー */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
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
            {analysis?.avgFinishScore.toFixed(1) ?? '--'}
          </Typography>
        </Box>
        {analysis && (
          <Box>
            <Typography variant="caption" color="text.secondary">
              中央値
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              {analysis.medianFinishScore.toFixed(0)}
            </Typography>
          </Box>
        )}
      </Box>

      {/* クラッチ率 & Bull & アレンジ率 */}
      {analysis && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
            gap: 1.5,
            p: 1.5,
            borderRadius: 1,
            bgcolor: 'rgba(255,255,255,0.03)',
            border: '1px solid #333',
            mb: 2,
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              クラッチ率
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontWeight: 'bold',
                color: analysis.clutchRatio >= 20 ? '#4caf50' : '#ff9800',
              }}
            >
              {analysis.clutchRatio}%
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: 9 }}>
              40+フィニッシュ
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Bullフィニッシュ
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
              {analysis.bullFinishPercentage}%
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: 9 }}>
              {analysis.bullFinishCount}回
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              低スコア率
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontWeight: 'bold',
                color: analysis.lowFinishRatio > 50 ? '#ff9800' : '#4caf50',
              }}
            >
              {analysis.lowFinishRatio}%
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: 9 }}>
              20以下
            </Typography>
          </Box>
          {arrangeRate != null && (
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                アレンジ率
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  fontWeight: 'bold',
                  color: arrangeRate >= 25 ? '#4caf50' : arrangeRate >= 15 ? '#ff9800' : '#f44336',
                }}
              >
                {arrangeRate}%
              </Typography>
            </Box>
          )}
        </Box>
      )}

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

      {/* フィニッシュスコア帯分布 */}
      {analysis && analysis.finishRanges.length > 0 && (
        <>
          <SectionTitle>フィニッシュスコア帯分布</SectionTitle>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={analysis.finishRanges}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="label" fontSize={11} tick={{ fill: '#aaa' }} />
              <YAxis fontSize={11} tick={{ fill: '#aaa' }} />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(v: number | undefined) => [`${v ?? 0}回`, '回数']}
              />
              <Bar dataKey="count" name="回数" fill="#E53935" radius={[4, 4, 0, 0]}>
                {analysis.finishRanges.map((r, idx) => (
                  <Cell
                    key={idx}
                    fill={r.max >= 40 ? '#FF9800' : r.max >= 20 ? '#E53935' : '#666'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </>
      )}

      {/* ダブル使用傾向 TOP5 */}
      {analysis && analysis.doublePreferences.length > 0 && (
        <>
          <SectionTitle>ダブル使用傾向</SectionTitle>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {analysis.doublePreferences.slice(0, 8).map((d) => (
              <Box
                key={d.score}
                sx={{
                  p: 1,
                  borderRadius: 1,
                  bgcolor: d.isDouble ? 'rgba(229,57,53,0.15)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${d.isDouble ? '#E53935' : '#333'}`,
                  textAlign: 'center',
                  minWidth: 60,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 'bold', color: d.isDouble ? '#E53935' : '#aaa' }}
                >
                  {d.label}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {d.count}回 ({d.percentage}%)
                </Typography>
              </Box>
            ))}
          </Box>
        </>
      )}
    </Paper>
  );
}
