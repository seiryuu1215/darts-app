# Darts Lab - アーキテクチャ設計書

## インタラクティブ設計図

以下の6つのインタラクティブ設計図をポートフォリオサイトで公開しています。
クリック操作で詳細表示・タブ切替が可能な SVG ベースの設計図です。

**[設計図ビューア → https://portfolio-seiryuu.vercel.app/projects/darts-lab](https://portfolio-seiryuu.vercel.app/projects/darts-lab)**

| 設計図 | 内容 |
|---|---|
| 📐 アーキテクチャ | Client → Vercel → Firebase → 外部サービスの全体構成 |
| 🗄️ ER図 | Firestore 12コレクション + 11サブコレクション + リレーション |
| 🔐 認証・課金 | NextAuth JWT フロー / Stripe Webhook / LINE連携 |
| ⏰ Cronバッチ | 日次自動パイプライン（9ステップ + XPルール14種） |
| 📱 画面遷移 | 30+ページ × ロール別アクセス制御 |
| 🔄 API・データフロー | 25+ APIルート / セキュリティレイヤー |

## コンポーネント構成

```
components/
├── layout/                    # レイアウト
│   ├── Header.tsx             # AppBar + ナビ + ドロップダウンメニュー
│   ├── Footer.tsx             # 4カラムリッチフッター
│   ├── TwoColumnLayout.tsx    # PC: メイン+サイドバー / モバイル: 1カラム
│   ├── Sidebar.tsx            # 人気バレル・新着記事・最新ディスカッション・ショップバナー
│   └── Breadcrumbs.tsx        # パンくずナビ
├── shops/                     # マイショップ
│   ├── ShopCard.tsx           # ショップカード（台数・タグ・お気に入り・メモ表示）
│   ├── ShopBookmarkDialog.tsx # ショップ追加/編集ダイアログ（URL自動取得対応）
│   ├── ShopListDialog.tsx     # リスト作成/編集ダイアログ
│   ├── ShopListChips.tsx      # リストフィルターChipバー
│   ├── ShopMapView.tsx        # Google Maps表示
│   ├── ShopViewToggle.tsx     # リスト/マップ表示切替
│   ├── TagManageDialog.tsx    # タグ管理ダイアログ
│   └── LineImportDialog.tsx   # 路線一括インポートダイアログ
├── affiliate/                 # アフィリエイト
│   ├── AffiliateButton.tsx    # 複数ショップドロップダウン購入ボタン
│   └── AffiliateBanner.tsx    # ショップバナー
├── darts/                     # セッティング
│   ├── DartCard.tsx           # セッティングカード
│   ├── DartCardSkeleton.tsx   # ローディングスケルトン
│   ├── DartDetail.tsx         # セッティング詳細 + 購入導線
│   └── DartForm.tsx           # 登録・編集フォーム
├── barrels/                   # バレル
│   ├── BarrelCard.tsx         # バレル商品カード + アフィリエイトボタン
│   ├── BarrelCardSkeleton.tsx # ローディングスケルトン
│   ├── BarrelSimulator.tsx    # 実寸スケールバレル比較シミュレーター
│   └── BarrelQuiz.tsx         # 6ステップ診断クイズ (MUI Stepper)
├── discussions/               # ディスカッション（掲示板）
│   ├── DiscussionCard.tsx     # スレッド一覧カード（カテゴリ・Rt・返信数）
│   ├── CategoryTabs.tsx       # カテゴリフィルタータブ
│   ├── ReplyForm.tsx          # 返信投稿フォーム
│   └── ReplyList.tsx          # 返信一覧（Rt バッジ付き）
├── articles/                  # 記事
│   ├── ArticleCard.tsx        # 記事一覧カード
│   └── MarkdownContent.tsx    # Markdown レンダラー
├── auth/                      # 認証
│   ├── LoginForm.tsx          # ログインフォーム
│   └── RegisterForm.tsx       # 新規登録フォーム
├── comment/                   # コメント
│   ├── CommentForm.tsx
│   └── CommentList.tsx
├── stats/                     # スタッツダッシュボード（53コンポーネント）
│   ├── PlayerProfileCard.tsx  # プレイヤープロフィール（通り名・ホームショップ・Google Maps連携）
│   ├── RatingHeroCard.tsx     # レーティング + フライト + 進捗バー + パーセンタイル
│   ├── PeriodStatsPanel.tsx   # 期間タブ（今日/今週/今月/累計）+ サマリーテーブル
│   ├── GameStatsCards.tsx     # 01/Cricket/COUNT-UP 3カード（パーセンタイル付き）
│   ├── BullStatsCard.tsx      # ブル累計表示 + ドーナツチャート + 月間バーチャート
│   ├── CountUpDeltaChart.tsx  # カウントアップ ±差分バーチャート（緑/赤色分け）
│   ├── RatingTargetCard.tsx   # レーティング目標分析
│   ├── MonthlyTrendChart.tsx  # 月間推移グラフ
│   ├── RecentGamesChart.tsx   # 直近ゲーム結果チャート
│   ├── RecentDaySummary.tsx   # 直近プレイ日サマリー
│   ├── AwardsTable.tsx        # アワードテーブル
│   ├── PercentileChip.tsx     # 上位X%バッジ（再利用可能）
│   ├── PRSiteSection.tsx      # おすすめブランドPRカード
│   ├── StatsLoginDialog.tsx   # DARTSLIVE ログインダイアログ
│   ├── CalendarGrid.tsx       # カレンダー月表示（CSS Grid、コンディション色ドット）
│   ├── DayDetailPanel.tsx     # 日別詳細パネル（Rating/PPD/MPR + メモ + 課題）
│   ├── AdminApiStatsSection.tsx # DARTSLIVE API連携スタッツ（折りたたみ・表示切替対応）
│   ├── SkillRadarChart.tsx    # スキルレーダーチャート
│   ├── PlayerDnaCard.tsx      # プレイヤーDNA
│   ├── PracticeRecommendationsCard.tsx # AI練習レコメンデーション
│   ├── PerformanceInsightsCard.tsx # パフォーマンスインサイト
│   ├── DetailedGameStatsCard.tsx # 詳細ゲームスタッツ
│   ├── RatingBenchmarkCard.tsx # レーティングベンチマーク
│   ├── RatingSimulatorCard.tsx # レーティングシミュレーター
│   ├── RollingTrendCard.tsx   # 移動平均トレンド
│   ├── PeriodComparisonCard.tsx # 期間比較
│   ├── StreakPatternCard.tsx  # 連勝パターン
│   ├── AwardPaceCard.tsx      # アワードペース
│   ├── CountUpDeepAnalysisCard.tsx # COUNT-UP深掘り分析
│   ├── CountUpRoundAnalysisCard.tsx # ラウンド分析
│   ├── DartboardHeatmap.tsx   # ダーツボードヒートマップ（期間フィルター対応）
│   ├── SessionFatigueCard.tsx # セッション疲労分析（期間フィルター対応）
│   ├── SensorTrendCard.tsx    # センサー推移
│   ├── SpeedAccuracyCard.tsx  # スピード精度
│   ├── GameAveragesCard.tsx   # ゲーム別平均
│   ├── RatingTrendCard.tsx    # レーティングトレンド（スパークライン付き）
│   ├── AwardPaceSimpleCard.tsx # アワードペース予測（簡易版）
│   ├── GameMixCard.tsx        # ゲームミックス分析
│   ├── ConditionCorrelationCard.tsx # コンディション×パフォーマンス相関
│   └── SessionComparisonCard.tsx # セッション比較（直近2回）
├── progression/               # 経験値・レベル
│   ├── XpBar.tsx              # XPプログレスバー
│   ├── LevelUpSnackbar.tsx    # レベルアップ通知
│   ├── XpHistoryList.tsx      # XP履歴
│   └── AchievementList.tsx    # 実績一覧
├── notifications/             # 通知
│   ├── NotificationBell.tsx   # 通知ベル
│   ├── PushOptIn.tsx          # プッシュ通知オプトイン
│   └── XpNotificationDialog.tsx # XP通知ダイアログ
├── reports/                   # レポート
│   ├── WeeklyReportCard.tsx   # 週次レポート
│   └── MonthlyReportCard.tsx  # 月次レポート
├── OnboardingDialog.tsx       # 初回ログイン時のオンボーディング
├── ProPaywall.tsx             # PRO アップグレード誘導
├── UserAvatar.tsx             # DiceBear アバター
└── Providers.tsx              # SessionProvider + ThemeProvider
```

## 技術スタック詳細

| カテゴリ       | 技術                          | 用途                                               |
| -------------- | ----------------------------- | -------------------------------------------------- |
| フレームワーク | Next.js 16 (App Router)       | SSR/SSG + API Routes                               |
| 言語           | TypeScript 5 (strict)         | 型安全なフルスタック開発                           |
| UI             | React 19 + MUI v7             | コンポーネントライブラリ                           |
| CSS            | Tailwind CSS v4               | ユーティリティCSS                                  |
| 認証           | NextAuth.js 4 + Firebase Auth | JWT + ロールベースアクセス制御                     |
| データベース   | Cloud Firestore               | NoSQL リアルタイムDB                               |
| ストレージ     | Firebase Storage              | 画像アップロード                                   |
| 決済           | Stripe                        | サブスクリプション + Webhook                       |
| グラフ         | Recharts 3                    | スタッツ可視化                                     |
| 外部データ連携 | Puppeteer 24                  | DARTSLIVE 自動データ取得                           |
| メッセージング | LINE Messaging API            | スタッツ通知 + アカウント連携                      |
| エラー監視     | Sentry                        | 例外追跡 + エラーレポート                          |
| テスト         | Vitest                        | ユニット / 統合テスト                              |
| フォーマッター | Prettier                      | コードフォーマット                                 |
| CI             | GitHub Actions                | lint / format / test / build                       |
| PWA            | Serwist (@serwist/next)       | Service Worker + キャッシュ戦略                    |
| ホスティング   | Vercel                        | Edge Network + Serverless                          |
| IaC            | Firebase CLI                  | firestore.rules / storage.rules 管理               |
| アフィリエイト | 6ショップ                     | A8.net / エスダーツ / MAXIM / TiTO / 楽天 / Amazon |

## 環境変数一覧

| 変数                                 | 種類 | 説明                                       |
| ------------------------------------ | ---- | ------------------------------------------ |
| `NEXT_PUBLIC_FIREBASE_*`             | 公開 | Firebase クライアントSDK設定               |
| `NEXTAUTH_SECRET`                    | 秘密 | JWT署名キー                                |
| `NEXTAUTH_URL`                       | 設定 | アプリURL                                  |
| `ADMIN_EMAIL`                        | 設定 | 管理者メールアドレス                       |
| `FIREBASE_SERVICE_ACCOUNT_KEY`       | 秘密 | Firebase Admin SDK サービスアカウント JSON |
| `STRIPE_SECRET_KEY`                  | 秘密 | Stripe シークレットキー                    |
| `STRIPE_WEBHOOK_SECRET`              | 秘密 | Stripe Webhook 署名シークレット            |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | 公開 | Stripe 公開キー                            |
| `LINE_CHANNEL_SECRET`                | 秘密 | LINE Messaging API チャネルシークレット    |
| `LINE_CHANNEL_ACCESS_TOKEN`          | 秘密 | LINE チャネルアクセストークン              |
| `SENTRY_DSN`                         | 設定 | Sentry エラー監視用 DSN                    |
| `NEXT_PUBLIC_RAKUTEN_AFFILIATE_ID`   | 公開 | 楽天アフィリエイトID                       |
| `NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG`   | 公開 | Amazonアソシエイトタグ                     |
| `NEXT_PUBLIC_A8_MEDIA_ID`            | 公開 | A8.net メディアID                          |
| `UPSTASH_REDIS_REST_URL`             | 秘密 | Upstash Redis REST API URL                 |
| `UPSTASH_REDIS_REST_TOKEN`           | 秘密 | Upstash Redis REST API トークン            |
| `ENCRYPTION_KEY`                     | 秘密 | AES-256-GCM 暗号化キー                     |
| `CRON_SECRET`                        | 秘密 | Cron ジョブ認証シークレット                |
| `VAPID_PUBLIC_KEY`                   | 公開 | Web Push VAPID 公開鍵                      |
| `VAPID_PRIVATE_KEY`                  | 秘密 | Web Push VAPID 秘密鍵                      |
| `SENTRY_AUTH_TOKEN`                  | 秘密 | Sentry 認証トークン（ソースマップ等）      |

## アフィリエイトフロー

6ショップのアフィリエイト導線の詳細は [設計図ビューア「API・データフロー」タブ](https://portfolio-seiryuu.vercel.app/projects/darts-lab) を参照。

- `lib/affiliate.ts` — `getShopLinks(barrel)` で6ショップのURLを生成
- `AffiliateButton.tsx` — ドロップダウンで購入先選択
- 対象: A8.net(ダーツハイブ) / エスダーツ / MAXIM / TiTO / 楽天 / Amazon

## セキュリティ設計

### 認証・認可

- **デュアル認証**: NextAuth.js JWT + Firebase Auth
- **ロールベースアクセス制御**: admin / pro / general の3段階
- **権限管理**: `lib/permissions.ts` による一元的なロール判定
- **API ミドルウェア**: `lib/api-middleware.ts` で認証・権限・エラーハンドリングを共通化

### Firestore セキュリティ

- **フィールドレベル制限**: ユーザーが `role`・`stripeCustomerId`・`subscriptionId` 等を自己変更できないよう制限
- **replyCount 不正操作防止**: 更新は `+1` のみ許可
- **dartsliveCache**: Admin SDK のみアクセス可（クライアント `read/write: false`）
- **stripeEvents / lineConversations / lineLinkCodes**: Admin SDK 限定コレクション

### Storage セキュリティ（`storage.rules`）

- 画像のみ許可（jpeg / png / gif / webp）、5MB 制限
- パス別権限: `darts/{userId}` / `avatars/{userId}` は本人のみ書込、`articles/` は admin のみ
- デフォルト拒否（未定義パスは `read/write: false`）

### API セキュリティ

- **レートリミット**: Upstash Redis によるIPベース分散レートリミット（60 req/min）
- **Stripe Webhook**: 署名検証 + イベント重複排除（stripeEvents コレクション）
- **LINE Webhook**: `crypto.timingSafeEqual` によるタイミングセーフ HMAC 検証
- **SSRF 防止**: OG 画像生成でドメインホワイトリスト（`firebasestorage.googleapis.com` のみ）
- **画像プロキシ**: HTTPS のみ許可、SVG ブロック（XSS 防止）
- **CSV インジェクション防止**: スタッツエクスポート時に数式プレフィックス文字をエスケープ

### その他

- **DARTSLIVE 認証情報**: オンデマンド時はメモリ一時利用、Cron時はAES-256-GCM暗号化保存
- **環境変数管理**: 秘密情報は `.env.local` に分離、Git 管理外
- **エラー監視**: Sentry による例外追跡（全 API ルートで `Sentry.captureException`）
- **セキュリティヘッダー**: HSTS, X-Frame-Options, CSP 相当（Vercel 設定）
- **アフィリエイトID**: クライアント公開（`NEXT_PUBLIC_`）だが、IDのみで秘密情報ではない
