import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  MenuItem,
  Divider,
  Paper,
  FormControlLabel,
  Switch,
  InputAdornment,
  Chip,
} from '@mui/material';
import { MOCK_USER_GENERAL, MOCK_USER_PRO } from '../../mocks/users';

type MockUser = typeof MOCK_USER_GENERAL;

interface ProfileEditPageStoryProps {
  user: MockUser;
  hasDartslive: boolean;
}

function ProfileEditPageStory({ user, hasDartslive }: ProfileEditPageStoryProps) {
  const [displayName, setDisplayName] = useState(user.displayName);
  const [height, setHeight] = useState(user.height?.toString() ?? '');
  const [stanceType, setStanceType] = useState(user.fourStanceType ?? '');
  const [dominantEye, setDominantEye] = useState(user.dominantEye ?? '');
  const [gripType, setGripType] = useState(user.gripType);
  const [twitterHandle, setTwitterHandle] = useState(user.twitterHandle ?? '');
  const [isPublic, setIsPublic] = useState(user.isProfilePublic);

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 3, p: { xs: 1, sm: 2 } }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
          プロフィール編集
        </Typography>

        {/* Avatar */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              bgcolor: 'action.hover',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="h4" color="text.secondary">
              {displayName.charAt(0)}
            </Typography>
          </Box>
          <Button variant="outlined" size="small">
            画像を変更
          </Button>
        </Box>

        <TextField
          label="表示名"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          fullWidth
          required
          sx={{ mb: 2 }}
        />

        <TextField
          label="身長 (cm)"
          type="number"
          value={height}
          onChange={(e) => setHeight(e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
        />

        <TextField
          select
          label="4スタンス理論タイプ"
          value={stanceType}
          onChange={(e) => setStanceType(e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
        >
          <MenuItem value="">未設定</MenuItem>
          <MenuItem value="A1">A1</MenuItem>
          <MenuItem value="A2">A2</MenuItem>
          <MenuItem value="B1">B1</MenuItem>
          <MenuItem value="B2">B2</MenuItem>
        </TextField>

        <TextField
          select
          label="利き目"
          value={dominantEye}
          onChange={(e) => setDominantEye(e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
        >
          <MenuItem value="">未設定</MenuItem>
          <MenuItem value="right">右</MenuItem>
          <MenuItem value="left">左</MenuItem>
        </TextField>

        <TextField
          label="グリップ"
          value={gripType}
          onChange={(e) => setGripType(e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
        />

        <Divider sx={{ my: 2 }}>SNS</Divider>

        <TextField
          label="X (Twitter)"
          value={twitterHandle}
          onChange={(e) => setTwitterHandle(e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
          slotProps={{
            input: { startAdornment: <InputAdornment position="start">@</InputAdornment> },
          }}
        />

        <Divider sx={{ my: 2 }}>設定</Divider>

        <FormControlLabel
          control={<Switch checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />}
          label="プロフィールを公開"
          sx={{ mb: 2, display: 'block' }}
        />

        {/* DARTSLIVE連携 */}
        <Divider sx={{ my: 2 }}>DARTSLIVE連携</Divider>
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          {hasDartslive ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip label="連携済み" color="success" size="small" />
              <Typography variant="body2" color="text.secondary">
                自動チェック有効
              </Typography>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              DARTSLIVE連携が未設定です
            </Typography>
          )}
        </Paper>

        {/* Subscription */}
        {user.role === 'pro' && (
          <>
            <Divider sx={{ my: 2 }}>サブスクリプション</Divider>
            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip label="PRO" color="primary" size="small" />
                <Typography variant="body2">PROプラン利用中</Typography>
              </Box>
            </Paper>
          </>
        )}

        <Button variant="contained" fullWidth sx={{ mt: 2 }}>
          保存
        </Button>

        {/* Danger zone */}
        <Divider sx={{ my: 3 }} />
        <Paper variant="outlined" sx={{ p: 2, borderColor: 'error.main' }}>
          <Typography variant="subtitle2" color="error" sx={{ mb: 1 }}>
            アカウント削除
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            アカウントを削除すると、全てのデータが完全に消去されます。
          </Typography>
          <Button variant="outlined" color="error" size="small">
            アカウントを削除
          </Button>
        </Paper>
      </Box>
    </Container>
  );
}

const meta = {
  title: 'Pages/Profile/ProfileEditPage',
  component: ProfileEditPageStory,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof ProfileEditPageStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const General: Story = {
  args: { user: MOCK_USER_GENERAL as unknown as MockUser, hasDartslive: false },
};

export const Pro: Story = {
  args: { user: MOCK_USER_PRO as unknown as MockUser, hasDartslive: false },
};

export const WithDartslive: Story = {
  args: { user: MOCK_USER_PRO as unknown as MockUser, hasDartslive: true },
};
