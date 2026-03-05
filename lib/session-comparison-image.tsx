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
  if (positive) return '#4ade80';
  if (negative) return '#f87171';
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
  category?: string;
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

  // カテゴリ別メトリクス
  const sections: { category: string; rows: MetricRow[] }[] = [
    {
      category: 'スコア',
      rows: [
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
      ],
    },
    {
      category: 'ブル',
      rows: [
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
      ],
    },
    {
      category: 'パターン',
      rows: [
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
      ],
    },
    {
      category: 'センサー',
      rows: [
        {
          label: 'グルーピング',
          prev: `${prev.avgRadius.toFixed(1)}mm`,
          current: `${current.avgRadius.toFixed(1)}mm`,
          delta: deltaAvgRadius,
          suffix: 'mm',
          decimals: 1,
          invert: true,
        },
      ],
    },
  ];

  // ミス傾向行
  const hasMissDir = current.primaryMissDir !== '-' || prev.primaryMissDir !== '-';

  const displayInsights = insights.slice(0, 3);

  // 高さ計算: ヘッダー(80) + 日付(30) + テーブルヘッダー(36) + セクション + ミス傾向(52) + インサイト + フッター(36)
  const totalRows = sections.reduce((s, sec) => s + sec.rows.length, 0);
  const sectionDividers = sections.length - 1;
  const tableHeight = totalRows * 52 + sectionDividers * 1 + sections.length * 28;
  const insightHeight = displayInsights.length > 0 ? 16 + displayInsights.length * 30 : 0;
  const missHeight = hasMissDir ? 52 : 0;
  const imageHeight = 80 + 30 + 36 + tableHeight + missHeight + insightHeight + 44;

  const response = new ImageResponse(
    <div
      style={{
        width: '800px',
        height: `${imageHeight}px`,
        display: 'flex',
        flexDirection: 'column',
        background: '#0f1923',
        color: '#fff',
        fontFamily: 'Noto Sans JP, sans-serif',
        padding: '16px 24px',
      }}
    >
      {/* ヘッダー + レーティング */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '4px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '32px', fontWeight: 700, color: '#e0e0e0' }}>
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
          marginBottom: '8px',
        }}
      >
        <div style={{ display: 'flex', fontSize: '18px', color: '#aaa', gap: '8px' }}>
          <span>
            {prev.date} ({prev.gameCount}G)
          </span>
          <span>→</span>
          <span>
            {current.date} ({current.gameCount}G)
          </span>
        </div>
        {nextBm && (
          <span style={{ fontSize: '16px', color: '#78909C' }}>
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
          borderBottom: '1px solid #333',
          paddingBottom: '6px',
          marginBottom: '0px',
        }}
      >
        <span style={{ width: '40%' }}></span>
        <span style={{ width: '20%', textAlign: 'right' }}>前回</span>
        <span style={{ width: '20%', textAlign: 'right' }}>今回</span>
        <span style={{ width: '20%', textAlign: 'right' }}>差分</span>
      </div>

      {/* セクション別メトリクス */}
      {sections.map((section, si) => (
        <div
          key={section.category}
          style={{
            display: 'flex',
            flexDirection: 'column',
            borderBottom: si < sections.length - 1 ? '1px solid #1e2a3a' : 'none',
          }}
        >
          {/* カテゴリラベル */}
          <div
            style={{
              display: 'flex',
              fontSize: '16px',
              color: '#60a5fa',
              padding: '6px 0 2px 0',
            }}
          >
            {section.category}
          </div>

          {/* 各行 */}
          {section.rows.map((m) => (
            <div
              key={m.label}
              style={{
                display: 'flex',
                minHeight: '52px',
                alignItems: 'center',
              }}
            >
              <span style={{ width: '40%', fontSize: '20px', color: '#e0e0e0' }}>{m.label}</span>
              <span
                style={{
                  width: '20%',
                  textAlign: 'right',
                  fontSize: '22px',
                  fontWeight: 600,
                  color: '#bbb',
                }}
              >
                {m.prev}
                {m.suffix && !m.prev.includes(m.suffix) ? m.suffix : ''}
              </span>
              <span
                style={{
                  width: '20%',
                  textAlign: 'right',
                  fontSize: '22px',
                  fontWeight: 600,
                  color: '#fff',
                }}
              >
                {m.current}
                {m.suffix && !m.current.includes(m.suffix) ? m.suffix : ''}
              </span>
              <span
                style={{
                  width: '20%',
                  textAlign: 'right',
                  fontSize: '22px',
                  fontWeight: 700,
                  color: deltaColor(m.delta, m.invert),
                }}
              >
                {formatDelta(m.delta, m.suffix === 'mm' ? 'mm' : m.suffix, m.decimals)}
              </span>
            </div>
          ))}
        </div>
      ))}

      {/* ミス傾向行 */}
      {hasMissDir && (
        <div
          style={{
            display: 'flex',
            minHeight: '52px',
            alignItems: 'center',
            borderTop: '1px solid #1e2a3a',
          }}
        >
          <span style={{ width: '40%', fontSize: '20px', color: '#e0e0e0' }}>ミス傾向</span>
          <span
            style={{
              width: '20%',
              textAlign: 'right',
              fontSize: '22px',
              fontWeight: 600,
              color: '#bbb',
            }}
          >
            {missDirPrevText}
          </span>
          <span
            style={{
              width: '40%',
              textAlign: 'right',
              fontSize: '22px',
              fontWeight: missDirChanged ? 700 : 600,
              color: missDirChanged ? '#FFB74D' : '#bbb',
            }}
          >
            {missDirText}
          </span>
        </div>
      )}

      {/* インサイト */}
      {displayInsights.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            marginTop: '8px',
            gap: '6px',
          }}
        >
          {displayInsights.map((insight, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                fontSize: '17px',
                color: '#90caf9',
                gap: '8px',
                lineHeight: '1.5',
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
        <span style={{ fontSize: '20px', fontWeight: 700, color: '#1976d2' }}>Darts Lab</span>
      </div>
    </div>,
    {
      width: 800,
      height: imageHeight,
      fonts: [
        { name: 'Noto Sans JP', data: fonts.regular, weight: 400 as const },
        { name: 'Noto Sans JP', data: fonts.bold, weight: 700 as const },
      ],
    },
  );

  return Buffer.from(await response.arrayBuffer());
}
