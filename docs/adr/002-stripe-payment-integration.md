# ADR-002: Stripe 決済統合

## ステータス

採用済み

## コンテキスト

アプリに PRO プラン（有料サブスクリプション）を導入するにあたり、決済基盤を選定する必要があった。要件:

- 月額サブスクリプション対応
- テスト環境での開発容易性
- Webhook によるリアルタイムなプラン状態管理
- PCI DSS 準拠（カード情報の非保持）

## 決定

**Stripe** を決済プラットフォームとして採用する。

## 設計方針

### 決済フロー

1. ユーザーが `/pricing` ページで PRO プランを選択
2. `/api/stripe/checkout` が Stripe Checkout Session を作成
3. Stripe ホスト型の決済ページにリダイレクト
4. 決済完了後、Stripe Webhook (`/api/stripe/webhook`) が発火
5. Webhook 内で Firestore の `users/{id}.role` を `pro` に更新

### Webhook戦略

- `checkout.session.completed`: 初回決済完了 → role を pro に変更
- `customer.subscription.deleted`: 解約 → role を general に変更
- `invoice.payment_failed`: 決済失敗 → 通知処理

### カスタマーポータル

- `/api/stripe/customer-portal` で Stripe カスタマーポータルへのリダイレクトを提供
- プラン変更・解約はポータル経由で Stripe 側に委譲

## 代替案

| 選択肢   | 不採用理由                                   |
| -------- | -------------------------------------------- |
| PayPal   | 日本での利用体験が劣る、Webhook の信頼性     |
| LINE Pay | グローバル対応不可、サブスクリプション非対応 |
| 自前実装 | PCI DSS 準拠のコスト・リスクが高すぎる       |

## 結果

- 3つの API ルート（checkout, webhook, customer-portal）で完結
- テスト環境での動作確認が容易（Stripe CLI でローカル Webhook テスト可能）
- role ベースの権限管理（`lib/permissions.ts`）と自然に統合
