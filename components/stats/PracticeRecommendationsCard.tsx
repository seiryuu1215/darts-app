'use client';

import { useMemo } from 'react';
import { Paper, Typography, Box, Chip } from '@mui/material';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import { generateRecommendations } from '@/lib/practice-recommendations';
import type {
  RecommendationInput,
  PracticeRecommendation,
  Urgency,
} from '@/lib/practice-recommendations';

interface PracticeRecommendationsCardProps {
  input: RecommendationInput;
}

const URGENCY_CONFIG: Record<Urgency, { label: string; color: string; bgColor: string }> = {
  high: { label: '優先', color: '#f44336', bgColor: 'rgba(244,67,54,0.15)' },
  medium: { label: '推奨', color: '#FF9800', bgColor: 'rgba(255,152,0,0.15)' },
  low: { label: '参考', color: '#4caf50', bgColor: 'rgba(76,175,80,0.15)' },
};

function RecommendationItem({ rec }: { rec: PracticeRecommendation }) {
  const config = URGENCY_CONFIG[rec.urgency];

  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: 1,
        bgcolor: 'rgba(255,255,255,0.03)',
        border: `1px solid ${config.color}33`,
        mb: 1,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        <Chip
          label={config.label}
          size="small"
          sx={{
            fontSize: 10,
            height: 20,
            bgcolor: config.bgColor,
            color: config.color,
            border: `1px solid ${config.color}`,
          }}
        />
        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
          {rec.title}
        </Typography>
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
        {rec.description}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5, mb: 0.5 }}>
        <FitnessCenterIcon sx={{ fontSize: 14, color: '#aaa', mt: 0.2 }} />
        <Typography variant="caption" sx={{ color: '#ccc' }}>
          {rec.drill}
        </Typography>
      </Box>
      <Typography variant="caption" sx={{ color: '#4caf50', fontStyle: 'italic' }}>
        期待効果: {rec.expectedEffect}
      </Typography>
    </Box>
  );
}

export default function PracticeRecommendationsCard({ input }: PracticeRecommendationsCardProps) {
  const recommendations = useMemo(() => generateRecommendations(input), [input]);

  if (recommendations.length === 0) return null;

  return (
    <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
          練習レコメンド
        </Typography>
        <Chip
          label="AI"
          size="small"
          sx={{
            fontSize: 10,
            height: 20,
            bgcolor: 'rgba(156,39,176,0.2)',
            color: '#CE93D8',
            border: '1px solid #CE93D8',
          }}
        />
      </Box>

      {recommendations.map((rec) => (
        <RecommendationItem key={rec.id} rec={rec} />
      ))}

      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        スタッツデータに基づくルールベース分析。個人の体格やフォームは考慮されていません。
      </Typography>
    </Paper>
  );
}
