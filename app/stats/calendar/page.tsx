'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Box,
  Typography,
  IconButton,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  Paper,
} from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import { Button } from '@mui/material';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import CalendarGrid from '@/components/stats/CalendarGrid';
import DayDetailPanel from '@/components/stats/DayDetailPanel';

interface CalendarRecord {
  id: string;
  date: string;
  rating: number | null;
  ppd: number | null;
  mpr: number | null;
  gamesPlayed: number;
  condition: number | null;
  memo: string;
  challenge: string;
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

const DAY_NAMES = ['日', '月', '火', '水', '木', '金', '土'];

function formatDateHeader(dateStr: string): string {
  const [, monthStr, dayStr] = dateStr.split('-');
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);
  const d = new Date(dateStr + 'T12:00:00');
  const dow = DAY_NAMES[d.getDay()];
  return `${month}月${day}日（${dow}）`;
}

function getJSTNow() {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return {
    year: jst.getUTCFullYear(),
    month: jst.getUTCMonth() + 1,
  };
}

export default function CalendarPage() {
  const { status: sessionStatus } = useSession();
  const router = useRouter();

  const jstNow = getJSTNow();
  const [year, setYear] = useState(jstNow.year);
  const [month, setMonth] = useState(jstNow.month);
  const [records, setRecords] = useState<CalendarRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setSelectedDate(null);
    try {
      const res = await fetch(`/api/stats-calendar?year=${year}&month=${month}`);
      if (!res.ok) throw new Error('Fetch failed');
      const data = await res.json();
      setRecords(data.records ?? []);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (sessionStatus === 'authenticated') {
      fetchData();
    }
  }, [sessionStatus, fetchData, router]);

  const handlePrevMonth = () => {
    if (month === 1) {
      setYear(year - 1);
      setMonth(12);
    } else {
      setMonth(month - 1);
    }
  };

  const handleNextMonth = () => {
    const { year: nowYear, month: nowMonth } = getJSTNow();
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    if (nextYear > nowYear || (nextYear === nowYear && nextMonth > nowMonth)) {
      return;
    }
    setYear(nextYear);
    setMonth(nextMonth);
  };

  const isCurrentMonth = year === jstNow.year && month === jstNow.month;

  const handleDownloadPdf = async () => {
    setPdfLoading(true);
    try {
      const monthStr = `${year}-${String(month).padStart(2, '0')}`;
      const res = await fetch(`/api/export-pdf?month=${monthStr}`);
      if (!res.ok) throw new Error('PDF生成に失敗しました');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `darts-lab-report-${monthStr}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // エラーハンドリング
    } finally {
      setPdfLoading(false);
    }
  };

  // 選択日のレコード
  const selectedRecords = selectedDate
    ? records.filter((r) => {
        const d = new Date(r.date);
        const jstDate = new Date(d.getTime() + 9 * 60 * 60 * 1000);
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(jstDate.getUTCDate()).padStart(2, '0')}`;
        return dateStr === selectedDate;
      })
    : [];

  if (sessionStatus === 'loading') {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 2 }}>
      <Breadcrumbs items={[{ label: 'スタッツ', href: '/stats' }, { label: 'カレンダー' }]} />

      {/* 月ナビ */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, my: 2 }}>
        <IconButton onClick={handlePrevMonth} size="small" aria-label="前月">
          <ChevronLeftIcon />
        </IconButton>
        <Typography variant="h6" fontWeight={700}>
          {year}年{month}月
        </Typography>
        <IconButton
          onClick={handleNextMonth}
          size="small"
          disabled={isCurrentMonth}
          aria-label="翌月"
        >
          <ChevronRightIcon />
        </IconButton>
        <Button
          size="small"
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={handleDownloadPdf}
          disabled={pdfLoading || records.length === 0}
          sx={{ ml: 1 }}
        >
          {pdfLoading ? '生成中...' : 'PDF'}
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* 月間サマリー */}
          {records.length > 0 &&
            (() => {
              const playDays = new Set(
                records.map((r) => {
                  const d = new Date(r.date);
                  const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
                  return jst.toISOString().split('T')[0];
                }),
              ).size;
              const totalGames = records.reduce((sum, r) => sum + r.gamesPlayed, 0);
              const validRatings = records.filter((r) => r.rating != null);
              const avgRating =
                validRatings.length > 0
                  ? validRatings.reduce((s, r) => s + r.rating!, 0) / validRatings.length
                  : null;
              const validConditions = records.filter((r) => r.condition != null);
              const avgCondition =
                validConditions.length > 0
                  ? validConditions.reduce((s, r) => s + r.condition!, 0) / validConditions.length
                  : null;
              return (
                <Paper
                  variant="outlined"
                  sx={{
                    p: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1.5,
                    flexWrap: 'wrap',
                  }}
                >
                  <Typography variant="body2" fontWeight={700}>
                    {month}月:
                  </Typography>
                  <Typography variant="body2">{playDays}日プレイ</Typography>
                  <Typography variant="body2">{totalGames}G</Typography>
                  {avgRating != null && (
                    <Typography variant="body2">Rt平均 {avgRating.toFixed(2)}</Typography>
                  )}
                  {avgCondition != null && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                      <Typography variant="body2">調子 {avgCondition.toFixed(1)}</Typography>
                      <StarIcon sx={{ fontSize: 14, color: '#ffc107' }} />
                    </Box>
                  )}
                </Paper>
              );
            })()}

          {/* カレンダー */}
          <CalendarGrid
            year={year}
            month={month}
            records={records}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
        </Box>
      )}

      {/* 日別詳細ダイアログ */}
      <Dialog
        open={!!selectedDate && selectedRecords.length > 0}
        onClose={() => setSelectedDate(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          {selectedDate && formatDateHeader(selectedDate)}
          <IconButton onClick={() => setSelectedDate(null)} aria-label="閉じる">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <DayDetailPanel records={selectedRecords} />
        </DialogContent>
      </Dialog>
    </Container>
  );
}
