/**
 * ローリングトレンド分析ユーティリティ
 * SMA（単純移動平均）計算、トレンド検知、ゴールデン/デッドクロス検出
 */

interface DataPoint {
  date: string;
  value: number | null;
}

export interface SmaDataPoint {
  date: string;
  value: number | null;
  sma7: number | null;
  sma14: number | null;
  sma30: number | null;
}

export interface CrossSignal {
  date: string;
  type: 'golden' | 'dead';
  shortSma: number;
  longSma: number;
}

export type TrendDirection = 'up' | 'down' | 'flat';

export interface TrendResult {
  direction: TrendDirection;
  strength: number; // 0-100
  label: string;
  color: string;
}

/** 単純移動平均（SMA）を計算 */
export function computeSMA(data: DataPoint[], windows: number[] = [7, 14, 30]): SmaDataPoint[] {
  const values = data.map((d) => d.value);

  return data.map((d, i) => {
    const result: SmaDataPoint = {
      date: d.date,
      value: d.value,
      sma7: null,
      sma14: null,
      sma30: null,
    };

    for (const w of windows) {
      if (i < w - 1) continue;
      let sum = 0;
      let count = 0;
      for (let j = i - w + 1; j <= i; j++) {
        if (values[j] != null) {
          sum += values[j]!;
          count++;
        }
      }
      if (count > 0) {
        const avg = Math.round((sum / count) * 100) / 100;
        if (w === 7) result.sma7 = avg;
        else if (w === 14) result.sma14 = avg;
        else if (w === 30) result.sma30 = avg;
      }
    }

    return result;
  });
}

/** ゴールデンクロス/デッドクロスを検出 */
export function detectCrosses(smaData: SmaDataPoint[]): CrossSignal[] {
  const signals: CrossSignal[] = [];

  for (let i = 1; i < smaData.length; i++) {
    const prev = smaData[i - 1];
    const curr = smaData[i];

    if (prev.sma7 == null || prev.sma30 == null || curr.sma7 == null || curr.sma30 == null) {
      continue;
    }

    // 短期MAが長期MAを下から上に突き抜け → ゴールデンクロス
    if (prev.sma7 <= prev.sma30 && curr.sma7 > curr.sma30) {
      signals.push({
        date: curr.date,
        type: 'golden',
        shortSma: curr.sma7,
        longSma: curr.sma30,
      });
    }
    // 短期MAが長期MAを上から下に突き抜け → デッドクロス
    else if (prev.sma7 >= prev.sma30 && curr.sma7 < curr.sma30) {
      signals.push({
        date: curr.date,
        type: 'dead',
        shortSma: curr.sma7,
        longSma: curr.sma30,
      });
    }
  }

  return signals;
}

/** 直近のトレンド方向を判定 */
export function classifyTrend(smaData: SmaDataPoint[], lookback: number = 7): TrendResult {
  const recent = smaData.filter((d) => d.sma7 != null).slice(-lookback);

  if (recent.length < 3) {
    return { direction: 'flat', strength: 0, label: 'データ不足', color: '#888' };
  }

  // 線形回帰でトレンド方向を判定
  const values = recent.map((d) => d.sma7!);
  const n = values.length;
  const xMean = (n - 1) / 2;
  const yMean = values.reduce((a, b) => a + b, 0) / n;

  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < n; i++) {
    numerator += (i - xMean) * (values[i] - yMean);
    denominator += (i - xMean) ** 2;
  }

  const slope = denominator !== 0 ? numerator / denominator : 0;

  // 相対的な変化量（yMeanに対する割合）
  const relativeChange = yMean !== 0 ? Math.abs(slope / yMean) * 100 : 0;
  const strength = Math.min(100, Math.round(relativeChange * 10));

  if (relativeChange < 0.1) {
    return { direction: 'flat', strength, label: '横ばい', color: '#FF9800' };
  }
  if (slope > 0) {
    return { direction: 'up', strength, label: '上昇トレンド', color: '#4caf50' };
  }
  return { direction: 'down', strength, label: '下降トレンド', color: '#f44336' };
}
