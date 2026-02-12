# タスク分解（開発チェックリスト）

## ドキュメント情報

| 項目           | 内容       |
| -------------- | ---------- |
| プロジェクト名 | Darts App  |
| 作成日         | 2025-02-09 |

---

## Phase 1: プロジェクト基盤構築

### 1.1 環境セットアップ

- [x] Next.js 16 プロジェクト作成（App Router）
- [x] TypeScript 設定
- [x] MUI v7 + Emotion 導入
- [x] Tailwind CSS v4 導入
- [x] Firebase SDK 導入（Auth / Firestore / Storage）
- [x] NextAuth.js 導入
- [x] ESLint 設定
- [x] `.env.local` に環境変数設定
- [x] `.gitignore` 設定（`.env.local`, `node_modules`, `.next` 等）

### 1.2 共通基盤

- [x] 型定義（`types/index.ts`）— User, Dart, Barrel, Comment, Article, DartsLiveStats
- [x] NextAuth 型拡張（`types/next-auth.d.ts`）
- [x] Firebase Client SDK 初期化（`lib/firebase.ts`）
- [x] Firebase Admin SDK 初期化（`lib/firebase-admin.ts`）
- [x] NextAuth 設定（`lib/auth.ts`）— CredentialsProvider + JWT
- [x] テーマプロバイダー（`components/Providers.tsx`）— ダークモード対応
- [x] ルートレイアウト（`app/layout.tsx`）

---

## Phase 2: 認証・ユーザー管理

### 2.1 認証

- [x] ログインページ（`app/login/page.tsx`）
- [x] ログインフォーム（`components/auth/LoginForm.tsx`）— メール/パスワード + Google OAuth
- [x] 新規登録ページ（`app/register/page.tsx`）
- [x] 登録フォーム（`components/auth/RegisterForm.tsx`）
- [x] NextAuth API Route（`app/api/auth/[...nextauth]/route.ts`）
- [x] ロールベースアクセス制御（admin / pro / general）

### 2.2 ユーザープロフィール

- [x] プロフィール編集ページ（`app/profile/edit/page.tsx`）
- [x] アバター表示コンポーネント（`components/UserAvatar.tsx`）

---

## Phase 3: セッティング管理（コア機能）

### 3.1 パーツマスタデータ

- [x] チップ プリセット定義（`lib/darts-parts.ts` — 49製品）
- [x] シャフト プリセット定義（8製品）
- [x] フライト プリセット定義（13製品 + CONDOR AXE 7種）
- [x] カットタイプ定義（18種類）
- [x] スペック計算ロジック（`lib/calc-totals.ts`）

### 3.2 セッティングCRUD

- [x] セッティング登録フォーム（`components/darts/DartForm.tsx`）
  - [x] バレル入力セクション（ブランド・重量・径・長さ・カット複数選択）
  - [x] チップ入力セクション（プリセット選択 + カスタム入力）
  - [x] シャフト入力セクション（プリセット選択 + カスタム入力）
  - [x] フライト入力セクション（プリセット + CONDOR AXE 対応）
  - [x] 画像アップロード（最大3枚）
  - [x] 下書きモード
- [x] セッティング新規作成ページ（`app/darts/new/page.tsx`）
- [x] セッティング編集ページ（`app/darts/[id]/edit/page.tsx`）
- [x] セッティングカードコンポーネント（`components/darts/DartCard.tsx`）
- [x] セッティング詳細コンポーネント（`components/darts/DartDetail.tsx`）

### 3.3 セッティング一覧・検索

- [x] セッティング一覧ページ（`app/darts/page.tsx`）
  - [x] ブランド・カット・種別フィルタ
  - [x] テキスト検索
  - [x] おすすめタブ
- [x] レコメンドエンジン（`lib/recommend-barrels.ts`）

### 3.4 ソーシャル機能

- [x] いいね機能（Firestore `dartLikes` サブコレクション）
- [x] ブックマーク機能（`dartBookmarks` サブコレクション）
- [x] コメント一覧（`components/comment/CommentList.tsx`）
- [x] コメント投稿（`components/comment/CommentForm.tsx`）
- [x] ブックマーク一覧ページ（`app/bookmarks/page.tsx`）

### 3.5 セッティング比較

- [x] 比較ページ（`app/darts/compare/page.tsx`）
- [x] 差分カラー表示（`lib/comparison.ts`）

---

## Phase 4: バレルデータベース

- [x] バレルデータインポートスクリプト（`scripts/seed-darts.ts` 等）
- [x] バレルカードコンポーネント（`components/barrels/BarrelCard.tsx`）
- [x] バレル検索ページ（`app/barrels/page.tsx`）
  - [x] ブランド・重量・径・長さ・カットフィルタ
  - [x] ページネーション（30件/ページ）
  - [x] バレルブックマーク
  - [x] 「このバレルで下書き作成」機能

---

## Phase 5: スタッツ記録

### 5.1 手動入力

- [x] スタッツ入力ページ（`app/stats/new/page.tsx`）
- [x] スタッツ編集ページ（`app/stats/[id]/edit/page.tsx`）
- [x] Firestore `dartsLiveStats` サブコレクション

### 5.2 DARTSLIVE連携

- [x] スクレイピングAPIルート（`app/api/dartslive-stats/route.ts`）
  - [x] DARTSLIVEログイン処理
  - [x] 現在スタッツ取得（Rating, 01, Cricket, COUNT-UP, Awards）
  - [x] 月間推移データ取得（12ヶ月 × 4カテゴリ）
  - [x] 直近プレイデータ取得
- [x] Firebase Admin SDK によるキャッシュ保存
- [x] 自動取得ダイアログ（フォーム自動入力）

### 5.3 スタッツダッシュボード

- [x] ダッシュボードページ（`app/stats/page.tsx`）
  - [x] DARTSLIVE風UI（フライトカラー、カテゴリカラー）
  - [x] Rating Hero Card（フライト階級バッジ）
  - [x] 3カテゴリカード（01=赤, Cricket=青, CU=緑）
  - [x] 前回比±表示（DiffLabel）
  - [x] 月間推移 LineChart（4タブ切替）
  - [x] 直近プレイ ComposedChart
  - [x] Awards テーブル
  - [x] 使用中ダーツ表示

### 5.4 トップページ連携

- [x] スタッツサマリーカード（`app/page.tsx`）
- [x] `dartsliveCache/latest` からの読み込み

---

## Phase 6: 記事・コンテンツ

- [x] 記事一覧ページ（`app/articles/page.tsx`）
- [x] 記事詳細ページ（`app/articles/[slug]/page.tsx`）
- [x] 記事投稿ページ（`app/articles/new/page.tsx`）
- [x] 記事編集ページ（`app/articles/[slug]/edit/page.tsx`）
- [x] 記事カードコンポーネント（`components/articles/ArticleCard.tsx`）
- [x] Markdownレンダリング（`components/articles/MarkdownContent.tsx`）

---

## Phase 7: その他の機能

- [x] リファレンスページ — シャフト早見表（`app/reference/page.tsx`）
- [x] 画像プロキシAPI（`app/api/proxy-image/route.ts`）
- [x] ヘッダーナビゲーション（`components/layout/Header.tsx`）
- [x] フッター（`components/layout/Footer.tsx`）

---

## Phase 8: 管理機能

- [x] ユーザー管理ページ（`app/admin/users/page.tsx`）
- [x] ロール更新API（`app/api/admin/update-role/route.ts`）

---

## Phase 9: セキュリティ・本番準備

- [x] `serverExternalPackages` 設定（Puppeteer, Firebase Admin）
- [ ] Firestore セキュリティルールの見直し・強化
- [ ] `.env.example` 作成（秘密情報を除いたテンプレート）
- [ ] `docs/test-accounts.md` を `.gitignore` に追加（またはテスト用に差し替え）
- [ ] 本番用環境変数の整理（Vercel Dashboard）
- [ ] 画像アップロードのファイルサイズ制限確認
- [ ] DARTSLIVE スクレイピングのレート制限検討
- [ ] エラーログの適切な出力（秘密情報のログ出力防止）

---

## Phase 10: デプロイ・公開

- [ ] GitHub リポジトリ作成
- [ ] `.gitignore` の最終確認
- [ ] 機能単位でのコミット整理
- [ ] README.md 作成（ポートフォリオ向け）
- [ ] Vercel プロジェクト作成・GitHub連携
- [ ] Vercel 環境変数設定
- [ ] 本番デプロイ・動作確認
- [ ] Firestore インデックス作成（必要に応じて）

---

## 備考

- Phase 1〜8 は実装完了済み
- Phase 9〜10 が残タスク（本セッションで対応中）
