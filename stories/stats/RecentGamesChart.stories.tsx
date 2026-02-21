import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import RecentGamesChart from '@/components/stats/RecentGamesChart';
import { MOCK_DARTSLIVE_DATA } from '../mocks/dartslive-stats';

function RecentGamesWrapper({ initialCategory }: { initialCategory: string }) {
  const [cat, setCat] = useState(initialCategory);
  return (
    <RecentGamesChart
      games={MOCK_DARTSLIVE_DATA.recentGames.games}
      gameChartCategory={cat}
      onCategoryChange={setCat}
      expectedCountUp={522}
      dangerCountUp={424}
      excellentCountUp={600}
    />
  );
}

const meta = {
  title: 'Stats/RecentGamesChart',
  component: RecentGamesWrapper,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 600 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof RecentGamesWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CountUp: Story = {
  args: { initialCategory: 'COUNT-UP' },
};

export const ZeroOne: Story = {
  args: { initialCategory: '501' },
};

export const Cricket: Story = {
  args: { initialCategory: 'STANDARD CRICKET' },
};
