import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import SessionCompareCard from '@/components/stats/SessionCompareCard';
import { MOCK_COUNTUP_PLAYS } from '../mocks/dartslive-stats';

const meta: Meta<typeof SessionCompareCard> = {
  title: 'Stats/SessionCompareCard',
  component: SessionCompareCard,
  parameters: {
    layout: 'padded',
    backgrounds: { default: 'dark' },
  },
};

export default meta;
type Story = StoryObj<typeof SessionCompareCard>;

export const Standard: Story = {
  args: {
    countupPlays: MOCK_COUNTUP_PLAYS,
  },
};

export const InsufficientData: Story = {
  args: {
    countupPlays: MOCK_COUNTUP_PLAYS.slice(0, 10),
  },
};
