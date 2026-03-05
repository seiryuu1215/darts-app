import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import PracticeRecommendationsCard from '@/components/stats/PracticeRecommendationsCard';
import { MOCK_REC_INPUT, MOCK_REC_INPUT_LITE } from '../mocks/dartslive-stats';

const meta = {
  title: 'Stats/PracticeRecommendationsCard',
  component: PracticeRecommendationsCard,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 600 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PracticeRecommendationsCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FullInput: Story = {
  args: { input: MOCK_REC_INPUT },
};

export const LiteInput: Story = {
  args: { input: MOCK_REC_INPUT_LITE },
};
