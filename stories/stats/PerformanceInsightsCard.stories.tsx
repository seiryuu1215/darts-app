import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import PerformanceInsightsCard from '@/components/stats/PerformanceInsightsCard';
import { MOCK_ENRICHED_DATA } from '../mocks/dartslive-stats';

const meta = {
  title: 'Stats/PerformanceInsightsCard',
  component: PerformanceInsightsCard,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 600 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PerformanceInsightsCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithInsights: Story = {
  args: {
    enrichedData: MOCK_ENRICHED_DATA,
    currentRating: 8.32,
  },
};

export const MinimalData: Story = {
  args: {
    enrichedData: {
      maxRating: 5.1,
      stats01Detailed: {
        avg: 45.0,
        best: 52.0,
        winRate: null,
        bullRate: null,
        arrangeRate: null,
        avgBust: null,
        avg100: null,
      },
      statsCricketDetailed: null,
    },
    currentRating: 4.8,
  },
};
