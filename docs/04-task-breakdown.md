# タスク分解（開発チェックリスト）

## ドキュメント情報

| 項目           | 内容       |
| -------------- | ---------- |
| プロジェクト名 | Darts Lab  |
| 最終更新日     | 2026-02-23 |

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

- [x] 自動データ取得APIルート（`app/api/dartslive-stats/route.ts`）
  - [x] DARTSLIVEログイン処理
  - [x] 現在スタッツ取得（Rating, 01, Cricket, COUNT-UP, Awards）
  - [x] 月間推移データ取得（12ヶ月 × 4カテゴリ）
  - [x] 直近プレイデータ取得
- [x] Firebase Admin SDK によるキャッシュ保存
- [x] 自動取得ダイアログ（フォーム自動入力）

### 5.3 スタッツダッシュボード

- [x] ダッシュボードページ（`app/stats/page.tsx`）— オーケストレーター（約295行）
  - [x] DARTSLIVE風UI（フライトカラー、カテゴリカラー）
  - [x] Rating Hero Card（フライト階級バッジ）
  - [x] 3カテゴリカード（01=赤, Cricket=青, CU=緑）
  - [x] 前回比±表示（DiffLabel）
  - [x] 月間推移 LineChart（4タブ切替）
  - [x] 直近プレイ ComposedChart
  - [x] Awards テーブル
  - [x] 使用中ダーツ表示
  - [x] **コンポーネント分割（1608行→14コンポーネント + 295行オーケストレーター）**
  - [x] PlayerProfileCard（通り名・ホームショップ・Google Maps連携）
  - [x] PeriodStatsPanel（今日/今週/今月/累計タブ）
  - [x] BullStatsCard（D-BULL/S-BULL 累計 + ドーナツチャート + 月間バーチャート）
  - [x] CountUpDeltaChart（COUNT-UP ±差分バーチャート、緑/赤色分け）
  - [x] PercentileChip（上位X%バッジ — Rating/PPD/MPR/COUNT-UP）
  - [x] PRSiteSection（おすすめブランド3社 — JOKER DRIVER / JD ULTIMATE / POINT ARM）
  - [x] `lib/dartslive-percentile.ts`（パーセンタイル分布データ + 推定関数）

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

## Phase 7: その他の基盤機能

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

- [x] `serverExternalPackages` 設定（サーバーサイドブラウザ自動化, Firebase Admin）
- [x] Firestore セキュリティルールの見直し・強化
- [x] 本番用環境変数の整理（Vercel Dashboard）
- [x] 画像アップロードのファイルサイズ制限確認
- [x] 自動データ取得のレート制限検討
- [x] エラーログの適切な出力（秘密情報のログ出力防止）

---

## Phase 10: デプロイ・公開

- [x] GitHub リポジトリ作成
- [x] `.gitignore` の最終確認
- [x] 機能単位でのコミット整理
- [x] README.md 作成（ポートフォリオ向け）
- [x] Vercel プロジェクト作成・GitHub連携
- [x] Vercel 環境変数設定
- [x] 本番デプロイ・動作確認
- [x] Firestore インデックス作成（必要に応じて）

---

## Phase 11: ディスカッション（掲示板）

- [x] ディスカッション一覧ページ（`app/discussions/page.tsx`）
- [x] ディスカッション詳細ページ（`app/discussions/[id]/page.tsx`）
- [x] ディスカッション新規作成（`app/discussions/new/page.tsx`）
- [x] カテゴリタブ、返信機能、レーティングバッジ

---

## Phase 12: ショップ管理

- [x] ショップ一覧ページ（`app/shops/page.tsx`）
- [x] ショップブックマーク機能（リスト分類、タグ、メモ、評価）
- [x] 路線フィルター（`lib/line-stations.ts`）
- [x] 訪問済み/未訪問フィルター
- [x] 禁煙/分煙フィルター
- [x] URL自動取得（`app/api/shops/fetch-url`）
- [x] 路線一括インポート（`app/api/shops/import-by-line`）

---

## Phase 13: DARTSLIVE API連携 + 高度スタッツ分析

- [x] DARTSLIVE API連携（`lib/dartslive-api.ts`）
- [x] 管理者用API同期（`app/api/admin/dartslive-sync`）
- [x] 高度スタッツ分析（46コンポーネント in `components/stats/`）
  - [x] スキルレーダー、プレイヤーDNA、パフォーマンスインサイト
  - [x] レーティングベンチマーク、レーティングシミュレーター
  - [x] 移動平均トレンド、期間比較、連勝パターン、アワードペース
  - [x] COUNT-UP深掘り分析、ラウンド分析、ダーツボードヒートマップ、セッション疲労分析
  - [x] センサー推移、スピード精度
  - [x] AI練習レコメンデーション
  - [x] コンポーネント単位の表示/非表示トグル（localStorage保持）

---

## Phase 14: Stripe決済

- [x] Stripe Checkout（`app/api/stripe/checkout`）
- [x] Stripe Portal（`app/api/stripe/portal`）
- [x] Stripe Webhook + 冪等性（`app/api/stripe/webhook`）
- [x] 料金プランページ（`app/pricing/page.tsx`）
- [x] サブスクリプション管理（`app/profile/subscription/page.tsx`）
- [x] 管理者用料金プラン管理（`app/admin/pricing/page.tsx`）

---

## Phase 15: LINE連携

- [x] LINE Webhook（`app/api/line/webhook`）
- [x] アカウント連携/解除（`app/api/line/link`, `unlink`）
- [x] DL認証情報保存（AES-256-GCM暗号化）
- [x] 日次スタッツ通知、コンディション記録

---

## Phase 16: XP/レベル/ランク/実績システム

- [x] XPエンジン（`lib/progression/xp-engine.ts`）
- [x] XPルール定義（`lib/progression/xp-rules.ts`）
- [x] ランク定義（`lib/progression/ranks.ts`）
- [x] 実績システム（`lib/progression/achievements.ts`）
- [x] マイルストーン（`lib/progression/milestones.ts`）
- [x] XpBar、LevelUpSnackbar、AchievementList コンポーネント

---

## Phase 17: 目標管理

- [x] 目標CRUD API（`app/api/goals/`）
- [x] GoalSection, GoalCard, GoalSettingDialog, GoalAchievedDialog
- [x] 目標自動達成判定（Cronバッチ連携）

---

## Phase 18: 通知システム

- [x] NotificationBell, PushOptIn コンポーネント
- [x] Push通知API（`app/api/push-subscription`）
- [x] XpNotificationDialog

---

## Phase 19: 定期バッチ処理（Cron）

- [x] 日次スタッツ自動取得（`app/api/cron/daily-stats`）
- [x] DARTSLIVE API同期（`app/api/cron/dartslive-api-sync`）
- [x] XP自動付与、実績チェック、目標自動達成
- [x] 週次/月次レポート LINE配信

---

## Phase 20: バレル拡張

- [x] バレルシミュレーター（`app/barrels/simulator/page.tsx`）
- [x] バレル診断クイズ（`app/barrels/quiz/page.tsx`）
- [x] おすすめバレル（`app/barrels/recommend/page.tsx`）

---

## Phase 21: その他の機能

- [x] スタッツカレンダー（`app/stats/calendar/page.tsx`）
- [x] レポートページ（`app/reports/page.tsx`）
- [x] ツールページ（`app/tools/page.tsx`）
- [x] N01インポート（`app/api/n01-import`）
- [x] アカウント削除（`app/api/account/delete`）
- [x] OGP画像生成（`app/api/og`）
- [x] PWA対応（Service Worker）
- [x] iOSネイティブアプリ（Capacitor）
- [x] セキュリティヘッダー（CSP nonce方式含む7種）
- [x] Sentry エラー監視
- [x] About、Privacy、Terms ページ

---

## Phase 22: UI改善・最適化

- [x] セクション折りたたみ機能（localStorageで状態保持）
- [x] コンポーネント単位の表示/非表示トグル
- [x] 期間フィルター追加（ヒートマップ、セッション疲労分析）
- [x] COUNT-UP平均の直近30G制限
- [x] アウターシングル除外モード

---

## 備考

- Phase 1〜22 は実装完了済み。継続的に機能追加・改善中。
