import { describe, it, expect } from 'vitest';
import {
  BOARD_ORDER,
  BASE_SIZE,
  R_DOUBLE_OUTER,
  R_DBULL,
  arcPath,
  heatColor,
} from '../dartboard-svg-utils';

describe('BOARD_ORDER', () => {
  it('20個の数字で構成される', () => {
    expect(BOARD_ORDER).toHaveLength(20);
  });

  it('12時位置は20', () => {
    expect(BOARD_ORDER[0]).toBe(20);
  });

  it('1-20の全数字が含まれる', () => {
    const sorted = [...BOARD_ORDER].sort((a, b) => a - b);
    expect(sorted).toEqual(Array.from({ length: 20 }, (_, i) => i + 1));
  });
});

describe('定数', () => {
  it('BASE_SIZEは300', () => {
    expect(BASE_SIZE).toBe(300);
  });

  it('R_DOUBLE_OUTER > R_DBULL', () => {
    expect(R_DOUBLE_OUTER).toBeGreaterThan(R_DBULL);
  });
});

describe('arcPath', () => {
  it('SVGパス文字列を返す', () => {
    const path = arcPath(150, 150, 50, 100, 0, 18);
    expect(typeof path).toBe('string');
    expect(path).toMatch(/^M /);
    expect(path).toContain('L ');
    expect(path).toContain('A ');
    expect(path).toMatch(/Z$/);
  });

  it('異なるパラメータで異なるパスを返す', () => {
    const p1 = arcPath(150, 150, 50, 100, 0, 18);
    const p2 = arcPath(150, 150, 50, 100, 18, 36);
    expect(p1).not.toBe(p2);
  });

  it('cx, cyを変更するとパスが変わる', () => {
    const p1 = arcPath(100, 100, 50, 100, 0, 18);
    const p2 = arcPath(200, 200, 50, 100, 0, 18);
    expect(p1).not.toBe(p2);
  });
});

describe('heatColor', () => {
  it('0以下はtransparentを返す', () => {
    expect(heatColor(0)).toBe('transparent');
    expect(heatColor(-0.5)).toBe('transparent');
  });

  it('低い値（<0.33）はrgb文字列を返す', () => {
    const color = heatColor(0.1);
    expect(color).toMatch(/^rgb\(\d+,\d+,\d+\)$/);
  });

  it('中間値（0.33-0.66）はrgb文字列を返す', () => {
    const color = heatColor(0.5);
    expect(color).toMatch(/^rgb\(\d+,\d+,\d+\)$/);
  });

  it('高い値（>0.66）はrgb文字列を返す', () => {
    const color = heatColor(0.9);
    expect(color).toMatch(/^rgb\(\d+,\d+,\d+\)$/);
  });

  it('1.0でもrgb文字列を返す', () => {
    const color = heatColor(1.0);
    expect(color).toMatch(/^rgb\(\d+,\d+,\d+\)$/);
  });

  it('値が大きくなるにつれて色が変化する', () => {
    const low = heatColor(0.1);
    const mid = heatColor(0.5);
    const high = heatColor(0.9);
    expect(low).not.toBe(mid);
    expect(mid).not.toBe(high);
  });
});
