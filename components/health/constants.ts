export const PERIOD_OPTIONS = [
  { label: '1日', days: 1 },
  { label: '7日', days: 7 },
  { label: '14日', days: 14 },
  { label: '30日', days: 30 },
] as const;

export const CATEGORY_COLORS = {
  heart: { primary: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  sleep: { primary: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
  activity: { primary: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
  vitals: { primary: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
};
