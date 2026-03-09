# 管理者マニュアル

## 概要

Darts Lab の管理機能に関する操作手順書。管理者（`role: admin`）向け。

---

## 1. 管理画面アクセス

管理者アカウントでログイン後、ヘッダーのユーザーメニューから **「ユーザ管理」** を選択。

- URL: `/admin/users`
- アクセス権限: `admin` ロールのみ

## 2. ユーザー管理

### 2.1 ユーザー一覧

`/admin/users` でユーザー一覧を確認可能。

表示項目:

- ユーザー名 / メール / ロール / 作成日
- DARTSLIVE 連携状態
- サブスクリプション状態

### 2.2 ロール変更

1. ユーザー一覧から対象ユーザーを選択
2. ロールを `general` / `pro` / `admin` から選択
3. 「更新」ボタンで反映

API エンドポイント: `POST /api/admin/update-role`

```json
{
  "userId": "xxx",
  "role": "pro"
}
```

### 2.3 管理者の自動昇格

環境変数 `ADMIN_EMAIL` に設定されたメールアドレスでログインしたユーザーは、自動的に `admin` ロールに昇格する。

## 3. プラン・料金管理

### 3.1 料金設定変更

- URL: `/admin/pricing`
- PRO プランの月額料金を変更可能
- 変更は即座に `/pricing` ページに反映

### 3.2 Stripe ダッシュボード連携

- Stripe ダッシュボード: https://dashboard.stripe.com
- サブスクリプション一覧、支払い履歴、請求書を確認
- 返金処理は Stripe ダッシュボードから実施

## 4. デモアカウント管理

### 4.1 デモアカウントの仕様

- 特定のメールアドレスで識別
- 書き込み操作は `useDemoGuard` でフロントエンドでブロック
- API レベルでもデモユーザーの書き込みを制限

### 4.2 デモデータリセット

Cron ジョブ `/api/cron/reset-demo` で毎日自動リセット。

手動リセット:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://darts-app-lime.vercel.app/api/cron/reset-demo
```

## 5. DARTSLIVE 手動同期

ユーザーの DARTSLIVE データを手動で同期する場合:

```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId": "xxx"}' \
  https://darts-app-lime.vercel.app/api/admin/dartslive-sync
```

## 6. 問い合わせ対応フロー

1. X (Twitter) の @seiryuu_darts への DM を確認
2. 問題の種類を特定:
   - **アカウント関連**: ユーザー管理画面で確認・対応
   - **決済関連**: Stripe ダッシュボードで確認
   - **バグ報告**: GitHub Issues に起票
   - **機能要望**: GitHub Discussions に記録
3. 対応完了後、ユーザーに返信

## 7. LINE Bot 管理

### 7.1 LINE 公式アカウント

- LINE Developers Console: https://developers.line.biz
- Webhook URL: `https://darts-app-lime.vercel.app/api/line/webhook`

### 7.2 テスト通知送信

```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId": "xxx"}' \
  https://darts-app-lime.vercel.app/api/admin/line-test
```
