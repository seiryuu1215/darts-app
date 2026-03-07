import type { Discussion, DiscussionReply } from '@/types';
import { daysAgo, placeholderAvatar } from './factories';

type MockDiscussion = Omit<Discussion, 'createdAt' | 'updatedAt' | 'lastRepliedAt'> & {
  id: string;
  createdAt: ReturnType<typeof daysAgo>;
  updatedAt: ReturnType<typeof daysAgo>;
  lastRepliedAt: ReturnType<typeof daysAgo> | null;
};

type MockReply = Omit<DiscussionReply, 'createdAt'> & {
  id: string;
  createdAt: ReturnType<typeof daysAgo>;
};

export const MOCK_DISCUSSION: MockDiscussion = {
  id: 'disc_001',
  title: 'Rt.8からRt.10に上がるためのセッティング相談',
  content:
    '現在BBフライトで伸び悩んでいます。バレルの買い替えを検討中ですが、どんなスペックを重視すべきでしょうか？\n\n現在のセッティング:\n- バレル: TARGET RISING SUN 20g\n- シャフト: L-Shaft 260\n- フライト: L-Flight PRO カイト',
  category: 'setting',
  userId: 'user_001',
  userName: 'ダーツ太郎',
  userAvatarUrl: placeholderAvatar('太'),
  userRating: 8,
  userBarrelName: 'RISING SUN 6.0',
  isPinned: false,
  isLocked: false,
  replyCount: 3,
  lastRepliedAt: daysAgo(1),
  createdAt: daysAgo(5),
  updatedAt: daysAgo(1),
};

export const MOCK_DISCUSSION_PINNED: MockDiscussion = {
  id: 'disc_002',
  title: '【公式】掲示板の利用ルールについて',
  content:
    'コミュニティガイドラインです。\n\n1. 他のユーザーへの敬意を持ちましょう\n2. スパム投稿は禁止です\n3. 個人情報の投稿はしないでください',
  category: 'general',
  userId: 'admin_001',
  userName: '管理者',
  userAvatarUrl: placeholderAvatar('A'),
  userRating: null,
  userBarrelName: null,
  isPinned: true,
  isLocked: false,
  replyCount: 0,
  lastRepliedAt: null,
  createdAt: daysAgo(90),
  updatedAt: daysAgo(90),
};

export const MOCK_DISCUSSION_LOCKED: MockDiscussion = {
  id: 'disc_003',
  title: '解決済み: カウントアップで安定しないときの対処法',
  content: 'カウントアップで点数が安定しません。500〜650の間をウロウロしています。',
  category: 'practice',
  userId: 'user_002',
  userName: 'PROプレイヤー',
  userAvatarUrl: placeholderAvatar('P'),
  userRating: 12,
  userBarrelName: 'Solo G3',
  isPinned: false,
  isLocked: true,
  replyCount: 8,
  lastRepliedAt: daysAgo(10),
  createdAt: daysAgo(30),
  updatedAt: daysAgo(10),
};

export const MOCK_DISCUSSIONS_LIST: MockDiscussion[] = [
  MOCK_DISCUSSION_PINNED,
  MOCK_DISCUSSION,
  MOCK_DISCUSSION_LOCKED,
  {
    ...MOCK_DISCUSSION,
    id: 'disc_004',
    title: 'おすすめのストレートバレルを教えてください',
    category: 'barrel',
    replyCount: 5,
    lastRepliedAt: daysAgo(2),
    createdAt: daysAgo(7),
    updatedAt: daysAgo(2),
  },
  {
    ...MOCK_DISCUSSION,
    id: 'disc_005',
    title: 'シャフトの長さで飛びが変わるのか',
    category: 'gear',
    replyCount: 12,
    lastRepliedAt: daysAgo(0),
    createdAt: daysAgo(3),
    updatedAt: daysAgo(0),
  },
];

export const MOCK_REPLIES: MockReply[] = [
  {
    id: 'reply_001',
    userId: 'user_002',
    userName: 'PROプレイヤー',
    userAvatarUrl: placeholderAvatar('P'),
    userRating: 12,
    userBarrelName: 'Solo G3',
    text: 'Rt.8からなら、まずは練習量を増やすことをおすすめします。セッティングの変更は最小限にして、フォームの安定を目指しましょう。',
    createdAt: daysAgo(4),
  },
  {
    id: 'reply_002',
    userId: 'user_099',
    userName: 'ブル職人',
    userAvatarUrl: null,
    userRating: 14,
    userBarrelName: 'RAPIER',
    text: '自分もRt.8の壁を経験しました。カウントアップで700超えを安定して出せるようになるまでは、セッティングを変えない方がいいですよ。',
    createdAt: daysAgo(3),
  },
  {
    id: 'reply_003',
    userId: 'user_001',
    userName: 'ダーツ太郎',
    userAvatarUrl: placeholderAvatar('太'),
    userRating: 8,
    userBarrelName: 'RISING SUN 6.0',
    text: 'ありがとうございます！まずは練習量を増やしてフォーム固めに集中してみます。',
    createdAt: daysAgo(2),
  },
];
