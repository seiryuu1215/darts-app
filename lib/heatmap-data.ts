/**
 * ダーツボードヒートマップデータ計算
 * PLAY_LOGから各セグメントの着弾頻度を集計
 */

import { parseDartCode } from './stats-math';

/** セグメントID: "T20", "D10", "S15", "I15", "BB", "B", "OUT" */
export type SegmentId = string;

export interface SegmentFrequency {
  segmentId: SegmentId;
  count: number;
  percentage: number;
}

export interface HeatmapData {
  segments: Map<SegmentId, number>;
  totalDarts: number;
  maxCount: number;
  bullCount: number;
  doubleBullCount: number;
  outCount: number;
}

/** PLAY_LOGからセグメント別頻度を集計 */
export function computeSegmentFrequency(
  playLogs: string[],
  mode: 'all' | 'miss' = 'all',
): HeatmapData {
  const segments = new Map<SegmentId, number>();
  let totalDarts = 0;
  let bullCount = 0;
  let doubleBullCount = 0;
  let outCount = 0;

  for (const log of playLogs) {
    const darts = log.split(',');
    for (const dartCode of darts) {
      const parsed = parseDartCode(dartCode.trim());
      if (!parsed) continue;
      totalDarts++;

      if (parsed.area === 'out') {
        outCount++;
        if (mode === 'all') {
          segments.set('OUT', (segments.get('OUT') ?? 0) + 1);
        }
        continue;
      }

      if (parsed.isBull) {
        bullCount++;
        if (parsed.area === 'doubleBull') doubleBullCount++;
        // missモードではBULLはミスではないのでスキップ
        if (mode === 'miss') continue;
        const id = parsed.area === 'doubleBull' ? 'BB' : 'B';
        segments.set(id, (segments.get(id) ?? 0) + 1);
        continue;
      }

      // missモード: BULLとOUT以外がミス
      const prefix =
        parsed.area === 'triple'
          ? 'T'
          : parsed.area === 'double'
            ? 'D'
            : parsed.area === 'innerSingle'
              ? 'I'
              : 'S';
      const id = `${prefix}${parsed.number}`;
      segments.set(id, (segments.get(id) ?? 0) + 1);
    }
  }

  const maxCount = Math.max(...Array.from(segments.values()), 1);

  return { segments, totalDarts, maxCount, bullCount, doubleBullCount, outCount };
}

/** セグメントIDから表示名を取得 */
export function getSegmentLabel(id: SegmentId): string {
  if (id === 'BB') return 'D-BULL';
  if (id === 'B') return 'S-BULL';
  if (id === 'OUT') return 'OUT';
  return id;
}

/** 頻度から色の強度（0-1）を算出 */
export function getHeatIntensity(count: number, maxCount: number): number {
  if (maxCount === 0) return 0;
  return count / maxCount;
}
