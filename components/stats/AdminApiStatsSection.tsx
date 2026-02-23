'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  Collapse,
  IconButton,
} from '@mui/material';
import SyncIcon from '@mui/icons-material/Sync';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SkillRadarChart from './SkillRadarChart';
import PlayerDnaCard from './PlayerDnaCard';
import PerformanceInsightsCard from './PerformanceInsightsCard';
import DetailedGameStatsCard from './DetailedGameStatsCard';
import DartoutAnalysisCard from './DartoutAnalysisCard';
import RatingSimulatorCard from './RatingSimulatorCard';
import RollingTrendCard from './RollingTrendCard';
import StreakPatternCard from './StreakPatternCard';
import PeriodComparisonCard from './PeriodComparisonCard';
import AwardPaceCard from './AwardPaceCard';
import CountUpDeepAnalysisCard from './CountUpDeepAnalysisCard';
import type { CountUpPlay } from './CountUpDeepAnalysisCard';
import CountUpRoundAnalysisCard from './CountUpRoundAnalysisCard';
import DartboardHeatmap from './DartboardHeatmap';
import SensorTrendCard from './SensorTrendCard';
import SpeedAccuracyCard from './SpeedAccuracyCard';
import SessionFatigueCard from './SessionFatigueCard';
import PracticeRecommendationsCard from './PracticeRecommendationsCard';
import GameAveragesCard from './GameAveragesCard';
import RatingBenchmarkCard from './RatingBenchmarkCard';
import { calculateConsistency, analyzeMissDirection } from '@/lib/stats-math';
import { analyzeSensor } from '@/lib/sensor-analysis';
import { analyzeSession } from '@/lib/session-analysis';
import { analyzeRounds } from '@/lib/countup-round-analysis';
import type { RecommendationInput } from '@/lib/practice-recommendations';

interface DailyRecord {
  date: string;
  rating: number | null;
  stats01Avg: number | null;
  statsCriAvg: number | null;
  stats01Avg100?: number | null;
  statsCriAvg100?: number | null;
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
  gameAverages: { gameId: string; gameName: string; average: number; playCount: number }[] | null;
  apiSyncAt: string | null;
}

interface DartoutItem {
  score: number;
  count: number;
}

interface AwardEntry {
  date: string;
  awards: Record<string, number>;
}

interface RecentPlay {
  date: string;
  gameId: string;
  gameName: string;
  score: number;
  awards?: Record<string, number>;
}

interface AdminApiStatsSectionProps {
  dailyHistory: DailyRecord[];
  enrichedData: EnrichedData | null;
  onSyncComplete: () => void;
  dartoutList?: DartoutItem[] | null;
  awardList?: AwardEntry[] | null;
  recentPlays?: RecentPlay[] | null;
  countupPlays?: CountUpPlay[] | null;
}

const STORAGE_KEY = 'stats_collapsed_sections';

function loadCollapsed(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveCollapsed(state: Record<string, boolean>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

function CollapsibleSection({
  id,
  label,
  collapsed,
  onToggle,
  children,
}: {
  id: string;
  label: string;
  collapsed: boolean;
  onToggle: (id: string) => void;
  children: React.ReactNode;
}) {
  return (
    <>
      <Box
        onClick={() => onToggle(id)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mt: 3,
          mb: collapsed ? 0 : 1.5,
          cursor: 'pointer',
          userSelect: 'none',
          '&:hover .section-label': { color: 'text.primary' },
        }}
      >
        <Divider sx={{ flex: 1 }} />
        <Typography
          className="section-label"
          variant="caption"
          color="text.secondary"
          sx={{ fontWeight: 'bold', letterSpacing: 1, transition: 'color 0.2s' }}
        >
          {label}
        </Typography>
        <IconButton
          size="small"
          sx={{
            p: 0,
            transition: 'transform 0.2s',
            transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
          }}
        >
          <ExpandMoreIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
        </IconButton>
        <Divider sx={{ flex: 1 }} />
      </Box>
      <Collapse in={!collapsed}>{children}</Collapse>
    </>
  );
}

export default function AdminApiStatsSection({
  dailyHistory,
  enrichedData,
  onSyncComplete,
  dartoutList,
  awardList,
  recentPlays,
  countupPlays,
}: AdminApiStatsSectionProps) {
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setCollapsed(loadCollapsed());
  }, []);

  const toggleSection = useCallback((id: string) => {
    setCollapsed((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      saveCollapsed(next);
      return next;
    });
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    setSyncError(null);
    setSyncResult(null);
    try {
      const res = await fetch('/api/admin/dartslive-sync', { method: 'POST' });
      const json = await res.json();
      if (!res.ok) {
        setSyncError(json.error || 'API同期に失敗しました');
        return;
      }
      setSyncResult(
        `同期完了: ${json.dailyHistoryImported}日分の履歴、${json.recentPlaysCount}件のプレイログ`,
      );
      onSyncComplete();
    } catch {
      setSyncError('通信エラーが発生しました');
    } finally {
      setSyncing(false);
    }
  };

  // 直近のレーティング（日別履歴の最新）
  const currentRating = dailyHistory.length > 0 ? dailyHistory[0]?.rating : null;

  // COUNT-UP平均スコア
  const countupAvg = useMemo(() => {
    if (!countupPlays || countupPlays.length === 0) return null;
    const scores = countupPlays.map((p) => p.score);
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  }, [countupPlays]);

  // 練習レコメンデーション用の入力データ構築
  const recInput = useMemo((): RecommendationInput | null => {
    if (!enrichedData) return null;
    const s01 = enrichedData.stats01Detailed;
    const sCri = enrichedData.statsCricketDetailed;

    // COUNT-UPの安定度
    let countupConsistency: number | null = null;
    if (countupPlays && countupPlays.length >= 3) {
      const consistency = calculateConsistency(countupPlays.map((p) => p.score));
      countupConsistency = consistency?.score ?? null;
    }

    // ミス方向
    let primaryMissDirection: string | null = null;
    let directionStrength: number | null = null;
    if (countupPlays && countupPlays.length > 0) {
      const missResult = analyzeMissDirection(countupPlays.map((p) => p.playLog));
      if (missResult) {
        primaryMissDirection = missResult.primaryDirection;
        directionStrength = missResult.directionStrength;
      }
    }

    // センサー
    let avgRadius: number | null = null;
    let radiusImprovement: number | null = null;
    let avgSpeed: number | null = null;
    if (countupPlays && countupPlays.length >= 10) {
      const sensor = analyzeSensor(countupPlays);
      if (sensor) {
        avgRadius = sensor.overallStats.avgRadius;
        radiusImprovement = sensor.overallStats.radiusImprovement;
        avgSpeed = sensor.overallStats.avgSpeed;
      }
    }

    // セッション
    let optimalSessionLength: number | null = null;
    let peakGameNumber: number | null = null;
    if (countupPlays && countupPlays.length >= 10) {
      const session = analyzeSession(countupPlays);
      if (session) {
        optimalSessionLength = session.optimalLength.optimalLength;
        peakGameNumber = session.optimalLength.peakGameNumber;
      }
    }

    // ラウンド
    let roundPattern: string | null = null;
    let worstRound: number | null = null;
    if (countupPlays && countupPlays.length >= 5) {
      const rounds = analyzeRounds(countupPlays.map((p) => p.playLog));
      if (rounds) {
        roundPattern = rounds.pattern.pattern;
        worstRound = rounds.worstRound;
      }
    }

    return {
      ppd: s01?.avg ?? null,
      bullRate: s01?.bullRate ?? null,
      arrangeRate: s01?.arrangeRate ?? null,
      avgBust: s01?.avgBust ?? null,
      mpr: sCri?.avg ?? null,
      tripleRate: sCri?.tripleRate ?? null,
      openCloseRate: sCri?.openCloseRate ?? null,
      countupAvg,
      countupConsistency,
      primaryMissDirection,
      directionStrength,
      avgRadius,
      radiusImprovement,
      avgSpeed,
      optimalSessionLength,
      peakGameNumber,
      roundPattern,
      worstRound,
    };
  }, [enrichedData, countupPlays, countupAvg]);

  return (
    <Box sx={{ mt: 3 }}>
      {/* ヘッダー */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            API データ
          </Typography>
          <Chip label="ADMIN" size="small" color="error" />
        </Box>
        <Button
          variant="outlined"
          size="small"
          startIcon={syncing ? <CircularProgress size={16} color="inherit" /> : <SyncIcon />}
          onClick={handleSync}
          disabled={syncing}
        >
          {syncing ? '同期中...' : 'API同期'}
        </Button>
      </Box>

      {syncError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {syncError}
        </Alert>
      )}
      {syncResult && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {syncResult}
        </Alert>
      )}

      {enrichedData?.apiSyncAt && (
        <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
          最終API同期:{' '}
          {new Date(enrichedData.apiSyncAt).toLocaleString('ja-JP', {
            month: 'numeric',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Typography>
      )}

      {/* AI分析 */}
      {recInput && (
        <CollapsibleSection
          id="ai"
          label="AI分析"
          collapsed={!!collapsed.ai}
          onToggle={toggleSection}
        >
          <PracticeRecommendationsCard input={recInput} />
        </CollapsibleSection>
      )}

      {/* スキル分析 */}
      <CollapsibleSection
        id="skill"
        label="スキル分析"
        collapsed={!!collapsed.skill}
        onToggle={toggleSection}
      >
        <SkillRadarChart
          stats01={enrichedData?.stats01Detailed ?? null}
          statsCricket={enrichedData?.statsCricketDetailed ?? null}
        />
        <PlayerDnaCard
          stats01={enrichedData?.stats01Detailed ?? null}
          statsCricket={enrichedData?.statsCricketDetailed ?? null}
          countupAvg={countupAvg}
        />
        {enrichedData && (
          <PerformanceInsightsCard enrichedData={enrichedData} currentRating={currentRating} />
        )}
      </CollapsibleSection>

      {/* ゲーム詳細 */}
      <CollapsibleSection
        id="game_detail"
        label="ゲーム詳細"
        collapsed={!!collapsed.game_detail}
        onToggle={toggleSection}
      >
        <DetailedGameStatsCard
          stats01={enrichedData?.stats01Detailed ?? null}
          statsCricket={enrichedData?.statsCricketDetailed ?? null}
        />
        <RatingBenchmarkCard currentPpd={enrichedData?.stats01Detailed?.avg} />
        {enrichedData?.stats01Detailed?.avg != null &&
          enrichedData?.statsCricketDetailed?.avg != null && (
            <RatingSimulatorCard
              currentPpd={enrichedData.stats01Detailed.avg}
              currentMpr={enrichedData.statsCricketDetailed.avg}
            />
          )}
      </CollapsibleSection>

      {/* 推移・履歴 */}
      <CollapsibleSection
        id="trend"
        label="推移・履歴"
        collapsed={!!collapsed.trend}
        onToggle={toggleSection}
      >
        {dailyHistory.length >= 7 && <RollingTrendCard dailyHistory={dailyHistory} />}
        {dailyHistory.length >= 4 && <PeriodComparisonCard dailyHistory={dailyHistory} />}
        {dailyHistory.length >= 5 && <StreakPatternCard dailyHistory={dailyHistory} />}
        {awardList && awardList.length >= 2 && <AwardPaceCard awardList={awardList} />}
      </CollapsibleSection>

      {/* ゲーム分析 */}
      {(recentPlays?.length || countupPlays?.length || (dartoutList && dartoutList.length > 0)) && (
        <CollapsibleSection
          id="game_analysis"
          label="ゲーム分析"
          collapsed={!!collapsed.game_analysis}
          onToggle={toggleSection}
        >
          {dartoutList && dartoutList.length > 0 && (
            <DartoutAnalysisCard dartoutList={dartoutList} />
          )}
          {countupPlays && countupPlays.length > 0 && (
            <CountUpDeepAnalysisCard
              countupPlays={countupPlays}
              stats01Detailed={enrichedData?.stats01Detailed}
              bestRecords={enrichedData?.bestRecords}
            />
          )}
          {countupPlays && countupPlays.length >= 5 && (
            <CountUpRoundAnalysisCard countupPlays={countupPlays} />
          )}
          {countupPlays && countupPlays.length >= 24 && (
            <DartboardHeatmap countupPlays={countupPlays} />
          )}
          {countupPlays && countupPlays.length >= 10 && (
            <SessionFatigueCard countupPlays={countupPlays} />
          )}
        </CollapsibleSection>
      )}

      {/* センサー分析 */}
      {countupPlays && countupPlays.length >= 10 && (
        <CollapsibleSection
          id="sensor"
          label="センサー分析"
          collapsed={!!collapsed.sensor}
          onToggle={toggleSection}
        >
          <SensorTrendCard countupPlays={countupPlays} />
          <SpeedAccuracyCard countupPlays={countupPlays} />
        </CollapsibleSection>
      )}

      {/* 記録 */}
      {enrichedData?.gameAverages && (
        <CollapsibleSection
          id="records"
          label="記録"
          collapsed={!!collapsed.records}
          onToggle={toggleSection}
        >
          <GameAveragesCard averages={enrichedData.gameAverages} />
        </CollapsibleSection>
      )}
    </Box>
  );
}
