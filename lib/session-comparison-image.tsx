import { ImageResponse } from 'next/og';
import type { CuSessionComparison } from './countup-session-compare';
import { loadNotoSansJPFonts } from './image-fonts';
import { getBenchmarkByRating } from './dartslive-reference';

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

/** Rating整数からフライト名を取得 */
function getFlightLabel(rating: number): string {
  const bm = getBenchmarkByRating(Math.floor(rating));
  return bm ? bm.flight : '';
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

export interface SessionComparisonImageOptions {
  rating?: number | null;
  prevRating?: number | null;
}

export async function generateSessionComparisonImage(
  comparison: CuSessionComparison,
  options?: SessionComparisonImageOptions,
): Promise<Buffer> {
  const fonts = await loadNotoSansJPFonts();
  const { prev, current, deltas, insights } = comparison;

  const deltaMaxScore = current.maxScore - prev.maxScore;
  const deltaDoubleBullRate = Math.round((current.doubleBullRate - prev.doubleBullRate) * 10) / 10;
  const deltaAvgRadius = Math.round((current.avgRadius - prev.avgRadius) * 10) / 10;

  // ミス傾向テキスト
  const missDirChanged =
    prev.primaryMissDir !== '-' &&
    current.primaryMissDir !== '-' &&
    prev.primaryMissDir !== current.primaryMissDir;
  const missDirText = missDirChanged
    ? `${prev.primaryMissDir}→${current.primaryMissDir}`
    : current.primaryMissDir !== '-'
      ? `${current.primaryMissDir}（変化なし）`
      : '-';
  const missDirPrevText = prev.primaryMissDir !== '-' ? prev.primaryMissDir : '-';

  // レーティング情報
  const rating = options?.rating;
  const prevRt = options?.prevRating;
  const nextRt = rating != null ? Math.floor(rating) + 1 : null;
  const nextBm = nextRt != null ? getBenchmarkByRating(nextRt) : null;

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
      label: '最高スコア',
      prev: prev.maxScore.toString(),
      current: current.maxScore.toString(),
      delta: deltaMaxScore,
      suffix: '',
      decimals: 0,
    },
    {
      label: '安定度',
      prev: prev.consistency.toFixed(1),
      current: current.consistency.toFixed(1),
      delta: deltas.consistency,
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
      label: 'Dブル率',
      prev: prev.doubleBullRate.toFixed(1),
      current: current.doubleBullRate.toFixed(1),
      delta: deltaDoubleBullRate,
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
      label: 'グルーピング',
      prev: `${prev.avgRadius.toFixed(1)}mm`,
      current: `${current.avgRadius.toFixed(1)}mm`,
      delta: deltaAvgRadius,
      suffix: 'mm',
      decimals: 1,
      invert: true,
    },
  ];

  const displayInsights = insights.slice(0, 3);

  const response = new ImageResponse(
    <div
      style={{
        width: '800px',
        height: '680px',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        color: '#fff',
        fontFamily: 'Noto Sans JP, sans-serif',
        padding: '14px 20px',
      }}
    >
      {/* ヘッダー + レーティング */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '26px' }}>📊</span>
          <span style={{ fontSize: '26px', fontWeight: 700, color: '#90caf9' }}>
            セッション比較
          </span>
        </div>
        {rating != null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {prevRt != null && (
              <span style={{ fontSize: '18px', color: '#888' }}>Rt.{prevRt.toFixed(2)}</span>
            )}
            {prevRt != null && <span style={{ fontSize: '18px', color: '#666' }}>→</span>}
            <span style={{ fontSize: '22px', fontWeight: 700, color: '#FFD54F' }}>
              Rt.{rating.toFixed(2)} {getFlightLabel(rating)}
            </span>
          </div>
        )}
      </div>

      {/* 日付行 + 次の基準値 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '6px',
        }}
      >
        <div style={{ display: 'flex', fontSize: '17px', color: '#aaa', gap: '8px' }}>
          <span>
            {prev.date} ({prev.gameCount}G)
          </span>
          <span>→</span>
          <span>
            {current.date} ({current.gameCount}G)
          </span>
        </div>
        {nextBm && (
          <span style={{ fontSize: '15px', color: '#78909C' }}>
            次 Rt.{nextRt} {nextBm.flight} (PPD {nextBm.ppdMin}+)
          </span>
        )}
      </div>

      {/* テーブルヘッダー */}
      <div
        style={{
          display: 'flex',
          fontSize: '16px',
          color: '#888',
          borderBottom: '1px solid #444',
          paddingBottom: '4px',
          marginBottom: '0px',
        }}
      >
        <span style={{ width: '180px' }}></span>
        <span style={{ width: '160px', textAlign: 'right' }}>前回</span>
        <span style={{ width: '160px', textAlign: 'right' }}>今回</span>
        <span style={{ width: '160px', textAlign: 'right' }}>差分</span>
      </div>

      {/* メトリクス行 */}
      {metrics.map((m) => (
        <div
          key={m.label}
          style={{
            display: 'flex',
            fontSize: '20px',
            padding: '5px 0',
            borderBottom: '1px solid #1e2a45',
            alignItems: 'center',
          }}
        >
          <span style={{ width: '180px', fontWeight: 700, color: '#e0e0e0' }}>{m.label}</span>
          <span style={{ width: '160px', textAlign: 'right', color: '#bbb' }}>
            {m.prev}
            {m.suffix && !m.prev.includes(m.suffix) ? m.suffix : ''}
          </span>
          <span style={{ width: '160px', textAlign: 'right', color: '#fff', fontWeight: 700 }}>
            {m.current}
            {m.suffix && !m.current.includes(m.suffix) ? m.suffix : ''}
          </span>
          <span
            style={{
              width: '160px',
              textAlign: 'right',
              fontWeight: 700,
              color: deltaColor(m.delta, m.invert),
            }}
          >
            {formatDelta(m.delta, m.suffix === 'mm' ? 'mm' : m.suffix, m.decimals)}
          </span>
        </div>
      ))}

      {/* ミス傾向行 */}
      <div
        style={{
          display: 'flex',
          fontSize: '20px',
          padding: '5px 0',
          alignItems: 'center',
        }}
      >
        <span style={{ width: '180px', fontWeight: 700, color: '#e0e0e0' }}>ミス傾向</span>
        <span style={{ width: '160px', textAlign: 'right', color: '#bbb' }}>{missDirPrevText}</span>
        <span
          style={{
            width: '320px',
            textAlign: 'right',
            color: missDirChanged ? '#FFB74D' : '#bbb',
            fontWeight: missDirChanged ? 700 : 400,
          }}
        >
          {missDirText}
        </span>
      </div>

      {/* インサイト */}
      {displayInsights.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            marginTop: '4px',
            gap: '2px',
          }}
        >
          {displayInsights.map((insight, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                fontSize: '16px',
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
          gap: '6px',
          marginTop: 'auto',
          justifyContent: 'flex-end',
        }}
      >
        <span style={{ fontSize: '14px' }}>🎯</span>
        <span style={{ fontSize: '13px', fontWeight: 700, color: '#1976d2' }}>Darts Lab</span>
      </div>
    </div>,
    {
      width: 800,
      height: 680,
      fonts: [
        { name: 'Noto Sans JP', data: fonts.regular, weight: 400 as const },
        { name: 'Noto Sans JP', data: fonts.bold, weight: 700 as const },
      ],
    },
  );

  return Buffer.from(await response.arrayBuffer());
}
