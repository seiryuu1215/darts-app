import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'おすすめ外部ツール',
  description:
    'Darts Labと併用すると便利な無料ダーツツールまとめ。n01・Pro Darter・Dartore・MyDartTraining。',
};

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
