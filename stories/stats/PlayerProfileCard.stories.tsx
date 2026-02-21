import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import PlayerProfileCard from '@/components/stats/PlayerProfileCard';
import { getFlightColor } from '@/lib/dartslive-colors';

const meta = {
  title: 'Stats/PlayerProfileCard',
  component: PlayerProfileCard,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 600 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PlayerProfileCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithImage: Story = {
  args: {
    cardName: 'MOCK PLAYER',
    cardImageUrl: 'https://placehold.co/128x128/7B1FA2/white?text=BB',
    toorina: 'mockplayer',
    homeShop: 'Bee 渋谷道玄坂店',
    myAward: 'HAT TRICK',
    status: 'レーティングUP中',
    flightColor: getFlightColor('BB'),
  },
};

export const WithoutImage: Story = {
  args: {
    cardName: 'NO IMAGE PLAYER',
    cardImageUrl: '',
    toorina: 'noimgplayer',
    homeShop: 'ダーツハイブ新宿店',
    myAward: undefined,
    status: undefined,
    flightColor: getFlightColor('B'),
  },
};
