'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  Checkbox,
  FormControlLabel,
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
import dynamic from 'next/dynamic';
import type { CountUpPlay } from './CountUpDeepAnalysisCard';

// 軽量カード — 静的import
import DetailedGameStatsCard from './DetailedGameStatsCard';

// 重量カード — dynamic import（初期バンドルから除外）
const PlayerDnaCard = dynamic(() => import('./PlayerDnaCard'));
const CountUpDeepAnalysisCard = dynamic(() => import('./CountUpDeepAnalysisCard'));
const ZeroOneDeepAnalysisCard = dynamic(() => import('./ZeroOneDeepAnalysisCard'));
const CricketDeepAnalysisCard = dynamic(() => import('./CricketDeepAnalysisCard'));
const DartboardHeatmap = dynamic(() => import('./DartboardHeatmap'));
const SensorTrendCard = dynamic(() => import('./SensorTrendCard'));
const SessionFatigueCard = dynamic(() => import('./SessionFatigueCard'));
import StatsCardBoundary from './StatsCardBoundary';

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

interface AdminApiStatsSectionProps {
  dailyHistory: DailyRecord[];
  enrichedData: EnrichedData | null;
  onSyncComplete: () => void;
  dartoutList?: DartoutItem[] | null;
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
            aria-label="表示カード設定"
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
  countupPlays,
}: AdminApiStatsSectionProps) {
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [forceFullSync, setForceFullSync] = useState(false);
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
      const res = await fetch('/api/admin/dartslive-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forceFullSync }),
      });
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={syncing ? <CircularProgress size={16} color="inherit" /> : <SyncIcon />}
            onClick={handleSync}
            disabled={syncing}
          >
            {syncing ? '同期中...' : 'API同期'}
          </Button>
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={forceFullSync}
                onChange={(_, v) => setForceFullSync(v)}
              />
            }
            label="全部取り直し"
            sx={{ ml: 0.5, '& .MuiFormControlLabel-label': { fontSize: 12 } }}
            disabled={syncing}
          />
        </Box>
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

      {/* ゲーム詳細分析 */}
      <CollapsibleSection
        id="game_detail"
        label="ゲーム詳細分析"
        collapsed={!!collapsed.game_detail}
        onToggle={toggleSection}
        cards={[
          { id: 'detailed_game', label: 'ゲーム詳細' },
          { id: 'player_dna', label: 'プレイヤーDNA' },
        ]}
        hiddenCards={hiddenCards}
        onToggleCard={toggleCard}
      >
        {!hiddenCards.detailed_game && (
          <StatsCardBoundary name="ゲーム詳細">
            <DetailedGameStatsCard
              stats01={enrichedData?.stats01Detailed ?? null}
              statsCricket={enrichedData?.statsCricketDetailed ?? null}
            />
          </StatsCardBoundary>
        )}
        {!hiddenCards.player_dna && (
          <StatsCardBoundary name="プレイヤーDNA">
            <PlayerDnaCard
              stats01={enrichedData?.stats01Detailed ?? null}
              statsCricket={enrichedData?.statsCricketDetailed ?? null}
              countupAvg={countupAvg}
            />
          </StatsCardBoundary>
        )}
      </CollapsibleSection>

      {/* ゲーム別深掘り */}
      <CollapsibleSection
        id="game_deep"
        label="ゲーム別深掘り"
        collapsed={!!collapsed.game_deep}
        onToggle={toggleSection}
        cards={[
          { id: 'countup_deep', label: 'COUNT-UP深掘り' },
          { id: 'zeroone_deep', label: '01深掘り' },
          { id: 'cricket_deep', label: 'Cricket深掘り' },
          { id: 'dartboard_heatmap', label: 'ヒートマップ' },
        ]}
        hiddenCards={hiddenCards}
        onToggleCard={toggleCard}
      >
        {!hiddenCards.countup_deep && countupPlays && countupPlays.length > 0 && (
          <StatsCardBoundary name="COUNT-UP深掘り分析">
            <CountUpDeepAnalysisCard
              countupPlays={countupPlays}
              stats01Detailed={enrichedData?.stats01Detailed}
              bestRecords={enrichedData?.bestRecords}
            />
          </StatsCardBoundary>
        )}
        {!hiddenCards.zeroone_deep && (
          <StatsCardBoundary name="01深掘り分析">
            <ZeroOneDeepAnalysisCard
              stats01Detailed={enrichedData?.stats01Detailed ?? null}
              dailyHistory={dailyHistory}
              dartoutList={dartoutList ?? null}
              currentRating={currentRating}
              statsCriAvg={enrichedData?.statsCricketDetailed?.avg ?? null}
            />
          </StatsCardBoundary>
        )}
        {!hiddenCards.cricket_deep && (
          <StatsCardBoundary name="Cricket深掘り分析">
            <CricketDeepAnalysisCard
              statsCricketDetailed={enrichedData?.statsCricketDetailed ?? null}
              dailyHistory={dailyHistory}
              bullRate={enrichedData?.stats01Detailed?.bullRate ?? null}
              currentRating={currentRating}
              stats01Avg={enrichedData?.stats01Detailed?.avg ?? null}
            />
          </StatsCardBoundary>
        )}
        {!hiddenCards.dartboard_heatmap && countupPlays && countupPlays.length >= 24 && (
          <StatsCardBoundary name="ダーツボードヒートマップ">
            <DartboardHeatmap countupPlays={countupPlays} />
          </StatsCardBoundary>
        )}
      </CollapsibleSection>

      {/* センサー・セッション */}
      {countupPlays && countupPlays.length >= 10 && (
        <CollapsibleSection
          id="sensor"
          label="センサー・セッション"
          collapsed={!!collapsed.sensor}
          onToggle={toggleSection}
          cards={[
            { id: 'sensor_trend', label: 'センサー推移' },
            { id: 'session_fatigue', label: 'セッション疲労' },
          ]}
          hiddenCards={hiddenCards}
          onToggleCard={toggleCard}
        >
          {!hiddenCards.sensor_trend && (
            <StatsCardBoundary name="センサー推移">
              <SensorTrendCard countupPlays={countupPlays} />
            </StatsCardBoundary>
          )}
          {!hiddenCards.session_fatigue && (
            <StatsCardBoundary name="セッション疲労分析">
              <SessionFatigueCard countupPlays={countupPlays} />
            </StatsCardBoundary>
          )}
        </CollapsibleSection>
      )}
    </Box>
  );
}
