import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import ReferencePage from '@/app/reference/page';

const meta = {
  title: 'Pages/Reference/ReferencePage',
  component: ReferencePage,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof ReferencePage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
