# Darts App

ダーツプレイヤー向けのセッティング管理・スタッツ記録 Web アプリケーション。

自身のダーツセッティング（バレル・シャフト・フライト・チップ）を登録・共有し、DARTSLIVE のスタッツを自動取得してグラフで成長を可視化できます。

## 主な機能

### セッティング管理
- バレル・チップ・シャフト・フライトの組み合わせを登録
- 主要メーカーの製品プリセットから選択、またはカスタム入力
- CONDOR AXE（一体型パーツ）対応
- スペック（重量・全長）の自動計算
- 2つのセッティングを横並びで比較

### バレルデータベース
- バレル製品をスペック（重量・径・長さ・カット）で横断検索
- ブックマーク＆検索結果からセッティング下書き作成
- ユーザーの傾向に基づくレコメンド機能

### DARTSLIVE スタッツ連携
- DARTSLIVE アカウントからスタッツを自動取得（Puppeteer によるサーバーサイドスクレイピング）
- Rating / 01 / Cricket / COUNT-UP の月間推移グラフ（Recharts）
- 直近プレイデータの可視化
- 前回との比較（±表示）
- DARTSLIVE アプリ風の UI デザイン

### ソーシャル
- セッティングへのいいね・コメント・ブックマーク
- Markdown ベースのナレッジ記事投稿

## 技術スタック

| カテゴリ | 技術 |
|----------|------|
| フレームワーク | Next.js 16 (App Router) |
| 言語 | TypeScript 5 |
| UI | React 19, MUI v7, Tailwind CSS v4 |
| 認証 | NextAuth.js 4 + Firebase Authentication |
| データベース | Cloud Firestore |
| ストレージ | Firebase Storage |
| グラフ | Recharts 3 |
| スクレイピング | Puppeteer 24 |
| ホスティング | Vercel |

## アーキテクチャ

```
Client (React/Next.js)
    ↕ HTTPS
Vercel Serverless Functions (API Routes)
    ↕
Firebase (Auth / Firestore / Storage)
    ↕
DARTSLIVE (Puppeteer Scraping)
```

- **サーバーレスアーキテクチャ**: Vercel + Firebase による完全マネージド構成
- **JWT 認証**: NextAuth.js による セッション管理、ロールベースアクセス制御（admin/pro/general）
- **Firebase Admin SDK**: API ルートからの安全なデータアクセス
- **型安全**: TypeScript による共通型定義の一元管理

## セットアップ

### 前提条件

- Node.js 18+
- npm
- Firebase プロジェクト（Auth, Firestore, Storage を有効化）
- Chromium（Puppeteer のスクレイピング機能を使用する場合）

### インストール

```bash
git clone https://github.com/<your-username>/darts-app.git
cd darts-app
npm install
```

### 環境変数

`.env.example` を `.env.local` にコピーし、各値を設定してください。

```bash
cp .env.example .env.local
```

| 変数 | 説明 |
|------|------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase API キー |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Auth ドメイン |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase プロジェクトID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase Storage バケット |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase メッセージング送信者ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase アプリID |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | Firebase Analytics 測定ID |
| `NEXTAUTH_SECRET` | NextAuth JWT 署名キー（`openssl rand -base64 32` で生成） |
| `NEXTAUTH_URL` | アプリの URL（開発: `http://localhost:3000`） |
| `ADMIN_EMAIL` | 管理者メールアドレス |

### 開発サーバー

```bash
npm run dev
```

`http://localhost:3000` でアプリが起動します。

## ディレクトリ構成

```
darts-app/
├── app/                    # Next.js App Router (pages & API routes)
│   ├── api/                #   API エンドポイント
│   ├── darts/              #   セッティング管理
│   ├── barrels/            #   バレルデータベース
│   ├── stats/              #   スタッツ記録
│   ├── articles/           #   記事
│   └── admin/              #   管理機能
├── components/             # 再利用 UI コンポーネント
├── lib/                    # ビジネスロジック・ユーティリティ
├── types/                  # TypeScript 型定義
├── scripts/                # データインポート等の運用スクリプト
├── docs/                   # 設計ドキュメント
└── public/                 # 静的アセット
```

## 設計ドキュメント

| ドキュメント | 内容 |
|-------------|------|
| [要件定義書](docs/01-requirements.md) | 目的・ユーザー定義・機能一覧・非機能要件 |
| [基本設計書](docs/02-basic-design.md) | システム構成・技術選定理由・DB設計 |
| [詳細設計書](docs/03-detailed-design.md) | 画面設計・API設計・認証フロー・状態管理 |
| [タスク分解](docs/04-task-breakdown.md) | 開発チェックリスト |
| [セキュリティレビュー](docs/05-security-review.md) | セキュリティ観点のレビュー結果 |

## セキュリティ

- 認証情報はサーバーサイドのみで処理し、永続化しない
- Firebase セキュリティルールによるデータアクセス制御
- 環境変数による秘密情報管理（`.env.local` は Git 管理外）
- DARTSLIVE 連携は認証済みユーザーのみ利用可能

## ライセンス

MIT
