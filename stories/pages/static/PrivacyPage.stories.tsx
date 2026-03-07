import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import PrivacyPage from '@/app/privacy/page';

const meta = {
  title: 'Pages/Static/PrivacyPage',
  component: PrivacyPage,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof PrivacyPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
