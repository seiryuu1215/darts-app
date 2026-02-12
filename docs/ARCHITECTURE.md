# Darts Lab - アーキテクチャ設計書

## 全体システム構成図

```mermaid
graph TB
    subgraph Client["クライアント (Browser / PWA)"]
        NextApp["Next.js 16 App Router<br/>React 19 + MUI v7"]
        SW["Service Worker<br/>(Serwist / Workbox)"]
    end

    subgraph Vercel["Vercel Platform"]
        SSR["Edge Network<br/>(SSR / Static)"]
        API["Serverless Functions"]
        API_Auth["/api/auth/[...nextauth]"]
        API_Stats["/api/dartslive-stats"]
        API_Proxy["/api/proxy-image"]
        API_Admin["/api/admin/update-role"]
    end

    subgraph Firebase["Firebase"]
        Auth["Authentication"]
        Firestore["Cloud Firestore"]
        Storage["Cloud Storage"]
    end

    subgraph External["外部サービス"]
        DARTSLIVE["DARTSLIVE<br/>card.dartslive.com"]
        DartsHive["ダーツハイブ<br/>dartshive.jp"]
    end

    subgraph Affiliate["アフィリエイト"]
        A8["A8.net"]
        Rakuten["楽天アフィリエイト"]
        Amazon["Amazonアソシエイト"]
    end

    Client -->|HTTPS| Vercel
    SSR --> API
    API --> API_Auth & API_Stats & API_Proxy & API_Admin
    API_Auth -->|JWT| Auth
    API_Stats -->|Puppeteer| DARTSLIVE
    API_Proxy -->|Image Fetch| DartsHive
    API_Admin --> Firestore

    NextApp -->|Client SDK| Firestore
    NextApp -->|Client SDK| Auth
    NextApp -->|Client SDK| Storage
    NextApp -->|Affiliate Links| A8 & Rakuten & Amazon

    SW -.->|Cache| NextApp
```

## ページ遷移図

```mermaid
graph LR
    Home["/ ホーム"]

    subgraph Darts["セッティング管理"]
        DartsList["/darts 一覧"]
        DartsNew["/darts/new 新規"]
        DartsDetail["/darts/[id] 詳細"]
        DartsEdit["/darts/[id]/edit 編集"]
        DartsCompare["/darts/compare 比較"]
        DartsHistory["/darts/history 履歴"]
    end

    subgraph Barrels["バレル"]
        BarrelSearch["/barrels 検索"]
        BarrelRecommend["/barrels/recommend おすすめ"]
        BarrelSimulator["/barrels/simulator シミュレーター"]
        BarrelQuiz["/barrels/quiz 診断クイズ"]
    end

    subgraph Content["コンテンツ"]
        Articles["/articles 記事一覧"]
        ArticleDetail["/articles/[slug] 記事詳細"]
        Reference["/reference シャフト早見表"]
    end

    subgraph User["ユーザー"]
        Stats["/stats スタッツ"]
        StatsNew["/stats/new 記録"]
        Bookmarks["/bookmarks ブックマーク"]
        Profile["/profile/edit プロフィール"]
    end

    subgraph Info["情報"]
        About["/about サイトについて"]
        Privacy["/privacy プライバシー"]
        Terms["/terms 利用規約"]
    end

    Home --> DartsList & BarrelSearch & Articles & Stats
    DartsList --> DartsDetail & DartsNew
    DartsDetail --> DartsEdit & DartsCompare
    DartsDetail -.->|購入導線| BarrelSearch
    BarrelSearch --> BarrelRecommend & BarrelSimulator & BarrelQuiz
    BarrelQuiz -.->|相互リンク| BarrelRecommend
    Articles --> ArticleDetail
```

## データフロー

```mermaid
sequenceDiagram
    participant U as ユーザー
    participant App as Next.js App
    participant FS as Firestore
    participant AF as Affiliate (外部)

    Note over U,AF: バレル検索 → 購入フロー
    U->>App: バレル検索
    App->>FS: query(barrels, filters)
    FS-->>App: BarrelProduct[]
    App-->>U: BarrelCard表示

    U->>App: 「購入する」クリック
    App->>App: lib/affiliate.ts<br/>getShopLinks(barrel)
    App-->>U: ショップ選択メニュー
    U->>AF: 外部ショップへ遷移<br/>(アフィリエイトURL)

    Note over U,AF: おすすめバレル検索
    U->>App: バレルを1-3個選択
    App->>App: lib/recommend-barrels.ts<br/>scoreBarrel(barrel, pref)
    App-->>U: マッチ度付きレコメンド表示

    Note over U,AF: 診断クイズ
    U->>App: 6つの質問に回答
    App->>App: recommendFromQuiz(answers)
    App->>FS: query(barrels)
    App-->>U: パーソナライズ結果
```

## Firestore コレクション設計

```mermaid
erDiagram
    barrels {
        string name
        string brand
        number weight
        number maxDiameter
        number length
        string cut
        string imageUrl
        string productUrl
        string source
        timestamp scrapedAt
    }

    barrelRanking {
        number rank
        string name
        string imageUrl
        string productUrl
        string price
        timestamp updatedAt
    }

    darts {
        string userId
        string title
        object barrel
        object tip
        object shaft
        object flight
        array imageUrls
        string description
        number likeCount
        boolean isDraft
        timestamp createdAt
    }

    users {
        string displayName
        string email
        string role
        string activeSoftDartId
        string activeSteelDartId
        timestamp createdAt
    }

    articles {
        string slug
        string title
        string content
        array tags
        boolean isDraft
        boolean isFeatured
        string userId
        timestamp createdAt
    }

    darts ||--o{ comments : has
    darts ||--o{ memos : has
    users ||--o{ likes : has
    users ||--o{ bookmarks : has
    users ||--o{ barrelBookmarks : has
    users ||--o{ settingHistory : has
    users ||--o{ dartsliveCache : has
```

## コンポーネント構成

```
components/
├── layout/                    # レイアウト
│   ├── Header.tsx             # AppBar + ナビ + ドロップダウンメニュー
│   ├── Footer.tsx             # 4カラムリッチフッター
│   ├── TwoColumnLayout.tsx    # PC: メイン+サイドバー / モバイル: 1カラム
│   ├── Sidebar.tsx            # 人気バレル・新着記事・ショップバナー
│   └── Breadcrumbs.tsx        # パンくずナビ
├── affiliate/                 # アフィリエイト
│   └── AffiliateButton.tsx    # 複数ショップドロップダウン購入ボタン
├── darts/                     # セッティング
│   ├── DartCard.tsx           # セッティングカード
│   ├── DartDetail.tsx         # セッティング詳細 + 購入導線
│   └── DartForm.tsx           # 登録・編集フォーム
├── barrels/                   # バレル
│   ├── BarrelCard.tsx         # バレル商品カード + アフィリエイトボタン
│   ├── BarrelSimulator.tsx    # SVGバレル形状シミュレーター
│   └── BarrelQuiz.tsx         # 6ステップ診断クイズ (MUI Stepper)
├── articles/                  # 記事
│   ├── ArticleCard.tsx        # 記事一覧カード
│   └── MarkdownContent.tsx    # Markdown レンダラー
├── comment/                   # コメント
│   ├── CommentForm.tsx
│   └── CommentList.tsx
├── UserAvatar.tsx             # DiceBear アバター
└── Providers.tsx              # SessionProvider + ThemeProvider
```

## 技術スタック詳細

| カテゴリ | 技術 | 用途 |
|---------|------|------|
| フレームワーク | Next.js 16 (App Router) | SSR/SSG + API Routes |
| 言語 | TypeScript 5 (strict) | 型安全なフルスタック開発 |
| UI | React 19 + MUI v7 | コンポーネントライブラリ |
| CSS | Tailwind CSS v4 | ユーティリティCSS |
| 認証 | NextAuth.js 4 + Firebase Auth | JWT + ロールベースアクセス制御 |
| データベース | Cloud Firestore | NoSQL リアルタイムDB |
| ストレージ | Firebase Storage | 画像アップロード |
| グラフ | Recharts 3 | スタッツ可視化 |
| スクレイピング | Puppeteer 24 | DARTSLIVE データ取得 |
| PWA | Serwist (@serwist/next) | Service Worker + キャッシュ戦略 |
| ホスティング | Vercel | Edge Network + Serverless |
| アフィリエイト | A8.net / 楽天 / Amazon | 収益化基盤 |

## 環境変数一覧

| 変数 | 種類 | 説明 |
|------|------|------|
| `NEXT_PUBLIC_FIREBASE_*` | 公開 | Firebase クライアントSDK設定 |
| `NEXTAUTH_SECRET` | 秘密 | JWT署名キー |
| `NEXTAUTH_URL` | 設定 | アプリURL |
| `ADMIN_EMAIL` | 設定 | 管理者メールアドレス |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | 秘密 | Firebase Admin SDK キー |
| `NEXT_PUBLIC_RAKUTEN_AFFILIATE_ID` | 公開 | 楽天アフィリエイトID |
| `NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG` | 公開 | Amazonアソシエイトタグ |
| `NEXT_PUBLIC_A8_MEDIA_ID` | 公開 | A8.net メディアID |

## アフィリエイトフロー

```mermaid
graph LR
    User["ユーザー"] --> AB["AffiliateButton<br/>コンポーネント"]
    AB --> Lib["lib/affiliate.ts<br/>getShopLinks()"]

    Lib --> DH["toDartshiveAffiliateUrl()<br/>→ A8.net経由"]
    Lib --> RK["toRakutenSearchUrl()<br/>→ 楽天アフィリエイト"]
    Lib --> AZ["toAmazonSearchUrl()<br/>→ Amazonアソシエイト"]

    DH --> Shop1["ダーツハイブ"]
    RK --> Shop2["楽天市場"]
    AZ --> Shop3["Amazon.co.jp"]

    style AB fill:#1976d2,color:#fff
    style Lib fill:#ff9800,color:#fff
```

## セキュリティ設計

- **認証**: NextAuth.js JWT + Firebase Auth のデュアル認証
- **ロールベースアクセス制御**: admin / pro / general の3段階
- **Firebase セキュリティルール**: Firestore・Storage の読み書き制限
- **環境変数管理**: 秘密情報は `.env.local` に分離、Git管理外
- **DARTSLIVE連携**: 認証情報はセッション中のみサーバーサイドで処理、永続化しない
- **画像プロキシ**: ホワイトリスト方式（dartshive.jp, firebasestorage のみ許可）
- **アフィリエイトID**: クライアント公開（`NEXT_PUBLIC_`）だが、IDのみで秘密情報ではない
