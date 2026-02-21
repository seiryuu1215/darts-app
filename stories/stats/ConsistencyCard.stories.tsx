import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import ConsistencyCard from '@/components/stats/ConsistencyCard';
import {
  MOCK_DARTSLIVE_DATA,
  MOCK_HIGH_CONSISTENCY_GAMES,
  MOCK_LOW_CONSISTENCY_GAMES,
  MOCK_FEW_GAMES,
} from '../mocks/dartslive-stats';

const meta = {
  title: 'Stats/ConsistencyCard',
  component: ConsistencyCard,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 600 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ConsistencyCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Standard: Story = {
  args: { games: MOCK_DARTSLIVE_DATA.recentGames.games },
};

export const HighConsistency: Story = {
  args: { games: MOCK_HIGH_CONSISTENCY_GAMES },
};

export const LowConsistency: Story = {
  args: { games: MOCK_LOW_CONSISTENCY_GAMES },
};

export const MinimumGames: Story = {
  args: { games: MOCK_FEW_GAMES },
};
