'use client';

import { useMemo } from 'react';
import { Box, Card, CardContent, CardMedia, Typography, Divider } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import type { Dart } from '@/types';
import { COLOR_COUNTUP } from '@/lib/dartslive-colors';
import type { RecommendationInput } from '@/lib/practice-recommendations';
import { analyzeRoundBulls } from '@/lib/countup-round-analysis';
import { analyzeMissDirection } from '@/lib/stats-math';
import type { CountUpPlay } from './countup-deep-shared';

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
import CricketAnalysisCard from './CricketAnalysisCard';
import ConditionCorrelationCard from './ConditionCorrelationCard';
import RatingTrendCard from './RatingTrendCard';
import SkillRadarChart from './SkillRadarChart';
import SessionComparisonCard from './SessionComparisonCard';
import RatingBenchmarkCard from './RatingBenchmarkCard';
import StatsCardBoundary from './StatsCardBoundary';

const DartboardHeatmap = dynamic(() => import('./DartboardHeatmap'));
const MissDirectionCard = dynamic(() => import('./MissDirectionCard'));
const SessionCompareCard = dynamic(() => import('./SessionCompareCard'));
const RatingSimulatorCard = dynamic(() => import('./RatingSimulatorCard'));
const PerformanceInsightsCard = dynamic(() => import('./PerformanceInsightsCard'));
const PracticeRecommendationsCard = dynamic(() => import('./PracticeRecommendationsCard'));

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

interface EnrichedData {
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
}

type MonthlyTab = 'rating' | 'zeroOne' | 'cricket' | 'countUp';

function TierDivider({ label }: { label: string }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 3, mb: 1.5 }}>
      <Divider sx={{ flex: 1 }} />
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ fontWeight: 'bold', letterSpacing: 1 }}
      >
        {label}
      </Typography>
      <Divider sx={{ flex: 1 }} />
    </Box>
  );
}

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
  enrichedData?: EnrichedData | null;
  currentRating?: number | null;
  countupPlays?: CountUpPlay[] | null;
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
  enrichedData,
  currentRating,
  countupPlays,
}: StatsPageContentProps) {
  const c = dlData.current;
  const prev = dlData.prev;

  const countUpScores = useMemo(
    () => dlData.recentGames.games.find((g) => g.category === 'COUNT-UP')?.scores,
    [dlData.recentGames.games],
  );
  // 直近30Gのブル率・ノーブル率（スキルレーダー用）
  const radarBullStats = useMemo(() => {
    if (!countupPlays || countupPlays.length === 0) return null;
    const recent30 = countupPlays.slice(-30);
    const logs = recent30.map((p) => p.playLog).filter((l): l is string => !!l && l.length > 0);
    if (logs.length === 0) return null;
    const roundBulls = analyzeRoundBulls(logs);
    const missDir = analyzeMissDirection(logs);
    return {
      bullRate: missDir?.bullRate ?? null,
      noBullRate: roundBulls.noBullRate,
    };
  }, [countupPlays]);

  // PracticeRecommendationsCard 用の lite 版入力（sensor系は全て null）
  const recInput = useMemo((): RecommendationInput | null => {
    if (!enrichedData) return null;
    const s01 = enrichedData.stats01Detailed;
    const sCri = enrichedData.statsCricketDetailed;
    if (!s01 && !sCri) return null;
    return {
      ppd: s01?.avg ?? null,
      bullRate: s01?.bullRate ?? null,
      arrangeRate: s01?.arrangeRate ?? null,
      avgBust: s01?.avgBust ?? null,
      mpr: sCri?.avg ?? null,
      tripleRate: sCri?.tripleRate ?? null,
      openCloseRate: sCri?.openCloseRate ?? null,
      countupAvg: null,
      countupConsistency: null,
      primaryMissDirection: null,
      directionStrength: null,
      avgRadius: null,
      radiusImprovement: null,
      avgSpeed: null,
      optimalSessionLength: null,
      peakGameNumber: null,
      roundPattern: null,
      worstRound: null,
    };
  }, [enrichedData]);

  return (
    <>
      {/* ── ダッシュボード ── */}

      {/* 1. Rating Hero + Profile */}
      <StatsCardBoundary name="レーティング">
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
      </StatsCardBoundary>

      {/* 2. Game Stats Cards */}
      <StatsCardBoundary name="ゲームスタッツ">
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
      </StatsCardBoundary>

      {/* 3. Skill Radar (simple) */}
      {c.stats01Avg != null && c.statsCriAvg != null && (
        <StatsCardBoundary name="スキルレーダー">
          <SkillRadarChart
            simpleMode
            stats01Avg={c.stats01Avg}
            statsCriAvg={c.statsCriAvg}
            statsPraAvg={c.statsPraAvg}
            bullRate={radarBullStats?.bullRate}
            noBullRate={radarBullStats?.noBullRate}
            flight={c.flight || undefined}
          />
        </StatsCardBoundary>
      )}

      {/* ── レーティング ── */}
      <TierDivider label="レーティング" />

      {/* 4. Rating Benchmark */}
      <StatsCardBoundary name="レーティングベンチマーク">
        <RatingBenchmarkCard currentPpd={enrichedData?.stats01Detailed?.avg ?? c.stats01Avg} />
      </StatsCardBoundary>

      {/* 5. Rating Trend */}
      <StatsCardBoundary name="レーティング推移">
        <RatingTrendCard periodRecords={periodRecords} currentRating={c.rating} />
      </StatsCardBoundary>

      {/* 6. Rating Target */}
      {c.stats01Avg != null && c.statsCriAvg != null && (
        <StatsCardBoundary name="Rt目標">
          <RatingTargetCard
            stats01Avg={c.stats01Avg}
            statsCriAvg={c.statsCriAvg}
            flightColor={flightColor}
          />
        </StatsCardBoundary>
      )}

      {/* 7. Rating Simulator */}
      {(enrichedData?.stats01Detailed?.avg ?? c.stats01Avg) != null &&
        (enrichedData?.statsCricketDetailed?.avg ?? c.statsCriAvg) != null && (
          <StatsCardBoundary name="レート予測シミュレーター">
            <RatingSimulatorCard
              currentPpd={(enrichedData?.stats01Detailed?.avg ?? c.stats01Avg)!}
              currentMpr={(enrichedData?.statsCricketDetailed?.avg ?? c.statsCriAvg)!}
            />
          </StatsCardBoundary>
        )}

      {/* ── ゲーム分析 ── */}
      <TierDivider label="ゲーム分析" />

      {/* 8. Session Compare */}
      {countupPlays && countupPlays.length > 0 && (
        <StatsCardBoundary name="練習日比較">
          <SessionCompareCard countupPlays={countupPlays} />
        </StatsCardBoundary>
      )}

      {/* 11. COUNT-UP Delta */}
      <StatsCardBoundary name="COUNT-UPスコア推移">
        <CountUpDeltaChart games={dlData.recentGames.games} avgScore={c.statsPraAvg} />
      </StatsCardBoundary>

      {/* 11. COUNT-UP Analysis */}
      <StatsCardBoundary name="COUNT-UP分析">
        <CountUpAnalysisCard
          games={dlData.recentGames.games}
          expectedCountUp={expectedCountUp}
          currentRating={currentRating}
        />
      </StatsCardBoundary>

      {/* 12. 01 Analysis */}
      <StatsCardBoundary name="01分析">
        <ZeroOneAnalysisCard games={dlData.recentGames.games} currentRating={currentRating} />
      </StatsCardBoundary>

      {/* 13. Cricket Analysis */}
      <StatsCardBoundary name="Cricket分析">
        <CricketAnalysisCard games={dlData.recentGames.games} currentRating={currentRating} />
      </StatsCardBoundary>

      {/* 14. Consistency */}
      <StatsCardBoundary name="安定度分析">
        <ConsistencyCard games={dlData.recentGames.games} />
      </StatsCardBoundary>

      {/* 15. Monthly Trend */}
      <StatsCardBoundary name="月間推移">
        <MonthlyTrendChart
          monthly={dlData.monthly}
          monthlyTab={monthlyTab}
          onTabChange={onMonthlyTabChange}
          flightColor={flightColor}
        />
      </StatsCardBoundary>

      {/* ── インサイト ── */}
      <TierDivider label="インサイト" />

      {/* 16. Performance Insights */}
      {enrichedData && (enrichedData.stats01Detailed || enrichedData.statsCricketDetailed) && (
        <StatsCardBoundary name="パフォーマンスインサイト">
          <PerformanceInsightsCard enrichedData={enrichedData} currentRating={currentRating} />
        </StatsCardBoundary>
      )}

      {/* 17. Practice Recommendations */}
      {recInput && (
        <StatsCardBoundary name="練習レコメンド">
          <PracticeRecommendationsCard input={recInput} />
        </StatsCardBoundary>
      )}

      {/* 19. Recent Games */}
      <StatsCardBoundary name="最近のゲーム">
        <RecentGamesChart
          games={dlData.recentGames.games}
          gameChartCategory={gameChartCategory}
          onCategoryChange={onGameChartCategoryChange}
          expectedCountUp={expectedCountUp}
          dangerCountUp={dangerCountUp}
          excellentCountUp={excellentCountUp}
        />
      </StatsCardBoundary>

      {/* ── その他 ── */}
      <TierDivider label="その他" />

      {/* DartboardHeatmap（全期間ヒートマップ） */}
      {countupPlays && countupPlays.length >= 24 && (
        <StatsCardBoundary name="ダーツボードヒートマップ">
          <DartboardHeatmap countupPlays={countupPlays} />
        </StatsCardBoundary>
      )}

      {/* MissDirectionCard（全データミス方向） */}
      {countupPlays && countupPlays.length > 0 && (
        <StatsCardBoundary name="ミス方向分析">
          <MissDirectionCard countupPlays={countupPlays} />
        </StatsCardBoundary>
      )}

      {/* Recent Day Summary */}
      <StatsCardBoundary name="直近サマリー">
        <RecentDaySummary dayStats={dlData.recentGames.dayStats} shops={dlData.recentGames.shops} />
      </StatsCardBoundary>

      {/* 17. Bull Stats */}
      <StatsCardBoundary name="ブルスタッツ">
        <BullStatsCard awards={c.awards} />
      </StatsCardBoundary>

      {/* 18. Session Comparison */}
      <StatsCardBoundary name="セッション比較">
        <SessionComparisonCard periodRecords={periodRecords} />
      </StatsCardBoundary>

      {/* 19. Condition × Performance Correlation */}
      <StatsCardBoundary name="コンディション相関">
        <ConditionCorrelationCard periodRecords={periodRecords} />
      </StatsCardBoundary>

      {/* 20. Awards Table */}
      <StatsCardBoundary name="アワード">
        <AwardsTable awards={c.awards} />
      </StatsCardBoundary>

      {/* 21. Active Dart */}
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
