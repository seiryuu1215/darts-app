import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Dart } from '@/types';
import { canUseDartslive, canUseDartsliveApi } from '@/lib/permissions';
import type { AchievementSnapshot } from '@/lib/progression/xp-engine';
import type { CountUpPlay } from '@/components/stats/CountUpDeepAnalysisCard';

// === Types ===
export interface StatsHistorySummary {
  avgRating: number | null;
  avgPpd: number | null;
  avgMpr: number | null;
  avgCondition: number | null;
  totalGames: number;
  playDays: number;
  ratingChange: number | null;
  bestRating: number | null;
  bestPpd: number | null;
  bestMpr: number | null;
  streak: number;
}

export interface StatsHistoryRecord {
  id: string;
  date: string;
  rating: number | null;
  ppd: number | null;
  mpr: number | null;
  gamesPlayed: number;
  condition: number | null;
  memo: string;
  dBull: number | null;
  sBull: number | null;
}

export interface DartsliveData {
  current: {
    cardName: string;
    toorina: string;
    cardImageUrl: string;
    rating: number | null;
    ratingInt: number | null;
    flight: string;
    stats01Avg: number | null;
    statsCriAvg: number | null;
    statsPraAvg: number | null;
    stats01Best: number | null;
    statsCriBest: number | null;
    statsPraBest: number | null;
    awards: Record<string, { monthly: number; total: number }>;
    homeShop?: string;
    status?: string;
    myAward?: string;
  };
  monthly: Record<string, { month: string; value: number }[]>;
  recentGames: {
    dayStats: {
      best01: number | null;
      bestCri: number | null;
      bestCountUp: number | null;
      avg01: number | null;
      avgCri: number | null;
      avgCountUp: number | null;
    };
    games: { category: string; scores: number[] }[];
    shops: string[];
  };
  prev: {
    rating: number | null;
    stats01Avg: number | null;
    statsCriAvg: number | null;
    statsPraAvg: number | null;
  } | null;
}

export interface EnrichedData {
  maxRating: number | null;
  maxRatingDate: string | null;
  stats01Detailed: {
    avg: number | null;
    best: number | null;
    winRate: number | null;
    bullRate: number | null;
    arrangeRate: number | null;
    avgBust: number | null;
    avg100: number | null;
  } | null;
  statsCricketDetailed: {
    avg: number | null;
    best: number | null;
    winRate: number | null;
    tripleRate: number | null;
    openCloseRate: number | null;
    avg100: number | null;
  } | null;
  bestRecords:
    | { gameId: string; gameName: string; bestScore: number; bestDate: string | null }[]
    | null;
  gameAverages: { gameId: string; gameName: string; average: number; playCount: number }[] | null;
  apiSyncAt: string | null;
}

export interface DartoutItem {
  score: number;
  count: number;
}

export interface AwardEntry {
  date: string;
  awards: Record<string, number>;
}

export interface RecentPlay {
  date: string;
  gameId: string;
  gameName: string;
  score: number;
  awards?: Record<string, number>;
}

interface DailyHistoryRecord {
  date: string;
  rating: number | null;
  stats01Avg: number | null;
  statsCriAvg: number | null;
  stats01Avg100?: number | null;
  statsCriAvg100?: number | null;
}

export function useStatsPage() {
  const { data: session, status } = useSession();
  const canDartslive = canUseDartslive(session?.user?.role);
  const isAdminApi = canUseDartsliveApi(session?.user?.role);

  // DARTSLIVE state
  const [dlData, setDlData] = useState<DartsliveData | null>(null);
  const [dlOpen, setDlOpen] = useState(false);
  const [dlEmail, setDlEmail] = useState('');
  const [dlPassword, setDlPassword] = useState('');
  const [dlLoading, setDlLoading] = useState(false);
  const [dlError, setDlError] = useState('');
  const [dlConsent, setDlConsent] = useState(false);
  const [dlUpdatedAt, setDlUpdatedAt] = useState<string | null>(null);

  // API data state
  const [apiEnrichedData, setApiEnrichedData] = useState<EnrichedData | null>(null);
  const [apiDailyHistory, setApiDailyHistory] = useState<DailyHistoryRecord[]>([]);
  const [apiDartoutList, setApiDartoutList] = useState<DartoutItem[] | null>(null);
  const [apiAwardList, setApiAwardList] = useState<AwardEntry[] | null>(null);
  const [apiRecentPlays, setApiRecentPlays] = useState<RecentPlay[] | null>(null);
  const [apiCountupPlays, setApiCountupPlays] = useState<CountUpPlay[] | null>(null);

  // Period state
  const [periodTab, setPeriodTab] = useState<'latest' | 'week' | 'month' | 'all'>('all');
  const [periodSummary, setPeriodSummary] = useState<StatsHistorySummary | null>(null);
  const [periodRecords, setPeriodRecords] = useState<StatsHistoryRecord[]>([]);
  const [periodLoading, setPeriodLoading] = useState(false);

  // UI state kept in page
  const [monthlyTab, setMonthlyTab] = useState<'rating' | 'zeroOne' | 'cricket' | 'countUp'>(
    'rating',
  );
  const [gameChartCategory, setGameChartCategory] = useState<string>('');
  const [activeSoftDart, setActiveSoftDart] = useState<Dart | null>(null);

  // Progression
  const [achievements, setAchievements] = useState<string[]>([]);
  const [achievementSnapshot, setAchievementSnapshot] = useState<AchievementSnapshot | null>(null);
  const [xpHistory, setXpHistory] = useState<
    { id: string; action: string; xp: number; detail: string; createdAt: string }[]
  >([]);

  // localStorage consent
  useEffect(() => {
    try {
      if (localStorage.getItem('dartslive_consent') === '1') setDlConsent(true);
      localStorage.removeItem('dartslive_credentials');
    } catch {
      /* localStorage読み取りエラーは無視 */
    }
  }, []);

  // Fetch cached stats + active dart + progression
  useEffect(() => {
    if (!session?.user?.id) return;
    if (canDartslive) {
      const fetchCachedStats = async () => {
        try {
          const res = await fetch('/api/dartslive-stats');
          if (!res.ok) return;
          const json = await res.json();
          if (json.data) {
            setDlData(json.data);
            if (json.updatedAt) setDlUpdatedAt(json.updatedAt);
            if (json.data.recentGames?.games?.length > 0) {
              const games = json.data.recentGames.games;
              const countUp = games.find((g: { category: string }) => g.category === 'COUNT-UP');
              setGameChartCategory(countUp ? 'COUNT-UP' : games[0].category);
            }
          }
        } catch {
          /* ignore */
        }
      };
      fetchCachedStats();
    }
    const fetchActiveDart = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', session.user.id));
        if (!userDoc.exists()) return;
        const userData = userDoc.data();
        if (userData.activeSoftDartId) {
          const dartDoc = await getDoc(doc(db, 'darts', userData.activeSoftDartId));
          if (dartDoc.exists()) {
            setActiveSoftDart({ id: dartDoc.id, ...dartDoc.data() } as Dart);
          }
        }
      } catch {
        /* ignore */
      }
    };
    fetchActiveDart();

    const fetchProgression = async () => {
      try {
        const res = await fetch('/api/progression');
        if (!res.ok) return;
        const json = await res.json();
        setAchievements(json.achievements ?? []);
        setAchievementSnapshot(json.achievementSnapshot ?? null);
        setXpHistory(json.history ?? []);
      } catch {
        // ignore
      }
    };
    fetchProgression();
  }, [session, canDartslive]);

  // Admin API data
  const fetchAdminApiData = async () => {
    try {
      const res = await fetch('/api/admin/dartslive-history');
      if (!res.ok) return;
      const json = await res.json();
      setApiDailyHistory(json.records ?? []);
      setApiEnrichedData(json.enriched ?? null);
      setApiDartoutList(json.dartoutList ?? null);
      setApiAwardList(json.awardList ?? null);
      setApiRecentPlays(json.recentPlays ?? null);
      setApiCountupPlays(json.countupPlays ?? null);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    if (!session?.user?.id || !isAdminApi) return;
    fetchAdminApiData();
  }, [session, isAdminApi]);

  // Period stats
  useEffect(() => {
    if (!session?.user?.id || !canDartslive) return;
    const fetchPeriodStats = async () => {
      setPeriodLoading(true);
      try {
        const res = await fetch(`/api/stats-history?period=${periodTab}`);
        if (!res.ok) return;
        const json = await res.json();
        setPeriodSummary(json.summary ?? null);
        setPeriodRecords(json.records ?? []);
      } catch {
        /* ignore */
      } finally {
        setPeriodLoading(false);
      }
    };
    fetchPeriodStats();
  }, [session, canDartslive, periodTab]);

  // Handle DARTSLIVE login fetch
  const handleFetch = async () => {
    if (!dlEmail || !dlPassword) {
      setDlError('メールアドレスとパスワードを入力してください');
      return;
    }
    setDlError('');
    setDlLoading(true);
    try {
      const res = await fetch('/api/dartslive-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: dlEmail, password: dlPassword }),
      });
      const json = await res.json();
      if (!res.ok) {
        setDlError(json.error || '取得に失敗しました');
        return;
      }
      setDlData(json.data);
      setDlOpen(false);
      setDlUpdatedAt(new Date().toISOString());
      localStorage.setItem('dartslive_consent', '1');
      if (json.data.recentGames?.games?.length > 0) {
        const games = json.data.recentGames.games;
        const countUp = games.find((g: { category: string }) => g.category === 'COUNT-UP');
        setGameChartCategory(countUp ? 'COUNT-UP' : games[0].category);
      }
    } catch {
      setDlError('通信エラーが発生しました');
    } finally {
      setDlLoading(false);
    }
  };

  return {
    session,
    status,
    canDartslive,
    isAdminApi,

    // DARTSLIVE
    dlData,
    dlOpen,
    setDlOpen,
    dlEmail,
    setDlEmail,
    dlPassword,
    setDlPassword,
    dlLoading,
    dlError,
    dlConsent,
    setDlConsent,
    dlUpdatedAt,
    handleFetch,

    // API data
    apiEnrichedData,
    apiDailyHistory,
    apiDartoutList,
    apiAwardList,
    apiRecentPlays,
    apiCountupPlays,
    fetchAdminApiData,

    // Period
    periodTab,
    setPeriodTab,
    periodSummary,
    periodRecords,
    periodLoading,

    // UI
    monthlyTab,
    setMonthlyTab,
    gameChartCategory,
    setGameChartCategory,
    activeSoftDart,

    // Progression
    achievements,
    achievementSnapshot,
    xpHistory,
  };
}
