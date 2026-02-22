'use client';

import { useState } from 'react';
import { Box, Typography, Button, Chip, CircularProgress, Alert, Divider } from '@mui/material';
import SyncIcon from '@mui/icons-material/Sync';
import SkillRadarChart from './SkillRadarChart';
import PerformanceInsightsCard from './PerformanceInsightsCard';
import DetailedGameStatsCard from './DetailedGameStatsCard';
import DartoutAnalysisCard from './DartoutAnalysisCard';
import DailyHistoryChart from './DailyHistoryChart';
import AwardTrendChart from './AwardTrendChart';
import ScoreDistributionCard from './ScoreDistributionCard';
import BestRecordsCard from './BestRecordsCard';
import GameAveragesCard from './GameAveragesCard';

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
  flightColor?: string;
  onSyncComplete: () => void;
  dartoutList?: DartoutItem[] | null;
  awardList?: AwardEntry[] | null;
  recentPlays?: RecentPlay[] | null;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 3, mb: 1.5 }}>
      <Divider sx={{ flex: 1 }} />
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ fontWeight: 'bold', letterSpacing: 1 }}
      >
        {children}
      </Typography>
      <Divider sx={{ flex: 1 }} />
    </Box>
  );
}

export default function AdminApiStatsSection({
  dailyHistory,
  enrichedData,
  flightColor,
  onSyncComplete,
  dartoutList,
  awardList,
  recentPlays,
}: AdminApiStatsSectionProps) {
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<string | null>(null);

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

      {/* スキル分析 */}
      <SectionLabel>スキル分析</SectionLabel>
      <SkillRadarChart
        stats01={enrichedData?.stats01Detailed ?? null}
        statsCricket={enrichedData?.statsCricketDetailed ?? null}
      />
      {enrichedData && (
        <PerformanceInsightsCard enrichedData={enrichedData} currentRating={currentRating} />
      )}

      {/* ゲーム詳細 */}
      <SectionLabel>ゲーム詳細</SectionLabel>
      <DetailedGameStatsCard
        stats01={enrichedData?.stats01Detailed ?? null}
        statsCricket={enrichedData?.statsCricketDetailed ?? null}
      />
      {dartoutList && dartoutList.length > 0 && <DartoutAnalysisCard dartoutList={dartoutList} />}

      {/* 推移・履歴 */}
      <SectionLabel>推移・履歴</SectionLabel>
      {dailyHistory.length > 0 && (
        <DailyHistoryChart records={dailyHistory} flightColor={flightColor} />
      )}
      {awardList && awardList.length > 0 && <AwardTrendChart awardList={awardList} />}

      {/* ゲーム分析 */}
      {recentPlays && recentPlays.length > 0 && (
        <>
          <SectionLabel>ゲーム分析</SectionLabel>
          <ScoreDistributionCard recentPlays={recentPlays} />
        </>
      )}

      {/* 記録 */}
      {(enrichedData?.bestRecords || enrichedData?.gameAverages) && (
        <SectionLabel>記録</SectionLabel>
      )}
      {enrichedData?.bestRecords && <BestRecordsCard records={enrichedData.bestRecords} />}
      {enrichedData?.gameAverages && <GameAveragesCard averages={enrichedData.gameAverages} />}
    </Box>
  );
}
