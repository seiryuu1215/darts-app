import { ImageResponse } from 'next/og';
import type { CuSessionComparison } from './countup-session-compare';

// Google Fonts Noto Sans JP キャッシュ
let fontCache: { regular: ArrayBuffer; bold: ArrayBuffer } | null = null;

async function loadFonts(): Promise<{ regular: ArrayBuffer; bold: ArrayBuffer }> {
  if (fontCache) return fontCache;

  const [regular, bold] = await Promise.all([
    fetch(
      'https://fonts.gstatic.com/s/notosansjp/v53/-F6jfjtqLzI2JPCgQBnw7HFyzSD-AsregP8VFJEk757Y0rw_qMHVdbR2L8Y9QTJ1LwkRmR5GprQAe-TiQ.0.woff2',
    ).then((res) => res.arrayBuffer()),
    fetch(
      'https://fonts.gstatic.com/s/notosansjp/v53/-F6jfjtqLzI2JPCgQBnw7HFyzSD-AsregP8VFBEk757Y0rw_qMHVdbR2L8Y9QTJ1LwkRmR5GprQAe-TiQ.0.woff2',
    ).then((res) => res.arrayBuffer()),
  ]);

  fontCache = { regular, bold };
  return fontCache;
}

/** 差分値のフォーマット（+/-表記） */
function formatDelta(value: number, suffix = '', decimals = 1): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}${suffix}`;
}

/** 差分値の色 */
function deltaColor(value: number, invert = false): string {
  const positive = invert ? value < 0 : value > 0;
  const negative = invert ? value > 0 : value < 0;
  if (positive) return '#4CAF50';
  if (negative) return '#E53935';
  return '#888';
}

interface MetricRow {
  label: string;
  prev: string;
  current: string;
  delta: number;
  suffix: string;
  decimals: number;
  invert?: boolean;
}

export async function generateSessionComparisonImage(
  comparison: CuSessionComparison,
): Promise<Buffer> {
  const fonts = await loadFonts();
  const { prev, current, deltas, insights } = comparison;

  const metrics: MetricRow[] = [
    {
      label: '平均スコア',
      prev: prev.avgScore.toFixed(1),
      current: current.avgScore.toFixed(1),
      delta: deltas.avgScore,
      suffix: '',
      decimals: 1,
    },
    {
      label: 'ブル率',
      prev: prev.bullRate.toFixed(1),
      current: current.bullRate.toFixed(1),
      delta: deltas.bullRate,
      suffix: '%',
      decimals: 1,
    },
    {
      label: 'ワンブル率',
      prev: prev.oneBullRate.toFixed(1),
      current: current.oneBullRate.toFixed(1),
      delta: deltas.oneBullRate,
      suffix: '%',
      decimals: 1,
    },
    {
      label: 'ロートン率',
      prev: prev.lowTonRate.toFixed(1),
      current: current.lowTonRate.toFixed(1),
      delta: deltas.lowTonRate,
      suffix: '%',
      decimals: 1,
    },
    {
      label: 'ハット率',
      prev: prev.hatTrickRate.toFixed(1),
      current: current.hatTrickRate.toFixed(1),
      delta: deltas.hatTrickRate,
      suffix: '%',
      decimals: 1,
    },
    {
      label: '安定度',
      prev: prev.consistency.toFixed(1),
      current: current.consistency.toFixed(1),
      delta: deltas.consistency,
      suffix: '',
      decimals: 1,
    },
  ];

  const displayInsights = insights.slice(0, 3);

  const response = new ImageResponse(
    <div
      style={{
        width: '800px',
        height: '550px',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        color: '#fff',
        fontFamily: 'Noto Sans JP, sans-serif',
        padding: '28px 32px',
      }}
    >
      {/* ヘッダー */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '8px',
        }}
      >
        <span style={{ fontSize: '24px' }}>📊</span>
        <span style={{ fontSize: '22px', fontWeight: 700, color: '#90caf9' }}>セッション比較</span>
      </div>

      {/* 日付行 */}
      <div
        style={{
          display: 'flex',
          fontSize: '14px',
          color: '#aaa',
          marginBottom: '16px',
          gap: '8px',
        }}
      >
        <span>{prev.date}</span>
        <span>→</span>
        <span>{current.date}</span>
      </div>

      {/* テーブルヘッダー */}
      <div
        style={{
          display: 'flex',
          fontSize: '13px',
          color: '#888',
          borderBottom: '1px solid #333',
          paddingBottom: '6px',
          marginBottom: '4px',
        }}
      >
        <span style={{ width: '180px' }}></span>
        <span style={{ width: '140px', textAlign: 'right' }}>前回</span>
        <span style={{ width: '140px', textAlign: 'right' }}>今回</span>
        <span style={{ width: '140px', textAlign: 'right' }}>差分</span>
      </div>

      {/* メトリクス行 */}
      {metrics.map((m) => (
        <div
          key={m.label}
          style={{
            display: 'flex',
            fontSize: '16px',
            padding: '7px 0',
            borderBottom: '1px solid #222',
            alignItems: 'center',
          }}
        >
          <span style={{ width: '180px', fontWeight: 700, color: '#e0e0e0' }}>{m.label}</span>
          <span style={{ width: '140px', textAlign: 'right', color: '#bbb' }}>
            {m.prev}
            {m.suffix}
          </span>
          <span style={{ width: '140px', textAlign: 'right', color: '#fff', fontWeight: 700 }}>
            {m.current}
            {m.suffix}
          </span>
          <span
            style={{
              width: '140px',
              textAlign: 'right',
              fontWeight: 700,
              color: deltaColor(m.delta, m.invert),
            }}
          >
            {formatDelta(m.delta, m.suffix, m.decimals)}
          </span>
        </div>
      ))}

      {/* インサイト */}
      {displayInsights.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            marginTop: '16px',
            gap: '4px',
          }}
        >
          {displayInsights.map((insight, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                fontSize: '13px',
                color: '#90caf9',
                gap: '6px',
              }}
            >
              <span>•</span>
              <span>{insight}</span>
            </div>
          ))}
        </div>
      )}

      {/* フッター */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginTop: 'auto',
          justifyContent: 'flex-end',
        }}
      >
        <span style={{ fontSize: '18px' }}>🎯</span>
        <span style={{ fontSize: '14px', fontWeight: 700, color: '#1976d2' }}>Darts Lab</span>
      </div>
    </div>,
    {
      width: 800,
      height: 550,
      fonts: [
        { name: 'Noto Sans JP', data: fonts.regular, weight: 400 as const },
        { name: 'Noto Sans JP', data: fonts.bold, weight: 700 as const },
      ],
    },
  );

  return Buffer.from(await response.arrayBuffer());
}
