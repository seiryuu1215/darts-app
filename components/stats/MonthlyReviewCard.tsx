'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  CircularProgress,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';

interface Summary {
  avgRating: number | null;
  avgPpd: number | null;
  avgMpr: number | null;
  avgCondition: number | null;
  totalGames: number;
  playDays: number;
  ratingChange: number | null;
}

interface MonthlyReviewCardProps {
  year: number;
  month: number;
  summary: Summary;
  review: { good: string; bad: string } | null;
  onSave: (good: string, bad: string) => Promise<void>;
  loading: boolean;
}

interface StatItemProps {
  label: string;
  value: string;
}

function StatItem({ label, value }: StatItemProps) {
  return (
    <Box sx={{ textAlign: 'center' }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body1" fontWeight={600}>
        {value}
      </Typography>
    </Box>
  );
}

export default function MonthlyReviewCard({
  month,
  summary,
  review,
  onSave,
  loading,
}: MonthlyReviewCardProps) {
  const [good, setGood] = useState(review?.good ?? '');
  const [bad, setBad] = useState(review?.bad ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setGood(review?.good ?? '');
    setBad(review?.bad ?? '');
  }, [review]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(good, bad);
    } finally {
      setSaving(false);
    }
  };

  if (summary.totalGames === 0) return null;

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="subtitle1" fontWeight={700} gutterBottom>
        {month}月のまとめ
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress size={24} />
        </Box>
      ) : (
        <>
          {/* サマリー */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 1,
              mb: 2,
            }}
          >
            <StatItem
              label="平均Rt"
              value={summary.avgRating != null ? summary.avgRating.toFixed(2) : '-'}
            />
            <StatItem
              label="平均PPD"
              value={summary.avgPpd != null ? summary.avgPpd.toFixed(2) : '-'}
            />
            <StatItem
              label="平均MPR"
              value={summary.avgMpr != null ? summary.avgMpr.toFixed(2) : '-'}
            />
            <StatItem label="ゲーム数" value={String(summary.totalGames)} />
            <StatItem label="プレイ日数" value={`${summary.playDays}日`} />
            <StatItem
              label="平均調子"
              value={summary.avgCondition != null ? summary.avgCondition.toFixed(1) : '-'}
            />
          </Box>

          {summary.ratingChange != null && (
            <Typography
              variant="body2"
              sx={{
                mb: 2,
                color: summary.ratingChange >= 0 ? 'success.main' : 'error.main',
                fontWeight: 600,
              }}
            >
              Rating変動: {summary.ratingChange >= 0 ? '+' : ''}
              {summary.ratingChange.toFixed(2)}
            </Typography>
          )}

          {/* レビューフォーム */}
          <TextField
            label="良かったところ"
            multiline
            rows={3}
            fullWidth
            value={good}
            onChange={(e) => setGood(e.target.value)}
            sx={{ mb: 2 }}
            size="small"
          />
          <TextField
            label="悪かったところ・課題"
            multiline
            rows={3}
            fullWidth
            value={bad}
            onChange={(e) => setBad(e.target.value)}
            sx={{ mb: 2 }}
            size="small"
          />
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
            onClick={handleSave}
            disabled={saving}
            fullWidth
          >
            保存
          </Button>
        </>
      )}
    </Paper>
  );
}
