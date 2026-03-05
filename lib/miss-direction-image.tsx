import { ImageResponse } from 'next/og';
import type { MissDirectionResult } from './stats-math';
import { loadNotoSansJPFonts } from './image-fonts';

/** ミス方向分析画像を生成 (800×500, ダークテーマ) */
export async function generateMissDirectionImage(
  result: MissDirectionResult,
  date: string,
): Promise<Buffer> {
  const fonts = await loadNotoSansJPFonts();

  // 8方向をパーセンテージ降順ソート
  const sortedDirs = [...result.directions]
    .filter((d) => d.count > 0)
    .sort((a, b) => b.percentage - a.percentage);

  const maxPct = sortedDirs.length > 0 ? sortedDirs[0].percentage : 0;
  const topMiss = result.topMissNumbers.slice(0, 3);

  const response = new ImageResponse(
    <div
      style={{
        width: '800px',
        height: '500px',
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
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '22px' }}>🎯</span>
          <span style={{ fontSize: '20px', fontWeight: 700, color: '#CE93D8' }}>ミス方向分析</span>
        </div>
        <span style={{ fontSize: '14px', color: '#aaa' }}>{result.totalDarts}本</span>
      </div>

      {/* 日付 */}
      <div style={{ display: 'flex', fontSize: '13px', color: '#aaa', marginBottom: '12px' }}>
        <span>{date}</span>
      </div>

      {/* ブル率 */}
      <div
        style={{
          display: 'flex',
          gap: '24px',
          fontSize: '14px',
          marginBottom: '14px',
          color: '#e0e0e0',
        }}
      >
        <span>
          ブル率:{' '}
          <span style={{ fontWeight: 700, color: '#4CAF50' }}>{result.bullRate.toFixed(1)}%</span>
        </span>
        <span>
          Dブル率:{' '}
          <span style={{ fontWeight: 700, color: '#4CAF50' }}>
            {result.doubleBullRate.toFixed(1)}%
          </span>
        </span>
      </div>

      {/* バーチャート */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          marginBottom: '14px',
        }}
      >
        {sortedDirs.map((d, i) => {
          const isPrimary = d.label === result.primaryDirection;
          const barWidth = maxPct > 0 ? Math.max(8, (d.percentage / maxPct) * 380) : 8;
          return (
            <div
              key={d.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
              }}
            >
              {/* 主傾向マーク */}
              <span
                style={{
                  width: '20px',
                  textAlign: 'center',
                  fontSize: '14px',
                  color: '#FFD54F',
                }}
              >
                {isPrimary ? '★' : ''}
              </span>
              {/* 方向ラベル */}
              <span
                style={{
                  width: '40px',
                  textAlign: 'right',
                  color: isPrimary ? '#fff' : '#bbb',
                  fontWeight: isPrimary ? 700 : 400,
                }}
              >
                {d.label}
              </span>
              {/* バー */}
              <div
                style={{
                  display: 'flex',
                  width: `${barWidth}px`,
                  height: '18px',
                  borderRadius: '3px',
                  background: isPrimary ? '#7B1FA2' : '#5C6BC0',
                }}
              />
              {/* パーセンテージ */}
              <span
                style={{
                  fontSize: '13px',
                  color: isPrimary ? '#CE93D8' : '#aaa',
                  fontWeight: isPrimary ? 700 : 400,
                }}
              >
                {d.percentage.toFixed(1)}%
              </span>
            </div>
          );
        })}
      </div>

      {/* 主傾向テキスト */}
      <div
        style={{
          display: 'flex',
          fontSize: '14px',
          color: '#CE93D8',
          marginBottom: '12px',
          fontWeight: 700,
        }}
      >
        <span>
          主傾向: {result.primaryDirection}（強度 {(result.directionStrength * 100).toFixed(0)}%）
        </span>
      </div>

      {/* TOP3ミスナンバー */}
      {topMiss.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          <span style={{ fontSize: '13px', color: '#888', marginBottom: '2px' }}>
            TOP3ミスナンバー
          </span>
          <div style={{ display: 'flex', gap: '16px', fontSize: '14px' }}>
            {topMiss.map((m, i) => (
              <span key={m.number} style={{ color: i === 0 ? '#FFB74D' : '#bbb' }}>
                {i + 1}. S{m.number} ({m.count}本)
              </span>
            ))}
          </div>
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
      height: 500,
      fonts: [
        { name: 'Noto Sans JP', data: fonts.regular, weight: 400 as const },
        { name: 'Noto Sans JP', data: fonts.bold, weight: 700 as const },
      ],
    },
  );

  return Buffer.from(await response.arrayBuffer());
}
