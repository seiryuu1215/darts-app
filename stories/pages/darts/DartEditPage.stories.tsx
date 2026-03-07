import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Container, Box, Typography, Paper } from '@mui/material';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import type { Dart } from '@/types';
import { MOCK_DART_COMPLETE } from '../../mocks/darts';

interface DartEditPageStoryProps {
  dart: Dart | null;
}

function DartEditPageStory({ dart }: DartEditPageStoryProps) {
  if (!dart) {
    return (
      <Container maxWidth="md">
        <Box sx={{ mt: 3, p: { xs: 1, sm: 2 } }}>
          <Breadcrumbs items={[{ label: 'ダーツ一覧', href: '/darts' }, { label: '編集' }]} />
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
        <Breadcrumbs
          items={[
            { label: 'ダーツ一覧', href: '/darts' },
            { label: dart.title, href: `/darts/${dart.id}` },
            { label: '編集' },
          ]}
        />
        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
          セッティング編集: {dart.title}
        </Typography>
        <Paper variant="outlined" sx={{ p: 3, mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
            バレル情報
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {dart.barrel.brand} {dart.barrel.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {dart.barrel.weight}g
            {dart.barrel.maxDiameter && ` / 最大径${dart.barrel.maxDiameter}mm`}
            {dart.barrel.length && ` / 全長${dart.barrel.length}mm`}
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
}

const meta = {
  title: 'Pages/Darts/DartEditPage',
  component: DartEditPageStory,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof DartEditPageStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Loaded: Story = {
  args: { dart: MOCK_DART_COMPLETE as unknown as Dart },
};

export const NotFound: Story = {
  args: { dart: null },
};
