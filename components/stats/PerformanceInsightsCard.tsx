'use client';

import { useMemo } from 'react';
import { Paper, Typography, Alert, Box } from '@mui/material';

interface EnrichedData {
  maxRating: number | null;
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
}

interface PerformanceInsightsCardProps {
  enrichedData: EnrichedData;
  currentRating?: number | null;
}

interface Insight {
  message: string;
  severity: 'success' | 'info' | 'warning';
}

export default function PerformanceInsightsCard({
  enrichedData,
  currentRating,
}: PerformanceInsightsCardProps) {
  const insights = useMemo(() => {
    const result: Insight[] = [];
    const s01 = enrichedData.stats01Detailed;
    const sCri = enrichedData.statsCricketDetailed;

    // 01 vs Cricket 勝率比較
    if (s01?.winRate != null && sCri?.winRate != null) {
      if (s01.winRate > sCri.winRate + 5) {
        result.push({
          message: '01の方が得意です。Cricketの勝率向上が課題です。',
          severity: 'info',
        });
      } else if (sCri.winRate > s01.winRate + 5) {
        result.push({
          message: 'Cricketが得意です。01の安定性を上げるとさらに強くなれます。',
          severity: 'info',
        });
      }
    }

    // アレンジ率
    if (s01?.arrangeRate != null) {
      if (s01.arrangeRate < 20) {
        result.push({
          message: `アレンジ成功率が${s01.arrangeRate}%と低め。フィニッシュ練習を重点的に。`,
          severity: 'warning',
        });
      } else if (s01.arrangeRate >= 35) {
        result.push({
          message: `アレンジ成功率${s01.arrangeRate}%は高水準。フィニッシュ力が武器です。`,
          severity: 'success',
        });
      }
    }

    // Bull率
    if (s01?.bullRate != null) {
      if (s01.bullRate >= 30) {
        result.push({
          message: `Bull率${s01.bullRate}%は高水準。01の安定感につながっています。`,
          severity: 'success',
        });
      } else if (s01.bullRate < 15) {
        result.push({
          message: `Bull率${s01.bullRate}%。ブル練習で01スタッツが大幅向上する可能性があります。`,
          severity: 'warning',
        });
      }
    }

    // 80% vs 100% 比較
    if (s01?.avg != null && s01?.avg100 != null && s01.avg > 0) {
      const ratio = s01.avg100 / s01.avg;
      if (ratio > 1.15) {
        result.push({
          message: '好調時のパフォーマンスは高いです。安定性向上が鍵になります。',
          severity: 'info',
        });
      }
    }

    // レーティング差
    if (enrichedData.maxRating != null && currentRating != null) {
      const diff = enrichedData.maxRating - currentRating;
      if (diff >= 2) {
        result.push({
          message: `最高Rt.${enrichedData.maxRating}から-${diff.toFixed(0)}。復調の余地があります。`,
          severity: 'warning',
        });
      } else if (diff <= 0) {
        result.push({
          message: '現在のレーティングが最高値です。好調を維持しましょう。',
          severity: 'success',
        });
      }
    }

    // トリプル率 vs Open-Close率
    if (sCri?.tripleRate != null && sCri?.openCloseRate != null) {
      if (sCri.tripleRate > sCri.openCloseRate + 10) {
        result.push({
          message:
            'トリプル率に対してOpen-Close率が低め。クローズ判断の改善で勝率アップが見込めます。',
          severity: 'info',
        });
      } else if (sCri.openCloseRate > sCri.tripleRate + 10) {
        result.push({
          message: 'Open-Close率が高く、戦術面が優秀です。トリプル率を上げればさらに強くなれます。',
          severity: 'info',
        });
      }
    }

    return result;
  }, [enrichedData, currentRating]);

  if (insights.length === 0) return null;

  return (
    <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1.5 }}>
        パフォーマンスインサイト
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {insights.map((insight, idx) => (
          <Alert key={idx} severity={insight.severity} variant="outlined" sx={{ py: 0.5 }}>
            {insight.message}
          </Alert>
        ))}
      </Box>
    </Paper>
  );
}
