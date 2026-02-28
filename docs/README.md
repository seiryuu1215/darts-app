# Darts Lab — ドキュメント

> 最終更新: 2026-03-01

## インタラクティブ設計図

**[設計図ビューア → https://portfolio-seiryuu.vercel.app/projects/darts-lab](https://portfolio-seiryuu.vercel.app/projects/darts-lab)**

7つのインタラクティブ設計図（SVG + React）でシステム全体を可視化しています。
TSXソースは [`diagrams/`](./diagrams/) に収録。

---

## ドキュメント一覧

| ファイル | 内容 | 対象読者 |
|---|---|---|
| [01-requirements.md](./01-requirements.md) | 要件定義（機能要件・非機能要件） | 企画・PM |
| [02-basic-design.md](./02-basic-design.md) | **基本設計（SSOT）** — アーキテクチャ・DB・認証・外部連携・デプロイ | 全員 |
| [03-detailed-design.md](./03-detailed-design.md) | 詳細設計 — 画面設計・API設計・状態管理・コンポーネント設計 | 開発者 |
| [04-task-breakdown.md](./04-task-breakdown.md) | タスク分解・進捗管理 | PM・開発者 |
| [05-security-review.md](./05-security-review.md) | **セキュリティレビュー（SSOT）** — 全17観点・評価A- | セキュリティ |
| [ROLES-AND-PLANS.md](./ROLES-AND-PLANS.md) | **ロール・権限管理（SSOT）** — 3ロール・機能別マトリクス・プラン設計 | 企画・開発者 |
| [DEVELOPER-REFERENCE.md](./DEVELOPER-REFERENCE.md) | 開発者リファレンス — コードウォークスルー・実装パターン | 開発者 |
| [CRON.md](./CRON.md) | Cronバッチ設計 — 日次自動処理パイプライン | 開発者・運用 |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | ~~旧アーキテクチャ設計書~~ → 02-basic-design.md に統合済み | — |

---

## 読み方ガイド

### 新規開発者

1. **[02-basic-design.md](./02-basic-design.md)** — システム全体像（構成図・DB・認証フロー）
2. **[DEVELOPER-REFERENCE.md](./DEVELOPER-REFERENCE.md)** — コードの読み方・実装パターン
3. **[ROLES-AND-PLANS.md](./ROLES-AND-PLANS.md)** — 権限体系の理解

### セキュリティレビュー

1. **[05-security-review.md](./05-security-review.md)** — 全観点の詳細レビュー
2. **[02-basic-design.md §6](./02-basic-design.md#6-外部連携設計)** — DL連携のセキュリティ対策

### 機能企画

1. **[01-requirements.md](./01-requirements.md)** — 現在の要件
2. **[ROLES-AND-PLANS.md](./ROLES-AND-PLANS.md)** — PRO機能・制限一覧
3. **[設計図ビューア「要件・ペルソナ」タブ](https://portfolio-seiryuu.vercel.app/projects/darts-lab)** — 機能マップ・ペルソナ・技術選定

---

## SSOT（Single Source of Truth）方針

重複を避けるため、以下のトピックは正規ソースを1箇所に定め、他ドキュメントからはリンク参照しています。

| トピック | 正規ソース |
|---|---|
| アーキテクチャ・DB設計・デプロイ | [02-basic-design.md](./02-basic-design.md) |
| ロール・権限マトリクス | [ROLES-AND-PLANS.md](./ROLES-AND-PLANS.md) |
| セキュリティ | [05-security-review.md](./05-security-review.md) |
| Cronバッチ | [CRON.md](./CRON.md) |
