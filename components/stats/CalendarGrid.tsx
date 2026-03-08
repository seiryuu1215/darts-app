'use client';

import { Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';

interface CalendarRecord {
  date: string;
  condition: number | null;
  rating: number | null;
  gamesPlayed: number;
}

interface CalendarGridProps {
  year: number;
  month: number;
  records: CalendarRecord[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
}

const DAY_LABELS = ['月', '火', '水', '木', '金', '土', '日'];

function getConditionColor(condition: number | null): string {
  if (condition == null) return '#9e9e9e';
  if (condition >= 4) return '#4caf50';
  if (condition === 3) return '#ff9800';
  return '#f44336';
}

export default function CalendarGrid({
  year,
  month,
  records,
  selectedDate,
  onSelectDate,
}: CalendarGridProps) {
  const theme = useTheme();

  // 月の1日の曜日（月曜始まり: 0=月, 6=日）
  const firstDay = new Date(year, month - 1, 1);
  const startDow = (firstDay.getDay() + 6) % 7; // 月曜=0

  // 月の日数
  const daysInMonth = new Date(year, month, 0).getDate();

  // 42セル（6週分）
  const cells: Array<{ day: number; inMonth: boolean }> = [];
  // 前月のグレーアウト日
  const prevMonthDays = new Date(year, month - 1, 0).getDate();
  for (let i = startDow - 1; i >= 0; i--) {
    cells.push({ day: prevMonthDays - i, inMonth: false });
  }
  // 当月
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, inMonth: true });
  }
  // 次月の埋め
  while (cells.length < 42) {
    cells.push({ day: cells.length - startDow - daysInMonth + 1, inMonth: false });
  }

  // プレイ日のマップ: dateStr -> { condition, rating, gamesPlayed }
  const playDayMap = new Map<
    string,
    { condition: number | null; rating: number | null; gamesPlayed: number }
  >();
  for (const r of records) {
    // ISO -> JST日付文字列
    const d = new Date(r.date);
    const jstDate = new Date(d.getTime() + 9 * 60 * 60 * 1000);
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(jstDate.getUTCDate()).padStart(2, '0')}`;
    const existing = playDayMap.get(dateStr);
    if (!existing) {
      playDayMap.set(dateStr, {
        condition: r.condition,
        rating: r.rating,
        gamesPlayed: r.gamesPlayed,
      });
    } else {
      // 複数レコードがある場合: conditionは最大、ratingは最新（後勝ち）、gamesPlayedは合計
      playDayMap.set(dateStr, {
        condition:
          r.condition != null && (existing.condition == null || r.condition > existing.condition)
            ? r.condition
            : existing.condition,
        rating: r.rating ?? existing.rating,
        gamesPlayed: existing.gamesPlayed + r.gamesPlayed,
      });
    }
  }

  // 今日の日付文字列（JST）
  const now = new Date();
  const jstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const todayStr = `${jstNow.getUTCFullYear()}-${String(jstNow.getUTCMonth() + 1).padStart(2, '0')}-${String(jstNow.getUTCDate()).padStart(2, '0')}`;

  return (
    <Box>
      {/* 曜日ヘッダー */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5, mb: 0.5 }}>
        {DAY_LABELS.map((label, i) => (
          <Box key={label} sx={{ textAlign: 'center', py: 0.5 }}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 600,
                color: i === 5 ? '#2196f3' : i === 6 ? '#f44336' : 'text.secondary',
              }}
            >
              {label}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* カレンダーグリッド */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5 }}>
        {cells.map((cell, idx) => {
          const dateStr = cell.inMonth
            ? `${year}-${String(month).padStart(2, '0')}-${String(cell.day).padStart(2, '0')}`
            : '';
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDate;
          const hasPlay = cell.inMonth && playDayMap.has(dateStr);
          const playData = hasPlay ? playDayMap.get(dateStr)! : null;
          const condition = playData?.condition ?? null;
          const dow = idx % 7;

          return (
            <Box
              key={idx}
              onClick={() => {
                if (cell.inMonth && hasPlay) {
                  onSelectDate(dateStr);
                }
              }}
              sx={{
                position: 'relative',
                aspectRatio: '1',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 1,
                cursor: cell.inMonth && hasPlay ? 'pointer' : 'default',
                bgcolor: isSelected
                  ? theme.palette.mode === 'dark'
                    ? 'rgba(33, 150, 243, 0.2)'
                    : 'rgba(33, 150, 243, 0.1)'
                  : hasPlay
                    ? theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.04)'
                      : 'rgba(0, 0, 0, 0.02)'
                    : 'transparent',
                border: isToday
                  ? `2px solid ${theme.palette.primary.main}`
                  : '2px solid transparent',
                '&:hover':
                  cell.inMonth && hasPlay
                    ? {
                        bgcolor:
                          theme.palette.mode === 'dark'
                            ? 'rgba(255, 255, 255, 0.08)'
                            : 'rgba(0, 0, 0, 0.04)',
                      }
                    : {},
                transition: 'background-color 0.15s',
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontWeight: isToday ? 700 : 400,
                  color: !cell.inMonth
                    ? 'text.disabled'
                    : dow === 5
                      ? '#2196f3'
                      : dow === 6
                        ? '#f44336'
                        : 'text.primary',
                  fontSize: '0.85rem',
                  lineHeight: 1.2,
                }}
              >
                {cell.day}
              </Typography>
              {hasPlay && playData?.rating != null && (
                <Typography
                  variant="caption"
                  sx={{ fontSize: '0.6rem', color: 'text.secondary', lineHeight: 1.2 }}
                >
                  {playData.rating.toFixed(2)}
                </Typography>
              )}
              {hasPlay && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.3,
                    mt: 0.1,
                  }}
                >
                  {playData && playData.gamesPlayed > 0 && (
                    <Typography
                      variant="caption"
                      sx={{ fontSize: '0.55rem', color: 'text.secondary', lineHeight: 1 }}
                    >
                      {playData.gamesPlayed}G
                    </Typography>
                  )}
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      bgcolor: getConditionColor(condition),
                    }}
                  />
                </Box>
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
