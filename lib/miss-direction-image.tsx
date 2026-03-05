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

/** レーダーバー（ウェッジ）のSVGパスを生成（画面のMissDirectionCardと同じ形状） */
function wedgePath(
  cx: number,
  cy: number,
  innerR: number,
  outerR: number,
  angleDeg: number,
  halfSpan: number,
): string {
  const sa = ((angleDeg - halfSpan - 90) * Math.PI) / 180;
  const ea = ((angleDeg + halfSpan - 90) * Math.PI) / 180;
  const x1 = cx + innerR * Math.cos(sa);
  const y1 = cy + innerR * Math.sin(sa);
  const x2 = cx + outerR * Math.cos(sa);
  const y2 = cy + outerR * Math.sin(sa);
  const x3 = cx + outerR * Math.cos(ea);
  const y3 = cy + outerR * Math.sin(ea);
  const x4 = cx + innerR * Math.cos(ea);
  const y4 = cy + innerR * Math.sin(ea);
  return [
    `M ${x1} ${y1}`,
    `L ${x2} ${y2}`,
    `A ${outerR} ${outerR} 0 0 1 ${x3} ${y3}`,
    `L ${x4} ${y4}`,
    `A ${innerR} ${innerR} 0 0 0 ${x1} ${y1}`,
    'Z',
  ].join(' ');
}

/** ミス方向分析画像を生成（画面のMissDirectionCardと同じデザイン） */
export async function generateMissDirectionImage(
  result: MissDirectionResult,
  date: string,
  heatmapData?: HeatmapData | null,
): Promise<Buffer> {
  const fonts = await loadNotoSansJPFonts();

  const maxPct = Math.max(...result.directions.map((d) => d.percentage), 1);
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

  // レーダーチャートの寸法（画面と同じ構造）
  const cx = 220;
  const cy = 210;
  const outerR = 150;
  const innerR = 45;

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
        <span style={{ fontSize: '22px', fontWeight: 700, color: '#e0e0e0' }}>
          ミス方向分析（ブル狙い）
        </span>
        <span style={{ fontSize: '16px', color: '#aaa' }}>{result.totalDarts}本</span>
      </div>

      {/* 日付 + ブル率 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
        }}
      >
        <span style={{ fontSize: '15px', color: '#aaa' }}>{date}</span>
        <div style={{ display: 'flex', gap: '20px', fontSize: '16px' }}>
          <span style={{ color: '#e0e0e0' }}>
            ブル率{' '}
            <span style={{ fontWeight: 700, color: '#4caf50' }}>{result.bullRate.toFixed(1)}%</span>
          </span>
          <span style={{ color: '#e0e0e0' }}>
            Dブル率{' '}
            <span style={{ fontWeight: 700, color: '#4caf50' }}>
              {result.doubleBullRate.toFixed(1)}%
            </span>
          </span>
        </div>
      </div>

      {/* メインエリア: レーダーチャート + 凡例 */}
      <div style={{ display: 'flex', flex: 1 }}>
        {/* レーダーチャート */}
        <div
          style={{
            display: 'flex',
            width: '440px',
            height: '420px',
            position: 'relative',
          }}
        >
          <svg width="440" height="420" viewBox="0 0 440 420">
            {/* 同心円ガイド */}
            <circle cx={cx} cy={cy} r={outerR} fill="none" stroke="#333" strokeWidth="1" />
            <circle cx={cx} cy={cy} r={outerR * 0.66} fill="none" stroke="#222" strokeWidth="0.5" />
            <circle cx={cx} cy={cy} r={outerR * 0.33} fill="none" stroke="#222" strokeWidth="0.5" />

            {/* 方向別ウェッジ（画面と同じレーダーバー） */}
            {result.directions
              .filter((d) => d.count > 0)
              .map((d) => {
                const angle = DIR_ANGLES[d.label];
                if (angle == null) return null;
                const intensity = d.percentage / maxPct;
                const isPrimary = d.label === result.primaryDirection;
                const barR = innerR + (outerR - innerR) * intensity;
                const fillOpacity = 0.15 + intensity * 0.55;
                return (
                  <path
                    key={d.label}
                    d={wedgePath(cx, cy, innerR, barR, angle, 22.5)}
                    fill={isPrimary ? '#f44336' : '#ef5350'}
                    fillOpacity={fillOpacity}
                    stroke={isPrimary ? '#f44336' : '#444'}
                    strokeWidth={isPrimary ? 1.5 : 0.5}
                  />
                );
              })}

            {/* 中心BULLサークル（画面と同じ緑） */}
            <circle cx={cx} cy={cy} r={innerR} fill="rgba(76,175,80,0.25)" />
            <circle cx={cx} cy={cy} r={innerR} fill="none" stroke="#4caf50" strokeWidth="2" />
          </svg>

          {/* 中心テキスト: BULL率（HTMLで描画） */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              position: 'absolute',
              left: `${cx - 40}px`,
              top: `${cy - 24}px`,
              width: '80px',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#4caf50' }}>BULL</span>
            <span style={{ fontSize: '18px', fontWeight: 700, color: '#4caf50' }}>
              {result.bullRate.toFixed(1)}%
            </span>
            <span style={{ fontSize: '10px', color: '#888' }}>
              BB:{result.doubleBullRate.toFixed(1)}%
            </span>
          </div>

          {/* 8方向ラベル + パーセンテージ（HTMLで描画） */}
          {Object.entries(DIR_ANGLES).map(([dir, angle]) => {
            const dirData = result.directions.find((d) => d.label === dir);
            const isPrimary = dir === result.primaryDirection;
            const midR = outerR * 0.58;
            const pos = labelPos(angle, midR);
            return (
              <div
                key={dir}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'absolute',
                  left: `${cx + pos.x - 24}px`,
                  top: `${cy + pos.y - 16}px`,
                  width: '48px',
                  alignItems: 'center',
                }}
              >
                <span
                  style={{
                    fontSize: '12px',
                    color: isPrimary ? '#f44336' : '#aaa',
                    fontWeight: isPrimary ? 700 : 400,
                  }}
                >
                  {dir}
                </span>
                {dirData && dirData.count > 0 && (
                  <span
                    style={{
                      fontSize: '14px',
                      fontWeight: 700,
                      color: isPrimary ? '#ff8a80' : '#ccc',
                    }}
                  >
                    {dirData.percentage.toFixed(1)}%
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* 右側: 主傾向 + TOP3ミスナンバー */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            paddingLeft: '16px',
            justifyContent: 'center',
            gap: '12px',
          }}
        >
          {/* 主傾向 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '14px', color: '#888' }}>主傾向</span>
            <span
              style={{
                fontSize: '20px',
                fontWeight: 700,
                color: result.directionStrength > 0.1 ? '#f44336' : '#ff9800',
              }}
            >
              {result.directionStrength > 0.05 ? `${result.primaryDirection}方向` : 'ミス均等'}
            </span>
            <span style={{ fontSize: '14px', color: '#aaa' }}>
              偏り強度: {(result.directionStrength * 100).toFixed(0)}%
            </span>
          </div>

          {/* 方向別一覧（パーセンテージ降順） */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {[...result.directions]
              .filter((d) => d.count > 0)
              .sort((a, b) => b.percentage - a.percentage)
              .map((d) => {
                const isPrimary = d.label === result.primaryDirection;
                return (
                  <div
                    key={d.label}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '15px',
                    }}
                  >
                    <span
                      style={{
                        width: '36px',
                        color: isPrimary ? '#f44336' : '#ccc',
                        fontWeight: isPrimary ? 700 : 400,
                      }}
                    >
                      {d.label}
                    </span>
                    <span
                      style={{
                        color: isPrimary ? '#ff8a80' : '#aaa',
                        fontWeight: isPrimary ? 700 : 400,
                      }}
                    >
                      {d.percentage.toFixed(1)}%
                    </span>
                  </div>
                );
              })}
          </div>

          {/* TOP3ミスナンバー */}
          {topMiss.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                marginTop: '8px',
                gap: '4px',
              }}
            >
              <span style={{ fontSize: '14px', color: '#888' }}>TOP3ミスナンバー</span>
              {topMiss.map((m, i) => (
                <span
                  key={m.number}
                  style={{
                    fontSize: '16px',
                    color: i === 0 ? '#ff9800' : '#bbb',
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
            const maxSegPct = top5Segments[0].percentage * 1.1;
            const barWidth = Math.max(4, (seg.percentage / maxSegPct) * 100);
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
          gap: '6px',
          marginTop: 'auto',
          justifyContent: 'flex-end',
        }}
      >
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
