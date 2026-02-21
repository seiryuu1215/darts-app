import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import ZeroOneAnalysisCard from '@/components/stats/ZeroOneAnalysisCard';
import { MOCK_DARTSLIVE_DATA } from '../mocks/dartslive-stats';

const meta = {
  title: 'Stats/ZeroOneAnalysisCard',
  component: ZeroOneAnalysisCard,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 600 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ZeroOneAnalysisCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Standard: Story = {
  args: { games: MOCK_DARTSLIVE_DATA.recentGames.games },
};
