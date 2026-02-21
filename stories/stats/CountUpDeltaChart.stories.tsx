import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import CountUpDeltaChart from '@/components/stats/CountUpDeltaChart';
import {
  MOCK_DARTSLIVE_DATA,
  MOCK_TRENDING_UP_GAMES,
  MOCK_TRENDING_DOWN_GAMES,
} from '../mocks/dartslive-stats';

const meta = {
  title: 'Stats/CountUpDeltaChart',
  component: CountUpDeltaChart,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 600 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CountUpDeltaChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Standard: Story = {
  args: {
    games: MOCK_DARTSLIVE_DATA.recentGames.games,
    avgScore: 521,
  },
};

export const TrendingUp: Story = {
  args: {
    games: MOCK_TRENDING_UP_GAMES,
    avgScore: 550,
  },
};

export const TrendingDown: Story = {
  args: {
    games: MOCK_TRENDING_DOWN_GAMES,
    avgScore: 530,
  },
};
