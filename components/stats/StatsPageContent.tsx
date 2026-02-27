'use client';

import { useMemo } from 'react';
import { Box, Card, CardContent, CardMedia, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Link from 'next/link';
import type { Dart } from '@/types';
import { COLOR_COUNTUP } from '@/lib/dartslive-colors';

import RatingHeroCard from './RatingHeroCard';
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
import ConditionCorrelationCard from './ConditionCorrelationCard';
import RatingTrendCard from './RatingTrendCard';
import SkillRadarChart from './SkillRadarChart';
import SessionComparisonCard from './SessionComparisonCard';

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
  periodTab: 'latest' | 'week' | 'month' | 'all';
  periodSummary: StatsHistorySummary | null;
  periodRecords: StatsHistoryRecord[];
  flightColor: string;
  expectedCountUp: number | null;
  dangerCountUp: number | null;
  excellentCountUp: number | null;
  activeSoftDart: Dart | null;
  monthlyTab: MonthlyTab;
  gameChartCategory: string;
  onMonthlyTabChange: (tab: MonthlyTab) => void;
  onGameChartCategoryChange: (cat: string) => void;
}

export default function StatsPageContent({
  dlData,
  periodTab,
  periodSummary,
  periodRecords,
  flightColor,
  expectedCountUp,
  dangerCountUp,
  excellentCountUp,
  activeSoftDart,
  monthlyTab,
  gameChartCategory,
  onMonthlyTabChange,
  onGameChartCategoryChange,
}: StatsPageContentProps) {
  const c = dlData.current;
  const prev = dlData.prev;

  const dBullTotal = useMemo(
    () => periodRecords.reduce((s, r) => s + (r.dBull ?? 0), 0) || null,
    [periodRecords],
  );
  const sBullTotal = useMemo(
    () => periodRecords.reduce((s, r) => s + (r.sBull ?? 0), 0) || null,
    [periodRecords],
  );
  const countUpScores = useMemo(
    () => dlData.recentGames.games.find((g) => g.category === 'COUNT-UP')?.scores,
    [dlData.recentGames.games],
  );

  return (
    <>
      {/* 1. Rating Hero + Profile */}
      <RatingHeroCard
        rating={c.rating}
        ratingPrev={prev?.rating ?? null}
        flight={c.flight}
        flightColor={flightColor}
        streak={periodSummary?.streak ?? 0}
        showStreak={periodTab === 'all'}
        cardName={c.cardName}
        cardImageUrl={c.cardImageUrl}
        toorina={c.toorina}
        homeShop={c.homeShop}
        status={c.status}
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
      <CountUpAnalysisCard games={dlData.recentGames.games} expectedCountUp={expectedCountUp} />

      {/* 6d. 01 Analysis */}
      <ZeroOneAnalysisCard games={dlData.recentGames.games} />

      {/* 6e. 01 Consistency */}
      <ZeroOneConsistencyCard games={dlData.recentGames.games} />

      {/* 6f. Condition × Performance Correlation */}
      <ConditionCorrelationCard periodRecords={periodRecords} />

      {/* 6g. PRO Skill Radar */}
      {c.stats01Avg != null && c.statsCriAvg != null && (
        <SkillRadarChart
          simpleMode
          stats01Avg={c.stats01Avg}
          statsCriAvg={c.statsCriAvg}
          statsPraAvg={c.statsPraAvg}
          dBullTotal={dBullTotal}
          sBullTotal={sBullTotal}
          countUpScores={countUpScores}
          flight={c.flight || undefined}
        />
      )}

      {/* 6h. Rating Trend */}
      <RatingTrendCard periodRecords={periodRecords} currentRating={c.rating} />

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

      {/* 10b. Session Comparison */}
      <SessionComparisonCard periodRecords={periodRecords} />

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
