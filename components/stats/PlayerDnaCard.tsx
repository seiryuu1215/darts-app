'use client';

import { useMemo } from 'react';
import { Paper, Typography, Box, LinearProgress } from '@mui/material';
import { getPercentile, getPercentileColor, getPercentileLabel } from '@/lib/dartslive-percentile';
import { calc01Rating, calcCriRating } from '@/lib/dartslive-rating';
import { COLOR_01, COLOR_CRICKET, COLOR_COUNTUP } from '@/lib/dartslive-colors';

interface Stats01Detailed {
  avg: number | null;
  best: number | null;
  winRate: number | null;
  bullRate: number | null;
  arrangeRate: number | null;
  avgBust: number | null;
  avg100: number | null;
}

interface StatsCricketDetailed {
  avg: number | null;
  best: number | null;
  winRate: number | null;
  tripleRate: number | null;
  openCloseRate: number | null;
  avg100: number | null;
}

interface PlayerDnaCardProps {
  stats01: Stats01Detailed | null;
  statsCricket: StatsCricketDetailed | null;
  countupAvg: number | null;
}

type PlayerType = '01特化型' | 'Cricket特化型' | 'バランス型' | 'COUNT-UP特化型';

interface SkillBar {
  label: string;
  value: number | null;
  percentile: number;
  color: string;
  displayValue: string;
}

function classifyPlayerType(
  o1Rt: number | null,
  criRt: number | null,
  cuPercentile: number | null,
): { type: PlayerType; color: string } {
  if (o1Rt == null && criRt == null) return { type: 'バランス型', color: '#FF9800' };

  const o1 = o1Rt ?? 0;
  const cri = criRt ?? 0;
  const diff = o1 - cri;

  // COUNT-UP特化の場合
  if (cuPercentile != null && cuPercentile < 20 && o1 < 5 && cri < 5) {
    return { type: 'COUNT-UP特化型', color: COLOR_COUNTUP };
  }

  if (diff > 1.5) return { type: '01特化型', color: COLOR_01 };
  if (diff < -1.5) return { type: 'Cricket特化型', color: COLOR_CRICKET };
  return { type: 'バランス型', color: '#FF9800' };
}

function generateSummary(
  playerType: PlayerType,
  skills: SkillBar[],
  stats01: Stats01Detailed | null,
  statsCricket: StatsCricketDetailed | null,
): string {
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  for (const s of skills) {
    if (s.percentile <= 15) strengths.push(s.label);
    else if (s.percentile > 50) weaknesses.push(s.label);
  }

  let summary = '';

  switch (playerType) {
    case '01特化型':
      summary = '01ゲームが得意なプレイヤーです。';
      break;
    case 'Cricket特化型':
      summary = 'Cricketが得意なプレイヤーです。';
      break;
    case 'COUNT-UP特化型':
      summary = 'COUNT-UPのスコアが高いプレイヤーです。';
      break;
    default:
      summary = '01とCricketのバランスが取れたプレイヤーです。';
  }

  if (strengths.length > 0) {
    summary += `${strengths.join('・')}が強みです。`;
  }

  if (weaknesses.length > 0) {
    summary += `${weaknesses.join('・')}の向上が課題です。`;
  }

  // 具体的なアドバイス
  if (stats01?.arrangeRate != null && stats01.arrangeRate < 20) {
    summary += ' フィニッシュ力の強化で01の勝率が大きく向上する可能性があります。';
  } else if (stats01?.bullRate != null && stats01.bullRate < 15) {
    summary += ' ブル率を上げることで01・COUNT-UP両方のスタッツ向上が期待できます。';
  }

  if (statsCricket?.openCloseRate != null && statsCricket.openCloseRate < 30) {
    summary += ' Open-Close戦略の改善でCricketの勝率アップが見込めます。';
  }

  return summary;
}

function SkillBarItem({ skill }: { skill: SkillBar }) {
  // パーセンタイルを0-100のバー値に変換（小さいパーセンタイル = 高スキル → 高いバー）
  const barValue = Math.max(0, Math.min(100, 100 - skill.percentile));
  const pColor = getPercentileColor(skill.percentile);
  const pLabel = getPercentileLabel(skill.percentile);

  return (
    <Box sx={{ mb: 1.5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.3 }}>
        <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#ccc' }}>
          {skill.label}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
            {skill.displayValue}
          </Typography>
          <Typography variant="caption" sx={{ color: pColor, fontWeight: 'bold', fontSize: 10 }}>
            上位{skill.percentile}% ({pLabel})
          </Typography>
        </Box>
      </Box>
      <LinearProgress
        variant="determinate"
        value={barValue}
        sx={{
          height: 8,
          borderRadius: 4,
          bgcolor: 'rgba(255,255,255,0.08)',
          '& .MuiLinearProgress-bar': {
            borderRadius: 4,
            bgcolor: pColor,
          },
        }}
      />
    </Box>
  );
}

export default function PlayerDnaCard({ stats01, statsCricket, countupAvg }: PlayerDnaCardProps) {
  const analysis = useMemo(() => {
    const skills: SkillBar[] = [];

    // 01スキル
    if (stats01?.avg != null) {
      const p = getPercentile('ppd', stats01.avg);
      skills.push({
        label: '01 Avg (PPD)',
        value: stats01.avg,
        percentile: p,
        color: COLOR_01,
        displayValue: `${stats01.avg.toFixed(1)}`,
      });
    }

    if (stats01?.bullRate != null) {
      // Bull率は直接パーセンタイル比較できないため、PPDベースで推定
      const p =
        stats01.bullRate >= 35
          ? 5
          : stats01.bullRate >= 25
            ? 15
            : stats01.bullRate >= 18
              ? 30
              : stats01.bullRate >= 12
                ? 50
                : 70;
      skills.push({
        label: 'Bull率',
        value: stats01.bullRate,
        percentile: p,
        color: COLOR_01,
        displayValue: `${stats01.bullRate}%`,
      });
    }

    if (stats01?.arrangeRate != null) {
      const p =
        stats01.arrangeRate >= 35
          ? 5
          : stats01.arrangeRate >= 25
            ? 15
            : stats01.arrangeRate >= 18
              ? 30
              : stats01.arrangeRate >= 12
                ? 50
                : 70;
      skills.push({
        label: 'アレンジ率',
        value: stats01.arrangeRate,
        percentile: p,
        color: COLOR_01,
        displayValue: `${stats01.arrangeRate}%`,
      });
    }

    // Cricketスキル
    if (statsCricket?.avg != null) {
      const p = getPercentile('mpr', statsCricket.avg);
      skills.push({
        label: 'Cricket Avg (MPR)',
        value: statsCricket.avg,
        percentile: p,
        color: COLOR_CRICKET,
        displayValue: `${statsCricket.avg.toFixed(2)}`,
      });
    }

    if (statsCricket?.tripleRate != null) {
      const p =
        statsCricket.tripleRate >= 40
          ? 5
          : statsCricket.tripleRate >= 30
            ? 15
            : statsCricket.tripleRate >= 22
              ? 30
              : statsCricket.tripleRate >= 15
                ? 50
                : 70;
      skills.push({
        label: 'トリプル率',
        value: statsCricket.tripleRate,
        percentile: p,
        color: COLOR_CRICKET,
        displayValue: `${statsCricket.tripleRate}%`,
      });
    }

    if (statsCricket?.openCloseRate != null) {
      const p =
        statsCricket.openCloseRate >= 45
          ? 5
          : statsCricket.openCloseRate >= 35
            ? 15
            : statsCricket.openCloseRate >= 28
              ? 30
              : statsCricket.openCloseRate >= 20
                ? 50
                : 70;
      skills.push({
        label: 'Open-Close率',
        value: statsCricket.openCloseRate,
        percentile: p,
        color: COLOR_CRICKET,
        displayValue: `${statsCricket.openCloseRate}%`,
      });
    }

    // COUNT-UP
    const cuPercentile = countupAvg != null ? getPercentile('countup', countupAvg) : null;
    if (countupAvg != null && cuPercentile != null) {
      skills.push({
        label: 'COUNT-UP平均',
        value: countupAvg,
        percentile: cuPercentile,
        color: COLOR_COUNTUP,
        displayValue: `${Math.round(countupAvg)}`,
      });
    }

    // タイプ判定
    const o1Rt = stats01?.avg != null ? calc01Rating(stats01.avg) : null;
    const criRt = statsCricket?.avg != null ? calcCriRating(statsCricket.avg) : null;
    const { type: playerType, color: typeColor } = classifyPlayerType(o1Rt, criRt, cuPercentile);

    const summary = generateSummary(playerType, skills, stats01, statsCricket);

    return { skills, playerType, typeColor, summary };
  }, [stats01, statsCricket, countupAvg]);

  if (analysis.skills.length === 0) return null;

  return (
    <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
          プレイヤーDNA
        </Typography>
        <Box
          sx={{
            px: 1.2,
            py: 0.2,
            borderRadius: 1,
            bgcolor: analysis.typeColor,
            color: '#fff',
            fontSize: 12,
            fontWeight: 'bold',
          }}
        >
          {analysis.playerType}
        </Box>
      </Box>

      {/* スキルバー */}
      <Box sx={{ mb: 2 }}>
        {analysis.skills.map((skill) => (
          <SkillBarItem key={skill.label} skill={skill} />
        ))}
      </Box>

      {/* テキストサマリー */}
      <Box
        sx={{
          p: 1.5,
          borderRadius: 1,
          bgcolor: 'rgba(255,255,255,0.03)',
          border: '1px solid #333',
        }}
      >
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
          {analysis.summary}
        </Typography>
      </Box>
    </Paper>
  );
}
