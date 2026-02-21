import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import CountUpAnalysisCard from '@/components/stats/CountUpAnalysisCard';
import { MOCK_DARTSLIVE_DATA } from '../mocks/dartslive-stats';

const meta = {
  title: 'Stats/CountUpAnalysisCard',
  component: CountUpAnalysisCard,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 600 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CountUpAnalysisCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Standard: Story = {
  args: { games: MOCK_DARTSLIVE_DATA.recentGames.games },
};
