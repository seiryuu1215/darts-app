import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import ToolsPage from '@/app/tools/page';

const meta = {
  title: 'Pages/Tools/ToolsPage',
  component: ToolsPage,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof ToolsPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
