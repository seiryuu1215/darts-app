import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import BullStatsCard from '@/components/stats/BullStatsCard';
import { MOCK_DARTSLIVE_DATA } from '../mocks/dartslive-stats';

const meta = {
  title: 'Stats/BullStatsCard',
  component: BullStatsCard,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 600 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof BullStatsCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FullStats: Story = {
  args: { awards: MOCK_DARTSLIVE_DATA.current.awards },
};

export const MonthlyOnly: Story = {
  args: {
    awards: {
      'D-BULL': { monthly: 87, total: 87 },
      'S-BULL': { monthly: 52, total: 52 },
    },
  },
};
