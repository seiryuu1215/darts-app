import { doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '@/lib/firebase';

// ==========================================
// Capacitor HealthKitプラグイン呼び出しラッパー
// Web環境では無操作
// ==========================================

interface HealthKitMetrics {
  metricDate: string;
  restingHr: number | null;
  avgHr: number | null;
  maxHr: number | null;
  hrvSdnn: number | null;
  sleepDurationMinutes: number | null;
  sleepDeepMinutes: number | null;
  sleepRemMinutes: number | null;
  sleepCoreMinutes: number | null;
  sleepAwakeMinutes: number | null;
  timeInBedMinutes: number | null;
  steps: number | null;
  activeEnergyKcal: number | null;
  exerciseMinutes: number | null;
  standHours: number | null;
  respiratoryRate: number | null;
  bloodOxygenPct: number | null;
}

export interface SyncProgress {
  current: number;
  total: number;
  phase: 'requesting' | 'reading' | 'writing' | 'done';
}

export interface SyncResult {
  success: boolean;
  error?: string;
  syncedDays?: number;
}

// ==========================================
// ローカルストレージキー
// ==========================================
const LAST_SYNC_KEY = 'healthkit_last_sync';
const SETUP_COMPLETE_KEY = 'healthkit_setup_complete';

// ==========================================
// プラットフォーム判定
// ==========================================

/** Capacitorネイティブ環境かどうかを判定 */
export function isNativePlatform(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cap = (window as any).Capacitor;
    return cap?.isNativePlatform?.() ?? false;
  } catch {
    return false;
  }
}

// ==========================================
// プラグイン呼び出し
// ==========================================

/** HealthKitプラグインのインターフェース */
interface HealthKitPluginInterface {
  requestAuthorization(): Promise<{ granted: boolean }>;
  readTodayMetrics(): Promise<HealthKitMetrics>;
  readMetricsForRange(options: { days: number }): Promise<{ metrics: HealthKitMetrics[] }>;
  isAuthorized(): Promise<{ authorized: boolean; available: boolean }>;
}

/** registerPluginでプラグインを取得（Capacitor 5+） */
let pluginInstance: HealthKitPluginInterface | null = null;

async function getHealthKitPlugin(): Promise<HealthKitPluginInterface | null> {
  if (pluginInstance) return pluginInstance;
  if (!isNativePlatform()) return null;

  try {
    const { registerPlugin } = await import('@capacitor/core');
    pluginInstance = registerPlugin<HealthKitPluginInterface>('HealthKitPlugin');
    return pluginInstance;
  } catch (err) {
    console.error('Failed to register HealthKitPlugin:', err);
    return null;
  }
}

/** HealthKitプラグインのメソッドを呼び出す */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function callHealthKitPlugin(method: string, args?: Record<string, any>): Promise<unknown> {
  const plugin = await getHealthKitPlugin();
  if (!plugin) return null;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return await (plugin as any)[method](args || {});
  } catch (err) {
    console.error(`HealthKitPlugin.${method} failed:`, err);
    return null;
  }
}

// ==========================================
// 権限管理
// ==========================================

/** HealthKit権限をリクエスト */
export async function requestHealthKitPermissions(): Promise<boolean> {
  const result = (await callHealthKitPlugin('requestAuthorization')) as {
    granted?: boolean;
  } | null;
  return result?.granted ?? false;
}

/** HealthKit権限状態を確認 */
export async function checkHealthKitAuthorization(): Promise<{
  authorized: boolean;
  available: boolean;
}> {
  if (!isNativePlatform()) {
    return { authorized: false, available: false };
  }
  const result = (await callHealthKitPlugin('isAuthorized')) as {
    authorized?: boolean;
    available?: boolean;
  } | null;
  return {
    authorized: result?.authorized ?? false,
    available: result?.available ?? false,
  };
}

// ==========================================
// セットアップ状態
// ==========================================

/** 初回セットアップが完了しているか */
export function isHealthKitSetupComplete(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(SETUP_COMPLETE_KEY) === 'true';
}

/** セットアップ完了をマーク */
export function markHealthKitSetupComplete(): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(SETUP_COMPLETE_KEY, 'true');
  }
}

/** 最終同期日時を取得 */
export function getLastSyncDate(): Date | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(LAST_SYNC_KEY);
  return stored ? new Date(stored) : null;
}

/** 最終同期日時を保存 */
function setLastSyncDate(): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
  }
}

/** 最終同期からの経過時間（時間単位） */
export function hoursSinceLastSync(): number | null {
  const last = getLastSyncDate();
  if (!last) return null;
  return (Date.now() - last.getTime()) / (1000 * 60 * 60);
}

// ==========================================
// 同期: 今日のみ
// ==========================================

/** 今日のメトリクスを取得してFirestoreに同期 */
export async function syncHealthData(): Promise<SyncResult> {
  if (!isNativePlatform()) {
    return { success: false, error: 'ネイティブ環境でのみ利用可能です' };
  }

  try {
    const metrics = (await callHealthKitPlugin('readTodayMetrics')) as HealthKitMetrics | null;
    if (!metrics) {
      return { success: false, error: 'ヘルスデータの取得に失敗しました' };
    }

    const result = await upsertMetrics([metrics]);
    if (!result.success) return result;

    setLastSyncDate();
    return { success: true, syncedDays: 1 };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : '同期に失敗しました' };
  }
}

// ==========================================
// 同期: 過去N日間（初回バックフィル用）
// ==========================================

/** 過去N日間のデータを一括同期 */
export async function syncHealthDataRange(
  days: number = 30,
  onProgress?: (progress: SyncProgress) => void,
): Promise<SyncResult> {
  if (!isNativePlatform()) {
    return { success: false, error: 'ネイティブ環境でのみ利用可能です' };
  }

  try {
    // Phase 1: HealthKitからデータ読み取り
    onProgress?.({ current: 0, total: days, phase: 'reading' });

    const rangeResult = (await callHealthKitPlugin('readMetricsForRange', { days })) as {
      metrics?: HealthKitMetrics[];
    } | null;
    if (!rangeResult?.metrics || rangeResult.metrics.length === 0) {
      return { success: false, error: 'ヘルスデータの取得に失敗しました' };
    }

    const allMetrics = rangeResult.metrics;

    // Phase 2: Firestoreにバッチ書き込み
    onProgress?.({ current: 0, total: allMetrics.length, phase: 'writing' });

    // 10件ずつバッチでupsert (Firestore batch上限は500だが安全に10件ずつ)
    const batchSize = 10;
    let written = 0;
    for (let i = 0; i < allMetrics.length; i += batchSize) {
      const chunk = allMetrics.slice(i, i + batchSize);
      const result = await upsertMetrics(chunk);
      if (!result.success) return result;
      written += chunk.length;
      onProgress?.({ current: written, total: allMetrics.length, phase: 'writing' });
    }

    onProgress?.({ current: allMetrics.length, total: allMetrics.length, phase: 'done' });
    setLastSyncDate();
    return { success: true, syncedDays: allMetrics.length };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : '同期に失敗しました' };
  }
}

// ==========================================
// 自動同期（フォアグラウンド復帰時）
// ==========================================

/** 必要に応じて自動同期（最終同期から6時間以上経過時） */
export async function autoSyncIfNeeded(): Promise<SyncResult | null> {
  if (!isNativePlatform()) return null;
  if (!isHealthKitSetupComplete()) return null;

  const hours = hoursSinceLastSync();
  // 初回同期済みで6時間以上経過している場合のみ
  if (hours !== null && hours < 6) return null;

  return await syncHealthData();
}

// ==========================================
// DB書き込みヘルパー (Firestore)
// ==========================================

async function upsertMetrics(metricsList: HealthKitMetrics[]): Promise<SyncResult> {
  const user = getAuth().currentUser;
  if (!user) {
    return { success: false, error: '認証が必要です' };
  }

  const validMetrics = metricsList.filter((m) => m.metricDate);
  if (validMetrics.length === 0) {
    return { success: true, syncedDays: 0 };
  }

  const batch = writeBatch(db);

  for (const m of validMetrics) {
    const ref = doc(db, 'users', user.uid, 'healthMetrics', m.metricDate);
    batch.set(
      ref,
      {
        metricDate: m.metricDate,
        restingHr: m.restingHr,
        avgHr: m.avgHr,
        maxHr: m.maxHr,
        hrvSdnn: m.hrvSdnn,
        sleepDurationMinutes: m.sleepDurationMinutes,
        sleepDeepMinutes: m.sleepDeepMinutes,
        sleepRemMinutes: m.sleepRemMinutes,
        sleepCoreMinutes: m.sleepCoreMinutes,
        sleepAwakeMinutes: m.sleepAwakeMinutes,
        timeInBedMinutes: m.timeInBedMinutes,
        steps: m.steps,
        activeEnergyKcal: m.activeEnergyKcal,
        exerciseMinutes: m.exerciseMinutes,
        standHours: m.standHours,
        respiratoryRate: m.respiratoryRate,
        bloodOxygenPct: m.bloodOxygenPct,
        source: 'capacitor',
        syncedAt: serverTimestamp(),
      },
      { merge: true },
    );
  }

  try {
    await batch.commit();
    return { success: true, syncedDays: validMetrics.length };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Firestore書き込みに失敗しました',
    };
  }
}
