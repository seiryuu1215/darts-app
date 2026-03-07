import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { TextField, Button, Box, Alert, Typography, Container } from '@mui/material';

function LoginPageStory({ hasError = false }: { hasError?: boolean }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <Container maxWidth="sm">
      <Box
        component="form"
        onSubmit={(e: React.FormEvent) => e.preventDefault()}
        sx={{ maxWidth: 400, mx: 'auto', mt: { xs: 2, sm: 4 }, p: { xs: 2, sm: 3 } }}
      >
        <Typography variant="h5" sx={{ mb: 3, textAlign: 'center' }}>
          ログイン
        </Typography>
        {hasError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            メールアドレスまたはパスワードが正しくありません
          </Alert>
        )}
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
        />
        <Box sx={{ mb: 1, textAlign: 'right' }}>
          <Typography variant="body2" color="primary" sx={{ cursor: 'pointer' }}>
            パスワードを忘れた方
          </Typography>
        </Box>
        <Button type="submit" variant="contained" fullWidth sx={{ mb: 3 }}>
          ログイン
        </Button>
        <Typography variant="body2" textAlign="center">
          アカウントをお持ちでない方は
          <Typography component="span" color="primary" sx={{ cursor: 'pointer' }}>
            新規登録
          </Typography>
        </Typography>
      </Box>
    </Container>
  );
}

const meta = {
  title: 'Pages/Auth/LoginPage',
  component: LoginPageStory,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof LoginPageStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { hasError: false },
};

export const WithError: Story = {
  args: { hasError: true },
};
