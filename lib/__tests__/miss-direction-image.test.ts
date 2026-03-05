import { describe, it, expect, vi } from 'vitest';

// next/og の ImageResponse をモック
vi.mock('next/og', () => ({
  ImageResponse: class MockImageResponse {
    private body: Uint8Array;
    constructor() {
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

import { generateMissDirectionImage } from '../miss-direction-image';
import type { MissDirectionResult } from '../stats-math';

function makeMissResult(): MissDirectionResult {
  return {
    totalDarts: 120,
    bullCount: 38,
    bullRate: 31.7,
    doubleBullCount: 17,
    doubleBullRate: 14.2,
    missCount: 82,
    outCount: 0,
    directions: [
      { label: '右上', count: 29, percentage: 35.4, numbers: [{ number: 20, count: 15 }] },
      { label: '右', count: 23, percentage: 28.0, numbers: [{ number: 1, count: 12 }] },
      { label: '上', count: 18, percentage: 22.0, numbers: [{ number: 5, count: 10 }] },
      { label: '左上', count: 12, percentage: 14.6, numbers: [{ number: 18, count: 8 }] },
      { label: '下', count: 0, percentage: 0, numbers: [] },
      { label: '左下', count: 0, percentage: 0, numbers: [] },
      { label: '左', count: 0, percentage: 0, numbers: [] },
      { label: '右下', count: 0, percentage: 0, numbers: [] },
    ],
    primaryDirection: '右上',
    directionStrength: 0.35,
    avgVector: { x: 2.5, y: -1.3 },
    topMissNumbers: [
      { number: 20, count: 15, percentage: 18.3 },
      { number: 1, count: 12, percentage: 14.6 },
      { number: 5, count: 10, percentage: 12.2 },
    ],
  };
}

describe('generateMissDirectionImage', () => {
  it('Bufferを返す', async () => {
    const result = makeMissResult();
    const buffer = await generateMissDirectionImage(result, '2026/03/05');
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('PNGヘッダーを含む', async () => {
    const result = makeMissResult();
    const buffer = await generateMissDirectionImage(result, '2026/03/05');
    expect(buffer[0]).toBe(0x89);
    expect(buffer[1]).toBe(0x50);
    expect(buffer[2]).toBe(0x4e);
    expect(buffer[3]).toBe(0x47);
  });

  it('ミスナンバーが空でもエラーにならない', async () => {
    const result = makeMissResult();
    result.topMissNumbers = [];
    const buffer = await generateMissDirectionImage(result, '2026/03/05');
    expect(buffer).toBeInstanceOf(Buffer);
  });

  it('全方向カウント0でもエラーにならない', async () => {
    const result = makeMissResult();
    result.directions = result.directions.map((d) => ({ ...d, count: 0, percentage: 0 }));
    const buffer = await generateMissDirectionImage(result, '2026/03/05');
    expect(buffer).toBeInstanceOf(Buffer);
  });
});
