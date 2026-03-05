import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from '@storybook/test';
import MiniDartboardSvg from '@/components/stats/MiniDartboardSvg';
import { computeSegmentFrequency } from '@/lib/heatmap-data';
import { MOCK_COUNTUP_PLAYS } from '../mocks/dartslive-stats';

const playLogs = MOCK_COUNTUP_PLAYS.slice(0, 35)
  .map((p) => p.playLog)
  .filter((l) => l && l.length > 0);

const heatmapAll = computeSegmentFrequency(playLogs, 'all');
const heatmapMiss = computeSegmentFrequency(playLogs, 'miss');

const meta: Meta<typeof MiniDartboardSvg> = {
  title: 'Stats/MiniDartboardSvg',
  component: MiniDartboardSvg,
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'dark' },
  },
};

export default meta;
type Story = StoryObj<typeof MiniDartboardSvg>;

export const AllDarts: Story = {
  args: {
    heatmapData: heatmapAll,
    size: 200,
  },
  play: async ({ canvasElement }) => {
    // SVGが描画されていること
    const svg = canvasElement.querySelector('svg');
    await expect(svg).not.toBeNull();
    await expect(svg?.getAttribute('width')).toBe('200');
    await expect(svg?.getAttribute('height')).toBe('200');

    // ダーツボードの構造線（circle要素）が存在すること
    const circles = canvasElement.querySelectorAll('circle');
    await expect(circles.length).toBeGreaterThan(0);

    // ヒートマップのpath要素が存在すること
    const paths = canvasElement.querySelectorAll('path');
    await expect(paths.length).toBeGreaterThan(0);
  },
};

export const MissOnly: Story = {
  args: {
    heatmapData: heatmapMiss,
    size: 200,
  },
  play: async ({ canvasElement }) => {
    const svg = canvasElement.querySelector('svg');
    await expect(svg).not.toBeNull();

    // ミスのみモードでもSVGが正常に描画される
    const paths = canvasElement.querySelectorAll('path');
    await expect(paths.length).toBeGreaterThan(0);
  },
};

export const Small: Story = {
  args: {
    heatmapData: heatmapAll,
    size: 100,
  },
  play: async ({ canvasElement }) => {
    const svg = canvasElement.querySelector('svg');
    await expect(svg).not.toBeNull();
    await expect(svg?.getAttribute('width')).toBe('100');
    await expect(svg?.getAttribute('height')).toBe('100');
  },
};

export const EmptyHeatmap: Story = {
  args: {
    heatmapData: computeSegmentFrequency([]),
    size: 200,
  },
  play: async ({ canvasElement }) => {
    // 空データでもSVGがクラッシュせず描画されること
    const svg = canvasElement.querySelector('svg');
    await expect(svg).not.toBeNull();
  },
};
