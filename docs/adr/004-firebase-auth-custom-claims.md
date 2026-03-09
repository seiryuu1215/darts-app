# ADR-004: Firebase Auth + カスタムクレーム認証設計

## ステータス

採用済み

## コンテキスト

アプリは以下の認証要件を持つ:

- メール/パスワード認証
- Google ソーシャルログイン
- 3 段階のロール管理（general / pro / admin）
- デモアカウント分離
- NextAuth との統合（セッション管理）

## 決定

**Firebase Auth** を認証基盤とし、**NextAuth** のカスタムプロバイダーとして統合する。ロール管理は Firebase カスタムクレーム + Firestore のハイブリッドで実現する。

## 設計

### 認証フロー

1. クライアントで Firebase Auth によるログイン
2. Firebase ID トークンを取得
3. NextAuth の `CredentialsProvider` に ID トークンを渡す
4. サーバー側で `firebase-admin` を使い ID トークンを検証
5. Firestore の `users/{id}` からロール情報を取得
6. NextAuth セッションに `id`, `role`, `email` 等を含める

### ロール管理

```
general（デフォルト）→ Stripe 決済完了 → pro
                    → ADMIN_EMAIL 一致 → admin
```

### デモアカウント

- 専用の `demoUser` ロール判定（`session.user.role === 'general'` + 特定 email）
- `useDemoGuard` フックで書き込み操作をブロック
- 日次 Cron (`/api/cron/reset-demo`) でデモデータをリセット

## 代替案

| 選択肢             | 不採用理由                                |
| ------------------ | ----------------------------------------- |
| Auth0              | Firebase エコシステムとの二重管理、コスト |
| Supabase Auth      | Firestore との統合が別途必要              |
| NextAuth のみ      | Firebase Firestore との認証統合が複雑化   |
| Firebase Auth のみ | SSR でのセッション管理が困難              |

## 結果

- Firebase Auth の安定性と NextAuth のセッション管理を両立
- `lib/permissions.ts` にロールベースの権限チェックを集約
- デモアカウントは useDemoGuard で UI レベルでの操作制限を実現
- JWT カスタムクレームとしてロールを含めることで、API ルートでの権限検証が効率的
