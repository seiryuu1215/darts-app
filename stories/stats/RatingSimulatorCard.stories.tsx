import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import RatingSimulatorCard from '@/components/stats/RatingSimulatorCard';

const meta = {
  title: 'Stats/RatingSimulatorCard',
  component: RatingSimulatorCard,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 600 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof RatingSimulatorCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const BBFlight: Story = {
  args: { currentPpd: 65.21, currentMpr: 2.31 },
};

export const SAFlight: Story = {
  args: { currentPpd: 89.45, currentMpr: 3.82 },
};
