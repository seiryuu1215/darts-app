'use client';

import { useState } from 'react';
import { Box, Typography, Popover } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';

interface CalendarRecord {
  date: string;
  condition: number | null;
  rating: number | null;
  gamesPlayed: number;
  ppd: number | null;
  mpr: number | null;
  dBull: number | null;
  sBull: number | null;
  bullRate: number | null;
  avg01: number | null;
  highOff: number | null;
  cricketHighScore: number | null;
  ton80: number;
  lowTon: number;
  highTon: number;
  hatTrick: number;
  threeInABed: number;
  threeInABlack: number;
  whiteHorse: number;
}

interface CalendarGridProps {
  year: number;
  month: number;
  records: CalendarRecord[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
}

const DAY_LABELS = ['月', '火', '水', '木', '金', '土', '日'];

function sumNullable(a: number | null, b: number | null): number | null {
  if (a == null && b == null) return null;
  return (a ?? 0) + (b ?? 0);
}

function maxNullable(a: number | null, b: number | null): number | null {
  if (a == null) return b;
  if (b == null) return a;
  return Math.max(a, b);
}

function getConditionLabel(condition: number | null): string {
  if (condition == null) return '未記録';
  if (condition >= 4) return '好調';
  if (condition === 3) return '普通';
  return '不調';
}

/** ゲーム数に応じた濃淡（GitHub Contributions風） */
function getGameIntensity(gamesPlayed: number, themeMode: 'light' | 'dark'): string | undefined {
  if (gamesPlayed === 0) return undefined;
  const base = themeMode === 'dark' ? [76, 175, 80] : [56, 142, 60]; // success green
  if (gamesPlayed <= 2)
    return `rgba(${base[0]}, ${base[1]}, ${base[2]}, ${themeMode === 'dark' ? 0.25 : 0.2})`;
  if (gamesPlayed <= 5)
    return `rgba(${base[0]}, ${base[1]}, ${base[2]}, ${themeMode === 'dark' ? 0.5 : 0.4})`;
  return `rgba(${base[0]}, ${base[1]}, ${base[2]}, ${themeMode === 'dark' ? 0.75 : 0.65})`;
}

export default function CalendarGrid({
  year,
  month,
  records,
  selectedDate,
  onSelectDate,
}: CalendarGridProps) {
  const theme = useTheme();
  const [popoverAnchor, setPopoverAnchor] = useState<HTMLElement | null>(null);
  const [popoverDate, setPopoverDate] = useState<string | null>(null);

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

  // プレイ日のマップ
  interface PlayDayData {
    condition: number | null;
    rating: number | null;
    gamesPlayed: number;
    ppd: number | null;
    mpr: number | null;
    dBull: number | null;
    sBull: number | null;
    bullRate: number | null;
    avg01: number | null;
    highOff: number | null;
    cricketHighScore: number | null;
    ton80: number;
    lowTon: number;
    highTon: number;
    hatTrick: number;
    threeInABed: number;
    threeInABlack: number;
    whiteHorse: number;
  }
  const playDayMap = new Map<string, PlayDayData>();
  for (const r of records) {
    const d = new Date(r.date);
    const jstDate = new Date(d.getTime() + 9 * 60 * 60 * 1000);
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(jstDate.getUTCDate()).padStart(2, '0')}`;
    const existing = playDayMap.get(dateStr);
    if (!existing) {
      playDayMap.set(dateStr, {
        condition: r.condition,
        rating: r.rating,
        gamesPlayed: r.gamesPlayed,
        ppd: r.ppd,
        mpr: r.mpr,
        dBull: r.dBull,
        sBull: r.sBull,
        bullRate: r.bullRate,
        avg01: r.avg01,
        highOff: r.highOff,
        cricketHighScore: r.cricketHighScore,
        ton80: r.ton80,
        lowTon: r.lowTon,
        highTon: r.highTon,
        hatTrick: r.hatTrick,
        threeInABed: r.threeInABed,
        threeInABlack: r.threeInABlack,
        whiteHorse: r.whiteHorse,
      });
    } else {
      // 複数レコード: condition最大、rating/avg系は後勝ち、awards系は合計、max系は最大
      playDayMap.set(dateStr, {
        condition:
          r.condition != null && (existing.condition == null || r.condition > existing.condition)
            ? r.condition
            : existing.condition,
        rating: r.rating ?? existing.rating,
        gamesPlayed: existing.gamesPlayed + r.gamesPlayed,
        ppd: r.ppd ?? existing.ppd,
        mpr: r.mpr ?? existing.mpr,
        dBull: sumNullable(existing.dBull, r.dBull),
        sBull: sumNullable(existing.sBull, r.sBull),
        bullRate: r.bullRate ?? existing.bullRate,
        avg01: r.avg01 ?? existing.avg01,
        highOff: maxNullable(existing.highOff, r.highOff),
        cricketHighScore: maxNullable(existing.cricketHighScore, r.cricketHighScore),
        ton80: existing.ton80 + r.ton80,
        lowTon: existing.lowTon + r.lowTon,
        highTon: existing.highTon + r.highTon,
        hatTrick: existing.hatTrick + r.hatTrick,
        threeInABed: existing.threeInABed + r.threeInABed,
        threeInABlack: existing.threeInABlack + r.threeInABlack,
        whiteHorse: existing.whiteHorse + r.whiteHorse,
      });
    }
  }

  // 今日の日付文字列（JST）
  const now = new Date();
  const jstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const todayStr = `${jstNow.getUTCFullYear()}-${String(jstNow.getUTCMonth() + 1).padStart(2, '0')}-${String(jstNow.getUTCDate()).padStart(2, '0')}`;

  const popoverData = popoverDate ? playDayMap.get(popoverDate) : null;

  const handleCellClick = (dateStr: string, el: HTMLElement) => {
    if (playDayMap.has(dateStr)) {
      setPopoverAnchor(el);
      setPopoverDate(dateStr);
      onSelectDate(dateStr);
    }
  };

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
                color: i === 5 ? 'info.main' : i === 6 ? 'error.main' : 'text.secondary',
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
          const dow = idx % 7;
          const intensity = hasPlay
            ? getGameIntensity(playData!.gamesPlayed, theme.palette.mode)
            : undefined;

          return (
            <Box
              key={idx}
              onClick={(e) => {
                if (cell.inMonth && hasPlay) {
                  handleCellClick(dateStr, e.currentTarget);
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
                  ? alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.2 : 0.1)
                  : (intensity ?? 'transparent'),
                border: isToday
                  ? `2px solid ${theme.palette.primary.main}`
                  : '2px solid transparent',
                '&:hover':
                  cell.inMonth && hasPlay
                    ? { bgcolor: alpha(theme.palette.primary.main, 0.15) }
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
                      ? 'info.main'
                      : dow === 6
                        ? 'error.main'
                        : 'text.primary',
                  fontSize: '0.85rem',
                  lineHeight: 1.2,
                }}
              >
                {cell.day}
              </Typography>
              {hasPlay && (
                <Box
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    bgcolor:
                      playData!.gamesPlayed >= 6
                        ? 'success.dark'
                        : playData!.gamesPlayed >= 3
                          ? 'success.main'
                          : 'success.light',
                    mt: 0.3,
                  }}
                />
              )}
            </Box>
          );
        })}
      </Box>

      {/* 凡例 */}
      <Box
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5, mt: 1 }}
      >
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
          少
        </Typography>
        {[0.2, 0.4, 0.65].map((opacity, i) => (
          <Box
            key={i}
            sx={{
              width: 10,
              height: 10,
              borderRadius: 0.5,
              bgcolor: alpha(theme.palette.success.main, opacity),
            }}
          />
        ))}
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
          多
        </Typography>
      </Box>

      {/* 詳細ポップオーバー */}
      <Popover
        open={Boolean(popoverAnchor) && popoverData != null}
        anchorEl={popoverAnchor}
        onClose={() => {
          setPopoverAnchor(null);
          setPopoverDate(null);
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        {popoverData && popoverDate && (
          <Box sx={{ p: 1.5, minWidth: 160 }}>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 0.5 }}>
              {popoverDate.replace(/-/g, '/')}
            </Typography>
            {popoverData.rating != null && (
              <Typography variant="body2" color="text.secondary">
                Rating: {popoverData.rating.toFixed(2)}
              </Typography>
            )}
            <Typography variant="body2" color="text.secondary">
              ゲーム数: {popoverData.gamesPlayed}
            </Typography>
            {popoverData.ppd != null && (
              <Typography variant="body2" color="text.secondary">
                PPD: {popoverData.ppd.toFixed(2)}
              </Typography>
            )}
            {popoverData.mpr != null && (
              <Typography variant="body2" color="text.secondary">
                MPR: {popoverData.mpr.toFixed(2)}
              </Typography>
            )}
            <Typography variant="body2" color="text.secondary">
              コンディション: {getConditionLabel(popoverData.condition)}
            </Typography>
            <Typography
              variant="caption"
              color="primary"
              sx={{ display: 'block', mt: 0.5, cursor: 'pointer' }}
            >
              クリックで詳細を表示
            </Typography>
          </Box>
        )}
      </Popover>
    </Box>
  );
}
