import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import ZeroOneConsistencyCard from '@/components/stats/ZeroOneConsistencyCard';
import { MOCK_DARTSLIVE_DATA } from '../mocks/dartslive-stats';

const meta = {
  title: 'Stats/ZeroOneConsistencyCard',
  component: ZeroOneConsistencyCard,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 600 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ZeroOneConsistencyCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Standard: Story = {
  args: { games: MOCK_DARTSLIVE_DATA.recentGames.games },
};
