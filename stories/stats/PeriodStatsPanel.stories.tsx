import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import PeriodStatsPanel from '@/components/stats/PeriodStatsPanel';
import { MOCK_PERIOD_SUMMARY, MOCK_PERIOD_RECORDS } from '../mocks/dartslive-stats';

type PeriodTab = 'latest' | 'week' | 'month' | 'all';

function PeriodStatsPanelWrapper({
  initialTab,
  isLoading = false,
}: {
  initialTab: PeriodTab;
  isLoading?: boolean;
}) {
  const [tab, setTab] = useState<PeriodTab>(initialTab);
  return (
    <PeriodStatsPanel
      periodTab={tab}
      onPeriodChange={setTab}
      loading={isLoading}
      summary={isLoading ? null : MOCK_PERIOD_SUMMARY}
      records={isLoading ? [] : MOCK_PERIOD_RECORDS}
      prevPpd={64.38}
      prevMpr={2.24}
    />
  );
}

const meta = {
  title: 'Stats/PeriodStatsPanel',
  component: PeriodStatsPanelWrapper,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 600 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PeriodStatsPanelWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const All: Story = {
  args: { initialTab: 'all' },
};

export const Latest: Story = {
  args: { initialTab: 'latest' },
};

export const Loading: Story = {
  args: { initialTab: 'all', isLoading: true },
};
