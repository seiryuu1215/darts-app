import { Timestamp } from 'firebase/firestore';

/** 指定日数前のTimestampを生成 */
export function daysAgo(days: number): Timestamp {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return Timestamp.fromDate(d);
}

/** 現在のTimestampを生成 */
export function now(): Timestamp {
  return Timestamp.fromDate(new Date());
}

/** テスト用の固定Timestamp */
export function mockTimestamp(dateStr: string): Timestamp {
  return Timestamp.fromDate(new Date(dateStr));
}

/** テスト用のID生成 */
let idCounter = 0;
export function mockId(prefix = 'mock'): string {
  return `${prefix}_${String(++idCounter).padStart(4, '0')}`;
}

/** IDカウンターリセット（テスト用） */
export function resetIdCounter(): void {
  idCounter = 0;
}

/** テスト用のセッション */
export function mockSession(
  overrides: {
    role?: 'admin' | 'pro' | 'general';
    id?: string;
    name?: string;
    email?: string;
  } = {},
) {
  return {
    user: {
      id: overrides.id ?? 'user_001',
      name: overrides.name ?? 'テストユーザー',
      email: overrides.email ?? 'test@example.com',
      role: overrides.role ?? 'general',
      subscriptionStatus: overrides.role === 'pro' ? ('active' as const) : null,
    },
    expires: new Date(Date.now() + 86400000).toISOString(),
  };
}

/** テスト用のProセッション */
export function mockProSession() {
  return mockSession({ role: 'pro', name: 'PROユーザー', email: 'pro@example.com' });
}

/** テスト用のAdminセッション */
export function mockAdminSession() {
  return mockSession({
    role: 'admin',
    id: 'admin_001',
    name: '管理者',
    email: 'admin@example.com',
  });
}

/** ランダムな日本語ユーザー名 */
const NAMES = [
  'ダーツ太郎',
  'ブル職人',
  'CU700',
  'トリプル狙い',
  'フェニックス使い',
  'レーティング8',
  'クリケットマスター',
  '初心者ダーツ',
];

export function randomUserName(index = 0): string {
  return NAMES[index % NAMES.length];
}

/** ダミー画像URL */
export function placeholderImage(width = 400, height = 300): string {
  return `https://placehold.co/${width}x${height}`;
}

/** ダミーアバターURL */
export function placeholderAvatar(seed = 'user'): string {
  return `https://placehold.co/100x100?text=${encodeURIComponent(seed.charAt(0).toUpperCase())}`;
}

/** テスト用のマークダウンコンテンツ */
export function sampleMarkdown(): string {
  return `## テスト記事

これはテスト用のマークダウンコンテンツです。

### セクション1

ダーツの練習方法について解説します。

- ポイント1: フォームを安定させる
- ポイント2: 毎日練習する
- ポイント3: 目標を設定する

### セクション2

> レーティングを上げるにはCOUNT-UPで700点を目指しましょう。

\`\`\`
PPD = COUNT-UP / 8ラウンド
Rating ≈ PPD × 0.5
\`\`\`
`;
}
