# セキュリティレビュー

## ドキュメント情報

| 項目 | 内容 |
|------|------|
| プロジェクト名 | Darts App |
| 作成日 | 2025-02-09 |
| 対象範囲 | アプリケーション全体（GitHub公開 + Vercel本番デプロイ前提） |

---

## 1. レビュー観点と結果サマリー

| # | 観点 | 評価 | 備考 |
|---|------|:----:|------|
| 1 | 認証・セッション管理 | OK | NextAuth.js JWT方式、適切な認証チェック |
| 2 | 認可（ロールベースアクセス制御） | OK | admin/pro/general の3階層、APIルートで検証 |
| 3 | 秘密情報の管理 | 要対応 | `.env.local` は gitignore 済み。`.env.example` 未作成 |
| 4 | フロントエンドの秘密情報 | OK | `NEXT_PUBLIC_` は Firebase公開キーのみ |
| 5 | XSS対策 | OK | React自動エスケープ、react-markdown使用 |
| 6 | CSRF対策 | OK | NextAuth.js 組み込みCSRFトークン |
| 7 | SQLインジェクション | N/A | Firestore使用（SQLなし） |
| 8 | 入力バリデーション | 一部要改善 | APIルートで基本チェックあり、型検証は部分的 |
| 9 | DARTSLIVE認証情報の取り扱い | 要注意 | 一時利用のみ（非保存）だが、リスク明記必要 |
| 10 | 依存ライブラリの脆弱性 | 要確認 | `npm audit` の定期実行を推奨 |
| 11 | エラーハンドリング | OK | 内部エラーの詳細を非露出 |
| 12 | ファイルアップロード | 一部要改善 | Firebase Storage使用、サイズ制限は Storage ルール依存 |
| 13 | ログ出力 | 要改善 | 認証情報がログに含まれないことの確認 |
| 14 | CORS | OK | Firebase Storage CORS設定済み、画像プロキシAPI |

---

## 2. 詳細レビュー

### 2.1 認証・セッション管理

**現状:**
- NextAuth.js v4 + JWT戦略
- Firebase Auth によるメール/パスワード認証
- セッション有効期限: NextAuth.jsデフォルト（30日）
- `getServerSession(authOptions)` による API ルートでの認証検証

**確認済み項目:**
- [x] パスワードは Firebase Auth が管理（アプリ側でハッシュ処理不要）
- [x] JWT署名キー（`NEXTAUTH_SECRET`）は環境変数管理
- [x] ログインページは HTTPS 前提（Vercel 自動SSL）
- [x] セッションCookie は HttpOnly, Secure（NextAuth.jsデフォルト）

**改善推奨:**
- [ ] `NEXTAUTH_SECRET` が未設定の場合の起動時警告追加を検討
- [ ] JWT有効期限の明示的な設定を検討（デフォルト30日で問題なければそのまま）

---

### 2.2 認可（ロールベースアクセス制御）

**現状:**
- 3ロール: `admin`, `pro`, `general`
- admin判定: `lib/auth.ts` でハードコードされたメールアドレスによる自動昇格
- API認可: `app/api/admin/update-role/route.ts` で Firestore から直接ロール確認

**確認済み項目:**
- [x] admin APIルートで JWTのロールだけでなく Firestore から直接確認（改ざん対策）
- [x] ロール変更時の入力バリデーション（`VALID_ROLES` によるホワイトリスト）
- [x] 対象ユーザー存在確認

**注意事項:**
- `ADMIN_EMAIL` がソースコードにハードコード → GitHub公開時にメールアドレスが公開される
  - **対応案**: 環境変数 `ADMIN_EMAIL` に移行、または公開を許容する判断

---

### 2.3 秘密情報の管理

**現状の環境変数分類:**

| 変数 | 分類 | GitHub公開 |
|------|------|:----------:|
| `NEXT_PUBLIC_FIREBASE_*` | 公開キー | 可（Firestore ルールで保護） |
| `NEXTAUTH_SECRET` | 秘密キー | 不可 |
| `NEXTAUTH_URL` | 設定値 | 不可 |
| `GOOGLE_APPLICATION_CREDENTIALS` | 秘密キー | 不可 |

**確認済み項目:**
- [x] `.env*` が `.gitignore` に含まれている
- [x] `docs/test-accounts.md` が `.gitignore` に含まれている
- [x] `NEXT_PUBLIC_` プレフィックスのない変数はサーバーサイドのみ

**要対応:**
- [ ] `.env.example` を作成（秘密情報を除いたテンプレート）
- [ ] ソースコード内のハードコードされた値の確認:
  - `lib/auth.ts:8` — `ADMIN_EMAIL = 'mt.oikawa@gmail.com'`（個人メールアドレス）
  - スクレイピングスクリプト内のテスト認証情報がないことの確認

---

### 2.4 Firebase 公開キーについて

Firebase の `NEXT_PUBLIC_` 環境変数（API Key等）はブラウザに公開されるが、これは設計上意図的である。

**セキュリティは以下で担保:**
- Firestore セキュリティルール（読み書き権限の制御）
- Firebase Auth（認証済みユーザーのみ書き込み可）
- Firebase App Check（導入推奨だが未実装）

**リスク:**
- Firestore ルールが不適切な場合、公開キーを使って不正なデータ操作が可能
- → **Firestore ルールの適切な設定が必須**

---

### 2.5 XSS（クロスサイトスクリプティング）対策

**確認済み項目:**
- [x] React のJSX自動エスケープにより、ユーザー入力はHTML として解釈されない
- [x] `dangerouslySetInnerHTML` の使用箇所なし
- [x] Markdown レンダリングは `react-markdown`（HTMLタグをサニタイズ）
- [x] URL パラメータの直接DOM注入なし

---

### 2.6 DARTSLIVE スクレイピングのセキュリティ

**リスク評価:**

| リスク | 深刻度 | 対策状況 |
|--------|:------:|---------|
| 認証情報の永続化 | 高 | 対策済み: メモリ上でのみ使用、Firestore非保存 |
| 認証情報のログ出力 | 高 | 要確認: `console.error` でリクエストボディがログされないこと |
| ブラウザプロセスリーク | 中 | 対策済み: `finally` ブロックで `browser.close()` |
| MITM攻撃 | 低 | HTTPS通信（card.dartslive.com） |
| DARTSLIVEの利用規約 | 中 | スクレイピングの合法性は要確認 |

**対策の実装状況:**
- [x] 認証情報は POST ボディで受信、変数に格納後は関数スコープで自動破棄
- [x] Firestore には認証情報を保存しない（スタッツデータのみ保存）
- [x] `finally` ブロックでブラウザを確実に終了
- [x] API ルートは認証済みユーザーのみアクセス可能
- [x] Firebase Admin SDK によるサーバーサイド書き込み（Firestore ルール不要）

**ユーザーへの告知事項（UI に記載済み）:**
> 「認証情報はサーバーに保存されません」

---

### 2.7 入力バリデーション

**APIルート別:**

| エンドポイント | バリデーション | 評価 |
|---------------|---------------|:----:|
| `/api/dartslive-stats` | email, password の存在チェック | OK |
| `/api/admin/update-role` | userId, role の存在 + ロールホワイトリスト | OK |
| `/api/proxy-image` | URL パラメータの存在チェック | 要改善 |

**改善推奨:**
- [ ] `/api/proxy-image` — 許可ドメインのホワイトリスト追加（SSRF対策）
- [ ] 全APIルート — リクエストボディのサイズ制限（Next.js デフォルト: 1MB）

---

### 2.8 画像プロキシ API（SSRF リスク）

**現状:**
- `/api/proxy-image?url=...` で任意のURLにサーバーからリクエスト
- SSRF（Server-Side Request Forgery）のリスクあり

**対策推奨:**
- [ ] 許可ドメインのホワイトリスト（例: `dartshive.com`, `firebasestorage.googleapis.com`）
- [ ] プライベートIP範囲への接続拒否（`10.x.x.x`, `192.168.x.x`, `127.0.0.1`）
- [ ] レスポンスサイズの上限設定

---

### 2.9 ファイルアップロード

**現状:**
- Firebase Storage にダーツ画像を直接アップロード（クライアントSDK）
- Storage セキュリティルールに依存

**確認推奨:**
- [ ] Storage ルールでファイルサイズ上限を設定（例: 5MB）
- [ ] アップロード可能なファイルタイプの制限（`image/jpeg`, `image/png`, `image/webp`）
- [ ] 認証済みユーザーのみアップロード可能であること

---

### 2.10 依存ライブラリ

**定期確認推奨:**
```bash
npm audit
```

**主要な依存関係:**
- `next` 16.1 — 最新安定版
- `firebase` 12 — 最新安定版
- `next-auth` 4 — 安定版（v5は beta）
- `puppeteer` 24 — 最新安定版

---

## 3. GitHub 公開前チェックリスト

### 3.1 公開してはいけない情報

- [ ] `.env.local` が gitignore に含まれている → **確認済み**
- [ ] `docs/test-accounts.md` が gitignore に含まれている → **確認済み**
- [ ] ソースコード内に API キーやパスワードがハードコードされていない
  - **注意**: `lib/auth.ts` にメールアドレスがハードコード
- [ ] Git履歴に秘密情報が含まれていない
- [ ] Firebase サービスアカウント JSON がコミットされていない

### 3.2 公開しても問題ない情報

- `NEXT_PUBLIC_FIREBASE_API_KEY` 等 — Firebase側のセキュリティルールで保護
- Firestore コレクション構造 — ルールで保護されていれば問題なし

### 3.3 公開前に実施すべき対応

1. [ ] `.env.example` の作成
2. [ ] `ADMIN_EMAIL` のハードコード解消（環境変数化）
3. [ ] `npm audit` の実行と脆弱性対応
4. [ ] Firestore セキュリティルールの最終確認
5. [ ] Firebase Storage ルールの最終確認
6. [ ] 画像プロキシAPIのSSRF対策
7. [ ] git log でコミット履歴に秘密情報が含まれていないか確認

---

## 4. Vercel デプロイ時のセキュリティ設定

| 設定項目 | 推奨値 |
|----------|-------|
| Environment Variables | `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `GOOGLE_APPLICATION_CREDENTIALS` を秘密変数として設定 |
| `NEXT_PUBLIC_*` | 公開変数として設定（ビルド時に埋め込まれる） |
| Preview Deployments | 必要に応じてパスワード保護 |
| Security Headers | `next.config.ts` で X-Frame-Options, CSP 等を検討 |

---

## 5. 今後の改善候補（優先度順）

| # | 項目 | 優先度 | 説明 |
|---|------|:------:|------|
| 1 | Firestore ルール強化 | 高 | ユーザー単位の書き込み制限、サブコレクションのルール |
| 2 | 画像プロキシ SSRF対策 | 高 | ドメインホワイトリスト |
| 3 | `.env.example` 作成 | 高 | 開発者向け環境変数テンプレート |
| 4 | `ADMIN_EMAIL` 環境変数化 | 中 | ソースコードからの個人情報除去 |
| 5 | Firebase App Check 導入 | 中 | 不正クライアントからのアクセス防止 |
| 6 | Rate Limiting | 中 | DARTSLIVE API のレート制限 |
| 7 | CSP ヘッダー設定 | 低 | Content-Security-Policy の設定 |
| 8 | Sentry等のエラー監視 | 低 | 本番環境でのエラートラッキング |
