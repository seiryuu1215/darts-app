'use client';

import { Box, Card, CardContent, CardMedia, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Link from 'next/link';
import type { Dart } from '@/types';
import { COLOR_COUNTUP } from '@/lib/dartslive-colors';

import PlayerProfileCard from './PlayerProfileCard';
import RatingHeroCard from './RatingHeroCard';
import PeriodStatsPanel from './PeriodStatsPanel';
import GameStatsCards from './GameStatsCards';
import BullStatsCard from './BullStatsCard';
import CountUpDeltaChart from './CountUpDeltaChart';
import RatingTargetCard from './RatingTargetCard';
import MonthlyTrendChart from './MonthlyTrendChart';
import RecentGamesChart from './RecentGamesChart';
import RecentDaySummary from './RecentDaySummary';
import AwardsTable from './AwardsTable';
import ConsistencyCard from './ConsistencyCard';
import CountUpAnalysisCard from './CountUpAnalysisCard';
import ZeroOneAnalysisCard from './ZeroOneAnalysisCard';
import ZeroOneConsistencyCard from './ZeroOneConsistencyCard';

interface StatsHistorySummary {
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

interface StatsHistoryRecord {
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

interface DartsliveData {
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

type MonthlyTab = 'rating' | 'zeroOne' | 'cricket' | 'countUp';

export interface StatsPageContentProps {
  dlData: DartsliveData;
  periodTab: 'today' | 'week' | 'month' | 'all';
  periodSummary: StatsHistorySummary | null;
  periodRecords: StatsHistoryRecord[];
  periodLoading: boolean;
  flightColor: string;
  expectedCountUp: number | null;
  dangerCountUp: number | null;
  excellentCountUp: number | null;
  activeSoftDart: Dart | null;
  monthlyTab: MonthlyTab;
  gameChartCategory: string;
  onPeriodChange: (tab: 'today' | 'week' | 'month' | 'all') => void;
  onMonthlyTabChange: (tab: MonthlyTab) => void;
  onGameChartCategoryChange: (cat: string) => void;
}

export default function StatsPageContent({
  dlData,
  periodTab,
  periodSummary,
  periodRecords,
  periodLoading,
  flightColor,
  expectedCountUp,
  dangerCountUp,
  excellentCountUp,
  activeSoftDart,
  monthlyTab,
  gameChartCategory,
  onPeriodChange,
  onMonthlyTabChange,
  onGameChartCategoryChange,
}: StatsPageContentProps) {
  const c = dlData.current;
  const prev = dlData.prev;

  return (
    <>
      {/* 1. Player Profile */}
      <PlayerProfileCard
        cardName={c.cardName}
        cardImageUrl={c.cardImageUrl}
        toorina={c.toorina}
        homeShop={c.homeShop}
        myAward={c.myAward}
        status={c.status}
        flightColor={flightColor}
      />

      {/* 2. Rating Hero */}
      <RatingHeroCard
        rating={c.rating}
        ratingPrev={prev?.rating ?? null}
        flight={c.flight}
        flightColor={flightColor}
        streak={periodSummary?.streak ?? 0}
        showStreak={periodTab === 'all'}
      />

      {/* 3. Period Stats */}
      <PeriodStatsPanel
        periodTab={periodTab}
        onPeriodChange={onPeriodChange}
        loading={periodLoading}
        summary={periodSummary}
        records={periodRecords}
        prevPpd={prev?.stats01Avg ?? null}
        prevMpr={prev?.statsCriAvg ?? null}
      />

      {/* 4. Game Stats Cards */}
      <GameStatsCards
        stats01Avg={c.stats01Avg}
        stats01Best={c.stats01Best}
        statsCriAvg={c.statsCriAvg}
        statsCriBest={c.statsCriBest}
        statsPraAvg={c.statsPraAvg}
        statsPraBest={c.statsPraBest}
        prev01Avg={prev?.stats01Avg ?? null}
        prevCriAvg={prev?.statsCriAvg ?? null}
        prevPraAvg={prev?.statsPraAvg ?? null}
        expectedCountUp={expectedCountUp}
      />

      {/* 5. Bull Stats */}
      <BullStatsCard awards={c.awards} />

      {/* 6. COUNT-UP Delta */}
      <CountUpDeltaChart games={dlData.recentGames.games} avgScore={c.statsPraAvg} />

      {/* 6b. Consistency */}
      <ConsistencyCard games={dlData.recentGames.games} />

      {/* 6c. COUNT-UP Analysis */}
      <CountUpAnalysisCard games={dlData.recentGames.games} />

      {/* 6d. 01 Analysis */}
      <ZeroOneAnalysisCard games={dlData.recentGames.games} />

      {/* 6e. 01 Consistency */}
      <ZeroOneConsistencyCard games={dlData.recentGames.games} />

      {/* 7. Rating Target */}
      {c.stats01Avg != null && c.statsCriAvg != null && (
        <RatingTargetCard
          stats01Avg={c.stats01Avg}
          statsCriAvg={c.statsCriAvg}
          flightColor={flightColor}
        />
      )}

      {/* 8. Monthly Trend */}
      <MonthlyTrendChart
        monthly={dlData.monthly}
        monthlyTab={monthlyTab}
        onTabChange={onMonthlyTabChange}
        flightColor={flightColor}
      />

      {/* 9. Recent Games */}
      <RecentGamesChart
        games={dlData.recentGames.games}
        gameChartCategory={gameChartCategory}
        onCategoryChange={onGameChartCategoryChange}
        expectedCountUp={expectedCountUp}
        dangerCountUp={dangerCountUp}
        excellentCountUp={excellentCountUp}
      />

      {/* 10. Recent Day Summary */}
      <RecentDaySummary dayStats={dlData.recentGames.dayStats} shops={dlData.recentGames.shops} />

      {/* 11. Awards Table */}
      <AwardsTable awards={c.awards} />

      {/* 12. Active Dart */}
      {activeSoftDart && (
        <Card
          component={Link}
          href={`/darts/${activeSoftDart.id}`}
          sx={{
            textDecoration: 'none',
            display: 'flex',
            flexDirection: 'row',
            mb: 2,
            height: 72,
            borderRadius: 2,
            borderLeft: `3px solid ${flightColor}`,
          }}
        >
          {activeSoftDart.imageUrls.length > 0 ? (
            <CardMedia
              component="img"
              image={activeSoftDart.imageUrls[0]}
              alt={activeSoftDart.title}
              sx={{ width: 72, objectFit: 'cover', flexShrink: 0 }}
            />
          ) : (
            <Box
              component="img"
              src="/dart-placeholder.svg"
              alt=""
              sx={{ width: 72, flexShrink: 0, objectFit: 'cover' }}
            />
          )}
          <CardContent
            sx={{
              py: 1,
              px: 1.5,
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              minWidth: 0,
              '&:last-child': { pb: 1 },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <CheckCircleIcon sx={{ fontSize: 14, color: COLOR_COUNTUP }} />
              <Typography variant="caption" color="text.secondary">
                使用中セッティング
              </Typography>
            </Box>
            <Typography variant="subtitle2" noWrap>
              {activeSoftDart.title}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {activeSoftDart.barrel.brand} {activeSoftDart.barrel.name} (
              {activeSoftDart.barrel.weight}g)
            </Typography>
          </CardContent>
        </Card>
      )}
    </>
  );
}
