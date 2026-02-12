import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'プロフィール',
  description: 'プロフィール編集・LINE連携・サブスクリプション管理。',
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
