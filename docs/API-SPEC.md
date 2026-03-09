# API 仕様書

## 概要

Darts Lab のバックエンド API 仕様。全ルートは Next.js App Router の Route Handlers として実装。

---

## 認証方式

- NextAuth セッション（Cookie ベース）
- API ミドルウェア `withAuth` でセッション検証
- Cron ジョブは `Authorization: Bearer $CRON_SECRET` ヘッダーで認証

## ベースURL

```
本番: https://darts-app-lime.vercel.app
開発: http://localhost:3000
```

---

## API ルート一覧

### 認証系

| メソッド | パス                      | 認証 | 説明                          |
| -------- | ------------------------- | ---- | ----------------------------- |
| ALL      | `/api/auth/[...nextauth]` | -    | NextAuth 認証ハンドラー       |
| GET      | `/api/firebase-token`     | 要   | Firebase カスタムトークン取得 |
| DELETE   | `/api/account/delete`     | 要   | アカウント永久削除            |

### ユーザーデータ

| メソッド | パス                     | 認証 | 説明                         |
| -------- | ------------------------ | ---- | ---------------------------- |
| GET      | `/api/notifications`     | 要   | 未読通知取得                 |
| PATCH    | `/api/notifications`     | 要   | 通知を既読にする             |
| GET      | `/api/progression`       | 要   | XP・レベル・ランク・実績取得 |
| POST     | `/api/push-subscription` | 要   | Web Push 購読登録            |

### DARTSLIVE スタッツ

| メソッド                  | パス                        | 認証    | 説明                             |
| ------------------------- | --------------------------- | ------- | -------------------------------- |
| POST                      | `/api/dartslive-stats`      | 要      | DARTSLIVE ログイン＆スタッツ取得 |
| GET                       | `/api/stats-calendar`       | 要      | カレンダー用月別データ           |
| GET,POST,PUT,PATCH,DELETE | `/api/stats-history`        | 要      | スタッツ履歴 CRUD                |
| GET                       | `/api/stats-history/export` | 要(PRO) | CSV エクスポート                 |
| GET                       | `/api/health-correlation`   | 要      | ヘルス×ダーツ相関分析            |
| POST                      | `/api/n01-import`           | 要      | N01 CSV インポート               |

### 目標管理

| メソッド                  | パス                 | 認証 | 説明              |
| ------------------------- | -------------------- | ---- | ----------------- |
| GET,POST,PUT,PATCH,DELETE | `/api/goals`         | 要   | 目標 CRUD         |
| POST                      | `/api/goals/achieve` | 要   | 目標達成 + XP付与 |

### 決済

| メソッド | パス                   | 認証       | 説明                      |
| -------- | ---------------------- | ---------- | ------------------------- |
| GET      | `/api/pricing`         | -          | 料金プラン情報取得        |
| POST     | `/api/stripe/checkout` | 要         | Checkout セッション作成   |
| POST     | `/api/stripe/portal`   | 要         | カスタマーポータルURL生成 |
| POST     | `/api/stripe/webhook`  | Stripe署名 | Webhook イベント処理      |

### LINE 連携

| メソッド | パス                            | 認証     | 説明                          |
| -------- | ------------------------------- | -------- | ----------------------------- |
| POST     | `/api/line/webhook`             | LINE署名 | LINE Bot Webhook              |
| POST     | `/api/line/link`                | 要       | LINE アカウント連携コード発行 |
| POST     | `/api/line/unlink`              | 要       | LINE アカウント連携解除       |
| POST     | `/api/line/save-dl-credentials` | LINE署名 | DARTSLIVE 認証情報保存        |
| POST     | `/api/line/save-px-credentials` | LINE署名 | Phoenix 認証情報保存          |

### ショップ

| メソッド | パス                        | 認証    | 説明                           |
| -------- | --------------------------- | ------- | ------------------------------ |
| POST     | `/api/shops/import-by-line` | 要(PRO) | 路線からショップ自動インポート |
| POST     | `/api/shops/fetch-url`      | 要      | URL メタデータ取得             |

### アフィリエイト

| メソッド | パス                   | 認証      | 説明                 |
| -------- | ---------------------- | --------- | -------------------- |
| POST     | `/api/affiliate/track` | -         | クリックトラッキング |
| GET      | `/api/affiliate/stats` | 要(admin) | クリック統計取得     |

### PDF エクスポート

| メソッド | パス                            | 認証 | 説明                  |
| -------- | ------------------------------- | ---- | --------------------- |
| GET      | `/api/export-pdf?month=YYYY-MM` | 要   | 月次レポート PDF 生成 |

### 管理者

| メソッド | パス                           | 認証      | 説明                |
| -------- | ------------------------------ | --------- | ------------------- |
| POST     | `/api/admin/update-role`       | 要(admin) | ユーザーロール変更  |
| POST     | `/api/admin/update-pricing`    | 要(admin) | 料金設定変更        |
| POST     | `/api/admin/dartslive-sync`    | 要(admin) | 手動 DARTSLIVE 同期 |
| GET      | `/api/admin/dartslive-history` | 要(admin) | DARTSLIVE 同期履歴  |
| POST     | `/api/admin/phoenix-sync`      | 要(admin) | 手動 Phoenix 同期   |
| GET      | `/api/admin/phoenix-stats`     | 要(admin) | Phoenix スタッツ    |
| POST     | `/api/admin/line-test`         | 要(admin) | LINE 通知テスト     |

### Cron ジョブ

| メソッド | パス                           | 認証        | 説明                    |
| -------- | ------------------------------ | ----------- | ----------------------- |
| GET      | `/api/cron/daily-stats`        | CRON_SECRET | 日次スタッツ同期 + 通知 |
| GET      | `/api/cron/dartslive-api-sync` | CRON_SECRET | API 経由のデータ同期    |
| GET      | `/api/cron/reset-demo`         | CRON_SECRET | デモアカウントリセット  |

### システム

| メソッド | パス                       | 認証 | 説明           |
| -------- | -------------------------- | ---- | -------------- |
| GET      | `/api/health`              | -    | ヘルスチェック |
| GET      | `/api/proxy-image?url=...` | -    | 画像プロキシ   |

---

## 主要エンドポイント詳細

### GET /api/stats-calendar

カレンダー表示用の月別スタッツデータを取得。

**パラメータ:**
| 名前 | 型 | 必須 | 説明 |
|------|------|------|------|
| year | number | ✓ | 年 |
| month | number | ✓ | 月 (1-12) |

**レスポンス:**

```json
{
  "year": 2026,
  "month": 3,
  "records": [
    {
      "id": "docId",
      "date": "2026-03-01T15:00:00.000Z",
      "rating": 5.67,
      "ppd": 21.5,
      "mpr": 2.1,
      "gamesPlayed": 15,
      "condition": 4,
      "memo": "調子良かった",
      "challenge": "ブル率向上",
      "dBull": 12,
      "sBull": 8,
      "bullRate": 35.2,
      "avg01": 450.5,
      "highOff": 120,
      "cricketHighScore": 3.5,
      "ton80": 0,
      "lowTon": 3,
      "highTon": 1,
      "hatTrick": 0,
      "threeInABed": 0,
      "threeInABlack": 0,
      "whiteHorse": 0
    }
  ]
}
```

### GET /api/export-pdf

月次レポートをPDFとして生成。

**パラメータ:**
| 名前 | 型 | 必須 | 説明 |
|------|------|------|------|
| month | string | ✓ | YYYY-MM形式 |

**レスポンス:** `application/pdf` バイナリ

### POST /api/stripe/checkout

Stripe Checkout セッション作成。

**リクエストボディ:**

```json
{
  "priceId": "price_xxx"
}
```

**レスポンス:**

```json
{
  "url": "https://checkout.stripe.com/..."
}
```

### GET /api/health

**レスポンス:**

```json
{
  "status": "ok",
  "firestore": { "latency": 45 },
  "timestamp": "2026-03-10T00:00:00.000Z"
}
```

---

## エラーコード一覧

| ステータス | コード                | 説明                                            |
| ---------- | --------------------- | ----------------------------------------------- |
| 400        | Bad Request           | パラメータ不正                                  |
| 401        | Unauthorized          | 未認証                                          |
| 403        | Forbidden             | 権限不足（ロール不足、PRO限定機能へのアクセス） |
| 404        | Not Found             | リソースが存在しない                            |
| 429        | Too Many Requests     | レート制限超過                                  |
| 500        | Internal Server Error | サーバー内部エラー                              |

**エラーレスポンス形式:**

```json
{
  "error": "エラーメッセージ"
}
```
