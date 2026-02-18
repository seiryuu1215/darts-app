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
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import CalendarGrid from '@/components/stats/CalendarGrid';
import DayDetailPanel from '@/components/stats/DayDetailPanel';
import MonthlyReviewCard from '@/components/stats/MonthlyReviewCard';

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
}

interface Summary {
  avgRating: number | null;
  avgPpd: number | null;
  avgMpr: number | null;
  avgCondition: number | null;
  totalGames: number;
  playDays: number;
  ratingChange: number | null;
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
  const [summary, setSummary] = useState<Summary>({
    avgRating: null,
    avgPpd: null,
    avgMpr: null,
    avgCondition: null,
    totalGames: 0,
    playDays: 0,
    ratingChange: null,
  });
  const [review, setReview] = useState<{ good: string; bad: string } | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setSelectedDate(null);
    try {
      const res = await fetch(`/api/stats-calendar?year=${year}&month=${month}`);
      if (!res.ok) throw new Error('Fetch failed');
      const data = await res.json();
      setRecords(data.records ?? []);
      setSummary(data.summary ?? {
        avgRating: null,
        avgPpd: null,
        avgMpr: null,
        avgCondition: null,
        totalGames: 0,
        playDays: 0,
        ratingChange: null,
      });
      setReview(data.review ?? null);
    } catch {
      setRecords([]);
      setSummary({
        avgRating: null,
        avgPpd: null,
        avgMpr: null,
        avgCondition: null,
        totalGames: 0,
        playDays: 0,
        ratingChange: null,
      });
      setReview(null);
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
    // 未来月は移動しない
    const { year: nowYear, month: nowMonth } = getJSTNow();
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    if (nextYear > nowYear || (nextYear === nowYear && nextMonth > nowMonth)) {
      return;
    }
    setYear(nextYear);
    setMonth(nextMonth);
  };

  // 未来月かどうか
  const isCurrentMonth = year === jstNow.year && month === jstNow.month;

  // 選択日のレコード
  const selectedRecords = selectedDate
    ? records.filter((r) => {
        const d = new Date(r.date);
        const jstDate = new Date(d.getTime() + 9 * 60 * 60 * 1000);
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(jstDate.getUTCDate()).padStart(2, '0')}`;
        return dateStr === selectedDate;
      })
    : [];

  const handleSaveReview = async (good: string, bad: string) => {
    const yearMonth = `${year}-${String(month).padStart(2, '0')}`;
    const res = await fetch('/api/stats-calendar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ yearMonth, good, bad }),
    });
    if (res.ok) {
      setReview({ good, bad });
    }
  };

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
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* カレンダー */}
          <CalendarGrid
            year={year}
            month={month}
            records={records}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />

          {/* 日別詳細 */}
          {selectedDate && selectedRecords.length > 0 && (
            <DayDetailPanel date={selectedDate} records={selectedRecords} />
          )}

          {/* 月間レビュー */}
          <MonthlyReviewCard
            year={year}
            month={month}
            summary={summary}
            review={review}
            onSave={handleSaveReview}
            loading={loading}
          />
        </Box>
      )}
    </Container>
  );
}
