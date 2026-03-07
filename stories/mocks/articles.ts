import type { Article } from '@/types';
import { daysAgo, sampleMarkdown, placeholderImage } from './factories';

type MockArticle = Omit<Article, 'createdAt' | 'updatedAt'> & {
  id: string;
  createdAt: ReturnType<typeof daysAgo>;
  updatedAt: ReturnType<typeof daysAgo>;
};

export const MOCK_ARTICLE: MockArticle = {
  id: 'article_001',
  slug: 'how-to-improve-rating',
  title: 'レーティングを効率的に上げる5つの練習法',
  content: sampleMarkdown(),
  coverImageUrl: placeholderImage(800, 400),
  tags: ['練習法', 'レーティング', '初心者向け'],
  isDraft: false,
  isFeatured: true,
  articleType: 'article',
  userId: 'admin_001',
  userName: '管理者',
  createdAt: daysAgo(30),
  updatedAt: daysAgo(5),
};

export const MOCK_ARTICLE_NO_IMAGE: MockArticle = {
  id: 'article_002',
  slug: 'barrel-weight-guide',
  title: 'バレル重量の選び方ガイド',
  content: `## バレル重量の選び方\n\n初心者からプロまで、適切なバレル重量の選び方を解説します。\n\n### 軽量バレル（16-18g）\n\nコントロール重視。力のない方や、繊細なリリースを求める方に。\n\n### 標準（18-20g）\n\n最もポピュラーな重量帯。多くのプロも使用。\n\n### 重量級（20-24g）\n\n飛びが安定しやすい。パワースローの方に最適。`,
  coverImageUrl: null,
  tags: ['バレル', '機材選び'],
  isDraft: false,
  isFeatured: false,
  articleType: 'article',
  userId: 'admin_001',
  userName: '管理者',
  createdAt: daysAgo(60),
  updatedAt: daysAgo(60),
};

export const MOCK_ARTICLE_DRAFT: MockArticle = {
  ...MOCK_ARTICLE,
  id: 'article_003',
  slug: 'draft-article',
  title: '下書き記事: CRICKETの戦略',
  isDraft: true,
  isFeatured: false,
};

export const MOCK_ARTICLE_ABOUT: MockArticle = {
  id: 'article_about',
  slug: 'about',
  title: 'Darts Labについて',
  content: `## Darts Labとは\n\nDarts Labは、ダーツプレイヤーのためのオールインワンプラットフォームです。\n\n### 主な機能\n\n- **セッティング管理**: マイダーツの構成をパーツ単位で記録・共有\n- **スタッツ分析**: DARTSLIVE連携で自動取得、推移グラフ表示\n- **バレルDB**: 1,000以上のバレルを検索・比較\n- **コミュニティ**: セッティング相談、練習法の共有`,
  coverImageUrl: null,
  tags: [],
  isDraft: false,
  isFeatured: false,
  articleType: 'page',
  userId: 'admin_001',
  userName: '管理者',
  createdAt: daysAgo(180),
  updatedAt: daysAgo(10),
};

export const MOCK_ARTICLES_LIST: MockArticle[] = [
  MOCK_ARTICLE,
  MOCK_ARTICLE_NO_IMAGE,
  {
    ...MOCK_ARTICLE,
    id: 'article_004',
    slug: 'count-up-tips',
    title: 'COUNT-UP 700点超えのコツ',
    tags: ['COUNT-UP', '練習法'],
    isFeatured: false,
    createdAt: daysAgo(15),
    updatedAt: daysAgo(15),
  },
  {
    ...MOCK_ARTICLE_NO_IMAGE,
    id: 'article_005',
    slug: 'flight-shape-guide',
    title: 'フライト形状による飛び方の違い',
    tags: ['フライト', '機材選び'],
    createdAt: daysAgo(45),
    updatedAt: daysAgo(45),
  },
];
