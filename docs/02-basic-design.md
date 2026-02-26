# 基本設計書

## ドキュメント情報

| 項目           | 内容       |
| -------------- | ---------- |
| プロジェクト名 | Darts Lab  |
| バージョン     | 3.0        |
| 作成日         | 2025-02-09 |
| 最終更新日     | 2026-02-23 |

---

## 1. システム構成図

```
┌──────────────────────────────────────────────────────────────┐
│                        クライアント                            │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              Next.js App Router (React 19)              │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────────┐       │  │
│  │  │ MUI v7   │ │ Recharts │ │ Tailwind CSS v4  │       │  │
│  │  └──────────┘ └──────────┘ └──────────────────┘       │  │
│  │  ┌──────────────────┐ ┌────────────────────────┐      │  │
│  │  │ Leaflet (地図)    │ │ Capacitor (iOS)        │      │  │
│  │  └──────────────────┘ └────────────────────────┘      │  │
│  └────────────────────────────────────────────────────────┘  │
└───────────────────────────┬──────────────────────────────────┘
                            │ HTTPS
┌───────────────────────────▼──────────────────────────────────┐
│                      Vercel Platform                          │
│  ┌────────────────┐  ┌─────────────────────────────────────┐ │
│  │  Edge Network   │  │  Serverless Functions                │ │
│  │  (CDN/SSR)      │  │  ┌────────────────────────────────┐ │ │
│  │  + Serwist PWA  │  │  │ API Routes                     │ │ │
│  │                 │  │  │  /api/auth/[...nextauth]       │ │ │
│  │                 │  │  │  /api/dartslive-stats           │ │ │
│  │                 │  │  │  /api/proxy-image               │ │ │
│  │                 │  │  │  /api/stripe/*                  │ │ │
│  │                 │  │  │  /api/line/*                    │ │ │
│  │                 │  │  │  /api/cron/*                    │ │ │
│  │                 │  │  │  /api/goals                     │ │ │
│  │                 │  │  │  /api/progression               │ │ │
│  │                 │  │  │  /api/notifications              │ │ │
│  │                 │  │  │  /api/stats-history              │ │ │
│  │                 │  │  │  /api/stats-calendar             │ │ │
│  │                 │  │  │  /api/og                        │ │ │
│  │                 │  │  │  /api/shops/*                   │ │ │
│  │                 │  │  │  /api/n01-import                │ │ │
│  │                 │  │  │  /api/admin/dartslive-sync      │ │ │
│  │                 │  │  │  /api/admin/dartslive-history   │ │ │
│  │                 │  │  │  /api/admin/update-role         │ │ │
│  │                 │  │  │  /api/admin/update-pricing      │ │ │
│  │                 │  │  └────────────────────────────────┘ │ │
│  └────────────────┘  └─────────────────────────────────────┘ │
└──────────┬──────────────────┬────────────────┬───────────────┘
           │                  │                │
     ┌─────▼─────┐    ┌──────▼──────────┐  ┌──▼──────────────┐
     │ Firebase   │    │ 外部サービス      │  │ インフラ          │
     │ ┌────────┐ │    │ ┌──────────────┐ │  │ ┌──────────────┐ │
     │ │  Auth  │ │    │ │ DARTSLIVE    │ │  │ │ Sentry       │ │
     │ ├────────┤ │    │ │ card.dartslive│ │  │ │ (エラー監視)  │ │
     │ │Firestore│ │    │ │ .com         │ │  │ ├──────────────┤ │
     │ ├────────┤ │    │ ├──────────────┤ │  │ │ Upstash Redis│ │
     │ │Storage │ │    │ │ Google OAuth │ │  │ │ (レートリミット)│ │
     │ └────────┘ │    │ ├──────────────┤ │  │ └──────────────┘ │
     └────────────┘    │ │ Stripe       │ │  └─────────────────┘
                       │ │ (決済)        │ │
                       │ ├──────────────┤ │
                       │ │ LINE         │ │
                       │ │ Messaging API│ │
                       │ └──────────────┘ │
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

| 技術                             | バージョン | 用途・選定理由                                        |
| -------------------------------- | ---------- | ----------------------------------------------------- |
| **サーバーサイドブラウザ自動化** | 24         | DARTSLIVEデータ取得用（データ連携手段が限定的なため） |
| **Stripe**                       | 20         | サブスクリプション決済                                |
| **LINE Messaging API**           | -          | アカウント連携・日次通知                              |
| **Sentry**                       | 10         | エラー監視・例外追跡                                  |
| **Capacitor**                    | 8          | iOSネイティブアプリ                                   |
| **Leaflet / react-leaflet**      | -          | 地図表示（ショップマップ）                            |
| **Upstash Redis**                | -          | 分散レートリミット                                    |
| **Serwist**                      | -          | PWA / Service Worker                                  |
| **Vitest**                       | 4          | ユニットテスト                                        |
| **Storybook**                    | 10         | UIテスト・コンポーネントカタログ                      |
| **zod**                          | 4          | バリデーション                                        |
| **react-markdown**               | 10         | 記事コンテンツのMarkdownレンダリング（GFM対応）       |
| **Sharp**                        | 0.34       | サーバーサイド画像最適化                              |

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
│   ├── dartsliveCache/latest
│   │     rating, ratingInt, flight, cardName
│   │     stats01Avg, statsCriAvg, statsPraAvg
│   │     prevRating, prevStats01Avg, prevStatsCriAvg, prevStatsPraAvg
│   │     updatedAt: Timestamp
│   │
│   ├── shopBookmarks/{bookmarkId}
│   │     shopId: string
│   │     listId: string | null
│   │     tags: string[]
│   │     memo: string
│   │     rating: number | null
│   │     visited: boolean
│   │     createdAt: Timestamp
│   │     updatedAt: Timestamp
│   │
│   ├── shopLists/{listId}
│   │     name: string
│   │     order: number
│   │     createdAt: Timestamp
│   │
│   ├── goals/{goalId}
│   │     type: string
│   │     targetValue: number
│   │     currentValue: number
│   │     status: "active" | "achieved" | "expired"
│   │     deadline: Timestamp | null
│   │     createdAt: Timestamp
│   │     updatedAt: Timestamp
│   │
│   ├── notifications/{notificationId}
│   │     type: string
│   │     title: string
│   │     body: string
│   │     read: boolean
│   │     createdAt: Timestamp
│   │
│   ├── xpHistory/{xpId}
│   │     amount: number
│   │     reason: string
│   │     createdAt: Timestamp
│   │
│   └── settingHistory/{historyId}
│         dartId: string
│         changedFields: object
│         createdAt: Timestamp
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
│     importedAt: Timestamp
│
├── articles/{articleId}
│     slug: string
│     title: string
│     content: string (Markdown)
│     coverImageUrl: string | null
│     tags: string[]
│     isDraft: boolean
│     isFeatured: boolean
│     userId: string
│     userName: string
│     createdAt: Timestamp
│     updatedAt: Timestamp
│
├── discussions/{discussionId}
│     title: string
│     body: string
│     category: string
│     userId: string
│     userName: string
│     userAvatarUrl: string | null
│     replyCount: number
│     createdAt: Timestamp
│     updatedAt: Timestamp
│
├── replies/{replyId}
│     discussionId: string
│     userId: string
│     userName: string
│     userAvatarUrl: string | null
│     body: string
│     createdAt: Timestamp
│
├── stripeEvents/{eventId}
│     type: string
│     data: object
│     processedAt: Timestamp
│
├── lineConversations/{conversationId}
│     userId: string
│     lineUserId: string
│     messages: array
│     updatedAt: Timestamp
│
├── lineLinkCodes/{code}
│     userId: string
│     createdAt: Timestamp
│     expiresAt: Timestamp
│
├── config/{configId}
│     （アプリ設定・フィーチャーフラグ等）
│
├── barrelRanking/{rankingId}
│     barrelId: string
│     score: number
│     updatedAt: Timestamp
│
├── shopBookmarks/{bookmarkId}
│     （トップレベルのショップブックマーク集計用）
│
└── shopLists/{listId}
      （トップレベルのショップリスト集計用）
```

### 4.2 設計方針

| 方針                       | 説明                                                                                     |
| -------------------------- | ---------------------------------------------------------------------------------------- |
| **非正規化**               | ユーザー名・アバターを各ドキュメントに埋め込み（Firestoreはjoinが高コストなため）        |
| **サブコレクション**       | ユーザー固有データ（ブックマーク・いいね・スタッツ・目標・通知）はサブコレクションで分離 |
| **キャッシュドキュメント** | `dartsliveCache/latest` で最新スタッツをキャッシュし、トップページの読み込みを高速化     |

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
| ショップ管理           |     X      |       O       |       O       |     O     |
| 掲示板投稿・返信       |     X      |       O       |       O       |     O     |
| 記事投稿・編集         |     X      |       X       |       O       |     O     |
| ユーザーロール管理     |     X      |       X       |       X       |     O     |

---

## 6. 外部連携設計

### 6.1 DARTSLIVEアカウント連携

```
クライアント            API Route           Browser Automation      DARTSLIVE
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
   │                     │←── fetched data ─────│                   │
   │                     │── close browser ────→│                   │
   │                     │                      │                   │
   │                     │── Firestore save ────────────────────────│
   │←── JSON response ──│                      │                   │
```

**セキュリティ対策:**

- 認証情報はリクエストボディで受信、サーバーメモリ上で一時利用のみ
- 認証情報はAES暗号化を施し、平文での保存を回避
- Firestoreへの認証情報の永続化は行わない
- ブラウザインスタンスは処理完了後に即座に破棄（`finally`ブロック）
- APIルートは認証済みユーザーのみアクセス可能
- Upstash Redis によるレートリミットで不正アクセスを防止

### 6.2 画像プロキシ

外部サイトの画像をCORS制約を回避して表示するためのプロキシAPI。

```
クライアント → /api/proxy-image?url=... → 外部画像サーバー → レスポンス返却
```

### 6.3 LINE連携

LINE Messaging API を使用したアカウント連携と日次通知。

```
ユーザー          API Route             LINE Messaging API
  │                  │                        │
  │── リンクコード ─→│                        │
  │  生成要求        │── lineLinkCodes 保存 ──→│
  │←── コード返却 ──│                        │
  │                  │                        │
  │  (LINEでコード送信)                       │
  │                  │←── Webhook ────────────│
  │                  │── アカウント紐付け ─────→│
  │                  │── 連携完了メッセージ ──→│
  │                  │                        │
  │  (日次cronトリガー)                        │
  │                  │── スタッツ通知 ────────→│
```

### 6.4 Stripe決済

```
ユーザー          API Route             Stripe
  │                  │                    │
  │── チェックアウト →│                    │
  │                  │── Session作成 ────→│
  │←── リダイレクト ─│←── Session URL ───│
  │                  │                    │
  │── (Stripe決済画面で支払い) ──────────→│
  │                  │←── Webhook ────────│
  │                  │── ロール更新 ──────→│
  │←── Pro有効化 ────│                    │
```

---

## 7. デプロイ構成

```
GitHub Repository
       │
       │ push / merge
       ▼
   GitHub Actions (CI)
       │
       ├── npm run lint          (ESLint)
       ├── npm run format:check  (Prettier)
       ├── npm run test:unit     (Vitest)
       └── npm run build         (Next.js ビルド)
       │
       │ CI パス後
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
| `STRIPE_SECRET_KEY`                        | **秘密** | Stripe シークレットキー                                            |
| `STRIPE_WEBHOOK_SECRET`                    | **秘密** | Stripe Webhook署名シークレット                                     |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`       |  公開可  | Stripe 公開可能キー                                                |
| `LINE_CHANNEL_ACCESS_TOKEN`                | **秘密** | LINE Messaging API チャネルアクセストークン                        |
| `LINE_CHANNEL_SECRET`                      | **秘密** | LINE Messaging API チャネルシークレット                            |
| `SENTRY_DSN`                               |  公開可  | Sentry エラー監視用DSN                                             |
| `SENTRY_AUTH_TOKEN`                        | **秘密** | Sentry ソースマップアップロード用トークン                          |
| `ENCRYPTION_KEY`                           | **秘密** | AES暗号化キー（認証情報暗号化用）                                  |
| `CRON_SECRET`                              | **秘密** | Cronジョブ認証用シークレット                                       |
| `ADMIN_EMAIL`                              | **秘密** | 管理者メールアドレス                                               |
| `NEXT_PUBLIC_AFFILIATE_*`                  |  公開可  | アフィリエイト関連設定                                             |

---

## 8. ディレクトリ構成

```
darts-app/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # ルートレイアウト
│   ├── page.tsx                  # トップページ
│   ├── sw.ts                     # Service Worker (PWA)
│   ├── login/                    # ログイン
│   ├── register/                 # 新規登録
│   ├── forgot-password/          # パスワードリセット
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
│   ├── discussions/              # 掲示板
│   ├── shops/                    # ショップ検索・マップ
│   ├── pricing/                  # 料金プラン
│   ├── about/                    # アプリ概要
│   ├── reports/                  # レポート
│   ├── tools/                    # ツール
│   ├── users/                    # ユーザープロフィール
│   ├── profile/edit/             # プロフィール編集
│   ├── reference/                # リファレンス
│   ├── admin/                    # 管理機能
│   └── api/                      # APIルート
│       ├── auth/[...nextauth]/   #   認証
│       ├── dartslive-stats/      #   自動データ取得
│       ├── proxy-image/          #   画像プロキシ
│       ├── stripe/               #   Stripe決済 (checkout, portal, webhook)
│       ├── line/                  #   LINE連携 (link, unlink, webhook, save-dl-credentials)
│       ├── cron/                  #   定期実行 (daily-stats, dartslive-api-sync)
│       ├── goals/                #   目標管理
│       ├── progression/          #   経験値・レベル
│       ├── notifications/        #   通知
│       ├── stats-history/        #   スタッツ履歴
│       ├── stats-calendar/       #   スタッツカレンダー
│       ├── og/                   #   OGP画像生成
│       ├── shops/                #   ショップ (fetch-url, import-by-line)
│       ├── n01-import/           #   N01データインポート
│       └── admin/                #   管理API (update-role, dartslive-sync, dartslive-history, update-pricing)
├── components/                   # 再利用コンポーネント
│   ├── layout/                   #   Header, Footer
│   ├── darts/                    #   DartCard, DartForm, DartDetail
│   ├── barrels/                  #   BarrelCard
│   ├── stats/                    #   スタッツダッシュボード（53コンポーネント）
│   │   ├── AdminApiStatsSection  #     管理者向けAPI連携スタッツ
│   │   ├── PlayerProfileCard     #     プロフィール（通り名・ホームショップ・Maps連携）
│   │   ├── RatingHeroCard        #     レーティング + フライト + パーセンタイル
│   │   ├── PeriodStatsPanel      #     期間タブ + サマリー
│   │   ├── GameStatsCards        #     01/Cricket/CU カード（パーセンタイル付き）
│   │   ├── DetailedGameStatsCard #     詳細ゲーム統計
│   │   ├── BullStatsCard         #     ブル統計 + ドーナツ/バーチャート
│   │   ├── CountUpDeltaChart     #     COUNT-UP ±差分バーチャート
│   │   ├── CountUpAnalysisCard   #     COUNT-UP分析（Rt期待値メトリクス + 前後半トレンド）
│   │   ├── CountUpDeepAnalysisCard #   COUNT-UP深掘り分析
│   │   ├── CountUpRoundAnalysisCard #  COUNT-UPラウンド分析
│   │   ├── ZeroOneAnalysisCard   #     01分析
│   │   ├── ZeroOneConsistencyCard #    01安定性分析
│   │   ├── RatingTargetCard      #     レーティング目標分析
│   │   ├── RatingSimulatorCard   #     レーティングシミュレーター
│   │   ├── RatingMomentumCard    #     レーティング勢い分析
│   │   ├── RatingBenchmarkCard   #     レーティングベンチマーク
│   │   ├── MonthlyTrendChart     #     月間推移グラフ
│   │   ├── DailyHistoryChart     #     日別履歴チャート
│   │   ├── RollingTrendCard      #     ローリングトレンド
│   │   ├── RecentGamesChart      #     直近ゲーム結果チャート + サマリー行（連続/最長/安定度）
│   │   ├── RecentDaySummary      #     直近プレイ日サマリー
│   │   ├── CalendarGrid          #     カレンダーグリッド
│   │   ├── DayDetailPanel        #     日別詳細パネル
│   │   ├── PlayerDnaCard         #     プレイヤーDNA分析
│   │   ├── SkillRadarChart       #     スキルレーダー（詳細8軸 + 簡易5軸 / ベンチマーク比較）
│   │   ├── DartboardHeatmap      #     ダーツボードヒートマップ
│   │   ├── ScoreDistributionCard #     スコア分布
│   │   ├── ConsistencyCard       #     安定性カード
│   │   ├── PeriodComparisonCard  #     期間比較
│   │   ├── GameAveragesCard      #     ゲーム平均
│   │   ├── BestRecordsCard       #     ベスト記録
│   │   ├── PerformanceInsightsCard #   パフォーマンスインサイト
│   │   ├── SpeedAccuracyCard     #     スピード/精度分析
│   │   ├── SessionFatigueCard    #     セッション疲労分析
│   │   ├── SensorTrendCard       #     センサートレンド
│   │   ├── StreakPatternCard     #     連続パターン分析
│   │   ├── AwardsTable           #     アワードテーブル
│   │   ├── AwardPaceCard         #     アワードペース
│   │   ├── AwardTrendChart       #     アワードトレンド
│   │   ├── PracticeRecommendationsCard # 練習メニュー提案
│   │   ├── N01ImportCard         #     N01インポート
│   │   ├── PercentileChip        #     上位X%バッジ（再利用可能）
│   │   ├── PRSiteSection         #     おすすめブランドPRカード
│   │   ├── StatsLoginDialog      #     DARTSLIVE ログインダイアログ
│   │   ├── RatingTrendCard       #     レーティングトレンド（スパークライン + 回帰直線）
│   │   ├── SessionComparisonCard #    セッション比較（直近2回のプレイ日比較）
│   │   ├── AwardPaceSimpleCard  #     アワードペース予測（簡易版）
│   │   ├── GameMixCard          #     ゲームミックス分析
│   │   ├── ConditionCorrelationCard # コンディション×パフォーマンス相関
│   │   └── StatsPageContent      #     スタッツページコンテンツ
│   ├── shops/                    #   ショップ関連
│   │   ├── ShopCard              #     ショップカード
│   │   ├── ShopMapView           #     地図ビュー
│   │   ├── ShopBookmarkDialog    #     ブックマークダイアログ
│   │   ├── ShopListDialog        #     リスト管理ダイアログ
│   │   ├── ShopListChips         #     リストチップス
│   │   ├── ShopViewToggle        #     表示切替
│   │   ├── TagManageDialog       #     タグ管理ダイアログ
│   │   └── LineImportDialog      #     LINE経由インポート
│   ├── affiliate/                #   アフィリエイト（AffiliateBanner, AffiliateButton）
│   ├── discussions/              #   掲示板（DiscussionCard, CategoryTabs, ReplyForm, ReplyList）
│   ├── goals/                    #   目標管理（GoalCard, GoalSection, GoalSettingDialog, GoalAchievedDialog）
│   ├── progression/              #   経験値・レベル（XpBar, LevelUpSnackbar, AchievementList, XpHistoryList）
│   ├── notifications/            #   通知（NotificationBell, PushOptIn, XpNotificationDialog）
│   ├── reports/                  #   レポート（WeeklyReportCard, MonthlyReportCard）
│   ├── articles/                 #   ArticleCard, MarkdownContent
│   ├── comment/                  #   CommentList, CommentForm
│   ├── auth/                     #   LoginForm, RegisterForm
│   └── home/                     #   ホーム画面コンポーネント
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
│   ├── dartslive-api.ts          #   DARTSLIVE API連携
│   ├── dartslive-reference.ts    #   DARTSLIVEリファレンスデータ
│   ├── dartslive-scraper.ts      #   外部データ連携（自動データ取得）
│   ├── permissions.ts            #   ロール別権限判定ユーティリティ
│   ├── affiliate.ts              #   アフィリエイト管理
│   ├── goals.ts                  #   目標管理ロジック
│   ├── crypto.ts                 #   暗号化ユーティリティ（AES）
│   ├── line.ts                   #   LINE Messaging API連携
│   ├── stripe.ts                 #   Stripe決済連携
│   ├── session-analysis.ts       #   セッション分析
│   ├── sensor-analysis.ts        #   センサーデータ分析
│   ├── countup-round-analysis.ts #   COUNT-UPラウンド分析
│   ├── heatmap-data.ts           #   ヒートマップデータ生成
│   ├── practice-recommendations.ts #  練習メニュー提案ロジック
│   ├── stats-math.ts             #   統計計算ユーティリティ
│   ├── stats-trend.ts            #   スタッツトレンド分析
│   ├── award-analysis.ts         #   アワード分析
│   ├── dartout-analysis.ts       #   ダーツアウト分析
│   ├── dartout-labels.ts         #   ダーツアウトラベル定義
│   ├── report-data.ts            #   レポートデータ生成
│   ├── n01-parser.ts             #   N01データパーサー
│   ├── shop-import.ts            #   ショップデータインポート
│   ├── line-stations.ts          #   路線名・カラー定義
│   ├── geocode.ts                #   ジオコーディング
│   ├── image-proxy.ts            #   画像プロキシ
│   ├── api-middleware.ts         #   APIミドルウェア
│   ├── rate-limit.ts             #   レートリミット（Upstash Redis）
│   ├── push-notifications.ts     #   プッシュ通知
│   ├── progression/              #   経験値・レベルシステム
│   │   ├── xp-engine.ts          #     XPエンジン
│   │   ├── xp-rules.ts           #     XPルール定義
│   │   ├── ranks.ts              #     ランク定義
│   │   ├── achievements.ts       #     実績定義
│   │   └── milestones.ts         #     マイルストーン定義
│   └── hooks/                    #   カスタムフック
├── types/                        # 型定義
│   ├── index.ts                  #   共通型
│   └── next-auth.d.ts            #   NextAuth型拡張
├── stories/                      # Storybook stories + モックデータ
├── scripts/                      # 運用スクリプト
├── docs/                         # ドキュメント
└── public/                       # 静的アセット
```
