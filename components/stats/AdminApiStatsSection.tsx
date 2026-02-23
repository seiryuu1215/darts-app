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
  Popover,
} from '@mui/material';
import SyncIcon from '@mui/icons-material/Sync';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import TuneIcon from '@mui/icons-material/Tune';
import SkillRadarChart from './SkillRadarChart';
import PlayerDnaCard from './PlayerDnaCard';
import PerformanceInsightsCard from './PerformanceInsightsCard';
import DetailedGameStatsCard from './DetailedGameStatsCard';

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
const HIDDEN_CARDS_KEY = 'stats_hidden_cards';

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

function loadHiddenCards(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(HIDDEN_CARDS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveHiddenCards(state: Record<string, boolean>) {
  try {
    localStorage.setItem(HIDDEN_CARDS_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

interface CardDef {
  id: string;
  label: string;
}

function CollapsibleSection({
  id,
  label,
  collapsed,
  onToggle,
  cards,
  hiddenCards,
  onToggleCard,
  children,
}: {
  id: string;
  label: string;
  collapsed: boolean;
  onToggle: (id: string) => void;
  cards?: CardDef[];
  hiddenCards?: Record<string, boolean>;
  onToggleCard?: (cardId: string) => void;
  children: React.ReactNode;
}) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mt: 3,
          mb: collapsed ? 0 : 1.5,
          userSelect: 'none',
        }}
      >
        <Divider sx={{ flex: 1 }} />
        {cards && cards.length > 0 && onToggleCard && (
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              setAnchorEl(e.currentTarget);
            }}
            sx={{ p: 0 }}
          >
            <TuneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
          </IconButton>
        )}
        <Box
          onClick={() => onToggle(id)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            cursor: 'pointer',
            '&:hover .section-label': { color: 'text.primary' },
          }}
        >
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
        </Box>
        <Divider sx={{ flex: 1 }} />
      </Box>
      {cards && hiddenCards && onToggleCard && (
        <Popover
          open={Boolean(anchorEl)}
          anchorEl={anchorEl}
          onClose={() => setAnchorEl(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          transformOrigin={{ vertical: 'top', horizontal: 'center' }}
          slotProps={{
            paper: {
              sx: { p: 1.5, bgcolor: '#1e1e1e', border: '1px solid #444', maxWidth: 320 },
            },
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            表示するカードを選択
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {cards.map((c) => (
              <Chip
                key={c.id}
                label={c.label}
                size="small"
                variant={hiddenCards[c.id] ? 'outlined' : 'filled'}
                onClick={() => onToggleCard(c.id)}
                sx={{
                  fontSize: 11,
                  height: 26,
                  opacity: hiddenCards[c.id] ? 0.5 : 1,
                  cursor: 'pointer',
                }}
              />
            ))}
          </Box>
        </Popover>
      )}
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
  const [hiddenCards, setHiddenCards] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setCollapsed(loadCollapsed());
    setHiddenCards(loadHiddenCards());
  }, []);

  const toggleSection = useCallback((id: string) => {
    setCollapsed((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      saveCollapsed(next);
      return next;
    });
  }, []);

  const toggleCard = useCallback((cardId: string) => {
    setHiddenCards((prev) => {
      const next = { ...prev, [cardId]: !prev[cardId] };
      saveHiddenCards(next);
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

  // COUNT-UP平均スコア（直近30G）
  const countupAvg = useMemo(() => {
    if (!countupPlays || countupPlays.length === 0) return null;
    const recent = countupPlays.slice(-30);
    const scores = recent.map((p) => p.score);
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
          cards={[{ id: 'practice_recommendations', label: 'レコメンド' }]}
          hiddenCards={hiddenCards}
          onToggleCard={toggleCard}
        >
          {!hiddenCards.practice_recommendations && (
            <PracticeRecommendationsCard input={recInput} />
          )}
        </CollapsibleSection>
      )}

      {/* スキル分析 */}
      <CollapsibleSection
        id="skill"
        label="スキル分析"
        collapsed={!!collapsed.skill}
        onToggle={toggleSection}
        cards={[
          { id: 'skill_radar', label: 'スキルレーダー' },
          { id: 'player_dna', label: 'プレイヤーDNA' },
          { id: 'performance_insights', label: 'インサイト' },
        ]}
        hiddenCards={hiddenCards}
        onToggleCard={toggleCard}
      >
        {!hiddenCards.skill_radar && (
          <SkillRadarChart
            stats01={enrichedData?.stats01Detailed ?? null}
            statsCricket={enrichedData?.statsCricketDetailed ?? null}
          />
        )}
        {!hiddenCards.player_dna && (
          <PlayerDnaCard
            stats01={enrichedData?.stats01Detailed ?? null}
            statsCricket={enrichedData?.statsCricketDetailed ?? null}
            countupAvg={countupAvg}
          />
        )}
        {!hiddenCards.performance_insights && enrichedData && (
          <PerformanceInsightsCard enrichedData={enrichedData} currentRating={currentRating} />
        )}
      </CollapsibleSection>

      {/* ゲーム詳細 */}
      <CollapsibleSection
        id="game_detail"
        label="ゲーム詳細"
        collapsed={!!collapsed.game_detail}
        onToggle={toggleSection}
        cards={[
          { id: 'detailed_game', label: 'ゲーム詳細' },
          { id: 'rating_benchmark', label: 'ベンチマーク' },
          { id: 'rating_simulator', label: 'レート予測' },
        ]}
        hiddenCards={hiddenCards}
        onToggleCard={toggleCard}
      >
        {!hiddenCards.detailed_game && (
          <DetailedGameStatsCard
            stats01={enrichedData?.stats01Detailed ?? null}
            statsCricket={enrichedData?.statsCricketDetailed ?? null}
          />
        )}
        {!hiddenCards.rating_benchmark && (
          <RatingBenchmarkCard currentPpd={enrichedData?.stats01Detailed?.avg} />
        )}
        {!hiddenCards.rating_simulator &&
          enrichedData?.stats01Detailed?.avg != null &&
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
        cards={[
          { id: 'rolling_trend', label: '移動平均' },
          { id: 'period_comparison', label: '期間比較' },
          { id: 'streak_pattern', label: '連勝パターン' },
          { id: 'award_pace', label: 'アワードペース' },
        ]}
        hiddenCards={hiddenCards}
        onToggleCard={toggleCard}
      >
        {!hiddenCards.rolling_trend && dailyHistory.length >= 7 && (
          <RollingTrendCard dailyHistory={dailyHistory} />
        )}
        {!hiddenCards.period_comparison && dailyHistory.length >= 4 && (
          <PeriodComparisonCard dailyHistory={dailyHistory} />
        )}
        {!hiddenCards.streak_pattern && dailyHistory.length >= 5 && (
          <StreakPatternCard dailyHistory={dailyHistory} />
        )}
        {!hiddenCards.award_pace && awardList && awardList.length >= 2 && (
          <AwardPaceCard awardList={awardList} />
        )}
      </CollapsibleSection>

      {/* ゲーム分析 */}
      {(recentPlays?.length || countupPlays?.length) && (
        <CollapsibleSection
          id="game_analysis"
          label="ゲーム分析"
          collapsed={!!collapsed.game_analysis}
          onToggle={toggleSection}
          cards={[
            { id: 'countup_deep', label: 'COUNT-UP深掘り' },
            { id: 'countup_round', label: 'ラウンド分析' },
            { id: 'dartboard_heatmap', label: 'ヒートマップ' },
            { id: 'session_fatigue', label: 'セッション疲労' },
          ]}
          hiddenCards={hiddenCards}
          onToggleCard={toggleCard}
        >
          {!hiddenCards.countup_deep && countupPlays && countupPlays.length > 0 && (
            <CountUpDeepAnalysisCard
              countupPlays={countupPlays}
              stats01Detailed={enrichedData?.stats01Detailed}
              bestRecords={enrichedData?.bestRecords}
            />
          )}
          {!hiddenCards.countup_round && countupPlays && countupPlays.length >= 5 && (
            <CountUpRoundAnalysisCard countupPlays={countupPlays} />
          )}
          {!hiddenCards.dartboard_heatmap && countupPlays && countupPlays.length >= 24 && (
            <DartboardHeatmap countupPlays={countupPlays} />
          )}
          {!hiddenCards.session_fatigue && countupPlays && countupPlays.length >= 10 && (
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
          cards={[
            { id: 'sensor_trend', label: 'センサー推移' },
            { id: 'speed_accuracy', label: 'スピード精度' },
          ]}
          hiddenCards={hiddenCards}
          onToggleCard={toggleCard}
        >
          {!hiddenCards.sensor_trend && <SensorTrendCard countupPlays={countupPlays} />}
          {!hiddenCards.speed_accuracy && <SpeedAccuracyCard countupPlays={countupPlays} />}
        </CollapsibleSection>
      )}

      {/* 記録 */}
      {enrichedData?.gameAverages && (
        <CollapsibleSection
          id="records"
          label="記録"
          collapsed={!!collapsed.records}
          onToggle={toggleSection}
          cards={[{ id: 'game_averages', label: 'ゲーム平均' }]}
          hiddenCards={hiddenCards}
          onToggleCard={toggleCard}
        >
          {!hiddenCards.game_averages && <GameAveragesCard averages={enrichedData.gameAverages} />}
        </CollapsibleSection>
      )}
    </Box>
  );
}
