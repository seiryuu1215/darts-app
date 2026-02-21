import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import GameStatsCards from '@/components/stats/GameStatsCards';

const meta = {
  title: 'Stats/GameStatsCards',
  component: GameStatsCards,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 600 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof GameStatsCards>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Standard: Story = {
  args: {
    stats01Avg: 65.21,
    stats01Best: 72.45,
    statsCriAvg: 2.31,
    statsCriBest: 2.89,
    statsPraAvg: 521,
    statsPraBest: 612,
    prev01Avg: 64.38,
    prevCriAvg: 2.24,
    prevPraAvg: 512,
    expectedCountUp: 522,
  },
};

export const WithPrevComparison: Story = {
  args: {
    stats01Avg: 65.21,
    stats01Best: 72.45,
    statsCriAvg: 2.31,
    statsCriBest: 2.89,
    statsPraAvg: 521,
    statsPraBest: 612,
    prev01Avg: 67.12,
    prevCriAvg: 2.45,
    prevPraAvg: 535,
    expectedCountUp: 522,
  },
};

export const NoPrev: Story = {
  args: {
    stats01Avg: 65.21,
    stats01Best: 72.45,
    statsCriAvg: 2.31,
    statsCriBest: 2.89,
    statsPraAvg: 521,
    statsPraBest: 612,
    prev01Avg: null,
    prevCriAvg: null,
    prevPraAvg: null,
    expectedCountUp: 522,
  },
};
