# ダーツ管理アプリ 技術仕様書（MVP版）

## 1. プロジェクト概要

ダーツのセットアップ（バレル、チップ、シャフト、フライト）を登録・管理し、ユーザー間でコメントを通じて情報共有できるWebアプリケーション。

## 2. 技術スタック

| カテゴリ       | 技術                                | バージョン |
| -------------- | ----------------------------------- | ---------- |
| フレームワーク | Next.js (App Router)                | 16.1.6     |
| UI ライブラリ  | MUI (Material UI)                   | 7.x        |
| CSS            | Tailwind CSS                        | 4.x        |
| 認証           | NextAuth.js                         | 4.x        |
| バックエンド   | Firebase (Firestore, Storage, Auth) | 12.x       |
| 言語           | TypeScript                          | 5.x        |
| ランタイム     | React                               | 19.x       |

## 3. ディレクトリ構成

```
darts-app/
├── app/
│   ├── layout.tsx              # ルートレイアウト（MUI ThemeProvider, SessionProvider）
│   ├── page.tsx                # トップページ（ダーツ一覧）
│   ├── login/
│   │   └── page.tsx            # ログインページ
│   ├── register/
│   │   └── page.tsx            # ユーザー登録ページ
│   ├── darts/
│   │   ├── new/
│   │   │   └── page.tsx        # ダーツ登録ページ
│   │   └── [id]/
│   │       ├── page.tsx        # ダーツ詳細ページ（コメント含む）
│   │       └── edit/
│   │           └── page.tsx    # ダーツ編集ページ
│   └── api/
│       └── auth/
│           └── [...nextauth]/
│               └── route.ts    # NextAuth.js APIルート（実装済み）
├── components/
│   ├── layout/
│   │   ├── Header.tsx          # ヘッダー（ナビゲーション、ログイン状態表示）
│   │   └── Footer.tsx          # フッター
│   ├── darts/
│   │   ├── DartCard.tsx        # ダーツ一覧用カード
│   │   ├── DartForm.tsx        # ダーツ登録/編集フォーム
│   │   └── DartDetail.tsx      # ダーツ詳細表示
│   ├── comment/
│   │   ├── CommentList.tsx     # コメント一覧
│   │   └── CommentForm.tsx     # コメント投稿フォーム
│   └── auth/
│       ├── LoginForm.tsx       # ログインフォーム
│       └── RegisterForm.tsx    # 登録フォーム
├── lib/
│   └── firebase.ts             # Firebase初期化（実装済み）
├── types/
│   └── index.ts                # 型定義
└── docs/
    └── technical-spec.md       # 本ドキュメント
```

## 4. Firebase設定

### 4.1 初期化（実装済み: `lib/firebase.ts`）

```typescript
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
```

エクスポートされる `auth`, `db`, `storage` を全機能で共通利用する。

### 4.2 環境変数（`.env.local`）

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
```

## 5. 認証

### 5.1 方式（実装済み: `app/api/auth/[...nextauth]/route.ts`）

NextAuth.js を使用し、以下2つのプロバイダーを提供する。

| プロバイダー        | 説明                                        |
| ------------------- | ------------------------------------------- |
| CredentialsProvider | Firebase Auth のメール/パスワード認証を利用 |
| GoogleProvider      | Google OAuth 2.0 によるソーシャルログイン   |

- セッション管理: JWT戦略
- カスタムログインページ: `/login`

### 5.2 ユーザー登録フロー

1. `/register` ページでメールアドレスとパスワードを入力
2. Firebase Auth の `createUserWithEmailAndPassword` でユーザー作成
3. Firestore の `users` コレクションにプロフィール情報を保存
4. 自動的にログインし、トップページへリダイレクト

### 5.3 ログインフロー

1. `/login` ページでメール/パスワード入力、またはGoogle認証ボタンを押下
2. NextAuth.js の `signIn()` を呼び出し
3. 認証成功後、JWTセッション発行、トップページへリダイレクト

## 6. データモデル（Firestore）

### 6.1 `users` コレクション

```
users/{userId}
```

| フィールド    | 型               | 説明                |
| ------------- | ---------------- | ------------------- |
| `displayName` | `string`         | 表示名              |
| `email`       | `string`         | メールアドレス      |
| `photoURL`    | `string \| null` | プロフィール画像URL |
| `createdAt`   | `Timestamp`      | 作成日時            |
| `updatedAt`   | `Timestamp`      | 更新日時            |

### 6.2 `darts` コレクション

```
darts/{dartId}
```

| フィールド      | 型          | 説明                                              |
| --------------- | ----------- | ------------------------------------------------- |
| `userId`        | `string`    | 投稿者のUID                                       |
| `title`         | `string`    | セットアップのタイトル                            |
| `barrel`        | `object`    | バレル情報                                        |
| `barrel.name`   | `string`    | バレル名                                          |
| `barrel.brand`  | `string`    | ブランド名                                        |
| `barrel.weight` | `number`    | 重量（g）                                         |
| `tip`           | `object`    | チップ情報                                        |
| `tip.name`      | `string`    | チップ名                                          |
| `tip.type`      | `string`    | 種類（`soft` / `steel`）                          |
| `shaft`         | `object`    | シャフト情報                                      |
| `shaft.name`    | `string`    | シャフト名                                        |
| `shaft.length`  | `string`    | 長さ（`short` / `medium` / `long`）               |
| `flight`        | `object`    | フライト情報                                      |
| `flight.name`   | `string`    | フライト名                                        |
| `flight.shape`  | `string`    | 形状（`standard` / `slim` / `kite` / `teardrop`） |
| `imageUrls`     | `string[]`  | 画像URLの配列（Firebase Storage）                 |
| `description`   | `string`    | 説明・メモ                                        |
| `createdAt`     | `Timestamp` | 作成日時                                          |
| `updatedAt`     | `Timestamp` | 更新日時                                          |

### 6.3 `comments` サブコレクション

```
darts/{dartId}/comments/{commentId}
```

| フィールド  | 型          | 説明                |
| ----------- | ----------- | ------------------- |
| `userId`    | `string`    | コメント投稿者のUID |
| `userName`  | `string`    | 投稿者の表示名      |
| `text`      | `string`    | コメント本文        |
| `createdAt` | `Timestamp` | 作成日時            |

## 7. Firebase Storage 構成

```
images/
  darts/
    {dartId}/
      {filename}    # アップロードされた画像ファイル
```

- 画像アップロード時に `ref(storage, 'images/darts/{dartId}/{filename}')` で保存
- `getDownloadURL()` で取得したURLを Firestore の `imageUrls` に格納
- MVP版ではアップロード上限: 1投稿あたり最大3枚、1ファイル5MB以下

## 8. TypeScript 型定義

```typescript
// types/index.ts

import { Timestamp } from 'firebase/firestore';

export interface User {
  displayName: string;
  email: string;
  photoURL: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Barrel {
  name: string;
  brand: string;
  weight: number;
}

export interface Tip {
  name: string;
  type: 'soft' | 'steel';
}

export interface Shaft {
  name: string;
  length: 'short' | 'medium' | 'long';
}

export interface Flight {
  name: string;
  shape: 'standard' | 'slim' | 'kite' | 'teardrop';
}

export interface Dart {
  id?: string;
  userId: string;
  title: string;
  barrel: Barrel;
  tip: Tip;
  shaft: Shaft;
  flight: Flight;
  imageUrls: string[];
  description: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Comment {
  id?: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: Timestamp;
}
```

## 9. 画面仕様（MVP版）

### 9.1 トップページ (`/`)

- ダーツセットアップ一覧をカード形式で表示（`DartCard`）
- 各カードにタイトル、バレル名、サムネイル画像を表示
- カードクリックで詳細ページへ遷移
- ログイン済みの場合、「新規登録」ボタンを表示

### 9.2 ログインページ (`/login`)

- メール/パスワード入力フォーム
- Google ログインボタン
- 新規登録ページへのリンク

### 9.3 ユーザー登録ページ (`/register`)

- メール、パスワード、表示名の入力フォーム
- Firebase Auth でユーザー作成後、Firestore に保存

### 9.4 ダーツ登録ページ (`/darts/new`)

- 認証必須（未ログイン時は `/login` にリダイレクト）
- 入力項目: タイトル、バレル情報、チップ情報、シャフト情報、フライト情報、説明、画像アップロード
- MUI の `TextField`, `Select`, `Button` を使用
- 画像は Firebase Storage にアップロード後、URLを Firestore に保存

### 9.5 ダーツ詳細ページ (`/darts/[id]`)

- セットアップの全情報を表示
- アップロードされた画像をギャラリー表示
- 投稿者本人の場合、編集・削除ボタンを表示
- コメント一覧（`CommentList`）とコメント投稿フォーム（`CommentForm`）を下部に表示

### 9.6 ダーツ編集ページ (`/darts/[id]/edit`)

- 認証必須、投稿者本人のみアクセス可能
- 登録ページと同じフォームに既存データをプリセット
- 画像の追加・削除が可能

## 10. Firestore セキュリティルール

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    match /darts/{dartId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null
        && resource.data.userId == request.auth.uid;

      match /comments/{commentId} {
        allow read: if true;
        allow create: if request.auth != null;
        allow delete: if request.auth != null
          && resource.data.userId == request.auth.uid;
      }
    }
  }
}
```

## 11. Firebase Storage セキュリティルール

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /images/darts/{dartId}/{fileName} {
      allow read: if true;
      allow write: if request.auth != null
        && request.resource.size < 5 * 1024 * 1024
        && request.resource.contentType.matches('image/.*');
    }
  }
}
```

## 12. MVP版 スコープ

### 含む機能

- メール/パスワードによるユーザー登録・ログイン
- Google認証によるログイン
- ダーツセットアップの CRUD（作成・読み取り・更新・削除）
- 画像アップロード（最大3枚/投稿）
- コメントの投稿・表示・削除
- レスポンシブ対応（MUI のブレークポイント利用）

### 含まない機能（将来対応）

- いいね / お気に関数能
- ユーザーフォロー
- ダーツの検索・フィルタリング
- プロフィール編集ページ
- 通知機能
- ダーツスコア記録・統計
