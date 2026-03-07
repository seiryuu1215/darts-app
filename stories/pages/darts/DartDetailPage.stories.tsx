import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Container, Box, Typography, Paper } from '@mui/material';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import DartDetail from '@/components/darts/DartDetail';
import type { Dart } from '@/types';
import { MOCK_DART_COMPLETE, MOCK_DART_STEEL } from '../../mocks/darts';

interface DartDetailPageStoryProps {
  dart: Dart | null;
  dartId: string;
}

function DartDetailPageStory({ dart, dartId }: DartDetailPageStoryProps) {
  if (!dart) {
    return (
      <Container maxWidth="md">
        <Box sx={{ mt: 3, p: { xs: 1, sm: 2 } }}>
          <Breadcrumbs items={[{ label: 'ダーツ一覧', href: '/darts' }, { label: '詳細' }]} />
          <Paper sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary">
              ダーツが見つかりませんでした
            </Typography>
          </Paper>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 3, p: { xs: 1, sm: 2 } }}>
        <Breadcrumbs items={[{ label: 'ダーツ一覧', href: '/darts' }, { label: dart.title }]} />
        <DartDetail dart={dart} dartId={dartId} />
      </Box>
    </Container>
  );
}

const meta = {
  title: 'Pages/Darts/DartDetailPage',
  component: DartDetailPageStory,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof DartDetailPageStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Loaded: Story = {
  args: { dart: MOCK_DART_COMPLETE as unknown as Dart, dartId: 'dart_001' },
};

export const SteelDart: Story = {
  args: { dart: MOCK_DART_STEEL as unknown as Dart, dartId: 'dart_002' },
};

export const NotFound: Story = {
  args: { dart: null, dartId: 'dart_999' },
};
