# セキュリティレビュー

## ドキュメント情報

| 項目           | 内容                                                        |
| -------------- | ----------------------------------------------------------- |
| プロジェクト名 | Darts Lab                                                   |
| 初回作成日     | 2025-02-09                                                  |
| 最終更新日     | 2026-02-23                                                  |
| 対象範囲       | アプリケーション全体（GitHub公開 + Vercel本番デプロイ前提） |
| 総合評価       | **A-**（重大脆弱性なし、全中優先度項目対応済み）            |

---

## 1. レビュー観点と結果サマリー

| #   | 観点                             |  評価  | 備考                                                     |
| --- | -------------------------------- | :----: | -------------------------------------------------------- |
| 1   | 認証・セッション管理             |   OK   | NextAuth JWT + Firebase Auth デュアル認証                |
| 2   | 認可（ロールベースアクセス制御） |   OK   | admin/pro/general 3階層 + Firestore直接ロール検証        |
| 3   | 秘密情報の管理                   |   OK   | `.env.example` 作成済み、`ADMIN_EMAIL` 環境変数化済み    |
| 4   | フロントエンドの秘密情報         |   OK   | `NEXT_PUBLIC_` は Firebase公開キー・アフィリエイトIDのみ |
| 5   | XSS対策                          |   OK   | React自動エスケープ、react-markdown サニタイズ           |
| 6   | CSRF対策                         |   OK   | NextAuth.js 組み込みCSRF + 状態変更は全てPOST            |
| 7   | SSRF対策                         |   OK   | 画像プロキシにドメインホワイトリスト + HTTPS強制         |
| 8   | 入力バリデーション               |   OK   | 主要APIでZod使用（5ルート）、残りはSDK側検証             |
| 9   | DARTSLIVE認証情報                |   OK   | メモリ一時利用 or AES-256-GCM暗号化保存                  |
| 10  | ファイルアップロード             |   OK   | Storage ルールで型制限 + 5MB上限 + パス認可              |
| 11  | Webhook署名検証                  |   OK   | Stripe署名検証 + LINE HMAC-SHA256 timingSafeEqual        |
| 12  | CSVインジェクション              |   OK   | 数式プレフィックス無害化済み                             |
| 13  | セキュリティヘッダー             |   OK   | 7種設定済み（CSP nonce方式含む）                         |
| 14  | レートリミット                   |   OK   | Upstash Redis による分散レートリミット                   |
| 15  | 依存ライブラリ                   |   OK   | `npm audit` 脆弱性0件（2026-02-13時点）                  |
| 16  | エラーハンドリング               |   OK   | Sentry連携 + 汎用エラーメッセージ（内部詳細非露出）      |
| 17  | 暗号化                           |   OK   | AES-256-GCM + ランダムIV + 認証タグ                      |

---

## 2. 詳細レビュー

### 2.1 認証・セッション管理

**構成:**

- NextAuth.js v4 + JWT戦略（`lib/auth.ts`）
- Firebase Auth（メール/パスワード + Google OAuth）
- デュアル認証同期（`components/Providers.tsx` → `/api/firebase-token`）

**確認済み項目:**

- [x] パスワードは Firebase Auth が管理（アプリ側でハッシュ処理不要）
- [x] JWT署名キー（`NEXTAUTH_SECRET`）は環境変数管理
- [x] HTTPS前提（Vercel自動SSL + HSTS設定済み）
- [x] セッションCookieは HttpOnly, Secure, SameSite=lax（NextAuth.jsデフォルト）
- [x] JWTコールバックでFirestoreからロールを毎回再取得（ロール変更即反映）
- [x] カスタムトークン発行は認証済みセッション必須

---

### 2.2 認可（ロールベースアクセス制御）

**構成:**

- 3ロール: `admin`, `pro`, `general`（`lib/permissions.ts`）
- APIミドルウェア: `withAuth` / `withAdmin` / `withPermission`（`lib/api-middleware.ts`）
- `ADMIN_EMAIL` は環境変数化済み（`lib/auth.ts:8`）

**APIルート認証マトリクス（全30ルート）:**

| エンドポイント                       | 認証方式             | 認可レベル  | バリデーション         |
| ------------------------------------ | -------------------- | ----------- | ---------------------- |
| `POST /api/dartslive-stats`          | withPermission       | Pro以上     | Zod                    |
| `GET /api/dartslive-stats`           | withAuth             | ログイン    | —                      |
| `POST /api/admin/update-role`        | withAdmin            | Admin       | Zod                    |
| `POST /api/admin/update-pricing`     | withAdmin            | Admin       | Zod                    |
| `POST /api/stripe/checkout`          | withAuth             | ログイン    | —                      |
| `POST /api/stripe/portal`            | withAuth             | ログイン    | —                      |
| `POST /api/stripe/webhook`           | Stripe署名検証       | —           | Stripe SDK             |
| `POST /api/line/webhook`             | HMAC-SHA256署名      | —           | カスタム               |
| `POST /api/line/link`                | withAuth             | ログイン    | —                      |
| `POST /api/line/unlink`              | withAuth             | ログイン    | —                      |
| `POST /api/line/save-dl-credentials` | withAuth             | ログイン    | Zod                    |
| `GET /api/firebase-token`            | withAuth             | ログイン    | —                      |
| `GET /api/stats-history`             | withAuth             | ログイン    | クエリパラメータ       |
| `GET /api/stats-history/export`      | withPermission       | Pro以上     | —                      |
| `GET /api/pricing`                   | なし（公開）         | —           | —                      |
| `GET /api/proxy-image`               | なし（公開）         | —           | ドメインホワイトリスト |
| `GET /api/cron/daily-stats`          | Bearerトークン       | Cron Secret | —                      |
| `GET /api/og`                        | なし（Edge Runtime） | —           | —                      |
| `GET /api/cron/dartslive-api-sync`   | Bearerトークン       | Cron Secret | —                      |
| `GET /api/stats-calendar`            | withAuth             | ログイン    | —                      |
| `POST /api/goals`                    | withAuth             | ログイン    | Zod                    |
| `POST /api/goals/achieve`            | withAuth             | ログイン    | —                      |
| `POST /api/push-subscription`        | withAuth             | ログイン    | —                      |
| `GET /api/notifications`             | withAuth             | ログイン    | —                      |
| `POST /api/n01-import`               | withAuth             | ログイン    | —                      |
| `DELETE /api/account/delete`         | withAuth             | ログイン    | —                      |
| `POST /api/shops/fetch-url`          | withAdmin            | Admin       | —                      |
| `POST /api/shops/import-by-line`     | withAdmin            | Admin       | —                      |
| `GET /api/progression`               | withAuth             | ログイン    | —                      |
| `POST /api/admin/dartslive-sync`     | withAdmin            | Admin       | —                      |
| `GET /api/admin/dartslive-history`   | withAdmin            | Admin       | —                      |

**確認済み項目:**

- [x] adminルートはJWTロールだけでなくFirestoreから直接ロール確認（`withAdmin`）
- [x] Firestoreルールでもロール昇格を防止（`role` フィールド変更不可）
- [x] 権限関数は `lib/permissions.ts` に一元化
- [x] `ADMIN_EMAIL` は `process.env.ADMIN_EMAIL` から読み取り

**対応済み:**

- ~~スクリプト5ファイルに管理者メールアドレスがハードコード~~ → `process.env.ADMIN_EMAIL` に統一済み

---

### 2.3 秘密情報の管理

**環境変数分類（全49変数）:**

| 変数                                 | 分類     | GitHub公開 |
| ------------------------------------ | -------- | :--------: |
| `NEXT_PUBLIC_FIREBASE_*` (7)         | 公開キー |     可     |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | 公開キー |     可     |
| `NEXT_PUBLIC_RAKUTEN_AFFILIATE_ID`   | 公開ID   |     可     |
| `NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG`   | 公開ID   |     可     |
| `NEXT_PUBLIC_A8_MEDIA_ID`            | 公開ID   |     可     |
| `NEXT_PUBLIC_SENTRY_DSN`             | 公開DSN  |     可     |
| `NEXTAUTH_SECRET`                    | 秘密キー |    不可    |
| `FIREBASE_SERVICE_ACCOUNT_KEY`       | 秘密キー |    不可    |
| `STRIPE_SECRET_KEY`                  | 秘密キー |    不可    |
| `STRIPE_WEBHOOK_SECRET`              | 秘密キー |    不可    |
| `LINE_CHANNEL_SECRET`                | 秘密キー |    不可    |
| `LINE_CHANNEL_ACCESS_TOKEN`          | 秘密キー |    不可    |
| `ENCRYPTION_KEY`                     | 秘密キー |    不可    |
| `CRON_SECRET`                        | 秘密キー |    不可    |
| `ADMIN_EMAIL`                        | 設定値   |    不可    |

**対応状況:**

- [x] `.env*` が `.gitignore` に含まれている（`.env.example` は除外）
- [x] `.env.example` 作成済み（秘密情報なしのテンプレート）
- [x] `docs/test-accounts.md` が `.gitignore` に含まれている
- [x] `lib/auth.ts` の `ADMIN_EMAIL` は環境変数化済み
- [x] Firebase サービスアカウント JSON は未コミット

**対応済み:**

- ~~`scripts/` 配下5ファイルにメールアドレスがハードコード~~ → `process.env.ADMIN_EMAIL` に統一済み
  - `scripts/set-admin.ts`, `scripts/seed-article.ts`, `scripts/seed-articles-batch.ts`, `scripts/post-article.ts`, `scripts/post-article-from-json.ts`

---

### 2.4 Firestoreセキュリティルール

**ファイル:** `firestore.rules`（約200行）

**ヘルパー関数:**

- `isSignedIn()` — `request.auth != null`
- `isOwner(userId)` — `request.auth.uid == userId`
- `isAdmin()` — Firestore上のロールを `get()` で確認
- `isPro()` — `role == 'pro' || role == 'admin'`

**コレクション別ルール:**

| コレクション                  | 読み取り | 書き込み                         | 特記事項                                                             |
| ----------------------------- | -------- | -------------------------------- | -------------------------------------------------------------------- |
| `users/{userId}`              | 認証済み | 本人 or Admin                    | `role`, `stripeCustomerId` 等の変更を `diff().affectedKeys()` で禁止 |
| `users/{uid}/likes`           | 本人     | 本人                             | サブコレクション                                                     |
| `users/{uid}/bookmarks`       | 本人     | 本人                             | サブコレクション                                                     |
| `users/{uid}/barrelBookmarks` | 本人     | 本人                             | サブコレクション                                                     |
| `users/{uid}/settingHistory`  | 本人     | 本人                             | サブコレクション                                                     |
| `users/{uid}/dartsLiveStats`  | 本人     | 本人（Pro以上で作成/更新）       | サブコレクション                                                     |
| `users/{uid}/dartsliveCache`  | **拒否** | **拒否**                         | Admin SDK専用                                                        |
| `darts/{dartId}`              | 公開     | 投稿者 or Admin                  | `userId` でオーナー判定                                              |
| `darts/{dartId}/comments`     | 公開     | 認証済み作成 / 投稿者・Admin削除 | —                                                                    |
| `darts/{dartId}/memos`        | 本人     | 本人                             | プライベートメモ                                                     |
| `articles`                    | 公開     | Admin                            | —                                                                    |
| `discussions`                 | 公開     | Pro作成 / 複雑な更新ルール       | `replyCount` は +1 のみ許可                                          |
| `discussions/{id}/replies`    | 公開     | 認証済み / 投稿者・Admin削除     | —                                                                    |
| `barrels`                     | 公開     | **拒否**                         | Admin SDK専用                                                        |
| `barrelRanking`               | 公開     | **拒否**                         | Admin SDK専用                                                        |
| `config`                      | 公開     | **拒否**                         | Admin SDK専用                                                        |
| `stripeEvents`                | **拒否** | **拒否**                         | Admin SDK専用                                                        |
| `lineConversations`           | **拒否** | **拒否**                         | Admin SDK専用                                                        |
| `lineLinkCodes`               | **拒否** | **拒否**                         | Admin SDK専用                                                        |

**確認済みセキュリティ:**

- [x] ロール昇格防止: ユーザーは `role` フィールドを変更不可
- [x] Stripe関連フィールド保護: `stripeCustomerId`, `subscriptionId` 等も変更不可
- [x] `replyCount` 不正操作防止: `resource.data.replyCount + 1` のみ許可
- [x] Admin SDK専用コレクションは `read/write: false`
- [x] ユーザー作成時に `role` フィールド設定不可（`!('role' in request.resource.data)`）
- [x] Pro機能ゲート（`dartsLiveStats` 作成にPro以上が必要）

**脆弱性: なし**

---

### 2.5 Storageセキュリティルール

**ファイル:** `storage.rules`

| パス                   | 読み取り | 書き込み   | 制約                              |
| ---------------------- | -------- | ---------- | --------------------------------- |
| `/darts/{userId}/**`   | 公開     | 本人のみ   | image/(jpeg\|png\|gif\|webp)、5MB |
| `/avatars/{userId}/**` | 公開     | 本人のみ   | 同上                              |
| `/articles/**`         | 公開     | Admin のみ | Firestoreからロール確認           |
| その他                 | **拒否** | **拒否**   | デフォルト拒否                    |

**確認済み:**

- [x] MIMEタイプ制限: `request.resource.contentType.matches('image/(jpeg|png|gif|webp)')`
- [x] サイズ制限: `request.resource.size < 5 * 1024 * 1024`
- [x] パスベース認可: `{userId}` でオーナー判定
- [x] デフォルト拒否（未定義パスはすべてブロック）

**脆弱性: なし**

---

### 2.6 XSS（クロスサイトスクリプティング）対策

**確認済み項目:**

- [x] ReactのJSX自動エスケープ
- [x] `dangerouslySetInnerHTML` は `app/layout.tsx` のテーマ初期化スクリプトのみ（ハードコード文字列、ユーザー入力なし）
- [x] `.innerHTML` 代入なし
- [x] `eval()` / `new Function()` 使用なし
- [x] Markdownレンダリングは `react-markdown`（HTMLタグサニタイズ済み）
- [x] URLパラメータの直接DOM注入なし

**脆弱性: なし**

---

### 2.7 SSRF対策（画像プロキシ）

**ファイル:** `app/api/proxy-image/route.ts`

**実装済み対策:**

- [x] ドメインホワイトリスト: `dartshive.jp`, `www.dartshive.jp`, `image.dartshive.jp`, `firebasestorage.googleapis.com` の4ドメインのみ
- [x] HTTPS強制: `parsed.protocol !== 'https:'` でHTTPを拒否
- [x] サブドメイン検証: `endsWith` チェック
- [x] Content-Type検証: 画像MIMEタイプのみ許可
- [x] サイズ制限: 10MB上限（二重チェック）
- [x] SVGブロック（XSS防止）

**脆弱性: なし**（前回レビューからの改善完了）

---

### 2.8 Webhook署名検証

#### Stripe Webhook（`app/api/stripe/webhook/route.ts`）

- [x] `stripe.webhooks.constructEvent()` による署名検証
- [x] `STRIPE_WEBHOOK_SECRET` 環境変数によるシークレット管理
- [x] 冪等性: `stripeEvents/{eventId}` で重複イベント排除
- [x] 手動PRO（`subscriptionId` なし）のユーザーは自動ダウングレード対象外

#### LINE Webhook（`app/api/line/webhook/route.ts` + `lib/line.ts`）

- [x] HMAC-SHA256による署名検証
- [x] `crypto.timingSafeEqual()` による定数時間比較（タイミング攻撃防止）
- [x] `LINE_CHANNEL_SECRET` 環境変数によるシークレット管理

**脆弱性: なし**

---

### 2.9 DARTSLIVE データ連携のセキュリティ

**リスク評価:**

| リスク                 | 深刻度 | 対策状況                                                            |
| ---------------------- | :----: | ------------------------------------------------------------------- |
| 認証情報の永続化       |   高   | **対策済み**: オンデマンドデータ取得時はメモリのみ、Cron時はAES-256-GCM暗号化 |
| 認証情報のログ出力     |   高   | **対策済み**: エラーメッセージは汎用（「ログインに失敗しました」）  |
| ブラウザプロセスリーク |   中   | **対策済み**: `finally` ブロックで `browser.close()`                |
| MITM攻撃               |   低   | HTTPS通信（card.dartslive.com）                                     |

**オンデマンドデータ取得（POST `/api/dartslive-stats`）:**

- [x] Zodによる入力バリデーション（email + password）
- [x] `withPermission(canUseDartslive)` でPro以上に制限
- [x] 認証情報はPOSTボディで受信、関数スコープで自動破棄
- [x] Firestoreにはスタッツデータのみ保存（認証情報なし）
- [x] エラーログに認証情報が含まれない
- [x] `maxDuration = 60` でタイムアウト制御

**日次Cronバッチ処理（`app/api/cron/daily-stats/route.ts`）:**

- [x] Bearerトークン認証（`CRON_SECRET`）
- [x] DL認証情報はAES-256-GCMで暗号化保存（`lib/crypto.ts`）
- [x] `decrypt()` で復号 → 自動データ取得 → 関数スコープで破棄
- [x] ブラウザは全ユーザー処理後に `finally` で確実に閉じる
- [x] エラーログは `userId` のみ（認証情報なし）
- [x] `maxDuration = 300` でタイムアウト制御

---

### 2.10 暗号化実装

**ファイル:** `lib/crypto.ts`

| 項目         | 実装                                     |
| ------------ | ---------------------------------------- |
| アルゴリズム | AES-256-GCM（認証付き暗号）              |
| IV           | 12バイト、`randomBytes()` で毎回生成     |
| 認証タグ     | 16バイト（改ざん検出）                   |
| 鍵管理       | `ENCRYPTION_KEY` 環境変数（32バイトHex） |
| 出力形式     | `iv + authTag + ciphertext`（Hex文字列） |

**確認済み:**

- [x] ランダムIV（同一平文でも異なる暗号文）
- [x] 認証タグによる改ざん検出
- [x] 鍵は環境変数管理（ソースコードに含まれない）

**対応済み:**

- [x] 鍵ローテーション手順を `docs/DEVELOPER-REFERENCE.md` §8 に文書化済み

---

### 2.11 CSVインジェクション対策

**ファイル:** `app/api/stats-history/export/route.ts`

```typescript
let memo = (d.memo ?? '').replace(/"/g, '""');
if (/^[=+\-@\t\r]/.test(memo)) memo = `'${memo}`;
```

- [x] ダブルクォートエスケープ
- [x] 数式プレフィックス文字（`=`, `+`, `-`, `@`, `\t`, `\r`）をシングルクォートで無害化
- [x] UTF-8 BOM付き（Excel互換）

**脆弱性: なし**

---

### 2.12 セキュリティヘッダー

**ファイル:** `next.config.ts`（全ルートに適用）

| ヘッダー                    | 値                                         | 状態 |
| --------------------------- | ------------------------------------------ | :--: |
| `X-Content-Type-Options`    | `nosniff`                                  |  OK  |
| `X-Frame-Options`           | `DENY`                                     |  OK  |
| `Referrer-Policy`           | `strict-origin-when-cross-origin`          |  OK  |
| `X-DNS-Prefetch-Control`    | `on`                                       |  OK  |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains`      |  OK  |
| `Permissions-Policy`        | `camera=(), microphone=(), geolocation=()` |  OK  |
| `Content-Security-Policy`   | nonce方式（`proxy.ts` で設定）             |  OK  |

**CSP実装済み（`proxy.ts`）:**

- `script-src 'self' 'nonce-{random}'` — インラインスクリプトにnonce付与
- `style-src 'self' 'unsafe-inline'` — MUI/Emotion CSS-in-JS に必要
- `img-src` — Firebase Storage, dartshive, wsrv.nl, dicebear, Twitter 画像を許可
- `connect-src` — Firebase, Sentry の接続を許可
- `frame-src` — Twitter埋め込みのみ許可
- `object-src 'none'`, `base-uri 'self'`, `frame-ancestors 'none'`
- リクエストごとに `crypto.randomUUID()` でnonce生成
- `app/layout.tsx` でnonceをインラインスクリプトに付与

---

### 2.13 レートリミット

**ファイル:** `lib/api-middleware.ts`

| 項目           | 値                              |
| -------------- | ------------------------------- |
| ウィンドウ     | 60秒                            |
| 上限           | 60リクエスト/ウィンドウ         |
| 識別子         | IPアドレス（`x-forwarded-for`） |
| ストレージ     | Upstash Redis                   |
| クリーンアップ | 5分ごとに期限切れエントリを除去 |

**制約:**

- **Upstash Redisにより、サーバーレス環境でもインスタンス間でレートリミットが共有される**
- **Cronエンドポイント除外**: `/api/cron/daily-stats` はAPIミドルウェアを経由しないためレートリミット対象外（Bearerトークン認証のみ）
- **個人アプリ規模では十分**: 現在のユーザー数では実用上問題なし

**対応済み**: Upstash Redis によるグローバルレートリミットを導入済み

---

### 2.14 エラーハンドリング

**ファイル:** `lib/api-middleware.ts`

```typescript
// withErrorHandler の実装
} catch (error) {
  console.error(`${label}:`, error);    // サーバーログのみ
  Sentry.captureException(error);        // エラー監視
  return NextResponse.json(
    { error: 'Internal Server Error' },  // クライアントには汎用メッセージのみ
    { status: 500 }
  );
}
```

**確認済み:**

- [x] スタックトレースがクライアントに露出しない
- [x] Sentry連携によるエラー追跡
- [x] 認証エラーは汎用メッセージ（「ログインに失敗しました」）
- [x] 401/403/429/500 の適切なHTTPステータスコード使用

**脆弱性: なし**

---

### 2.15 CSRF対策

**確認済み:**

- [x] NextAuth.js組み込みCSRFトークン
- [x] 状態変更APIはすべてPOST/DELETE（GETは読み取り専用）
  - `GET /api/pricing` — 公開設定の読み取り
  - `GET /api/dartslive-stats` — キャッシュ取得
  - `GET /api/stats-history` — 履歴取得（認証必須）
  - `GET /api/stats-history/export` — CSV出力（認証+Pro必須）
  - `GET /api/firebase-token` — トークン発行（認証必須、冪等）
  - `GET /api/cron/daily-stats` — Bearerトークン必須

**脆弱性: なし**

---

### 2.16 依存ライブラリ

**`npm audit` 結果（2026-02-13）:**

```
found 0 vulnerabilities
```

**主要依存関係:**

| パッケージ       | バージョン | 状態               |
| ---------------- | ---------- | ------------------ |
| `next`           | 16.1.6     | 最新安定版         |
| `react`          | 19.x       | 最新安定版         |
| `firebase`       | 12.9.0     | 最新安定版         |
| `firebase-admin` | 13.6.1     | 最新安定版         |
| `next-auth`      | 4.24.13    | v4最新（v5はbeta） |
| `stripe`         | 20.3.1     | 最新安定版         |
| `zod`            | 4.3.6      | 最新安定版         |
| `puppeteer-core` | 24.37.2    | DARTSLIVE 自動データ取得 |
| `@sentry/nextjs` | 最新       | 設定済み           |

**推奨:** `npm audit` を月次で実行、dependabotの有効化を検討

---

## 3. GitHub公開チェックリスト

### 3.1 対応済み

- [x] `.env*` が `.gitignore` に含まれている
- [x] `.env.example` 作成済み（秘密情報なしテンプレート）
- [x] `docs/test-accounts.md` が `.gitignore` に含まれている
- [x] `lib/auth.ts` の `ADMIN_EMAIL` は環境変数化済み
- [x] Firebase サービスアカウント JSON は未コミット
- [x] 画像プロキシAPIにSSRF対策済み
- [x] Firestoreセキュリティルール設定済み
- [x] Storageセキュリティルール設定済み
- [x] セキュリティヘッダー全7種設定済み（CSP nonce方式含む）

### 3.2 残存リスク（低）

- [x] ~~`scripts/` 配下5ファイルにメールアドレスがハードコード~~ → 環境変数化済み
- [ ] Git履歴に過去コミットされた秘密情報がないか確認（`git log --all -p | grep -i secret` 等）

### 3.3 公開しても問題ない情報

- `NEXT_PUBLIC_FIREBASE_*` — Firestore/Storageルールで保護
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — 公開キー（Stripe仕様）
- アフィリエイトID — 公開前提の識別子
- Firestoreコレクション構造 — ルールで保護されていれば問題なし

---

## 4. Vercelデプロイ時のセキュリティ設定

| 設定項目              | 推奨値                                                      |
| --------------------- | ----------------------------------------------------------- |
| Environment Variables | すべての非`NEXT_PUBLIC_`変数を「Sensitive」として設定       |
| `NEXT_PUBLIC_*`       | 公開変数として設定（ビルド時に埋め込み）                    |
| Vercel Cron           | `vercel.json` で `/api/cron/daily-stats` のスケジュール設定 |
| Preview Deployments   | 必要に応じてパスワード保護                                  |
| Security Headers      | `next.config.ts` で6種 + `proxy.ts` でCSP設定済み           |

---

## 5. 改善候補（優先度順）

### 高優先度

| #   | 項目                     | 状態     | 備考                                                 |
| --- | ------------------------ | -------- | ---------------------------------------------------- |
| 1   | Firestoreルール強化      | **完了** | ロール昇格防止、フィールド制限、サブコレクション保護 |
| 2   | 画像プロキシSSRF対策     | **完了** | ドメインホワイトリスト + HTTPS強制 + サイズ制限      |
| 3   | `.env.example` 作成      | **完了** | 全環境変数のテンプレート                             |
| 4   | `ADMIN_EMAIL` 環境変数化 | **完了** | `lib/auth.ts` で `process.env.ADMIN_EMAIL` 使用      |
| 5   | Sentry エラー監視        | **完了** | `@sentry/nextjs` 導入済み                            |
| 6   | Rate Limiting            | **完了** | インメモリ実装（規模相応）                           |
| 7   | Webhook署名検証          | **完了** | Stripe + LINE 両方実装済み                           |
| 8   | DL認証情報暗号化         | **完了** | AES-256-GCM（Cron用）                                |

### 中優先度

| #   | 項目                              | 状態     | 説明                                                    |
| --- | --------------------------------- | -------- | ------------------------------------------------------- |
| 1   | CSPヘッダー追加                   | **完了** | `proxy.ts` でnonce方式CSP導入、`layout.tsx` にnonce付与 |
| 2   | scriptsのメールアドレス環境変数化 | **完了** | 5ファイルを `process.env.ADMIN_EMAIL` に統一            |
| 3   | 暗号鍵ローテーション手順文書化    | **完了** | `docs/DEVELOPER-REFERENCE.md` §8 に記載                 |
| 4   | Redis分散レートリミット           | **完了** | Upstash Redis 導入済み                                  |

### 低優先度

| #   | 項目                       | 説明                               |
| --- | -------------------------- | ---------------------------------- |
| 1   | Firebase App Check         | 不正クライアントからのアクセス防止 |
| 2   | セキュリティスキャンCI統合 | GitHub ActionsでSnyk/Trivy等       |
| 3   | WAF導入                    | Cloudflare / Vercel Firewall       |
