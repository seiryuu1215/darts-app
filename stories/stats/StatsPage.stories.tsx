import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { Container, Box } from '@mui/material';
import StatsPageContent from '@/components/stats/StatsPageContent';
import { getFlightColor } from '@/lib/dartslive-colors';
import { calc01Rating, ppdForRating } from '@/lib/dartslive-rating';
import {
  MOCK_DARTSLIVE_DATA,
  MOCK_PERIOD_SUMMARY,
  MOCK_PERIOD_RECORDS,
  MOCK_SA_FLIGHT_DATA,
  MOCK_C_FLIGHT_DATA,
} from '../mocks/dartslive-stats';
import type { DartsliveData } from '../mocks/dartslive-stats';

function StatsPageWrapper({ dlData }: { dlData: DartsliveData }) {
  const [periodTab, setPeriodTab] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const [monthlyTab, setMonthlyTab] = useState<'rating' | 'zeroOne' | 'cricket' | 'countUp'>(
    'rating',
  );
  const [gameChartCategory, setGameChartCategory] = useState('COUNT-UP');

  const c = dlData.current;
  const flightColor = c.flight ? getFlightColor(c.flight) : '#808080';
  const expectedCountUp = c.stats01Avg != null ? Math.round(c.stats01Avg * 8) : null;
  const current01RtInt = c.stats01Avg != null ? Math.floor(calc01Rating(c.stats01Avg)) : null;
  const dangerCountUp =
    current01RtInt != null ? Math.round(ppdForRating(current01RtInt - 2) * 8) : null;
  const excellentCountUp =
    current01RtInt != null ? Math.round(ppdForRating(current01RtInt + 2) * 8) : null;

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 3, p: { xs: 1, sm: 2 } }}>
        <StatsPageContent
          dlData={dlData}
          periodTab={periodTab}
          periodSummary={MOCK_PERIOD_SUMMARY}
          periodRecords={MOCK_PERIOD_RECORDS}
          periodLoading={false}
          flightColor={flightColor}
          expectedCountUp={expectedCountUp}
          dangerCountUp={dangerCountUp}
          excellentCountUp={excellentCountUp}
          activeSoftDart={null}
          monthlyTab={monthlyTab}
          gameChartCategory={gameChartCategory}
          onPeriodChange={setPeriodTab}
          onMonthlyTabChange={setMonthlyTab}
          onGameChartCategoryChange={setGameChartCategory}
        />
      </Box>
    </Container>
  );
}

const meta = {
  title: 'Stats/StatsPage',
  component: StatsPageWrapper,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof StatsPageWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const BBFlight: Story = {
  args: { dlData: MOCK_DARTSLIVE_DATA },
};

export const SAFlight: Story = {
  args: { dlData: MOCK_SA_FLIGHT_DATA },
};

export const CFlight: Story = {
  args: { dlData: MOCK_C_FLIGHT_DATA },
};
