import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import MonthlyTrendChart from '@/components/stats/MonthlyTrendChart';
import { getFlightColor } from '@/lib/dartslive-colors';
import { MOCK_DARTSLIVE_DATA } from '../mocks/dartslive-stats';

type MonthlyTab = 'rating' | 'zeroOne' | 'cricket' | 'countUp';

function MonthlyTrendWrapper({ initialTab }: { initialTab: MonthlyTab }) {
  const [tab, setTab] = useState<MonthlyTab>(initialTab);
  return (
    <MonthlyTrendChart
      monthly={MOCK_DARTSLIVE_DATA.monthly}
      monthlyTab={tab}
      onTabChange={setTab}
      flightColor={getFlightColor('BB')}
    />
  );
}

const meta = {
  title: 'Stats/MonthlyTrendChart',
  component: MonthlyTrendWrapper,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 600 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MonthlyTrendWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Rating: Story = {
  args: { initialTab: 'rating' },
};

export const ZeroOne: Story = {
  args: { initialTab: 'zeroOne' },
};

export const Cricket: Story = {
  args: { initialTab: 'cricket' },
};

export const CountUp: Story = {
  args: { initialTab: 'countUp' },
};
