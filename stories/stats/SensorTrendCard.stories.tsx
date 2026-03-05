import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import SensorTrendCard from '@/components/stats/SensorTrendCard';
import { MOCK_COUNTUP_PLAYS } from '../mocks/dartslive-stats';

const meta = {
  title: 'Stats/SensorTrendCard',
  component: SensorTrendCard,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 600 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SensorTrendCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Standard: Story = {
  args: { countupPlays: MOCK_COUNTUP_PLAYS },
};
