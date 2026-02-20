'use client';

import { Paper, Box, Typography } from '@mui/material';

interface AwardEfficiencyCardProps {
  awards: Record<string, { monthly: number; total: number }>;
  totalGames: number;
}

interface EfficiencyItem {
  label: string;
  key: string;
  altKey?: string;
}

const EFFICIENCY_ITEMS: EfficiencyItem[] = [
  { label: 'HAT TRICK', key: 'HAT TRICK', altKey: 'Hat Trick' },
  { label: 'TON 80', key: 'TON 80', altKey: 'Ton 80' },
  { label: 'ブル', key: 'D-BULL' },
];

function getAwardValue(
  awards: Record<string, { monthly: number; total: number }>,
  key: string,
  altKey?: string,
  field: 'total' | 'monthly' = 'total',
): number {
  const v = awards[key]?.[field] ?? (altKey ? awards[altKey]?.[field] : undefined) ?? 0;
  if (key === 'D-BULL' && field === 'total') {
    return v + (awards['S-BULL']?.[field] ?? 0);
  }
  if (key === 'D-BULL' && field === 'monthly') {
    return v + (awards['S-BULL']?.[field] ?? 0);
  }
  return v;
}

export default function AwardEfficiencyCard({ awards, totalGames }: AwardEfficiencyCardProps) {
  if (!awards || totalGames <= 0) return null;

  return (
    <Paper sx={{ p: 2, mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
          アワード効率
        </Typography>
        <Typography variant="caption" color="text.secondary">
          / game
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {EFFICIENCY_ITEMS.map(({ label, key, altKey }) => {
          const total = getAwardValue(awards, key, altKey, 'total');
          const monthly = getAwardValue(awards, key, altKey, 'monthly');
          const rateTotal = total / totalGames;

          // 月間比較: monthly値 / (totalGames推定月間ゲーム) は正確ではないが
          // total と monthly の比率変化を見る
          const hasMonthly = monthly > 0;

          return (
            <Paper
              key={key}
              variant="outlined"
              sx={{ flex: 1, minWidth: 100, p: 1.5, textAlign: 'center' }}
            >
              <Typography variant="caption" color="text.secondary">
                {label}
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {rateTotal < 1 ? rateTotal.toFixed(2) : rateTotal.toFixed(1)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                / game
              </Typography>
              {hasMonthly && (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    今月 {monthly.toLocaleString()}
                  </Typography>
                </Box>
              )}
            </Paper>
          );
        })}
      </Box>
    </Paper>
  );
}
