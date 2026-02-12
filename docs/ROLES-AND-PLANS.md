# ロール・権限管理 / プラン設計書

## 概要

本アプリは3つのユーザーロールで機能制限を管理する。
権限判定は `lib/permissions.ts` に集約し、各ページ・APIで参照する。

---

## ロール定義

| ロール       | 識別値    | 付与方法                                                         |
| ------------ | --------- | ---------------------------------------------------------------- |
| 一般ユーザー | `general` | 新規登録時のデフォルト                                           |
| PROユーザー  | `pro`     | 管理者が `/admin/users` から手動変更                             |
| 管理者       | `admin`   | `ADMIN_EMAIL` 環境変数と一致するメールで自動付与、または手動変更 |

> **注記**: 現時点では決済（Stripe等）連携は未実装。PRO昇格は管理者の手動操作のみ。
> 支援窓口として Buy Me a Coffee を設置している。

---

## 機能別アクセス権限マトリクス

### セッティング（ダーツ構成）

| 機能                         | 一般 (general) | PRO (pro) | 管理者 (admin) |
| ---------------------------- | :------------: | :-------: | :------------: |
| セッティング閲覧             |       ○        |     ○     |       ○        |
| セッティング登録             |  **3件まで**   |  無制限   |     無制限     |
| 自分のセッティング編集・削除 |       ○        |     ○     |       ○        |

- 上限定数: `SETTINGS_LIMIT_GENERAL = 3` (`lib/permissions.ts`)
- 判定関数: `getSettingsLimit(role)` — PRO/admin は `null`（無制限）、general は `3`
- 制限箇所: `app/darts/new/page.tsx` でサーバー件数を確認し、上限到達時は登録不可

### DARTSLIVE連携

| 機能                 | 一般 (general) | PRO (pro) | 管理者 (admin) |
| -------------------- | :------------: | :-------: | :------------: |
| スタッツ取得・表示   |       ×        |     ○     |       ○        |
| スタッツ履歴保存     |       ×        |     ○     |       ○        |
| LINE自動スタッツ通知 |       ×        |     ○     |       ○        |

- 判定関数: `canUseDartslive(role)`
- 制限箇所:
  - `app/stats/page.tsx` — UIにペイウォール表示（PRO未満はロック状態）
  - `app/api/dartslive-stats/route.ts` — API側でも権限チェック（403返却）
  - `app/api/stats-history/route.ts` — 履歴API権限チェック

### 記事

| 機能                           | 一般 (general) | PRO (pro) | 管理者 (admin) |
| ------------------------------ | :------------: | :-------: | :------------: |
| 記事閲覧                       |       ○        |     ○     |       ○        |
| 記事作成                       |       ×        |     ○     |       ○        |
| 自分の記事編集                 |       ×        |     ○     |       ○        |
| 他人の記事編集                 |       ×        |     ×     |       ○        |
| 記事タイプ変更（article/page） |       ×        |     ×     |       ○        |
| 注目記事フラグ設定             |       ×        |     ×     |       ○        |

- 判定関数: `canWriteArticles(role)`, `canEditArticle(role, articleUserId, currentUserId)`, `isAdmin(role)`
- 制限箇所:
  - `app/articles/page.tsx` — 「新規作成」ボタンの表示/非表示
  - `app/articles/new/page.tsx` — ページアクセス制御 + 記事タイプUI
  - `app/articles/[slug]/edit/page.tsx` — 編集権限チェック

### バレルDB・レコメンド

| 機能                     | 一般 (general) | PRO (pro) | 管理者 (admin) |
| ------------------------ | :------------: | :-------: | :------------: |
| バレル検索・フィルタ     |       ○        |     ○     |       ○        |
| バレルブックマーク       |       ○        |     ○     |       ○        |
| レコメンド（類似バレル） |       ○        |     ○     |       ○        |
| レコメンド（クイズ）     |       ○        |     ○     |       ○        |

> バレル関連機能にロール制限はない。全ユーザーが利用可能。

### 管理機能

| 機能                          | 一般 (general) | PRO (pro) | 管理者 (admin) |
| ----------------------------- | :------------: | :-------: | :------------: |
| ユーザー一覧・ロール変更      |       ×        |     ×     |       ○        |
| サイト情報（about）編集リンク |       ×        |     ×     |       ○        |

- 制限箇所:
  - `app/admin/users/page.tsx` — ページ全体がadminガード
  - `app/api/admin/update-role/route.ts` — API側でFirestoreからadmin確認
  - `components/layout/Header.tsx` — 管理メニュー表示/非表示

### プロフィール

| 機能                         | 一般 (general) |  PRO (pro)   | 管理者 (admin) |
| ---------------------------- | :------------: | :----------: | :------------: |
| プロフィール編集             |       ○        |      ○       |       ○        |
| プロフィール公開/非公開切替  |       ○        |      ○       |       ○        |
| 他ユーザーのプロフィール閲覧 |  ○ (公開のみ)  | ○ (公開のみ) |  ○ (公開のみ)  |

> プロフィール関連にロール制限はない。公開設定 (`isProfilePublic`) のみで制御。

---

## PROアップグレードで解放される機能

以下は一般ユーザーがPROにアップグレードした際に解放される機能一覧。
**課金導線の訴求ポイントとして利用可能。**

| 機能                       | 一般ユーザーの制限 | PRO で解放                     |
| -------------------------- | ------------------ | ------------------------------ |
| セッティング登録数         | **3件まで**        | **無制限**                     |
| DARTSLIVE スタッツ連携     | 利用不可           | **レーティング・スタッツ取得** |
| DARTSLIVE 履歴トラッキング | 利用不可           | **日次/週次/月次の推移グラフ** |
| LINE自動スタッツ通知       | 利用不可           | **LINE Botで自動通知**         |
| 記事投稿                   | 投稿不可           | **記事の作成・編集**           |

### ペイウォールUI

`app/stats/page.tsx` でDARTSLIVE連携セクションは以下のように表示:

- PRO以上: 通常のスタッツUI（取得ボタン、グラフ、履歴）
- 一般ユーザー: ロック状態のUI + PROアップグレード促進メッセージ

---

## 技術実装詳細

### 権限判定の仕組み

```
lib/permissions.ts          ← 全権限判定関数を集約
  ├─ isPro(role)            ← pro || admin
  ├─ isAdmin(role)          ← admin のみ
  ├─ canWriteArticles(role) ← pro || admin
  ├─ canEditArticle(...)    ← admin: 全記事, pro: 自分の記事のみ
  ├─ canUseDartslive(role)  ← pro || admin
  └─ getSettingsLimit(role) ← general: 3, pro/admin: null (無制限)
```

### ロール判定フロー

```
ログイン (lib/auth.ts)
  │
  ├─ Firebase Auth で認証
  ├─ Firestore users/{uid}.role を取得
  ├─ ADMIN_EMAIL と一致 → role を 'admin' に自動昇格
  └─ JWT トークンに role を埋め込み
      │
      ├─ クライアント: session.user.role で参照
      └─ API: getServerSession().user.role で参照
```

### ロール変更

- **エンドポイント**: `POST /api/admin/update-role`
- **リクエスト**: `{ userId: string, role: 'general' | 'pro' | 'admin' }`
- **認可**: Firestoreから呼び出し元のroleを直接確認（JWTだけに依存しない）
- **UI**: `/admin/users` ページからドロップダウンで変更

### 型定義

```typescript
// types/index.ts
type UserRole = 'general' | 'pro' | 'admin';
```

---

## 今後の拡張案

- [ ] Stripe連携によるPROプラン自動課金
- [ ] PRO有効期限（サブスクリプション）の管理
- [ ] ロール変更履歴のログ保存
- [ ] 機能別の細かい権限（feature flags）
