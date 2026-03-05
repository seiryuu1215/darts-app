import { ImageResponse } from 'next/og';
import type { CuSessionComparison } from './countup-session-compare';
import { loadNotoSansJPFonts } from './image-fonts';

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
  group?: string;
}

export async function generateSessionComparisonImage(
  comparison: CuSessionComparison,
): Promise<Buffer> {
  const fonts = await loadNotoSansJPFonts();
  const { prev, current, deltas, insights } = comparison;

  // maxScore / doubleBullRate deltas are not in the type — compute inline
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

  const metrics: MetricRow[] = [
    // スコアグループ
    {
      group: 'スコア',
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
    // ブルグループ
    {
      group: 'ブル',
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
    // パターングループ
    {
      group: 'パターン',
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
    // センサーグループ
    {
      group: 'センサー',
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
        height: '630px',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        color: '#fff',
        fontFamily: 'Noto Sans JP, sans-serif',
        padding: '24px 32px',
      }}
    >
      {/* ヘッダー */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '4px',
        }}
      >
        <span style={{ fontSize: '22px' }}>📊</span>
        <span style={{ fontSize: '20px', fontWeight: 700, color: '#90caf9' }}>セッション比較</span>
      </div>

      {/* 日付行（ゲーム数付き） */}
      <div
        style={{
          display: 'flex',
          fontSize: '13px',
          color: '#aaa',
          marginBottom: '12px',
          gap: '8px',
        }}
      >
        <span>
          {prev.date} ({prev.gameCount}G)
        </span>
        <span>→</span>
        <span>
          {current.date} ({current.gameCount}G)
        </span>
      </div>

      {/* テーブルヘッダー */}
      <div
        style={{
          display: 'flex',
          fontSize: '12px',
          color: '#888',
          borderBottom: '1px solid #333',
          paddingBottom: '4px',
          marginBottom: '2px',
        }}
      >
        <span style={{ width: '40px' }}></span>
        <span style={{ width: '130px' }}></span>
        <span style={{ width: '130px', textAlign: 'right' }}>前回</span>
        <span style={{ width: '130px', textAlign: 'right' }}>今回</span>
        <span style={{ width: '130px', textAlign: 'right' }}>差分</span>
      </div>

      {/* メトリクス行 */}
      {metrics.map((m) => (
        <div
          key={m.label}
          style={{
            display: 'flex',
            fontSize: '14px',
            padding: '5px 0',
            borderBottom: '1px solid #1a1a2e',
            alignItems: 'center',
          }}
        >
          {/* グループラベル */}
          <span
            style={{
              width: '40px',
              fontSize: '10px',
              color: '#5C6BC0',
              fontWeight: 700,
            }}
          >
            {m.group ?? ''}
          </span>
          <span style={{ width: '130px', fontWeight: 700, color: '#e0e0e0', fontSize: '14px' }}>
            {m.label}
          </span>
          <span style={{ width: '130px', textAlign: 'right', color: '#bbb' }}>
            {m.prev}
            {m.suffix && !m.prev.includes(m.suffix) ? m.suffix : ''}
          </span>
          <span style={{ width: '130px', textAlign: 'right', color: '#fff', fontWeight: 700 }}>
            {m.current}
            {m.suffix && !m.current.includes(m.suffix) ? m.suffix : ''}
          </span>
          <span
            style={{
              width: '130px',
              textAlign: 'right',
              fontWeight: 700,
              color: deltaColor(m.delta, m.invert),
            }}
          >
            {formatDelta(m.delta, m.suffix === 'mm' ? 'mm' : m.suffix, m.decimals)}
          </span>
        </div>
      ))}

      {/* ミス傾向行（特殊: テキスト比較） */}
      <div
        style={{
          display: 'flex',
          fontSize: '14px',
          padding: '5px 0',
          borderBottom: '1px solid #1a1a2e',
          alignItems: 'center',
        }}
      >
        <span style={{ width: '40px', fontSize: '10px', color: '#5C6BC0', fontWeight: 700 }}></span>
        <span style={{ width: '130px', fontWeight: 700, color: '#e0e0e0', fontSize: '14px' }}>
          ミス傾向
        </span>
        <span style={{ width: '130px', textAlign: 'right', color: '#bbb' }}>{missDirPrevText}</span>
        <span
          style={{
            width: '260px',
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
            marginTop: '10px',
            gap: '3px',
          }}
        >
          {displayInsights.map((insight, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                fontSize: '12px',
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
        <span style={{ fontSize: '16px' }}>🎯</span>
        <span style={{ fontSize: '13px', fontWeight: 700, color: '#1976d2' }}>Darts Lab</span>
      </div>
    </div>,
    {
      width: 800,
      height: 630,
      fonts: [
        { name: 'Noto Sans JP', data: fonts.regular, weight: 400 as const },
        { name: 'Noto Sans JP', data: fonts.bold, weight: 700 as const },
      ],
    },
  );

  return Buffer.from(await response.arrayBuffer());
}
