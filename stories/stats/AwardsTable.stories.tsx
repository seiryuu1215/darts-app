import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import AwardsTable from '@/components/stats/AwardsTable';
import { MOCK_DARTSLIVE_DATA } from '../mocks/dartslive-stats';

const meta = {
  title: 'Stats/AwardsTable',
  component: AwardsTable,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 600 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AwardsTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Standard: Story = {
  args: { awards: MOCK_DARTSLIVE_DATA.current.awards },
};
