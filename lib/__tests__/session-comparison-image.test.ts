import { describe, it, expect, vi } from 'vitest';

// next/og の ImageResponse をモック
vi.mock('next/og', () => ({
  ImageResponse: class MockImageResponse {
    private body: Uint8Array;
    constructor() {
      // 最小限のPNGヘッダーを模擬
      this.body = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
    }
    async arrayBuffer() {
      return this.body.buffer;
    }
  },
}));

// フォント読み込みをモック
vi.mock('../image-fonts', () => ({
  loadNotoSansJPFonts: async () => ({
    regular: new ArrayBuffer(8),
    bold: new ArrayBuffer(8),
  }),
}));

import { generateSessionComparisonImage } from '../session-comparison-image';
import type { CuSessionComparison } from '../countup-session-compare';

function makeComparison(): CuSessionComparison {
  return {
    prev: {
      date: '2025-03-01',
      gameCount: 35,
      avgScore: 480.5,
      maxScore: 620,
      minScore: 380,
      consistency: 72.3,
      bullRate: 28.5,
      doubleBullRate: 12.1,
      missDirections: [{ direction: '右上', percentage: 35 }],
      avgVectorX: 2.5,
      avgVectorY: -1.3,
      avgRadius: 25.0,
      avgSpeed: 12.5,
      primaryMissDir: '右上',
      directionStrength: 0.35,
      lowTonRate: 15.0,
      hatTrickRate: 8.0,
      oneBullRate: 22.0,
      noBullRate: 30.0,
    },
    current: {
      date: '2025-03-05',
      gameCount: 40,
      avgScore: 510.2,
      maxScore: 650,
      minScore: 400,
      consistency: 78.1,
      bullRate: 32.0,
      doubleBullRate: 14.5,
      missDirections: [{ direction: '右', percentage: 28 }],
      avgVectorX: 1.8,
      avgVectorY: -0.9,
      avgRadius: 22.0,
      avgSpeed: 13.0,
      primaryMissDir: '右',
      directionStrength: 0.28,
      lowTonRate: 18.0,
      hatTrickRate: 10.5,
      oneBullRate: 25.0,
      noBullRate: 25.0,
    },
    deltas: {
      avgScore: 29.7,
      consistency: 5.8,
      bullRate: 3.5,
      vectorX: -0.7,
      vectorY: 0.4,
      radius: -3.0,
      speed: 0.5,
      lowTonRate: 3.0,
      hatTrickRate: 2.5,
      oneBullRate: 3.0,
      noBullRate: -5.0,
    },
    insights: ['平均スコアが29.7点向上', 'ブル率が3.5%改善', 'グルーピングが3mm改善'],
  };
}

describe('generateSessionComparisonImage', () => {
  it('Bufferを返す', async () => {
    const comparison = makeComparison();
    const buffer = await generateSessionComparisonImage(comparison);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('PNGヘッダーを含む', async () => {
    const comparison = makeComparison();
    const buffer = await generateSessionComparisonImage(comparison);
    // モックが返すPNGヘッダー
    expect(buffer[0]).toBe(0x89);
    expect(buffer[1]).toBe(0x50); // 'P'
    expect(buffer[2]).toBe(0x4e); // 'N'
    expect(buffer[3]).toBe(0x47); // 'G'
  });

  it('インサイトが空でもエラーにならない', async () => {
    const comparison = makeComparison();
    comparison.insights = [];
    const buffer = await generateSessionComparisonImage(comparison);
    expect(buffer).toBeInstanceOf(Buffer);
  });
});
