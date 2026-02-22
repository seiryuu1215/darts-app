import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'パスワードリセット',
  description: 'パスワードをリセットするためのメールを送信します。',
};

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
