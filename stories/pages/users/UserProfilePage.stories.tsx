import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Container, Box, Typography, Paper, Grid, Chip, Button } from '@mui/material';
import UserAvatar from '@/components/UserAvatar';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import DartCard from '@/components/darts/DartCard';
import type { Dart } from '@/types';
import { MOCK_USER_GENERAL, MOCK_USER_PRO, MOCK_USER_PRIVATE } from '../../mocks/users';
import { MOCK_DARTS_LIST } from '../../mocks/darts';

type MockUser = typeof MOCK_USER_GENERAL;

interface UserProfilePageStoryProps {
  variant: 'public' | 'owner' | 'private' | 'notFound';
  user?: MockUser;
  darts: Dart[];
}

function UserProfilePageStory({ variant, user, darts }: UserProfilePageStoryProps) {
  if (variant === 'notFound') {
    return (
      <Container maxWidth="md">
        <Box sx={{ mt: 3, p: { xs: 1, sm: 2 } }}>
          <Breadcrumbs items={[{ label: 'ユーザー' }]} />
          <Paper sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary">
              ユーザーが見つかりませんでした
            </Typography>
          </Paper>
        </Box>
      </Container>
    );
  }

  if (variant === 'private' || !user) {
    return (
      <Container maxWidth="md">
        <Box sx={{ mt: 3, p: { xs: 1, sm: 2 } }}>
          <Breadcrumbs items={[{ label: 'ユーザー' }]} />
          <Paper sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary">
              このプロフィールは非公開です
            </Typography>
          </Paper>
        </Box>
      </Container>
    );
  }

  const isOwner = variant === 'owner';
  const roleLabels: Record<string, string> = {
    admin: '管理者',
    pro: 'PRO',
    general: '',
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 3, p: { xs: 1, sm: 2 } }}>
        <Breadcrumbs items={[{ label: user.displayName }]} />

        {/* Profile Card */}
        <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <UserAvatar
              userId={user.id}
              avatarUrl={user.avatarUrl}
              userName={user.displayName}
              size={64}
            />
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6">{user.displayName}</Typography>
                {roleLabels[user.role] && (
                  <Chip label={roleLabels[user.role]} size="small" color="primary" />
                )}
              </Box>
              {user.twitterHandle && (
                <Typography variant="caption" color="text.secondary">
                  @{user.twitterHandle}
                </Typography>
              )}
            </Box>
            {isOwner && (
              <Button variant="outlined" size="small">
                編集
              </Button>
            )}
          </Box>

          <Grid container spacing={2}>
            {user.height && (
              <Grid size={{ xs: 6, sm: 3 }}>
                <Typography variant="caption" color="text.secondary">
                  身長
                </Typography>
                <Typography variant="body2">{user.height}cm</Typography>
              </Grid>
            )}
            {user.fourStanceType && (
              <Grid size={{ xs: 6, sm: 3 }}>
                <Typography variant="caption" color="text.secondary">
                  4スタンス
                </Typography>
                <Typography variant="body2">{user.fourStanceType}</Typography>
              </Grid>
            )}
            {user.dominantEye && (
              <Grid size={{ xs: 6, sm: 3 }}>
                <Typography variant="caption" color="text.secondary">
                  利き目
                </Typography>
                <Typography variant="body2">
                  {user.dominantEye === 'right' ? '右' : '左'}
                </Typography>
              </Grid>
            )}
            {user.gripType && (
              <Grid size={{ xs: 6, sm: 3 }}>
                <Typography variant="caption" color="text.secondary">
                  グリップ
                </Typography>
                <Typography variant="body2">{user.gripType}</Typography>
              </Grid>
            )}
          </Grid>
        </Paper>

        {/* Darts */}
        <Typography variant="h6" sx={{ mb: 2 }}>
          セッティング ({darts.length})
        </Typography>
        {darts.length === 0 ? (
          <Paper sx={{ textAlign: 'center', py: 4, bgcolor: 'background.default' }}>
            <Typography color="text.secondary">セッティングが登録されていません</Typography>
          </Paper>
        ) : (
          <Grid container spacing={2}>
            {darts.map((dart) => (
              <Grid size={{ xs: 12, sm: 6 }} key={dart.id}>
                <DartCard dart={dart} />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Container>
  );
}

const meta = {
  title: 'Pages/Users/UserProfilePage',
  component: UserProfilePageStory,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof UserProfilePageStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Public: Story = {
  args: {
    variant: 'public',
    user: MOCK_USER_GENERAL,
    darts: MOCK_DARTS_LIST.slice(0, 3) as unknown as Dart[],
  },
};

export const Owner: Story = {
  args: {
    variant: 'owner',
    user: MOCK_USER_PRO,
    darts: MOCK_DARTS_LIST.slice(0, 2) as unknown as Dart[],
  },
};

export const Private: Story = {
  args: {
    variant: 'private',
    user: MOCK_USER_PRIVATE,
    darts: [],
  },
};

export const NotFound: Story = {
  args: { variant: 'notFound', darts: [] },
};
