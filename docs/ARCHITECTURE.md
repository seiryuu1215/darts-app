# Darts Lab — アーキテクチャ設計

## インタラクティブ設計図

**[設計図ビューア → https://portfolio-seiryuu.vercel.app/projects/darts-lab](https://portfolio-seiryuu.vercel.app/projects/darts-lab)**

7つのインタラクティブ設計図（SVG + React）でシステム全体を可視化しています。

| 設計図               | 内容                                             |
| -------------------- | ------------------------------------------------ |
| アーキテクチャ全体図 | サーバーレス構成・外部サービス連携・データフロー |
| 認証・決済フロー     | NextAuth + Stripe Checkout → Webhook フロー      |
| Cron パイプライン    | 日次バッチの処理順序・依存関係                   |
| ER 図                | Firestore コレクション・サブコレクション構造     |
| API データフロー     | クライアント ↔ API ↔ 外部サービスの通信経路      |
| ページ遷移図         | App Router のルーティング・認証ガード            |
| 要件・ペルソナ       | 機能マップ・ペルソナ・技術選定理由               |

TSX ソースは [`diagrams/`](./diagrams/) に収録。

## 詳細ドキュメント

設計の詳細は以下を参照してください。

- **[基本設計書](./02-basic-design.md)** — システム構成・技術選定理由・DB設計・外部連携
- **[詳細設計書](./03-detailed-design.md)** — 画面設計・API設計・認証フロー・状態管理
- **[セキュリティレビュー](./05-security-review.md)** — 全17観点のレビュー結果
- **[Cronバッチ設計](./CRON.md)** — 日次自動処理パイプライン
