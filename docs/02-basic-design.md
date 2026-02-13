# 基本設計書

## ドキュメント情報

| 項目           | 内容                                      |
| -------------- | ----------------------------------------- |
| プロジェクト名 | Darts App（ダーツセッティング管理アプリ） |
| バージョン     | 1.0                                       |
| 作成日         | 2025-02-09                                |

---

## 1. システム構成図

```
┌─────────────────────────────────────────────────────────┐
│                      クライアント                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │              Next.js App Router (React 19)         │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │  │
│  │  │ MUI v7   │ │ Recharts │ │ Tailwind CSS v4  │  │  │
│  │  └──────────┘ └──────────┘ └──────────────────┘  │  │
│  └───────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS
┌──────────────────────▼──────────────────────────────────┐
│                    Vercel Platform                       │
│  ┌───────────────┐  ┌────────────────────────────────┐  │
│  │  Edge Network  │  │  Serverless Functions           │  │
│  │  (CDN/SSR)     │  │  ┌──────────────────────────┐  │  │
│  │               │  │  │ API Routes               │  │  │
│  │               │  │  │  /api/auth/[...nextauth] │  │  │
│  │               │  │  │  /api/dartslive-stats    │  │  │
│  │               │  │  │  /api/proxy-image        │  │  │
│  │               │  │  │  /api/admin/update-role  │  │  │
│  │               │  │  └──────────────────────────┘  │  │
│  └───────────────┘  └────────────────────────────────┘  │
└──────────┬──────────────────┬───────────────────────────┘
           │                  │
     ┌─────▼─────┐    ┌──────▼──────────┐
     │ Firebase   │    │ 外部サービス      │
     │ ┌────────┐ │    │ ┌──────────────┐ │
     │ │  Auth  │ │    │ │ DARTSLIVE    │ │
     │ ├────────┤ │    │ │ card.dartslive│ │
     │ │Firestore│ │    │ │ .com         │ │
     │ ├────────┤ │    │ └──────────────┘ │
     │ │Storage │ │    │ ┌──────────────┐ │
     │ └────────┘ │    │ │ Google OAuth │ │
     └────────────┘    │ └──────────────┘ │
                       └─────────────────┘
```

---

## 2. アーキテクチャ方針

### 2.1 全体方針

| 方針                           | 説明                                                                |
| ------------------------------ | ------------------------------------------------------------------- |
| サーバーレス                   | Vercel Serverless Functions + Firebase でインフラ管理不要           |
| クライアントサイドレンダリング | 'use client' コンポーネント中心。認証状態に依存するページが多いため |
| BaaS活用                       | Firebase (Auth/Firestore/Storage) でバックエンド実装を最小化        |
| 型安全                         | TypeScript による型定義の一元管理                                   |

### 2.2 レイヤー構成

```
┌─────────────────────────────────────┐
│  プレゼンテーション層                  │
│  app/          → ページコンポーネント  │
│  components/   → 再利用UIコンポーネント │
├─────────────────────────────────────┤
│  ビジネスロジック層                    │
│  lib/          → ユーティリティ・計算   │
│  app/api/      → サーバーサイド処理     │
├─────────────────────────────────────┤
│  データアクセス層                      │
│  lib/firebase.ts       → Client SDK  │
│  lib/firebase-admin.ts → Admin SDK   │
├─────────────────────────────────────┤
│  型定義層                             │
│  types/        → 共通型定義            │
└─────────────────────────────────────┘
```

---

## 3. 技術選定と理由

### 3.1 フレームワーク・言語

| 技術           | バージョン | 選定理由                                                                       |
| -------------- | ---------- | ------------------------------------------------------------------------------ |
| **Next.js**    | 16.1       | App Router による直感的なルーティング、Vercel との親和性、SSR/SSG の柔軟な選択 |
| **React**      | 19         | コンポーネントベースUI、豊富なエコシステム、Server Components対応              |
| **TypeScript** | 5          | 型安全によるバグ防止、IDE補完、リファクタリング容易性                          |

### 3.2 UIライブラリ

| 技術                  | バージョン | 選定理由                                                                           |
| --------------------- | ---------- | ---------------------------------------------------------------------------------- |
| **MUI (Material UI)** | 7          | 豊富なコンポーネント群、テーマカスタマイズ、ダークモード対応、日本語入力との親和性 |
| **Tailwind CSS**      | 4          | ユーティリティベースの迅速なスタイリング、MUI と併用でレイアウト調整に利用         |
| **Emotion**           | 11         | MUI のCSS-in-JSエンジン（MUI依存）                                                 |

### 3.3 バックエンド・データベース

| 技術                   | バージョン | 選定理由                                                                                                            |
| ---------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------- |
| **Firebase Auth**      | 12         | メール/パスワード + Google OAuth の統合認証基盤、NextAuth.jsとの連携実績                                            |
| **Cloud Firestore**    | 12         | NoSQLでスキーマレス、リアルタイム対応、セキュリティルールによるアクセス制御、サブコレクションによる柔軟なデータ設計 |
| **Firebase Storage**   | 12         | 画像アップロード、CDN配信、セキュリティルール                                                                       |
| **Firebase Admin SDK** | 13         | サーバーサイドでのFirestoreアクセス（セキュリティルールバイパス）                                                   |

### 3.4 認証

| 技術            | バージョン | 選定理由                                                                                               |
| --------------- | ---------- | ------------------------------------------------------------------------------------------------------ |
| **NextAuth.js** | 4          | Next.js標準の認証ライブラリ、JWT/Session管理、複数プロバイダ対応、ロールベースアクセス制御の実装容易性 |

### 3.5 データ可視化

| 技術         | バージョン | 選定理由                                                                                        |
| ------------ | ---------- | ----------------------------------------------------------------------------------------------- |
| **Recharts** | 3          | React向け軽量チャートライブラリ、レスポンシブ対応、LineChart/BarChart/ComposedChartの豊富な種類 |

### 3.6 その他

| 技術               | バージョン | 用途・選定理由                                            |
| ------------------ | ---------- | --------------------------------------------------------- |
| **Puppeteer**      | 24         | DARTSLIVEサイトのWebスクレイピング（公式API非公開のため） |
| **react-markdown** | 10         | 記事コンテンツのMarkdownレンダリング（GFM対応）           |
| **Sharp**          | 0.34       | サーバーサイド画像最適化                                  |

---

## 4. データベース設計

### 4.1 Firestore コレクション構造

```
Firestore Root
│
├── users/{userId}
│   │  displayName: string
│   │  email: string
│   │  photoURL: string | null
│   │  avatarUrl: string | null
│   │  height: number | null
│   │  fourStanceType: "A1" | "A2" | "B1" | "B2" | null
│   │  throwingImage: string | null
│   │  dominantEye: string | null
│   │  gripType: string | null
│   │  role: "admin" | "pro" | "general"
│   │  activeSoftDartId: string | null
│   │  activeSteelDartId: string | null
│   │  createdAt: Timestamp
│   │  updatedAt: Timestamp
│   │
│   ├── barrelBookmarks/{barrelId}
│   │     barrelId: string
│   │     createdAt: Timestamp
│   │
│   ├── dartBookmarks/{dartId}
│   │     dartId: string
│   │     createdAt: Timestamp
│   │
│   ├── dartLikes/{dartId}
│   │     dartId: string
│   │     createdAt: Timestamp
│   │
│   ├── dartsLiveStats/{docId}
│   │     date: Timestamp
│   │     rating: number
│   │     gamesPlayed: number
│   │     zeroOneStats: { ppd, avg, highOff }
│   │     cricketStats: { mpr, highScore }
│   │     bullRate: number | null
│   │     hatTricks: number | null
│   │     condition: 1-5
│   │     memo: string
│   │     createdAt: Timestamp
│   │     updatedAt: Timestamp
│   │
│   └── dartsliveCache/latest
│         rating, ratingInt, flight, cardName
│         stats01Avg, statsCriAvg, statsPraAvg
│         prevRating, prevStats01Avg, prevStatsCriAvg, prevStatsPraAvg
│         updatedAt: Timestamp
│
├── darts/{dartId}
│     userId: string
│     userName: string
│     userAvatarUrl: string | null
│     title: string
│     barrel: { name, brand, weight, maxDiameter, length, cut }
│     tip: { name, type, lengthMm, weightG }
│     shaft: { name, lengthMm, weightG }
│     flight: { name, shape, weightG, isCondorAxe, condorAxeShaftLengthMm }
│     imageUrls: string[]
│     description: string
│     likeCount: number
│     isDraft: boolean
│     sourceBarrelId: string | null
│     createdAt: Timestamp
│     updatedAt: Timestamp
│
├── comments/{commentId}
│     dartId: string
│     userId: string
│     userName: string
│     userAvatarUrl: string | null
│     text: string
│     createdAt: Timestamp
│
├── barrels/{barrelId}
│     name: string
│     brand: string
│     weight: number
│     maxDiameter: number
│     length: number
│     cut: string
│     imageUrl: string | null
│     productUrl: string | null
│     source: string
│     scrapedAt: Timestamp
│
└── articles/{articleId}
      slug: string
      title: string
      content: string (Markdown)
      coverImageUrl: string | null
      tags: string[]
      isDraft: boolean
      isFeatured: boolean
      userId: string
      userName: string
      createdAt: Timestamp
      updatedAt: Timestamp
```

### 4.2 設計方針

| 方針                       | 説明                                                                                 |
| -------------------------- | ------------------------------------------------------------------------------------ |
| **非正規化**               | ユーザー名・アバターを各ドキュメントに埋め込み（Firestoreはjoinが高コストなため）    |
| **サブコレクション**       | ユーザー固有データ（ブックマーク・いいね・スタッツ）はサブコレクションで分離         |
| **キャッシュドキュメント** | `dartsliveCache/latest` で最新スタッツをキャッシュし、トップページの読み込みを高速化 |

---

## 5. 認証・認可設計

### 5.1 認証フロー

```
ユーザー                   NextAuth.js              Firebase Auth
  │                           │                         │
  │─── ログイン要求 ──────────→│                         │
  │   (email + password)      │                         │
  │                           │── signInWithEmail... ──→│
  │                           │                         │── 認証結果 ──→
  │                           │←── uid + token ─────────│
  │                           │                         │
  │                           │── Firestore: users/{uid} 取得 ──→
  │                           │←── role 取得 ────────────────────│
  │                           │                         │
  │←── JWT (sub=uid, role) ───│                         │
  │   Set-Cookie              │                         │
```

### 5.2 認可マトリクス

| 機能                   | 未ログイン |    general    |      pro      |   admin   |
| ---------------------- | :--------: | :-----------: | :-----------: | :-------: |
| セッティング閲覧       |     O      |       O       |       O       |     O     |
| バレル検索             |     O      |       O       |       O       |     O     |
| 記事閲覧               |     O      |       O       |       O       |     O     |
| セッティング登録・編集 |     X      | O（自分のみ） | O（自分のみ） | O（全て） |
| いいね・コメント       |     X      |       O       |       O       |     O     |
| ブックマーク           |     X      |       O       |       O       |     O     |
| スタッツ記録           |     X      |       O       |       O       |     O     |
| 記事投稿・編集         |     X      |       X       |       O       |     O     |
| ユーザーロール管理     |     X      |       X       |       X       |     O     |

---

## 6. 外部連携設計

### 6.1 DARTSLIVE スクレイピング連携

```
クライアント            API Route              Puppeteer          DARTSLIVE
   │                     │                      │                   │
   │── POST /api/ ──────→│                      │                   │
   │  {email, password}  │── launch browser ───→│                   │
   │                     │                      │── login ─────────→│
   │                     │                      │←── session cookie ─│
   │                     │                      │── GET /play/ ────→│
   │                     │                      │←── HTML ──────────│
   │                     │                      │── GET /monthly ──→│
   │                     │                      │←── HTML ──────────│
   │                     │                      │── GET /playdata ─→│
   │                     │                      │←── HTML ──────────│
   │                     │←── scraped data ─────│                   │
   │                     │── close browser ────→│                   │
   │                     │                      │                   │
   │                     │── Firestore save ────────────────────────│
   │←── JSON response ──│                      │                   │
```

**セキュリティ対策:**

- 認証情報はリクエストボディで受信、サーバーメモリ上で一時利用のみ
- Firestoreへの認証情報の永続化は行わない
- ブラウザインスタンスは処理完了後に即座に破棄（`finally`ブロック）
- APIルートは認証済みユーザーのみアクセス可能

### 6.2 画像プロキシ

外部サイトの画像をCORS制約を回避して表示するためのプロキシAPI。

```
クライアント → /api/proxy-image?url=... → 外部画像サーバー → レスポンス返却
```

---

## 7. デプロイ構成

```
GitHub Repository
       │
       │ push / merge
       ▼
   Vercel CI/CD
       │
       ├── Build (next build)
       ├── TypeScript 型チェック
       └── Deploy
            │
            ├── Static Assets → Vercel CDN (Edge)
            ├── Pages → Serverless Functions
            └── API Routes → Serverless Functions
                  │
                  └── 環境変数（Vercel Dashboard で管理）
                       ├── NEXT_PUBLIC_FIREBASE_*  (公開可)
                       ├── NEXTAUTH_SECRET         (秘密)
                       ├── NEXTAUTH_URL            (秘密)
                       └── GOOGLE_APPLICATION_CREDENTIALS (秘密)
```

### 7.1 環境変数の分類

| 変数                                       | 公開可否 | 用途                                                               |
| ------------------------------------------ | :------: | ------------------------------------------------------------------ |
| `NEXT_PUBLIC_FIREBASE_API_KEY`             |  公開可  | Firebase クライアントSDK初期化（Firebaseセキュリティルールで保護） |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`         |  公開可  | Firebase Auth ドメイン                                             |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID`          |  公開可  | Firebase プロジェクト識別子                                        |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`      |  公開可  | Storage バケット                                                   |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` |  公開可  | FCM 送信者ID                                                       |
| `NEXT_PUBLIC_FIREBASE_APP_ID`              |  公開可  | Firebase アプリID                                                  |
| `NEXTAUTH_SECRET`                          | **秘密** | JWTの署名キー                                                      |
| `NEXTAUTH_URL`                             | **秘密** | NextAuth コールバックURL                                           |
| `GOOGLE_APPLICATION_CREDENTIALS`           | **秘密** | Firebase Admin SDK サービスアカウント                              |

---

## 8. ディレクトリ構成

```
darts-app/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # ルートレイアウト
│   ├── page.tsx                  # トップページ
│   ├── login/                    # ログイン
│   ├── register/                 # 新規登録
│   ├── darts/                    # セッティング管理
│   │   ├── page.tsx              #   一覧
│   │   ├── new/                  #   新規作成
│   │   ├── [id]/                 #   詳細・編集
│   │   └── compare/              #   比較
│   ├── barrels/                  # バレルDB
│   ├── stats/                    # スタッツ記録
│   │   ├── page.tsx              #   ダッシュボード
│   │   ├── new/                  #   手動入力
│   │   └── [id]/edit/            #   編集
│   ├── articles/                 # 記事
│   ├── bookmarks/                # ブックマーク
│   ├── profile/edit/             # プロフィール編集
│   ├── reference/                # リファレンス
│   ├── admin/                    # 管理機能
│   └── api/                      # APIルート
│       ├── auth/[...nextauth]/   #   認証
│       ├── dartslive-stats/      #   スクレイピング
│       ├── proxy-image/          #   画像プロキシ
│       └── admin/                #   管理API
├── components/                   # 再利用コンポーネント
│   ├── layout/                   #   Header, Footer
│   ├── darts/                    #   DartCard, DartForm, DartDetail
│   ├── barrels/                  #   BarrelCard
│   ├── stats/                    #   スタッツダッシュボード（14コンポーネント）
│   │   ├── PlayerProfileCard     #     プロフィール（通り名・ホームショップ・Maps連携）
│   │   ├── RatingHeroCard        #     レーティング + フライト + パーセンタイル
│   │   ├── PeriodStatsPanel      #     期間タブ + サマリー
│   │   ├── GameStatsCards        #     01/Cricket/CU カード（パーセンタイル付き）
│   │   ├── BullStatsCard         #     ブル統計 + ドーナツ/バーチャート
│   │   ├── CountUpDeltaChart     #     COUNT-UP ±差分バーチャート
│   │   ├── RatingTargetCard      #     レーティング目標分析
│   │   ├── MonthlyTrendChart     #     月間推移グラフ
│   │   ├── RecentGamesChart      #     直近ゲーム結果チャート
│   │   ├── RecentDaySummary      #     直近プレイ日サマリー
│   │   ├── AwardsTable           #     アワードテーブル
│   │   ├── PercentileChip        #     上位X%バッジ（再利用可能）
│   │   ├── PRSiteSection         #     おすすめブランドPRカード
│   │   └── StatsLoginDialog      #     DARTSLIVE ログインダイアログ
│   ├── articles/                 #   ArticleCard, MarkdownContent
│   ├── comment/                  #   CommentList, CommentForm
│   └── auth/                     #   LoginForm, RegisterForm
├── lib/                          # ビジネスロジック・ユーティリティ
│   ├── auth.ts                   #   NextAuth設定
│   ├── firebase.ts               #   Firebase Client SDK
│   ├── firebase-admin.ts         #   Firebase Admin SDK
│   ├── darts-parts.ts            #   パーツマスタデータ
│   ├── calc-totals.ts            #   スペック計算
│   ├── recommend-barrels.ts      #   レコメンドエンジン
│   ├── comparison.ts             #   比較ユーティリティ
│   ├── dartslive-rating.ts       #   DARTSLIVE レーティング計算（PPD/MPR⇔Rt変換）
│   ├── dartslive-colors.ts       #   フライト・カテゴリカラー定義
│   ├── dartslive-percentile.ts   #   パーセンタイル分布データ + 推定関数
│   └── permissions.ts            #   ロール別権限判定ユーティリティ
├── types/                        # 型定義
│   ├── index.ts                  #   共通型
│   └── next-auth.d.ts            #   NextAuth型拡張
├── scripts/                      # 運用スクリプト
├── docs/                         # ドキュメント
└── public/                       # 静的アセット
```
