# 詳細設計書

## ドキュメント情報

| 項目           | 内容       |
| -------------- | ---------- |
| プロジェクト名 | Darts Lab  |
| バージョン     | 3.0        |
| 最終更新日     | 2026-03-01 |

---

## 1. 画面設計

### 1.1 画面一覧

| #     | 画面名                   | パス                    |    認証     | 概要                                                              |
| ----- | ------------------------ | ----------------------- | :---------: | ----------------------------------------------------------------- |
| S-001 | トップページ             | `/`                     |    不要     | フィーチャーカード、注目ダーツ/記事、ログイン時はスタッツサマリー |
| S-002 | ログイン                 | `/login`                |    不要     | メール/パスワード + Google OAuth                                  |
| S-003 | 新規登録                 | `/register`             |    不要     | アカウント作成フォーム                                            |
| S-004 | セッティング一覧         | `/darts`                |    不要     | カード一覧、フィルタ、検索、おすすめタブ                          |
| S-005 | セッティング詳細         | `/darts/[id]`           |    不要     | スペック詳細、画像、コメント、いいね                              |
| S-006 | セッティング新規作成     | `/darts/new`            |    必要     | パーツ選択フォーム（バレル・チップ・シャフト・フライト）          |
| S-007 | セッティング編集         | `/darts/[id]/edit`      |    必要     | S-006と同一フォーム（既存データプリフィル）                       |
| S-008 | セッティング比較         | `/darts/compare`        |    不要     | 2つのセッティングを横並び比較                                     |
| S-009 | バレル検索               | `/barrels`              |    不要     | スペックフィルタ、ページネーション、ブックマーク                  |
| S-010 | スタッツダッシュボード   | `/stats`                |    必要     | DARTSLIVE風UI、月間グラフ、直近プレイデータ                       |
| S-011 | スタッツ手動入力         | `/stats/new`            |    必要     | 各種スタッツ入力 + DARTSLIVE自動取得ダイアログ                    |
| S-012 | スタッツ編集             | `/stats/[id]/edit`      |    必要     | S-011と同一フォーム + 削除機能                                    |
| S-013 | 記事一覧                 | `/articles`             |    不要     | 記事カード一覧                                                    |
| S-014 | 記事詳細                 | `/articles/[slug]`      |    不要     | Markdownレンダリング                                              |
| S-015 | 記事投稿                 | `/articles/new`         | 必要(pro+)  | Markdown入力フォーム                                              |
| S-016 | 記事編集                 | `/articles/[slug]/edit` | 必要(pro+)  | S-015と同一フォーム                                               |
| S-017 | ブックマーク             | `/bookmarks`            |    必要     | ダーツ/バレルのブックマーク一覧                                   |
| S-018 | プロフィール編集         | `/profile/edit`         |    必要     | ユーザー情報編集                                                  |
| S-019 | リファレンス             | `/reference`            |    不要     | シャフトスペック早見表                                            |
| S-020 | ユーザー管理             | `/admin/users`          | 必要(admin) | ロール変更                                                        |
| S-021 | スタッツカレンダー       | `/stats/calendar`       |    必要     | 月間カレンダー、プレイ日可視化、日別詳細パネル                    |
| S-022 | パスワードリセット       | `/forgot-password`      |    不要     | メールアドレス入力でリセットリンク送信                            |
| S-023 | ショップ管理             | `/shops`                |    必要     | ダーツショップ検索・ブックマーク・地図・路線フィルター            |
| S-024 | ディスカッション一覧     | `/discussions`          |    不要     | カテゴリ別ディスカッション一覧                                    |
| S-025 | ディスカッション詳細     | `/discussions/[id]`     |    不要     | ディスカッション本文 + リプライスレッド                           |
| S-026 | ディスカッション新規作成 | `/discussions/new`      | 必要(pro+)  | ディスカッション投稿フォーム                                      |
| S-027 | 料金プラン               | `/pricing`              |    不要     | Free / Pro プラン比較、Stripe決済                                 |
| S-028 | サブスクリプション管理   | `/profile/subscription` |    必要     | 現在のプラン表示、プラン変更・解約                                |
| S-029 | サイトについて           | `/about`                |    不要     | サービス紹介、開発者情報                                          |
| S-030 | バレルシミュレーター     | `/barrels/simulator`    |    不要     | バレルスペックの仮想シミュレーション                              |
| S-031 | バレル診断クイズ         | `/barrels/quiz`         |    不要     | 質問形式でおすすめバレルを診断                                    |
| S-032 | おすすめバレル           | `/barrels/recommend`    |    不要     | ユーザーのプレイスタイルに基づくバレル推薦                        |
| S-033 | セッティング使用履歴     | `/darts/history`        |    必要     | 過去のセッティング変更履歴タイムライン                            |
| S-034 | レポート                 | `/reports`              |    必要     | 週次・月次レポート自動生成                                        |
| S-035 | ツール                   | `/tools`                |    不要     | ダーツ関連便利ツール集                                            |
| S-036 | ユーザープロフィール     | `/users/[id]`           |    不要     | 公開ユーザープロフィール表示                                      |
| S-037 | 管理: 料金設定           | `/admin/pricing`        | 必要(admin) | プラン料金・機能の管理設定                                        |

### 1.2 画面遷移図

```
トップページ (/)
├── ログイン (/login) ←→ 新規登録 (/register)
│   └── パスワードリセット (/forgot-password)
├── サイトについて (/about)
├── 料金プラン (/pricing)
│   └── Stripe決済 → サブスクリプション管理 (/profile/subscription)
├── セッティング一覧 (/darts)
│   ├── セッティング詳細 (/darts/[id])
│   │   └── セッティング編集 (/darts/[id]/edit) → 詳細に戻る
│   ├── セッティング新規作成 (/darts/new) → 一覧に戻る
│   ├── セッティング比較 (/darts/compare)
│   └── セッティング使用履歴 (/darts/history)
├── バレル検索 (/barrels)
│   ├── バレルシミュレーター (/barrels/simulator)
│   ├── バレル診断クイズ (/barrels/quiz)
│   ├── おすすめバレル (/barrels/recommend)
│   └── [このバレルで下書き作成] → セッティング新規作成
├── スタッツダッシュボード (/stats)
│   ├── スタッツカレンダー (/stats/calendar)
│   │   └── スタッツ編集 (/stats/[id]/edit?from=calendar) → カレンダーに戻る
│   ├── スタッツ手動入力 (/stats/new) → ダッシュボードに戻る
│   └── スタッツ編集 (/stats/[id]/edit) → ダッシュボードに戻る
├── 記事一覧 (/articles)
│   ├── 記事詳細 (/articles/[slug])
│   │   └── 記事編集 (/articles/[slug]/edit)
│   └── 記事投稿 (/articles/new)
├── ディスカッション一覧 (/discussions)
│   ├── ディスカッション詳細 (/discussions/[id])
│   └── ディスカッション新規作成 (/discussions/new)
├── ショップ管理 (/shops)
├── レポート (/reports)
├── ツール (/tools)
├── ブックマーク (/bookmarks)
├── ユーザープロフィール (/users/[id])
├── プロフィール編集 (/profile/edit)
│   └── サブスクリプション管理 (/profile/subscription)
├── リファレンス (/reference)
├── ユーザー管理 (/admin/users)
└── 管理: 料金設定 (/admin/pricing)
```

### 1.3 主要画面のワイヤーフレーム概要

#### S-010: スタッツダッシュボード

`app/stats/page.tsx` はオーケストレーターとして機能し、`AdminApiStatsSection` を中心に `components/stats/` 配下の50以上のコンポーネントにUIを委譲する。各セクションは折りたたみ可能で、コンポーネント単位の表示/非表示トグルを備える（状態はlocalStorageで保持）。各カードには期間フィルター（直近30G / 1ヶ月 / 1週間 / 1日）を提供。

```
┌──────────────────────────────────────────────────┐
│ [DARTSLIVEから取得] ボタン                        │
├──────────────────────────────────────────────────┤
│ セクション折りたたみ + 表示/非表示トグル           │
│ (localStorage保持)                                │
├──────────────────────────────────────────────────┤
│                                                    │
│ ■ 基本情報セクション                               │
│  PlayerProfileCard (通り名・ホームショップ・地図)  │
│  RatingHeroCard (フライト・Rt・進捗バー)          │
│  PeriodStatsPanel (今日/今週/今月/累計タブ)        │
│  GameStatsCards (01/Cri/CU + PercentileChip)      │
│                                                    │
│ ■ AdminApiStatsSection (API連携データ)             │
│  ┌──────────────────────────────────────────────┐ │
│  │                                                │ │
│  │ ◆ AI分析                                      │ │
│  │   PracticeRecommendationsCard                 │ │
│  │                                                │ │
│  │ ◆ スキル分析                                  │ │
│  │   SkillRadarChart                             │ │
│  │   PlayerDnaCard                               │ │
│  │   PerformanceInsightsCard                     │ │
│  │                                                │ │
│  │ ◆ ゲーム詳細                                  │ │
│  │   DetailedGameStatsCard                       │ │
│  │   RatingBenchmarkCard                         │ │
│  │   RatingSimulatorCard                         │ │
│  │                                                │ │
│  │ ◆ 推移・履歴                                  │ │
│  │   RollingTrendCard                            │ │
│  │   PeriodComparisonCard                        │ │
│  │   StreakPatternCard                           │ │
│  │   AwardPaceCard                               │ │
│  │                                                │ │
│  │ ◆ ゲーム分析                                  │ │
│  │   CountUpDeepAnalysisCard                     │ │
│  │   CountUpRoundAnalysisCard                    │ │
│  │   DartboardHeatmap                            │ │
│  │   SessionFatigueCard                          │ │
│  │                                                │ │
│  │ ◆ センサー分析                                │ │
│  │   SensorTrendCard                             │ │
│  │   SpeedAccuracyCard                           │ │
│  │                                                │ │
│  │ ◆ 記録                                        │ │
│  │   GameAveragesCard                            │ │
│  │                                                │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
│ ■ チャート・分析セクション                         │
│  BullStatsCard (D-BULL/S-BULL ドーナツ+バー)      │
│  CountUpDeltaChart (±差分バーチャート)             │
│  ConsistencyCard (COUNT-UP一貫性スコア)            │
│  CountUpAnalysisCard (統計分析+分布グラフ)         │
│  ScoreDistributionCard (スコア分布)                │
│  ZeroOneAnalysisCard (01分析)                      │
│  ZeroOneConsistencyCard (01一貫性)                  │
│  RatingMomentumCard (Rtモメンタム)                 │
│  RatingTargetCard (Rt目標分析)                     │
│  MonthlyTrendChart (Recharts LineChart 12ヶ月)     │
│  DailyHistoryChart (日別推移)                       │
│  AwardTrendChart (アワード推移)                     │
│  RecentGamesChart (ComposedChart + サマリー行)      │
│  RatingTrendCard (AreaChart スパークライン)         │
│  SessionComparisonCard (直近2セッション比較)       │
│  GameMixCard (ゲームミックス分析)                   │
│  ConditionCorrelationCard (コンディション相関)     │
│  SkillRadarChart (PRO簡易5軸 + ベンチマーク)       │
│  BestRecordsCard (自己ベスト記録)                   │
│                                                    │
│ ■ その他セクション                                 │
│  RecentDaySummary (直近プレイ日)                   │
│  AwardsTable (ブル以外のアワード)                  │
│  N01ImportCard (N01データ取り込み)                  │
│  使用中ダーツ                                      │
│  CSVエクスポート                                   │
│  手動記録リンク                                    │
│  PRSiteSection (おすすめブランド3社)               │
│                                                    │
│ [期間フィルター: 直近30G / 1ヶ月 / 1週間 / 1日]   │
└──────────────────────────────────────────────────┘
```

---

## 2. 状態管理設計

### 2.1 方針

| 方針             | 説明                                                            |
| ---------------- | --------------------------------------------------------------- |
| React State中心  | グローバル状態管理ライブラリ（Redux等）は使用しない             |
| ローカルステート | 各ページで `useState` / `useEffect` によるFirestoreデータ取得   |
| セッション       | NextAuth `useSession()` でクライアントサイド認証状態管理        |
| テーマ           | React Context (`Providers.tsx`) でダークモード/ライトモード管理 |

### 2.2 主要な状態の分類

| カテゴリ     | 管理方法                  | スコープ       | 例                                     |
| ------------ | ------------------------- | -------------- | -------------------------------------- |
| 認証状態     | NextAuth SessionProvider  | アプリ全体     | `session.user.id`, `session.user.role` |
| テーマ       | React Context (Providers) | アプリ全体     | `darkMode: boolean`                    |
| ページデータ | useState + useEffect      | ページローカル | ダーツ一覧、バレル検索結果             |
| フォーム入力 | useState                  | コンポーネント | 各入力フィールドの値                   |
| UI状態       | useState                  | コンポーネント | ダイアログ開閉、ローディング、エラー   |
| 永続UI状態   | localStorage              | アプリ全体     | セクション折りたたみ、表示/非表示設定  |

### 2.3 データフェッチパターン

```typescript
// 標準的なFirestoreデータ取得パターン
const [data, setData] = useState<Type[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  if (!session?.user?.id) return;

  const q = query(
    collection(db, 'collectionName'),
    where('userId', '==', session.user.id),
    orderBy('createdAt', 'desc'),
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setData(items);
    setLoading(false);
  });

  return () => unsubscribe();
}, [session?.user?.id]);
```

---

## 3. API設計

### 3.1 エンドポイント一覧

#### API-001: NextAuth 認証

| 項目           | 内容                                             |
| -------------- | ------------------------------------------------ |
| エンドポイント | `/api/auth/[...nextauth]`                        |
| メソッド       | GET, POST                                        |
| 認証           | 不要（認証処理自体）                             |
| 処理           | NextAuth.jsによるセッション管理、JWTの発行・検証 |

#### API-002: DARTSLIVEアカウント連携（自動データ取得）

| 項目           | 内容                                                        |
| -------------- | ----------------------------------------------------------- |
| エンドポイント | `/api/dartslive-stats`                                      |
| メソッド       | POST                                                        |
| 認証           | 必要（NextAuth セッション）                                 |
| タイムアウト   | 60秒 (`maxDuration: 60`)                                    |
| 処理           | DARTSLIVEアカウント連携によるスタッツの自動データ取得・同期 |

**リクエスト:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**レスポンス（成功）:**

```json
{
  "success": true,
  "data": {
    "current": {
      "cardName": "カード名",
      "rating": 10.4,
      "ratingInt": 10,
      "flight": "BB",
      "stats01Avg": 23.45,
      "statsCriAvg": 2.1,
      "statsPraAvg": 521.3,
      "stats01Best": 35.2,
      "statsCriBest": 4.5,
      "statsPraBest": 780,
      "awards": {
        "HAT TRICK": { "monthly": 5, "total": 120 },
        "TON 80": { "monthly": 1, "total": 15 }
      }
    },
    "monthly": {
      "rating": [{ "month": "2025/01", "value": 10.2 }],
      "zeroOne": [{ "month": "2025/01", "value": 22.8 }],
      "cricket": [{ "month": "2025/01", "value": 2.05 }],
      "countUp": [{ "month": "2025/01", "value": 510 }]
    },
    "recentGames": {
      "dayStats": {
        "best01": 30.5,
        "bestCri": 3.2,
        "bestCountUp": 650,
        "avg01": 24.1,
        "avgCri": 2.1,
        "avgCountUp": 520
      },
      "games": [{ "category": "01 GAMES", "scores": [25.3, 22.1, 28.4] }],
      "shops": ["ダーツショップA"]
    },
    "prev": {
      "rating": 10.2,
      "stats01Avg": 22.25,
      "statsCriAvg": 2.05,
      "statsPraAvg": 509.5
    }
  }
}
```

**レスポンス（エラー）:**

```json
{ "error": "ログインに失敗しました。メールアドレスとパスワードを確認してください。" }
```

| ステータス | 説明                                            |
| ---------- | ----------------------------------------------- |
| 200        | 成功                                            |
| 400        | バリデーションエラー（メール/パスワード未入力） |
| 401        | 未ログイン or DARTSLIVEログイン失敗             |
| 500        | データ取得エラー                                |

#### API-003: 画像プロキシ

| 項目             | 内容                                                       |
| ---------------- | ---------------------------------------------------------- |
| エンドポイント   | `/api/proxy-image`                                         |
| メソッド         | GET                                                        |
| 認証             | 不要                                                       |
| クエリパラメータ | `url` - プロキシ対象の画像URL                              |
| 処理             | User-Agentを付与して外部画像を取得し、レスポンスとして返却 |

#### API-004: ユーザーロール更新

| 項目           | 内容                     |
| -------------- | ------------------------ |
| エンドポイント | `/api/admin/update-role` |
| メソッド       | POST                     |
| 認証           | 必要（admin のみ）       |

**リクエスト:**

```json
{
  "userId": "abc123",
  "role": "pro"
}
```

#### API-005: Stripe決済

| 項目           | 内容                                                                |
| -------------- | ------------------------------------------------------------------- |
| エンドポイント | `/api/stripe/checkout`, `/api/stripe/webhook`, `/api/stripe/portal` |
| メソッド       | POST                                                                |
| 認証           | checkout: 必要、webhook: Stripe署名検証、portal: 必要               |

| パス                   | 処理                                                   |
| ---------------------- | ------------------------------------------------------ |
| `/api/stripe/checkout` | Stripeチェックアウトセッション作成、決済フローへ遷移   |
| `/api/stripe/webhook`  | Stripe Webhookイベント受信、サブスクリプション状態同期 |
| `/api/stripe/portal`   | Stripeカスタマーポータルセッション作成                 |

#### API-006: LINE連携

| 項目           | 内容                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------ |
| エンドポイント | `/api/line/webhook`, `/api/line/link`, `/api/line/unlink`, `/api/line/save-dl-credentials` |
| メソッド       | POST                                                                                       |
| 認証           | webhook: LINE署名検証、その他: 必要（NextAuth セッション）                                 |

| パス                            | 処理                                       |
| ------------------------------- | ------------------------------------------ |
| `/api/line/webhook`             | LINE Messaging APIイベント受信・自動応答   |
| `/api/line/link`                | LINEアカウントとユーザーアカウントの紐付け |
| `/api/line/unlink`              | LINE連携の解除                             |
| `/api/line/save-dl-credentials` | DARTSLIVE連携用の認証情報をLINE経由で保存  |

#### API-007: 日次バッチ

| 項目           | 内容                                                    |
| -------------- | ------------------------------------------------------- |
| エンドポイント | `/api/cron/daily-stats`, `/api/cron/dartslive-api-sync` |
| メソッド       | GET                                                     |
| 認証           | Vercel Cron認証（`CRON_SECRET`ヘッダー）                |

| パス                           | 処理                                            |
| ------------------------------ | ----------------------------------------------- |
| `/api/cron/daily-stats`        | 全ユーザーの日次スタッツ集計・サマリー生成      |
| `/api/cron/dartslive-api-sync` | DARTSLIVEアカウント連携ユーザーの自動データ同期 |

#### API-008: 目標管理

| 項目           | 内容                               |
| -------------- | ---------------------------------- |
| エンドポイント | `/api/goals`, `/api/goals/achieve` |
| メソッド       | GET, POST, PUT, DELETE             |
| 認証           | 必要（NextAuth セッション）        |

| パス                 | メソッド | 処理                    |
| -------------------- | -------- | ----------------------- |
| `/api/goals`         | GET      | ユーザーの目標一覧取得  |
| `/api/goals`         | POST     | 新規目標作成            |
| `/api/goals`         | PUT      | 目標更新                |
| `/api/goals`         | DELETE   | 目標削除                |
| `/api/goals/achieve` | POST     | 目標達成の記録 + XP付与 |

#### API-009: XPプログレッション

| 項目           | 内容                                         |
| -------------- | -------------------------------------------- |
| エンドポイント | `/api/progression`                           |
| メソッド       | GET, POST                                    |
| 認証           | 必要（NextAuth セッション）                  |
| 処理           | 経験値の取得・加算、レベル算出、実績解除判定 |

#### API-010: 通知

| 項目           | 内容                        |
| -------------- | --------------------------- |
| エンドポイント | `/api/notifications`        |
| メソッド       | GET, PUT                    |
| 認証           | 必要（NextAuth セッション） |
| 処理           | 通知一覧取得、既読更新      |

#### API-011: スタッツ履歴

| 項目           | 内容                                              |
| -------------- | ------------------------------------------------- |
| エンドポイント | `/api/stats-history`, `/api/stats-history/export` |
| メソッド       | GET, POST                                         |
| 認証           | 必要（NextAuth セッション）                       |

| パス                        | メソッド | 処理                        |
| --------------------------- | -------- | --------------------------- |
| `/api/stats-history`        | GET      | スタッツ履歴の一覧取得      |
| `/api/stats-history`        | POST     | スタッツ履歴の新規登録      |
| `/api/stats-history/export` | GET      | CSV形式でスタッツデータ出力 |

#### API-012: スタッツカレンダー

| 項目           | 内容                                                 |
| -------------- | ---------------------------------------------------- |
| エンドポイント | `/api/stats-calendar`                                |
| メソッド       | GET                                                  |
| 認証           | 必要（NextAuth セッション）                          |
| 処理           | 月間プレイ日・スタッツサマリーをカレンダー形式で返却 |

#### API-013: OGP画像生成

| 項目           | 内容                                                     |
| -------------- | -------------------------------------------------------- |
| エンドポイント | `/api/og`                                                |
| メソッド       | GET                                                      |
| 認証           | 不要                                                     |
| ランタイム     | Edge Runtime                                             |
| 処理           | 動的OGP画像の生成（ユーザー・記事ごとのSNSシェア用画像） |

#### API-014: ショップ

| 項目           | 内容                                                |
| -------------- | --------------------------------------------------- |
| エンドポイント | `/api/shops/fetch-url`, `/api/shops/import-by-line` |
| メソッド       | POST                                                |
| 認証           | 必要（NextAuth セッション）                         |

| パス                        | 処理                                   |
| --------------------------- | -------------------------------------- |
| `/api/shops/fetch-url`      | URL指定でショップ情報を取得・登録      |
| `/api/shops/import-by-line` | 路線指定で沿線ショップを一括インポート |

#### API-015: N01インポート

| 項目           | 内容                                                        |
| -------------- | ----------------------------------------------------------- |
| エンドポイント | `/api/n01-import`                                           |
| メソッド       | POST                                                        |
| 認証           | 必要（NextAuth セッション）                                 |
| 処理           | N01（ダーツ練習アプリ）のデータファイルをパース・インポート |

#### API-016: Admin DARTSLIVEデータ連携

| 項目           | 内容                                                        |
| -------------- | ----------------------------------------------------------- |
| エンドポイント | `/api/admin/dartslive-sync`, `/api/admin/dartslive-history` |
| メソッド       | POST, GET                                                   |
| 認証           | 必要（admin のみ）                                          |

| パス                           | メソッド | 処理                                          |
| ------------------------------ | -------- | --------------------------------------------- |
| `/api/admin/dartslive-sync`    | POST     | 管理者によるDARTSLIVEデータの手動同期トリガー |
| `/api/admin/dartslive-history` | GET      | 自動データ取得の実行履歴・ログ閲覧            |

#### API-017: Push通知

| 項目           | 内容                                       |
| -------------- | ------------------------------------------ |
| エンドポイント | `/api/push-subscription`                   |
| メソッド       | POST, DELETE                               |
| 認証           | 必要（NextAuth セッション）                |
| 処理           | Web Push通知のサブスクリプション登録・解除 |

---

## 4. 認証フロー詳細

### 4.1 ログインフロー（メール/パスワード）

```
1. ユーザーがログインフォームに入力
2. LoginForm → signIn('credentials', { email, password })
3. NextAuth authorize() コールバック:
   a. Firebase Auth: signInWithEmailAndPassword(auth, email, password)
   b. 成功 → Firebase uid 取得
   c. Firestore: doc('users', uid) 取得 → role 取得
   d. adminメールチェック → role='admin' 自動昇格
   e. return { id: uid, email, name, role }
4. NextAuth jwt() コールバック:
   a. token.sub = user.id
   b. token.role = user.role
5. クライアントにJWT Cookieが設定される
6. 以降のリクエストでは useSession() / getServerSession() で認証状態を取得
```

### 4.2 ログインフロー（Google OAuth）

```
1. ユーザーが「Googleでログイン」をクリック
2. Google OAuth画面にリダイレクト
3. 認証完了 → NextAuth signIn() コールバック
4. Firebase Auth にユーザー作成/更新
5. Firestore users/{uid} ドキュメント作成/更新
6. JWT発行 → Cookie設定
```

### 4.3 セッション検証

```typescript
// クライアントサイド
const { data: session, status } = useSession();
if (status === 'unauthenticated') {
  router.push('/login');
}

// サーバーサイド（API Route）
const session = await getServerSession(authOptions);
if (!session?.user?.id) {
  return NextResponse.json({ error: '未ログインです' }, { status: 401 });
}
```

### 4.4 ロールベースアクセス制御

```typescript
// 管理者チェック（API Route）
if (session.user.role !== 'admin') {
  return NextResponse.json({ error: '権限がありません' }, { status: 403 });
}

// 記事投稿権限チェック（クライアント）
if (session?.user?.role !== 'pro' && session?.user?.role !== 'admin') {
  router.push('/');
}
```

---

## 5. コンポーネント設計

### 5.1 コンポーネントツリー（主要部分）

```
RootLayout (app/layout.tsx)
└── Providers (SessionProvider + ThemeProvider)
    ├── Header
    │   ├── PC: AppBar + Navigation Links
    │   ├── Mobile: Drawer + Menu Items
    │   ├── NotificationBell
    │   └── UserAvatar + Logout
    ├── [Page Content]
    │   ├── DartsPage
    │   │   ├── SearchBar + Filters
    │   │   └── DartCard[] (grid)
    │   ├── DartDetailPage
    │   │   ├── DartDetail (specs + images)
    │   │   ├── CommentList
    │   │   └── CommentForm
    │   ├── DartFormPage (new/edit)
    │   │   └── DartForm
    │   │       ├── BarrelSection (brand, specs, cut[])
    │   │       ├── TipSection (presets + custom)
    │   │       ├── ShaftSection (presets + custom)
    │   │       ├── FlightSection (presets + CONDOR AXE)
    │   │       └── ImageUpload
    │   ├── StatsPage (orchestrator, components/stats/ に委譲)
    │   │   ├── StatsPageContent (メインコンテンツ)
    │   │   ├── PlayerProfileCard (通り名・ホームショップ・Google Maps)
    │   │   ├── RatingHeroCard (flight-colored + PercentileChip)
    │   │   ├── PeriodStatsPanel (今日/今週/今月/累計タブ)
    │   │   ├── GameStatsCards (01/Cri/CU + PercentileChip)
    │   │   ├── AdminApiStatsSection (API連携データセクション)
    │   │   │   ├── PracticeRecommendationsCard (AI練習提案)
    │   │   │   ├── SkillRadarChart (スキルレーダー)
    │   │   │   ├── PlayerDnaCard (プレイヤーDNA)
    │   │   │   ├── PerformanceInsightsCard (パフォーマンス洞察)
    │   │   │   ├── DetailedGameStatsCard (ゲーム詳細統計)
    │   │   │   ├── RatingBenchmarkCard (Rtベンチマーク)
    │   │   │   ├── RatingSimulatorCard (Rtシミュレーター)
    │   │   │   ├── RollingTrendCard (移動平均トレンド)
    │   │   │   ├── PeriodComparisonCard (期間比較)
    │   │   │   ├── StreakPatternCard (連続パターン)
    │   │   │   ├── AwardPaceCard (アワードペース)
    │   │   │   ├── CountUpDeepAnalysisCard (CU深掘り分析)
    │   │   │   ├── CountUpRoundAnalysisCard (CUラウンド分析)
    │   │   │   ├── DartboardHeatmap (ダーツボードヒートマップ)
    │   │   │   ├── SessionFatigueCard (セッション疲労分析)
    │   │   │   ├── SensorTrendCard (センサートレンド)
    │   │   │   ├── SpeedAccuracyCard (速度-精度分析)
    │   │   │   └── GameAveragesCard (ゲーム平均記録)
    │   │   ├── BullStatsCard (D-BULL/S-BULL ドーナツ+バー)
    │   │   ├── CountUpDeltaChart (±差分バーチャート)
    │   │   ├── ConsistencyCard (COUNT-UP一貫性スコア)
    │   │   ├── CountUpAnalysisCard (統計分析+分布グラフ)
    │   │   ├── ScoreDistributionCard (スコア分布)
    │   │   ├── ZeroOneAnalysisCard (01分析)
    │   │   ├── ZeroOneConsistencyCard (01一貫性)
    │   │   ├── RatingMomentumCard (Rtモメンタム)
    │   │   ├── RatingTargetCard (Rt目標分析)
    │   │   ├── MonthlyTrendChart (Recharts LineChart)
    │   │   ├── DailyHistoryChart (日別推移)
    │   │   ├── AwardTrendChart (アワード推移)
    │   │   ├── RecentGamesChart (ComposedChart)
    │   │   ├── BestRecordsCard (自己ベスト記録)
    │   │   ├── RecentDaySummary (直近プレイ日)
    │   │   ├── AwardsTable (ブル以外のアワード)
    │   │   ├── N01ImportCard (N01データ取り込み)
    │   │   ├── PercentileChip (再利用可能な上位X%バッジ)
    │   │   ├── PRSiteSection (おすすめブランド3社)
    │   │   └── StatsLoginDialog (DARTSLIVE連携ダイアログ)
    │   ├── StatsCalendarPage
    │   │   ├── CalendarGrid (月表示・日選択)
    │   │   └── DayDetailPanel (選択日の詳細)
    │   ├── BarrelsPage
    │   │   ├── FilterPanel
    │   │   └── BarrelCard[] (grid)
    │   ├── ShopsPage (components/shops/)
    │   │   ├── ShopCard (ショップカード)
    │   │   ├── ShopBookmarkDialog (ブックマークダイアログ)
    │   │   ├── ShopListDialog (リスト管理)
    │   │   ├── ShopListChips (リストフィルターチップ)
    │   │   ├── ShopViewToggle (リスト/マップ切替)
    │   │   ├── ShopMapView (地図表示)
    │   │   ├── LineImportDialog (路線インポート)
    │   │   └── TagManageDialog (タグ管理)
    │   ├── DiscussionsPage (components/discussions/)
    │   │   ├── CategoryTabs (カテゴリタブ)
    │   │   ├── DiscussionCard (ディスカッションカード)
    │   │   ├── ReplyList (リプライ一覧)
    │   │   └── ReplyForm (リプライ投稿)
    │   ├── GoalSection (components/goals/)
    │   │   ├── GoalCard (目標カード)
    │   │   ├── GoalSettingDialog (目標設定)
    │   │   └── GoalAchievedDialog (目標達成演出)
    │   ├── ReportsPage (components/reports/)
    │   │   ├── WeeklyReportCard (週次レポート)
    │   │   └── MonthlyReportCard (月次レポート)
    │   ├── ProgressionWidgets (components/progression/)
    │   │   ├── XpBar (経験値バー)
    │   │   ├── XpHistoryList (XP履歴)
    │   │   ├── AchievementList (実績一覧)
    │   │   └── LevelUpSnackbar (レベルアップ通知)
    │   ├── NotificationWidgets (components/notifications/)
    │   │   ├── NotificationBell (通知ベル)
    │   │   ├── XpNotificationDialog (XP獲得通知)
    │   │   └── PushOptIn (Push通知オプトイン)
    │   └── AffiliateWidgets (components/affiliate/)
    │       ├── AffiliateBanner (アフィリエイトバナー)
    │       └── AffiliateButton (アフィリエイトボタン)
    └── Footer
```

### 5.2 主要コンポーネントの責務

| コンポーネント                | 責務                           | props/state                                                                                                                                                         |
| ----------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DartForm`                    | セッティング入力の全管理       | 15+ state variables (barrel, tip, shaft, flight specs)                                                                                                              |
| `DartCard`                    | セッティング一覧のカード表示   | `dart: Dart`, `onLike`, `isLiked`, `isBookmarked`                                                                                                                   |
| `BarrelCard`                  | バレル製品カード               | `barrel: BarrelProduct`, `isBookmarked`, `onBookmark`                                                                                                               |
| `CommentList`                 | コメント一覧の表示・削除       | `dartId`, `comments[]`, `currentUserId`                                                                                                                             |
| `Providers`                   | テーマ・セッション提供         | `children`, `darkMode` context                                                                                                                                      |
| `PlayerProfileCard`           | DARTSLIVEプロフィール表示      | `cardName`, `toorina`, `homeShop`, `cardImageUrl`, `flightColor`                                                                                                    |
| `RatingHeroCard`              | レーティング+フライト+進捗バー | `rating`, `ratingPrev`, `flight`, `flightColor`, `streak`                                                                                                           |
| `PeriodStatsPanel`            | 期間別スタッツ集計表示         | `periodTab`, `summary`, `records`, `loading`                                                                                                                        |
| `GameStatsCards`              | 3カテゴリスタッツカード        | `stats01Avg`, `statsCriAvg`, `statsPraAvg` + prev + percentile                                                                                                      |
| `AdminApiStatsSection`        | API連携データのセクション管理  | `apiData`, セクション折りたたみ状態                                                                                                                                 |
| `PracticeRecommendationsCard` | AI練習メニュー提案             | `stats`, `games`                                                                                                                                                    |
| `SkillRadarChart`             | スキルレーダー（詳細+簡易）    | 詳細: `stats01`, `statsCricket`, `flight?`。簡易: `simpleMode`, `stats01Avg`, `statsCriAvg`, `statsPraAvg`, `dBullTotal`, `sBullTotal`, `countUpScores?`, `flight?` |
| `PlayerDnaCard`               | プレイヤーDNA可視化            | `dnaData`, `flightColor`                                                                                                                                            |
| `DetailedGameStatsCard`       | 01/Cri/CU詳細統計              | `detailedStats`                                                                                                                                                     |
| `RatingBenchmarkCard`         | フライト別ベンチマーク比較     | `rating`, `flight`, `benchmarks`                                                                                                                                    |
| `RatingSimulatorCard`         | Rt変動シミュレーション         | `currentRating`, `games`                                                                                                                                            |
| `RollingTrendCard`            | 移動平均トレンドライン         | `trendData`, `period`                                                                                                                                               |
| `PeriodComparisonCard`        | 期間比較（前週比等）           | `currentPeriod`, `previousPeriod`                                                                                                                                   |
| `CountUpDeepAnalysisCard`     | COUNT-UP深掘り分析             | `games`                                                                                                                                                             |
| `DartboardHeatmap`            | ダーツボードヒートマップ       | `hitData`                                                                                                                                                           |
| `SensorTrendCard`             | センサーデータ推移             | `sensorData`                                                                                                                                                        |
| `GameAveragesCard`            | ゲーム平均記録一覧             | `averages`                                                                                                                                                          |
| `RatingTrendCard`             | Rtトレンドスパークライン       | `periodRecords`, `currentRating`                                                                                                                                    |
| `SessionComparisonCard`       | 直近2セッション比較            | `periodRecords`                                                                                                                                                     |
| `CountUpAnalysisCard`         | CU統計分析+Rt期待値メトリクス  | `games`, `expectedCountUp?`                                                                                                                                         |
| `RecentGamesChart`            | 直近ゲーム+サマリー行          | `games`, `gameChartCategory`, `onCategoryChange`, `expectedCountUp`, `dangerCountUp`, `excellentCountUp`                                                            |
| `ShopCard`                    | ショップ情報カード             | `shop`, `isBookmarked`, `isVisited`, `tags`                                                                                                                         |
| `ShopBookmarkDialog`          | ショップブックマーク管理       | `shop`, `lists`, `onSave`                                                                                                                                           |
| `DiscussionCard`              | ディスカッションカード表示     | `discussion`, `replyCount`                                                                                                                                          |
| `GoalCard`                    | 目標進捗カード                 | `goal`, `onAchieve`, `onEdit`                                                                                                                                       |
| `XpBar`                       | 経験値プログレスバー           | `currentXp`, `level`, `nextLevelXp`                                                                                                                                 |
| `NotificationBell`            | ヘッダー通知アイコン           | `unreadCount`, `onClick`                                                                                                                                            |
| `WeeklyReportCard`            | 週次レポートカード             | `reportData`, `weekRange`                                                                                                                                           |
| `MonthlyReportCard`           | 月次レポートカード             | `reportData`, `month`                                                                                                                                               |
| `CalendarGrid`                | カレンダー月表示・日選択       | `year`, `month`, `records`, `selectedDate`, `onSelectDate`                                                                                                          |
| `DayDetailPanel`              | 選択日の詳細スタッツ表示       | `date`, `records`                                                                                                                                                   |

---

## 6. セキュリティ設計

> 詳細なセキュリティレビュー（全17観点・評価A-）は **[05-security-review.md](./05-security-review.md)** を参照。

**サマリー:**

| レイヤー | 主要対策 |
|---|---|
| フロントエンド | React自動エスケープ、CSP nonce方式、CSRF保護 |
| API | 認証ミドルウェア (`withAuth`/`withAdmin`)、Upstash Redis レートリミット |
| Webhook | Stripe署名検証 + LINE HMAC-SHA256 timingSafeEqual |
| DB | Firestoreルール（ロール昇格防止、フィールド制限）、Storage型制限+5MB |
| DL連携 | メモリ一時利用 or AES-256-GCM暗号化、ブラウザ即時破棄 |
| インフラ | セキュリティヘッダー7種、SSRF防止ホワイトリスト |

---

## 7. エラーハンドリング設計

### 7.1 エラー分類

| レベル           | 例                              | ハンドリング                             |
| ---------------- | ------------------------------- | ---------------------------------------- |
| バリデーション   | 必須項目未入力                  | Alert コンポーネントでインライン表示     |
| 認証エラー       | 未ログイン、権限不足            | ログインページへリダイレクト             |
| API通信エラー    | ネットワーク障害                | 「通信エラーが発生しました」トースト表示 |
| Firestoreエラー  | 権限不足、ドキュメント未存在    | エラーメッセージ表示 + コンソールログ    |
| データ取得エラー | 外部サービス変更・タイムアウト  | 詳細エラーメッセージ + サーバーログ      |
| 決済エラー       | Stripe決済失敗、Webhook処理失敗 | エラーメッセージ表示 + リトライ案内      |

### 7.2 エラーメッセージ方針

- ユーザー向けメッセージは日本語で簡潔に
- 技術的詳細はサーバーログ（`console.error`）に出力
- セキュリティ上、スタックトレースはクライアントに返さない
