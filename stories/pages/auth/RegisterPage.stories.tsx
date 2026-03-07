import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { TextField, Button, Box, Alert, Typography, Container } from '@mui/material';

function RegisterPageStory({
  hasError = false,
  isDisabled = false,
}: {
  hasError?: boolean;
  isDisabled?: boolean;
}) {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (isDisabled) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ maxWidth: 400, mx: 'auto', mt: { xs: 2, sm: 4 }, p: { xs: 2, sm: 3 } }}>
          <Typography variant="h5" sx={{ mb: 3, textAlign: 'center' }}>
            新規登録
          </Typography>
          <Alert severity="info" sx={{ mb: 3 }}>
            現在新規登録を停止しています。
          </Alert>
          <Typography variant="body2" textAlign="center">
            アカウントをお持ちの方は
            <Typography component="span" color="primary" sx={{ cursor: 'pointer' }}>
              ログイン
            </Typography>
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box
        component="form"
        onSubmit={(e: React.FormEvent) => e.preventDefault()}
        sx={{ maxWidth: 400, mx: 'auto', mt: { xs: 2, sm: 4 }, p: { xs: 2, sm: 3 } }}
      >
        <Typography variant="h5" sx={{ mb: 3, textAlign: 'center' }}>
          新規登録
        </Typography>
        {hasError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            登録に失敗しました
          </Alert>
        )}
        <TextField
          label="表示名"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          fullWidth
          required
          sx={{ mb: 2 }}
        />
        <TextField
          label="メールアドレス"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          fullWidth
          required
          sx={{ mb: 2 }}
        />
        <TextField
          label="パスワード"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          fullWidth
          required
          sx={{ mb: 3 }}
          inputProps={{ minLength: 6 }}
        />
        <Button type="submit" variant="contained" fullWidth sx={{ mb: 2 }}>
          登録
        </Button>
        <Typography variant="body2" textAlign="center">
          アカウントをお持ちの方は
          <Typography component="span" color="primary" sx={{ cursor: 'pointer' }}>
            ログイン
          </Typography>
        </Typography>
      </Box>
    </Container>
  );
}

const meta = {
  title: 'Pages/Auth/RegisterPage',
  component: RegisterPageStory,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof RegisterPageStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { hasError: false, isDisabled: false },
};

export const WithError: Story = {
  args: { hasError: true, isDisabled: false },
};

export const RegistrationDisabled: Story = {
  args: { isDisabled: true },
};
