import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import RatingHeroCard from '@/components/stats/RatingHeroCard';
import { getFlightColor } from '@/lib/dartslive-colors';

const meta = {
  title: 'Stats/RatingHeroCard',
  component: RatingHeroCard,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 600 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof RatingHeroCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const BBFlight: Story = {
  args: {
    rating: 8.32,
    ratingPrev: 8.15,
    flight: 'BB',
    flightColor: getFlightColor('BB'),
    streak: 5,
    showStreak: true,
  },
};

export const WithProfile: Story = {
  args: {
    rating: 8.32,
    ratingPrev: 8.15,
    flight: 'BB',
    flightColor: getFlightColor('BB'),
    streak: 5,
    showStreak: true,
    cardName: 'MOCK PLAYER',
    cardImageUrl: 'https://placehold.co/128x128/7B1FA2/white?text=BB',
    toorina: '@mockplayer',
    homeShop: 'Bee 渋谷道玄坂店',
    status: 'レーティングUP中',
  },
};

export const SAFlight: Story = {
  args: {
    rating: 14.21,
    ratingPrev: 14.05,
    flight: 'SA',
    flightColor: getFlightColor('SA'),
    streak: 12,
    showStreak: true,
  },
};

export const CFlight: Story = {
  args: {
    rating: 3.45,
    ratingPrev: 3.21,
    flight: 'C',
    flightColor: getFlightColor('C'),
    streak: 2,
    showStreak: true,
  },
};

export const NFlight: Story = {
  args: {
    rating: 1.23,
    ratingPrev: 1.45,
    flight: 'N',
    flightColor: getFlightColor('N'),
    streak: 0,
    showStreak: true,
  },
};

export const AFlight: Story = {
  args: {
    rating: 11.78,
    ratingPrev: 11.82,
    flight: 'A',
    flightColor: getFlightColor('A'),
    streak: 8,
    showStreak: true,
  },
};

export const RatingDown: Story = {
  args: {
    rating: 8.12,
    ratingPrev: 8.45,
    flight: 'BB',
    flightColor: getFlightColor('BB'),
    streak: 0,
    showStreak: false,
  },
};

export const BFlight: Story = {
  args: {
    rating: 5.67,
    ratingPrev: 5.42,
    flight: 'B',
    flightColor: getFlightColor('B'),
    streak: 3,
    showStreak: true,
  },
};
