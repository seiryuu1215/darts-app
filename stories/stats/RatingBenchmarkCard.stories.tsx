import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import RatingBenchmarkCard from '@/components/stats/RatingBenchmarkCard';

const meta = {
  title: 'Stats/RatingBenchmarkCard',
  component: RatingBenchmarkCard,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 600 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof RatingBenchmarkCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const BBFlight: Story = {
  args: { currentPpd: 65.21 },
};

export const SAFlight: Story = {
  args: { currentPpd: 89.45 },
};

export const CFlight: Story = {
  args: { currentPpd: 42.18 },
};

export const NoPpd: Story = {
  args: { currentPpd: null },
};
