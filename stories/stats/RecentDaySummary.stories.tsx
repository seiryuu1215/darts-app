import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import RecentDaySummary from '@/components/stats/RecentDaySummary';
import { MOCK_DARTSLIVE_DATA } from '../mocks/dartslive-stats';

const meta = {
  title: 'Stats/RecentDaySummary',
  component: RecentDaySummary,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 600 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof RecentDaySummary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Standard: Story = {
  args: {
    dayStats: MOCK_DARTSLIVE_DATA.recentGames.dayStats,
    shops: MOCK_DARTSLIVE_DATA.recentGames.shops,
  },
};
