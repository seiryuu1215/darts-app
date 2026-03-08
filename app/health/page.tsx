'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  Alert,
  AlertTitle,
  LinearProgress,
  Skeleton,
  Container,
} from '@mui/material';
import SyncIcon from '@mui/icons-material/Sync';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import type { HealthMetric, HealthDartsCorrelation } from '@/types';
import { generateHealthInsights } from '@/lib/health-analytics';
import {
  isNativePlatform,
  isHealthKitSetupComplete,
  markHealthKitSetupComplete,
  getLastSyncDate,
  autoSyncIfNeeded,
  type SyncProgress,
} from '@/lib/capacitor/health-sync';
import { PERIOD_OPTIONS } from '@/components/health/constants';
import { HeartSection } from '@/components/health/HeartSection';
import { SleepSection } from '@/components/health/SleepSection';
import { ActivitySection } from '@/components/health/ActivitySection';
import { VitalsSection } from '@/components/health/VitalsSection';
import { ConditionScoreSection } from '@/components/health/ConditionScoreSection';
import { BestConditionSection } from '@/components/health/BestConditionSection';
import { PracticeTimingSection } from '@/components/health/PracticeTimingSection';
import { MonthlyTrendSection } from '@/components/health/MonthlyTrendSection';
import { SleepStageCorrelationSection } from '@/components/health/SleepStageCorrelationSection';
import { DetailDrawer } from '@/components/health/DetailDrawer';

export default function HealthPage() {
  const [metrics, setMetrics] = useState<HealthMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<number>(7);
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);
  const [setupNeeded, setSetupNeeded] = useState(false);
  const [isNative, setIsNative] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [detailType, setDetailType] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const [correlationData, setCorrelationData] = useState<HealthDartsCorrelation[]>([]);
  const addLog = (msg: string) =>
    setDebugLog((prev) => [...prev, `${new Date().toLocaleTimeString()} ${msg}`]);

  const fetchMetrics = useCallback(async (days: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/health-metrics?days=${days}`);
      if (res.ok) {
        const data = await res.json();
        setMetrics(data.metrics || []);
      }
    } catch (err) {
      console.error('Failed to fetch health metrics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const native = isNativePlatform();
    setIsNative(native);

    if (native) {
      setSetupNeeded(!isHealthKitSetupComplete());
      const ls = getLastSyncDate();
      setLastSync(ls ? ls.toLocaleString('ja-JP') : null);

      autoSyncIfNeeded().then((result) => {
        if (result?.success) {
          setLastSync(new Date().toLocaleString('ja-JP'));
          fetchMetrics(period);
        }
      });
    }

    fetchMetrics(period);

    fetch('/api/health-correlation?days=180')
      .then((r) => (r.ok ? r.json() : { correlations: [] }))
      .then((d) => setCorrelationData(d.correlations || []))
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchMetrics(period);
  }, [period, fetchMetrics]);

  const handleSetup = async () => {
    setSyncing(true);
    setSyncError(null);
    setDebugLog([]);
    try {
      const { registerPlugin } = await import('@capacitor/core');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const plugin = registerPlugin<any>('HealthKitPlugin');

      addLog('1. 権限リクエスト...');
      const authResult = await plugin.requestAuthorization();
      addLog('1. 結果: ' + JSON.stringify(authResult));

      addLog('2. 今日のデータ読み取り...');
      const metrics = await plugin.readTodayMetrics();
      addLog('2. メトリクス: ' + JSON.stringify(metrics).substring(0, 200));

      if (!metrics || !metrics.metricDate) {
        setSyncError('HealthKitデータの取得に失敗しました');
        setSyncing(false);
        return;
      }

      addLog('3. セットアップ完了処理...');
      markHealthKitSetupComplete();
      setSetupNeeded(false);
      addLog('4. セットアップ完了！データ同期は自動で実行されます');
    } catch (err) {
      addLog('エラー: ' + (err instanceof Error ? err.message : String(err)));
      setSyncError(err instanceof Error ? err.message : 'セットアップに失敗しました');
    } finally {
      setSyncing(false);
      setSyncProgress(null);
    }
  };

  const getFirebaseUser = async () => {
    const { getAuth } = await import('firebase/auth');
    const user = getAuth().currentUser;
    if (user) return user;

    return new Promise<import('firebase/auth').User | null>((resolve) => {
      const unsub = getAuth().onAuthStateChanged((u) => {
        unsub();
        resolve(u);
      });
      setTimeout(() => resolve(null), 5000);
    });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const writeMetricsToFirestore = async (uid: string, metricsList: any[]) => {
    const { doc, writeBatch, serverTimestamp } = await import('firebase/firestore');
    const { db } = await import('@/lib/firebase');
    for (let i = 0; i < metricsList.length; i += 400) {
      const chunk = metricsList.slice(i, i + 400);
      const batch = writeBatch(db);
      for (const m of chunk) {
        if (!m.metricDate) continue;
        const ref = doc(db, 'users', uid, 'healthMetrics', m.metricDate);
        batch.set(ref, { ...m, source: 'capacitor', syncedAt: serverTimestamp() }, { merge: true });
      }
      await batch.commit();
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncError(null);
    setDebugLog([]);
    try {
      const { registerPlugin } = await import('@capacitor/core');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const plugin = registerPlugin<any>('HealthKitPlugin');

      addLog('1. Firebase Auth確認...');
      const firebaseUser = await getFirebaseUser();
      if (!firebaseUser) {
        setSyncError('Firebaseにログインしていません');
        addLog('1. Firebase未認証');
        return;
      }
      addLog('1. OK: ' + firebaseUser.uid.substring(0, 8) + '...');

      addLog('2. 過去30日分のデータ読み取り中...');
      setSyncProgress({ current: 0, total: 30, phase: 'reading' });
      const rangeResult = await plugin.readMetricsForRange({ days: 30 });
      const allMetrics = rangeResult?.metrics ?? [];
      addLog('2. 取得: ' + allMetrics.length + '日分');

      if (allMetrics.length === 0) {
        setSyncError('HealthKitにデータがありません。設定→ヘルスケアで権限を確認してください');
        return;
      }

      const daysWithData = allMetrics.filter(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (m: any) => m.restingHr || m.steps || m.sleepDurationMinutes || m.avgHr,
      ).length;
      addLog('2. データあり: ' + daysWithData + '日');

      addLog('3. Firestore書き込み中...');
      setSyncProgress({ current: 15, total: 30, phase: 'writing' });
      await writeMetricsToFirestore(firebaseUser.uid, allMetrics);
      addLog('3. 書き込み完了');

      setLastSync(new Date().toLocaleString('ja-JP'));
      addLog('4. 同期完了！ ' + allMetrics.length + '日分');
      await fetchMetrics(period);
    } catch (err) {
      addLog('エラー: ' + (err instanceof Error ? err.message : String(err)));
      setSyncError(err instanceof Error ? err.message : '同期に失敗しました');
    } finally {
      setSyncing(false);
      setSyncProgress(null);
    }
  };

  const latest = metrics.length > 0 ? metrics[0] : null;
  const previousLatest = metrics.length > 1 ? metrics[1] : null;

  const insights = useMemo(() => generateHealthInsights(metrics), [metrics]);

  return (
    <Container maxWidth="sm" sx={{ py: 2, px: { xs: 1.5, sm: 2 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <HealthAndSafetyIcon sx={{ color: '#22c55e' }} />
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          ヘルスケア
        </Typography>
      </Box>

      {isNative && setupNeeded && (
        <Paper
          sx={{ p: 2, mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'primary.main' }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
            HealthKit連携を設定
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Apple Healthのデータを同期して、体調とダーツパフォーマンスの関係を分析します。
          </Typography>
          <Button
            variant="contained"
            onClick={handleSetup}
            disabled={syncing}
            startIcon={<HealthAndSafetyIcon />}
            fullWidth
          >
            {syncing ? 'セットアップ中...' : 'HealthKitを有効化'}
          </Button>
          {syncProgress && syncProgress.phase === 'writing' && (
            <Box sx={{ mt: 1 }}>
              <LinearProgress
                variant="determinate"
                value={(syncProgress.current / syncProgress.total) * 100}
              />
              <Typography variant="caption" color="text.secondary">
                {syncProgress.current} / {syncProgress.total} 日分を同期中...
              </Typography>
            </Box>
          )}
          {syncError && (
            <Alert severity="error" sx={{ mt: 1 }}>
              {syncError}
            </Alert>
          )}
          {debugLog.length > 0 && (
            <Box
              sx={{
                mt: 1,
                p: 1,
                bgcolor: '#111',
                borderRadius: 1,
                maxHeight: 150,
                overflow: 'auto',
              }}
            >
              {debugLog.map((log, i) => (
                <Typography
                  key={i}
                  variant="caption"
                  sx={{ display: 'block', fontFamily: 'monospace', color: '#0f0', fontSize: 10 }}
                >
                  {log}
                </Typography>
              ))}
            </Box>
          )}
        </Paper>
      )}

      {isNative && !setupNeeded && (
        <Box
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}
        >
          <Typography variant="caption" color="text.secondary">
            {lastSync ? `最終同期: ${lastSync}` : '未同期'}
          </Typography>
          <Button
            size="small"
            startIcon={<SyncIcon sx={{ fontSize: 14 }} />}
            onClick={handleSync}
            disabled={syncing}
            sx={{ fontSize: 12 }}
          >
            同期
          </Button>
        </Box>
      )}

      {!setupNeeded && debugLog.length > 0 && (
        <Box
          sx={{ mb: 1.5, p: 1, bgcolor: '#111', borderRadius: 1, maxHeight: 150, overflow: 'auto' }}
        >
          {debugLog.map((log, i) => (
            <Typography
              key={i}
              variant="caption"
              sx={{ display: 'block', fontFamily: 'monospace', color: '#0f0', fontSize: 10 }}
            >
              {log}
            </Typography>
          ))}
          {syncError && (
            <Alert severity="error" sx={{ mt: 1 }}>
              {syncError}
            </Alert>
          )}
        </Box>
      )}

      <ToggleButtonGroup
        value={period}
        exclusive
        onChange={(_, v) => v !== null && setPeriod(v)}
        size="small"
        fullWidth
        sx={{ mb: 2 }}
      >
        {PERIOD_OPTIONS.map((opt) => (
          <ToggleButton key={opt.days} value={opt.days} sx={{ fontSize: 12, py: 0.5 }}>
            {opt.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      {loading && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Skeleton variant="rounded" height={100} />
          <Skeleton variant="rounded" height={100} />
          <Skeleton variant="rounded" height={100} />
        </Box>
      )}

      {!loading && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {insights.length > 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {insights.map((insight, i) => (
                <Alert
                  key={i}
                  severity={
                    insight.severity === 'critical'
                      ? 'error'
                      : insight.severity === 'warning'
                        ? 'warning'
                        : 'info'
                  }
                  variant="outlined"
                  sx={{ borderRadius: 2 }}
                >
                  <AlertTitle sx={{ fontSize: 12 }}>
                    {insight.type === 'correlation'
                      ? '相関分析'
                      : insight.type === 'trend'
                        ? 'トレンド'
                        : '警告'}
                  </AlertTitle>
                  <Typography variant="body2" sx={{ fontSize: 13 }}>
                    {insight.messageJa}
                  </Typography>
                </Alert>
              ))}
            </Box>
          )}

          {metrics.length === 0 && (
            <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 2 }}>
              <HealthAndSafetyIcon sx={{ fontSize: 48, color: '#52525b', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                ヘルスデータがありません
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {isNative
                  ? 'HealthKitを連携してデータを同期してください'
                  : 'iOSアプリからHealthKitデータを同期してください'}
              </Typography>
            </Paper>
          )}

          {metrics.length > 0 && (
            <>
              <HeartSection
                metrics={metrics}
                latest={latest}
                previousLatest={previousLatest}
                onDetailOpen={setDetailType}
              />
              <SleepSection
                metrics={metrics}
                latest={latest}
                previousLatest={previousLatest}
                onDetailOpen={setDetailType}
              />
              <ActivitySection
                metrics={metrics}
                latest={latest}
                previousLatest={previousLatest}
                onDetailOpen={setDetailType}
              />
              <VitalsSection latest={latest} previousLatest={previousLatest} />

              <ConditionScoreSection metrics={metrics} correlationData={correlationData} />
              <BestConditionSection correlationData={correlationData} />
              <PracticeTimingSection correlationData={correlationData} />
              <MonthlyTrendSection correlationData={correlationData} />
              <SleepStageCorrelationSection correlationData={correlationData} />
            </>
          )}
        </Box>
      )}

      <DetailDrawer
        open={detailType !== null}
        onClose={() => setDetailType(null)}
        type={detailType || ''}
        metrics={metrics}
      />
    </Container>
  );
}
