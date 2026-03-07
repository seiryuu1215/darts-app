import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import TermsPage from '@/app/terms/page';

const meta = {
  title: 'Pages/Static/TermsPage',
  component: TermsPage,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof TermsPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
