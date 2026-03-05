import { ImageResponse } from 'next/og';
import type { MissDirectionResult } from './stats-math';
import type { HeatmapData } from './heatmap-data';
import { getSegmentLabel } from './heatmap-data';
import { loadNotoSansJPFonts } from './image-fonts';

// 8方向の角度マッピング（上=0°から時計回り）
const DIR_ANGLES: Record<string, number> = {
  上: 0,
  右上: 45,
  右: 90,
  右下: 135,
  下: 180,
  左下: 225,
  左: 270,
  左上: 315,
};

// 方向ラベルの位置（中心からの相対座標）
function labelPos(angleDeg: number, r: number): { x: number; y: number } {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: Math.cos(rad) * r, y: Math.sin(rad) * r };
}

// SVG円弧パス生成
function pieSlicePath(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  if (endDeg - startDeg >= 359.99) {
    // ほぼ全周 → 2つの半円で描画
    const r1 = ((startDeg - 90) * Math.PI) / 180;
    const r2 = ((startDeg + 180 - 90) * Math.PI) / 180;
    const x1 = cx + Math.cos(r1) * r;
    const y1 = cy + Math.sin(r1) * r;
    const x2 = cx + Math.cos(r2) * r;
    const y2 = cy + Math.sin(r2) * r;
    return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} A ${r} ${r} 0 0 1 ${x1} ${y1} Z`;
  }
  const r1 = ((startDeg - 90) * Math.PI) / 180;
  const r2 = ((endDeg - 90) * Math.PI) / 180;
  const x1 = cx + Math.cos(r1) * r;
  const y1 = cy + Math.sin(r1) * r;
  const x2 = cx + Math.cos(r2) * r;
  const y2 = cy + Math.sin(r2) * r;
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
}

const SLICE_COLORS = [
  '#7B1FA2',
  '#5C6BC0',
  '#42A5F5',
  '#26C6DA',
  '#66BB6A',
  '#FFA726',
  '#EF5350',
  '#AB47BC',
];

/** ミス方向分析画像を生成 (800×680, ダークテーマ, 円グラフ + ヒートマップ) */
export async function generateMissDirectionImage(
  result: MissDirectionResult,
  date: string,
  heatmapData?: HeatmapData | null,
): Promise<Buffer> {
  const fonts = await loadNotoSansJPFonts();

  // 8方向をパーセンテージ降順ソート
  const sortedDirs = [...result.directions]
    .filter((d) => d.count > 0)
    .sort((a, b) => b.percentage - a.percentage);

  const totalPct = sortedDirs.reduce((s, d) => s + d.percentage, 0);
  const topMiss = result.topMissNumbers.slice(0, 3);

  // ヒートマップTOP5セグメント
  const top5Segments: { label: string; count: number; percentage: number }[] = [];
  if (heatmapData && heatmapData.totalDarts > 0) {
    const entries = Array.from(heatmapData.segments.entries())
      .filter(([id]) => id !== 'BB' && id !== 'B' && id !== 'OUT')
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    for (const [id, count] of entries) {
      top5Segments.push({
        label: getSegmentLabel(id),
        count,
        percentage: (count / heatmapData.totalDarts) * 100,
      });
    }
  }

  const hasHeatmap = top5Segments.length > 0;
  const imageHeight = hasHeatmap ? 680 : 600;

  // 円グラフ用スライスデータ
  const cx = 220;
  const cy = 200;
  const r = 150;
  let cumAngle = 0;
  const slices = sortedDirs.map((d, i) => {
    const angle = totalPct > 0 ? (d.percentage / totalPct) * 360 : 0;
    const startAngle = cumAngle;
    cumAngle += angle;
    const midAngle = startAngle + angle / 2;
    return {
      ...d,
      startAngle,
      endAngle: cumAngle,
      midAngle,
      color:
        d.label === result.primaryDirection
          ? '#7B1FA2'
          : SLICE_COLORS[(i + 1) % SLICE_COLORS.length],
      isPrimary: d.label === result.primaryDirection,
    };
  });

  const response = new ImageResponse(
    <div
      style={{
        width: '800px',
        height: `${imageHeight}px`,
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        color: '#fff',
        fontFamily: 'Noto Sans JP, sans-serif',
        padding: '20px 28px',
      }}
    >
      {/* ヘッダー */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '24px' }}>🎯</span>
          <span style={{ fontSize: '22px', fontWeight: 700, color: '#CE93D8' }}>ミス方向分析</span>
        </div>
        <span style={{ fontSize: '16px', color: '#aaa' }}>{result.totalDarts}本</span>
      </div>

      {/* 日付 + ブル率 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
        }}
      >
        <span style={{ fontSize: '15px', color: '#aaa' }}>{date}</span>
        <div style={{ display: 'flex', gap: '20px', fontSize: '16px' }}>
          <span style={{ color: '#e0e0e0' }}>
            ブル率{' '}
            <span style={{ fontWeight: 700, color: '#4CAF50' }}>{result.bullRate.toFixed(1)}%</span>
          </span>
          <span style={{ color: '#e0e0e0' }}>
            Dブル率{' '}
            <span style={{ fontWeight: 700, color: '#4CAF50' }}>
              {result.doubleBullRate.toFixed(1)}%
            </span>
          </span>
        </div>
      </div>

      {/* メインエリア: 円グラフ + 凡例 */}
      <div style={{ display: 'flex', flex: 1 }}>
        {/* 円グラフ SVG */}
        <div
          style={{
            display: 'flex',
            width: '440px',
            height: '400px',
            position: 'relative',
          }}
        >
          <svg width="440" height="400" viewBox="0 0 440 400">
            {/* 外周円（背景） */}
            <circle cx={cx} cy={cy} r={r + 2} fill="none" stroke="#333" strokeWidth="1" />

            {/* スライス */}
            {slices.map((s) => (
              <path
                key={s.label}
                d={pieSlicePath(cx, cy, s.isPrimary ? r + 8 : r, s.startAngle, s.endAngle)}
                fill={s.color}
                stroke="#1a1a2e"
                strokeWidth="2"
              />
            ))}

            {/* 中心円（ドーナツ風） */}
            <circle cx={cx} cy={cy} r="55" fill="#1a1a2e" />
            <circle cx={cx} cy={cy} r="55" fill="none" stroke="#333" strokeWidth="1" />

            {/* 中心テキスト: 主傾向 */}
            <text
              x={cx}
              y={cy - 8}
              textAnchor="middle"
              fill="#CE93D8"
              fontSize="20"
              fontWeight="bold"
            >
              {result.primaryDirection}
            </text>
            <text x={cx} y={cy + 18} textAnchor="middle" fill="#aaa" fontSize="14">
              {(result.directionStrength * 100).toFixed(0)}%
            </text>

            {/* 8方向ラベル（外周） */}
            {Object.entries(DIR_ANGLES).map(([dir, angle]) => {
              const pos = labelPos(angle, r + 35);
              const hasData = sortedDirs.some((d) => d.label === dir);
              return (
                <text
                  key={dir}
                  x={cx + pos.x}
                  y={cy + pos.y + 5}
                  textAnchor="middle"
                  fill={hasData ? '#e0e0e0' : '#555'}
                  fontSize="15"
                  fontWeight={dir === result.primaryDirection ? 'bold' : 'normal'}
                >
                  {dir}
                </text>
              );
            })}
          </svg>
        </div>

        {/* 凡例 + TOP3 */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            paddingLeft: '16px',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          {/* 凡例 */}
          {slices.map((s) => (
            <div
              key={s.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '16px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  width: '14px',
                  height: '14px',
                  borderRadius: '3px',
                  background: s.color,
                }}
              />
              <span
                style={{
                  color: s.isPrimary ? '#fff' : '#ccc',
                  fontWeight: s.isPrimary ? 700 : 400,
                  width: '40px',
                }}
              >
                {s.label}
              </span>
              <span
                style={{
                  color: s.isPrimary ? '#CE93D8' : '#aaa',
                  fontWeight: s.isPrimary ? 700 : 400,
                }}
              >
                {s.percentage.toFixed(1)}%
              </span>
              {s.isPrimary && <span style={{ color: '#FFD54F', fontSize: '14px' }}>★</span>}
            </div>
          ))}

          {/* TOP3ミスナンバー */}
          {topMiss.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                marginTop: '16px',
                gap: '4px',
              }}
            >
              <span style={{ fontSize: '14px', color: '#888' }}>TOP3ミスナンバー</span>
              {topMiss.map((m, i) => (
                <span
                  key={m.number}
                  style={{
                    fontSize: '16px',
                    color: i === 0 ? '#FFB74D' : '#bbb',
                    fontWeight: i === 0 ? 700 : 400,
                  }}
                >
                  {i + 1}. S{m.number} ({m.count}本)
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ヒートマップ TOP5セグメント */}
      {hasHeatmap && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            marginTop: '4px',
            padding: '0 4px',
          }}
        >
          <span style={{ fontSize: '14px', color: '#888', marginBottom: '2px' }}>
            TOP5セグメント
          </span>
          {top5Segments.map((seg) => {
            const maxPct = top5Segments[0].percentage * 1.1;
            const barWidth = Math.max(4, (seg.percentage / maxPct) * 100);
            return (
              <div
                key={seg.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '14px',
                }}
              >
                <span style={{ width: '48px', color: '#ccc', textAlign: 'right' }}>
                  {seg.label}
                </span>
                <div
                  style={{
                    display: 'flex',
                    width: '460px',
                    height: '10px',
                    background: '#333',
                    borderRadius: '3px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      width: `${barWidth}%`,
                      height: '10px',
                      background: '#42A5F5',
                      borderRadius: '3px',
                    }}
                  />
                </div>
                <span style={{ color: '#aaa', width: '80px' }}>
                  {seg.percentage.toFixed(1)}% ({seg.count})
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* フッター */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          justifyContent: 'flex-end',
        }}
      >
        <span style={{ fontSize: '16px' }}>🎯</span>
        <span style={{ fontSize: '14px', fontWeight: 700, color: '#1976d2' }}>Darts Lab</span>
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
