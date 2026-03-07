import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { TextField, Button, Box, Alert, Typography } from '@mui/material';

function ForgotPasswordPageStory({ variant = 'form' }: { variant?: 'form' | 'sent' | 'error' }) {
  const [email, setEmail] = useState('');

  if (variant === 'sent') {
    return (
      <Box sx={{ maxWidth: 400, mx: 'auto', mt: { xs: 2, sm: 4 }, p: { xs: 2, sm: 3 } }}>
        <Typography variant="h5" sx={{ mb: 3, textAlign: 'center' }}>
          メールを送信しました
        </Typography>
        <Alert severity="success" sx={{ mb: 3 }}>
          パスワードリセット用のメールを送信しました。メールに記載されたリンクからパスワードを再設定してください。
        </Alert>
        <Typography variant="body2" textAlign="center" color="primary" sx={{ cursor: 'pointer' }}>
          ログインページに戻る
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      component="form"
      onSubmit={(e: React.FormEvent) => e.preventDefault()}
      sx={{ maxWidth: 400, mx: 'auto', mt: { xs: 2, sm: 4 }, p: { xs: 2, sm: 3 } }}
    >
      <Typography variant="h5" sx={{ mb: 1, textAlign: 'center' }}>
        パスワードリセット
      </Typography>
      <Typography variant="body2" sx={{ mb: 3, textAlign: 'center', color: 'text.secondary' }}>
        登録済みのメールアドレスを入力してください。パスワードリセット用のメールをお送りします。
      </Typography>
      {variant === 'error' && (
        <Alert severity="error" sx={{ mb: 2 }}>
          メールの送信に失敗しました。メールアドレスをご確認ください。
        </Alert>
      )}
      <TextField
        label="メールアドレス"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        fullWidth
        required
        sx={{ mb: 3 }}
      />
      <Button type="submit" variant="contained" fullWidth sx={{ mb: 3 }}>
        リセットメールを送信
      </Button>
      <Typography variant="body2" textAlign="center" color="primary" sx={{ cursor: 'pointer' }}>
        ログインページに戻る
      </Typography>
    </Box>
  );
}

const meta = {
  title: 'Pages/Auth/ForgotPasswordPage',
  component: ForgotPasswordPageStory,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof ForgotPasswordPageStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Form: Story = {
  args: { variant: 'form' },
};

export const EmailSent: Story = {
  args: { variant: 'sent' },
};

export const WithError: Story = {
  args: { variant: 'error' },
};
