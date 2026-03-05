import type { Meta, StoryObj } from '@storybook/nextjs-vite';
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
};

export const MissOnly: Story = {
  args: {
    heatmapData: heatmapMiss,
    size: 200,
  },
};

export const Small: Story = {
  args: {
    heatmapData: heatmapAll,
    size: 100,
  },
};
