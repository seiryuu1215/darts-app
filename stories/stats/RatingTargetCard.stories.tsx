import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import RatingTargetCard from '@/components/stats/RatingTargetCard';
import { getFlightColor } from '@/lib/dartslive-colors';

const meta = {
  title: 'Stats/RatingTargetCard',
  component: RatingTargetCard,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 600 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof RatingTargetCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Rt5: Story = {
  args: {
    stats01Avg: 48.5,
    statsCriAvg: 1.65,
    flightColor: getFlightColor('B'),
  },
};

export const Rt8: Story = {
  args: {
    stats01Avg: 65.21,
    statsCriAvg: 2.31,
    flightColor: getFlightColor('BB'),
  },
};

export const Rt12: Story = {
  args: {
    stats01Avg: 82.5,
    statsCriAvg: 3.35,
    flightColor: getFlightColor('A'),
  },
};
