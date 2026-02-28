import { useTheme } from '@mui/material';

export function useChartTheme() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  return {
    grid: isDark ? '#333' : '#ddd',
    text: isDark ? '#ccc' : '#666',
    tooltipStyle: {
      backgroundColor: isDark ? '#1e1e1e' : '#fff',
      border: `1px solid ${isDark ? '#444' : '#ddd'}`,
      borderRadius: 6,
      color: isDark ? '#ccc' : '#333',
    },
  };
}
