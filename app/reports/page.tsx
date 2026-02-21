'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Container, Box, Typography, Tabs, Tab, CircularProgress } from '@mui/material';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import { canUseDartslive } from '@/lib/permissions';
import ProPaywall from '@/components/ProPaywall';
import WeeklyReportCard from '@/components/reports/WeeklyReportCard';
import MonthlyReportCard from '@/components/reports/MonthlyReportCard';

interface StatsRecord {
  date: string;
  rating: number | null;
  gamesPlayed: number;
  hatTricks: number | null;
  ton80: number | null;
  lowTon: number | null;
  highTon: number | null;
}

interface XpRecord {
  xp: number;
  createdAt: string;
}

interface GoalRecord {
  achievedAt: string | null;
}

interface WeekData {
  label: string;
  playDays: number;
  totalGames: number;
  ratingChange: number | null;
  bestDay: { date: string; rating: number } | null;
  awardsHighlights: { label: string; count: number }[];
  goalsAchieved: number;
  xpGained: number;
}

interface MonthData {
  label: string;
  playDays: number;
  totalGames: number;
  ratingStart: number | null;
  ratingEnd: number | null;
  ratingChange: number | null;
  avgPpd: number | null;
  avgMpr: number | null;
  bestDay: { date: string; rating: number } | null;
  worstDay: { date: string; rating: number } | null;
  awardsHighlights: { label: string; count: number }[];
  goalsAchieved: number;
  goalsActive: number;
  xpGained: number;
}

function getWeekRanges(count: number): { label: string; start: Date; end: Date }[] {
  const ranges: { label: string; start: Date; end: Date }[] = [];
  const now = new Date();
  // JST offset
  now.setHours(now.getHours() + 9);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  for (let i = 0; i < count; i++) {
    const end = new Date(today);
    end.setDate(end.getDate() - i * 7 - 1);
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    const label = `${start.getMonth() + 1}/${start.getDate()} - ${end.getMonth() + 1}/${end.getDate()}`;
    ranges.push({ label, start, end });
  }
  return ranges;
}

function getMonthRanges(count: number): { label: string; start: Date; end: Date }[] {
  const ranges: { label: string; start: Date; end: Date }[] = [];
  const now = new Date();
  now.setHours(now.getHours() + 9);

  for (let i = 1; i <= count; i++) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
    const label = `${start.getFullYear()}年${start.getMonth() + 1}月`;
    ranges.push({ label, start, end });
  }
  return ranges;
}

function computeAwardsDiff(records: StatsRecord[]): { label: string; count: number }[] {
  if (records.length < 2) return [];
  const first = records[0];
  const last = records[records.length - 1];
  const highlights: { label: string; count: number }[] = [];
  const fields: { key: keyof StatsRecord; label: string }[] = [
    { key: 'hatTricks', label: 'HAT TRICK' },
    { key: 'ton80', label: 'TON 80' },
    { key: 'lowTon', label: 'LOW TON' },
    { key: 'highTon', label: 'HIGH TON' },
  ];
  for (const f of fields) {
    const diff = ((last[f.key] as number) ?? 0) - ((first[f.key] as number) ?? 0);
    if (diff > 0) highlights.push({ label: f.label, count: diff });
  }
  highlights.sort((a, b) => b.count - a.count);
  return highlights.slice(0, 5);
}

export default function ReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statsRecords, setStatsRecords] = useState<StatsRecord[]>([]);
  const [xpRecords, setXpRecords] = useState<XpRecord[]>([]);
  const [goalRecords, setGoalRecords] = useState<GoalRecord[]>([]);

  const canDl = canUseDartslive(session?.user?.role);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    if (!session?.user?.id || !canDl) return;
    const userId = session.user.id;

    const fetchData = async () => {
      setLoading(true);
      try {
        // 過去4ヶ月分のdartsLiveStats
        const fourMonthsAgo = new Date();
        fourMonthsAgo.setMonth(fourMonthsAgo.getMonth() - 4);

        const statsSnap = await getDocs(
          query(
            collection(db, 'users', userId, 'dartsLiveStats'),
            where('date', '>=', fourMonthsAgo),
            orderBy('date', 'asc'),
          ),
        );
        const stats: StatsRecord[] = statsSnap.docs.map((d) => {
          const data = d.data();
          const dateVal = data.date?.toDate?.() ?? new Date(data.date);
          return {
            date: dateVal.toISOString().slice(0, 10),
            rating: data.rating ?? null,
            gamesPlayed: data.gamesPlayed ?? 0,
            hatTricks: data.hatTricks ?? null,
            ton80: data.ton80 ?? null,
            lowTon: data.lowTon ?? null,
            highTon: data.highTon ?? null,
          };
        });
        setStatsRecords(stats);

        // XP History
        const xpSnap = await getDocs(
          query(
            collection(db, 'users', userId, 'xpHistory'),
            where('createdAt', '>=', fourMonthsAgo),
          ),
        );
        const xps: XpRecord[] = xpSnap.docs.map((d) => {
          const data = d.data();
          const createdAt = data.createdAt?.toDate?.() ?? new Date();
          return { xp: data.xp ?? 0, createdAt: createdAt.toISOString() };
        });
        setXpRecords(xps);

        // Goals
        const goalsSnap = await getDocs(collection(db, 'users', userId, 'goals'));
        const goals: GoalRecord[] = goalsSnap.docs.map((d) => {
          const data = d.data();
          const achievedAt = data.achievedAt?.toDate?.();
          return { achievedAt: achievedAt ? achievedAt.toISOString() : null };
        });
        setGoalRecords(goals);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [session, canDl]);

  const weeklyData = useMemo((): WeekData[] => {
    const ranges = getWeekRanges(4);
    return ranges.map((range) => {
      const startStr = range.start.toISOString().slice(0, 10);
      const endStr = range.end.toISOString().slice(0, 10);
      const records = statsRecords.filter((r) => r.date >= startStr && r.date <= endStr);
      const ratings = records.filter((r) => r.rating != null);

      let bestDay: WeekData['bestDay'] = null;
      for (const r of ratings) {
        if (r.rating != null && (!bestDay || r.rating > bestDay.rating)) {
          bestDay = { date: r.date, rating: r.rating };
        }
      }

      const ratingChange =
        ratings.length >= 2
          ? (ratings[ratings.length - 1].rating ?? 0) - (ratings[0].rating ?? 0)
          : null;

      const xpGained = xpRecords
        .filter((x) => x.createdAt.slice(0, 10) >= startStr && x.createdAt.slice(0, 10) <= endStr)
        .reduce((sum, x) => sum + x.xp, 0);

      const goalsAchieved = goalRecords.filter(
        (g) =>
          g.achievedAt &&
          g.achievedAt.slice(0, 10) >= startStr &&
          g.achievedAt.slice(0, 10) <= endStr,
      ).length;

      return {
        label: range.label,
        playDays: records.length,
        totalGames: records.reduce((sum, r) => sum + r.gamesPlayed, 0),
        ratingChange,
        bestDay,
        awardsHighlights: computeAwardsDiff(records),
        goalsAchieved,
        xpGained,
      };
    });
  }, [statsRecords, xpRecords, goalRecords]);

  const monthlyData = useMemo((): MonthData[] => {
    const ranges = getMonthRanges(3);
    return ranges.map((range) => {
      const startStr = range.start.toISOString().slice(0, 10);
      const endStr = range.end.toISOString().slice(0, 10);
      const records = statsRecords.filter((r) => r.date >= startStr && r.date <= endStr);
      const ratings = records.filter((r) => r.rating != null);

      let bestDay: MonthData['bestDay'] = null;
      let worstDay: MonthData['worstDay'] = null;
      for (const r of ratings) {
        if (r.rating == null) continue;
        if (!bestDay || r.rating > bestDay.rating) bestDay = { date: r.date, rating: r.rating };
        if (!worstDay || r.rating < worstDay.rating) worstDay = { date: r.date, rating: r.rating };
      }

      const ratingStart = ratings.length > 0 ? ratings[0].rating : null;
      const ratingEnd = ratings.length > 0 ? ratings[ratings.length - 1].rating : null;
      const ratingChange =
        ratingStart != null && ratingEnd != null ? ratingEnd - ratingStart : null;

      const xpGained = xpRecords
        .filter((x) => x.createdAt.slice(0, 10) >= startStr && x.createdAt.slice(0, 10) <= endStr)
        .reduce((sum, x) => sum + x.xp, 0);

      const goalsAchieved = goalRecords.filter(
        (g) =>
          g.achievedAt &&
          g.achievedAt.slice(0, 10) >= startStr &&
          g.achievedAt.slice(0, 10) <= endStr,
      ).length;
      const goalsActive = goalRecords.filter((g) => !g.achievedAt).length;

      return {
        label: range.label,
        playDays: records.length,
        totalGames: records.reduce((sum, r) => sum + r.gamesPlayed, 0),
        ratingStart,
        ratingEnd,
        ratingChange,
        avgPpd: null, // クライアントサイドではcacheデータなし
        avgMpr: null,
        bestDay,
        worstDay,
        awardsHighlights: computeAwardsDiff(records),
        goalsAchieved,
        goalsActive,
        xpGained,
      };
    });
  }, [statsRecords, xpRecords, goalRecords]);

  if (status === 'loading') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 3, p: { xs: 1, sm: 2 } }}>
        <Breadcrumbs items={[{ label: 'レポート' }]} />

        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
          レポート
        </Typography>

        {!canDl && (
          <ProPaywall
            title="レポートはPROプラン限定です"
            description="PROプランにアップグレードすると、週次・月次のプレイレポートを確認できます。"
          />
        )}

        {canDl && (
          <>
            <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
              <Tab label="週次" />
              <Tab label="月次" />
            </Tabs>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            ) : tab === 0 ? (
              weeklyData.length === 0 ? (
                <Typography color="text.secondary" textAlign="center" sx={{ py: 8 }}>
                  データがありません
                </Typography>
              ) : (
                weeklyData.map((w) => (
                  <WeeklyReportCard key={w.label} {...w} periodLabel={w.label} />
                ))
              )
            ) : monthlyData.length === 0 ? (
              <Typography color="text.secondary" textAlign="center" sx={{ py: 8 }}>
                データがありません
              </Typography>
            ) : (
              monthlyData.map((m) => (
                <MonthlyReportCard key={m.label} {...m} periodLabel={m.label} />
              ))
            )}
          </>
        )}
      </Box>
    </Container>
  );
}
