# Darts Lab 開発者リファレンス

> TypeScript 3年・React 3年程度の経験者が、このアプリの全体像を把握するためのドキュメント。
> 既存の `ARCHITECTURE.md`（技術選定・システム構成図）と合わせて読むこと。

---

## 目次

1. [プロジェクト構造の読み方](#1-プロジェクト構造の読み方)
2. [ルーティングの仕組み（App Router）](#2-ルーティングの仕組みapp-router)
3. [認証アーキテクチャ（デュアル認証）](#3-認証アーキテクチャデュアル認証)
4. [データ層（Firestore + 型定義）](#4-データ層firestore--型定義)
5. [主要コンポーネントと実装パターン](#5-主要コンポーネントと実装パターン)
6. [外部サービス連携](#6-外部サービス連携)
7. [ビジネスロジック](#7-ビジネスロジック)
8. [知っておくべき設計判断と懸念点](#8-知っておくべき設計判断と懸念点)
9. [テスト・CI・デプロイ](#9-テストciデプロイ)
10. [ファイル索引](#10-ファイル索引)

---

## 1. プロジェクト構造の読み方

```
darts-app/
├── app/                    # Next.js App Router（ページ + API）
│   ├── layout.tsx          # ルートレイアウト（全ページ共通）
│   ├── page.tsx            # ホーム画面 /
│   ├── darts/              # セッティング管理
│   ├── barrels/            # バレル検索・シミュレーター・診断
│   ├── stats/              # スタッツダッシュボード
│   ├── articles/           # 記事
│   ├── discussions/        # 掲示板
│   ├── api/                # サーバーサイドAPI
│   │   ├── auth/           # NextAuth.js
│   │   ├── dartslive-stats/# Puppeteerスクレイピング
│   │   ├── stripe/         # 決済
│   │   ├── line/           # LINE連携
│   │   └── cron/           # 定期バッチ
│   └── sw.ts               # Service Worker（PWA）
├── components/             # UIコンポーネント（機能ごとにフォルダ分け）
│   ├── layout/             # Header, Footer, Sidebar, Breadcrumbs
│   ├── darts/              # DartCard, DartDetail, DartForm
│   ├── barrels/            # BarrelCard, BarrelSimulator, BarrelQuiz
│   ├── stats/              # 14個のスタッツ可視化コンポーネント
│   ├── affiliate/          # AffiliateButton, AffiliateBanner
│   ├── discussions/        # DiscussionCard, ReplyForm, ReplyList
│   ├── articles/           # ArticleCard, MarkdownContent
│   └── Providers.tsx       # 全プロバイダーをまとめるラッパー
├── lib/                    # ビジネスロジック・ユーティリティ
│   ├── firebase.ts         # Firebase Client SDK 初期化
│   ├── firebase-admin.ts   # Firebase Admin SDK 初期化
│   ├── auth.ts             # NextAuth設定
│   ├── permissions.ts      # ロール別権限関数
│   ├── api-middleware.ts   # API共通ミドルウェア
│   ├── affiliate.ts        # アフィリエイトリンク生成
│   ├── recommend-barrels.ts# バレルレコメンドエンジン
│   ├── dartslive-rating.ts # Rt計算・逆算ロジック
│   └── dartslive-percentile.ts # パーセンタイル分布
├── types/index.ts          # 全型定義
├── firestore.rules         # Firestoreセキュリティルール
├── storage.rules           # Storageセキュリティルール
└── docs/                   # 設計書・仕様書
```

**読む順序のおすすめ:**

1. `types/index.ts` — まずデータモデルを把握
2. `lib/permissions.ts` — ロール体系を理解
3. `app/layout.tsx` + `components/Providers.tsx` — アプリの骨格
4. `lib/auth.ts` — 認証の仕組み
5. 各ページの `page.tsx` — 画面単位で追う

---

## 2. ルーティングの仕組み（App Router）

### 基本ルール

Next.js App Router では **`app/` ディレクトリのフォルダ構造がそのままURLになる**。

```
app/page.tsx           → /
app/darts/page.tsx     → /darts
app/darts/[id]/page.tsx → /darts/abc123  （動的ルート）
app/api/auth/[...nextauth]/route.ts → /api/auth/*  （Catch-all API）
```

- `page.tsx` = 画面を描画するページコンポーネント
- `route.ts` = APIエンドポイント（画面なし、JSONを返す）
- `layout.tsx` = そのディレクトリ以下の共通レイアウト
- `[id]` = 動的パラメータ（`params.id` でアクセス）
- `[...nextauth]` = Catch-all（`/api/auth/signin`, `/api/auth/callback/google` などすべてマッチ）

### ルートレイアウト（`app/layout.tsx`）

全ページに適用される唯一のレイアウト。以下をラップしている:

```tsx
// app/layout.tsx（簡略化）
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {/* ↓ テーマのチラつき防止（React hydration前に実行） */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
          (function() {
            var t = localStorage.getItem('colorMode') ||
                    (matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light');
            document.documentElement.setAttribute('data-theme', t);
          })();
        `,
          }}
        />

        <Providers>
          {' '}
          {/* SessionProvider + ThemeProvider + Firebase同期 */}
          <Header /> {/* ナビゲーションバー */}
          <main>{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
```

**ポイント:**

- `suppressHydrationWarning` が `<html>` と `<body>` についている。これはダークモードの `data-theme` 属性がサーバーとクライアントで異なるためのReact警告抑制
- インラインスクリプトでテーマを即座に適用し、白→黒のフラッシュを防止

### Providers の入れ子構造（`components/Providers.tsx`）

```
SessionProvider (NextAuth)
  └── FirebaseAuthSync  ← NextAuthのセッションをFirebase Authに同期
       └── ColorModeContext.Provider  ← テーマ切り替え
            └── ThemeProvider (MUI)
                 └── CssBaseline
                      └── {children}
```

### ページの認証パターン

このアプリでは**ページレベルの認証はすべてクライアントサイド**で行っている（Server Componentsでの認証ガードではない）:

```tsx
// 典型的な認証パターン（例: admin/users/page.tsx）
'use client';

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return; // セッション読み込み中は何もしない
    if (!session || session.user.role !== 'admin') {
      router.push('/'); // 未認証 or 権限不足 → リダイレクト
      return;
    }
    // データフェッチ
  }, [session, status]);

  if (status === 'loading') return <Skeleton />;
  // ...
}
```

**注意:** このアプリはほぼ全ページが `'use client'` のClient Component。これは**Firestore Client SDKをブラウザで直接使う**設計のため。Server Componentsにするとサーバーでの認証情報管理が複雑になる。

---

## 3. 認証アーキテクチャ（デュアル認証）

### なぜ2つの認証が必要？

| レイヤー          | 使うもの         | 何のため？                                          |
| ----------------- | ---------------- | --------------------------------------------------- |
| **NextAuth.js**   | JWTセッション    | ページのログイン状態管理、APIルートの認証           |
| **Firebase Auth** | カスタムトークン | **クライアントからFirestoreに直接読み書き**するため |

Firestoreのセキュリティルール（`firestore.rules`）は `request.auth` を見て認証判定する。これはFirebase Authのトークンでしか動かない。だからNextAuthで認証した後、Firebase Authにもログインさせる必要がある。

### 認証フロー図

```
[ユーザー] → ログインフォーム
    ↓
[NextAuth] signIn('credentials', {email, password})
    ↓
[lib/auth.ts] CredentialsProvider内で
    Firebase Auth の signInWithEmailAndPassword() を呼ぶ
    → Firebase UID を取得
    → Firestore から role を取得
    → JWT に {id, role, subscriptionStatus} を埋め込んで返却
    ↓
[ブラウザ] NextAuth セッション確立（Cookie）
    ↓
[Providers.tsx] FirebaseAuthSync コンポーネント
    → セッションの存在を検知
    → /api/firebase-token を呼ぶ
    → サーバーが Admin SDK で createCustomToken(uid) を発行
    → クライアントで signInWithCustomToken(firebaseAuth, token) を実行
    ↓
[Firebase Auth] クライアントSDK認証完了
    → Firestore への読み書きが可能に
```

### 認証設定の実装（`lib/auth.ts`）

```typescript
// lib/auth.ts（重要部分のみ）
export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' }, // DBセッションではなくJWTを使用

  providers: [
    CredentialsProvider({
      async authorize(credentials) {
        // Firebase Auth でメール/パスワード認証
        const userCredential = await signInWithEmailAndPassword(
          getAuth(),
          credentials.email,
          credentials.password,
        );
        const uid = userCredential.user.uid;

        // Firestore から role を取得
        const userDoc = await adminDb.doc(`users/${uid}`).get();
        const role = userDoc.data()?.role ?? 'general';

        return { id: uid, email: credentials.email, role };
      },
    }),
    // GoogleProviderもあり
  ],

  callbacks: {
    // JWTトークンにカスタム情報を追加
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.subscriptionStatus = user.subscriptionStatus;
      }
      // ↓ トークン更新時にロールを再取得（ロール変更が即反映される）
      if (!user) {
        const doc = await adminDb.doc(`users/${token.sub}`).get();
        token.role = doc.data()?.role ?? 'general';
      }
      return token;
    },
    // セッションオブジェクトに情報を公開
    async session({ session, token }) {
      session.user.id = token.sub; // Firebase UID
      session.user.role = token.role;
      session.user.subscriptionStatus = token.subscriptionStatus;
      return session;
    },
  },
};
```

### Firebase SDK 2種類の使い分け

| SDK            | 初期化ファイル          | 用途                                         | 実行環境               |
| -------------- | ----------------------- | -------------------------------------------- | ---------------------- |
| **Client SDK** | `lib/firebase.ts`       | Firestore読み書き、Storage画像アップロード   | ブラウザ               |
| **Admin SDK**  | `lib/firebase-admin.ts` | ユーザー管理、カスタムトークン発行、Cron処理 | サーバー（API Routes） |

```typescript
// lib/firebase.ts — Client SDK（NEXT_PUBLIC_ 環境変数を使用）
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app); // ← コンポーネントで import して使う
export const storage = getStorage(app);
export const auth = getAuth(app);

// lib/firebase-admin.ts — Admin SDK（秘密鍵を使用）
const app = initializeApp({ credential: cert(serviceAccount) });
export const adminDb = getFirestore(app); // ← API Routeで import して使う
```

**重要:** Client SDKは `NEXT_PUBLIC_` プレフィックスの環境変数を使うため、ブラウザに公開される。ただしFirebase APIキーは「このプロジェクトにアクセスする識別子」であり、セキュリティルールが実際のアクセス制御を担う。

---

## 4. データ層（Firestore + 型定義）

### 型定義（`types/index.ts`）

主要な型の関係性:

```
User (ユーザー)
├── role: 'admin' | 'pro' | 'general'
├── activeSoftDartId? → Dart.id への参照
├── stripeCustomerId? → Stripe Customer
├── lineUserId? → LINE Messaging API
└── サブコレクション:
    ├── likes/{dartId}
    ├── bookmarks/{dartId}
    ├── barrelBookmarks/{barrelId}
    ├── settingHistory/{historyId}    ← セッティング使用履歴
    └── dartsLiveStats/{statsId}      ← スタッツ記録

Dart (セッティング)
├── userId → User への参照
├── barrel: { name, brand, weight, maxDiameter?, length?, cut? }
├── tip:    { name, type: 'soft'|'steel' }
├── shaft:  { name, length?, material?, color? }
├── flight: { name, shape?, color? }
├── imageUrls: string[]
└── サブコレクション:
    ├── comments/{commentId}
    └── memos/{memoId}

BarrelProduct (バレル商品DB)
├── name, brand, weight, maxDiameter?, length?, cut?
├── imageUrl?, productUrl?
├── source: 'darts-hive' | 'es-darts' | ...
└── isDiscontinued?
```

### Firestore のアクセスパターン

**読み取り（クライアントから直接）:**

```typescript
// コンポーネント内でFirestoreを直接クエリ
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

// 例: 自分のセッティングを取得
const q = query(
  collection(db, 'darts'),
  where('userId', '==', session.user.id),
  orderBy('createdAt', 'desc'),
  limit(20),
);
const snapshot = await getDocs(q);
const darts = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Dart);
```

**書き込み（クライアントから直接）:**

```typescript
// 例: セッティングを新規作成
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

await addDoc(collection(db, 'darts'), {
  userId: session.user.id,
  title: '今のセッティング',
  barrel: { name: 'Gomez 11', brand: 'TIGA', weight: 18 },
  // ...
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
});
```

**サーバーから（Admin SDK）:**

```typescript
// API Route内 — セキュリティルール無視、全コレクションにアクセス可能
import { adminDb } from '@/lib/firebase-admin';

const userDoc = await adminDb.doc(`users/${userId}`).get();
const userData = userDoc.data();
```

### セキュリティルール（`firestore.rules`）の読み方

```javascript
// firestore.rules（重要部分を抜粋）
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ヘルパー関数
    function isSignedIn() {
      return request.auth != null;
    }
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    function getUserRole() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
    }

    // ユーザードキュメント
    match /users/{userId} {
      allow read: if isSignedIn();
      allow create: if isOwner(userId);
      allow update: if isOwner(userId)
        // ↓ role, stripeCustomerId などはユーザー自身では変更不可！
        && !request.resource.data.diff(resource.data).affectedKeys()
            .hasAny(['role', 'stripeCustomerId', 'subscriptionId', ...]);
    }

    // セッティング
    match /darts/{dartId} {
      allow read: if true;  // 誰でも閲覧可能
      allow create: if isSignedIn();
      allow update, delete: if isSignedIn()
        && resource.data.userId == request.auth.uid;  // 投稿者本人のみ
    }

    // バレルDB（読み取り専用、データ投入はAdmin SDKで行う）
    match /barrels/{barrelId} {
      allow read: if true;
      allow write: if false;  // クライアントからの書き込み禁止
    }
  }
}
```

**ルール設計のポイント:**

- `read: if true` → 未ログインでも閲覧OK（公開データ）
- `read: if isSignedIn()` → ログインユーザーのみ
- `write: if false` → Admin SDKからのみ操作可能
- `diff().affectedKeys().hasAny()` → 特定フィールドの変更を禁止（ロール昇格攻撃の防止）

---

## 5. 主要コンポーネントと実装パターン

### 5-1. ホーム画面（`app/page.tsx`）

アプリのランディングページ。ログイン状態で表示内容が大きく変わる。

**構成:**

```
ホーム画面
├── 使用中ダーツカード（ログイン時のみ）
│   └── アクティブなソフト/スティールダーツを表示
├── Feature Cards（8個のウィジェットグリッド）
│   ├── みんなのセッティング、バレル検索、シャフト早見表、記事
│   ├── シミュレーター、バレル診断
│   └── セッティング比較、ブックマーク（ログイン時のみ）
├── 新着セッティング（公開データ）
├── 最新ディスカッション
└── Sidebar（PC: 右カラム）
    ├── 人気バレルランキング
    ├── 新着記事
    └── ショップバナー
```

**2カラムレイアウトの実装（`components/layout/TwoColumnLayout.tsx`）:**

```tsx
// PC: メインコンテンツ + サイドバー の2カラム
// モバイル: メインコンテンツのみ1カラム
<Box
  sx={{
    display: 'flex',
    gap: 3,
    flexDirection: { xs: 'column', md: 'row' }, // ← MUIのレスポンシブブレークポイント
  }}
>
  <Box sx={{ flex: 1 }}>{children}</Box>
  <Box sx={{ width: { md: 300 }, display: { xs: 'none', md: 'block' } }}>
    <Sidebar />
  </Box>
</Box>
```

### 5-2. スタッツ画面（`app/stats/page.tsx`）— 最も複雑なページ

約565行のオーケストレーションページ。15個のサブコンポーネントにデータを配る。

```
スタッツ画面
├── PlayerProfileCard      ← プレイヤー情報（通り名・ホームショップ）
├── RatingHeroCard         ← 大きなRt表示 + フライト色 + パーセンタイル
├── PeriodStatsPanel       ← 今日/今週/今月/累計 タブ切り替え
├── GameStatsCards         ← 01/Cricket/CU の3カード
├── BullStatsCard          ← ブル統計（ドーナツチャート + 推移）
├── CountUpDeltaChart      ← CUスコア±差分バー
├── RatingTargetCard       ← Rt目標分析（3シナリオ）
├── MonthlyTrendChart      ← 月間推移折れ線グラフ
├── RecentGamesChart       ← 直近ゲーム結果（ComposedChart）
├── RecentDaySummary       ← 直近プレイ日のサマリー
├── AwardsTable            ← アワード一覧
├── Active Dart Display    ← 使用中セッティング
├── CSV Export             ← Pro専用エクスポート
├── Manual Input Link      ← 手動記録ページへのリンク
└── PRSiteSection          ← おすすめブランドPR
```

**データフェッチの流れ:**

```typescript
// app/stats/page.tsx（簡略化）

// 1. キャッシュ済みDARTSLIVEデータを取得
useEffect(() => {
  const res = await fetch('/api/dartslive-stats');  // GET: キャッシュを返す
  setDlData(res.json().data);
}, []);

// 2. DARTSLIVEログイン → 最新データをスクレイピング
const handleDlFetch = async () => {
  const res = await fetch('/api/dartslive-stats', {  // POST: スクレイピング実行
    method: 'POST',
    body: JSON.stringify({ email: dlEmail, password: dlPassword }),
  });
  setDlData(res.json().data);
};

// 3. 各コンポーネントに必要な props だけ渡す
<RatingHeroCard
  rating={dlData?.stats?.rating}
  ratingPrev={dlData?.prevStats?.rating}
  flight={dlData?.stats?.flight}
  // ...最小限のpropsだけ
/>
```

### 5-3. DartForm（`components/darts/DartForm.tsx`）— フォームの実装例

セッティング登録/編集フォーム。React状態管理の典型パターン。

**特徴的な実装:**

```typescript
// 画像アップロード
const handleImageUpload = async (files: FileList) => {
  for (const file of Array.from(files)) {
    // Firebase Storage にアップロード
    const storageRef = ref(storage, `darts/${session.user.id}/${dartId}/${file.name}`);
    //                               ↑ storage.rules のパスと一致させる必要がある！
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    setImageUrls((prev) => [...prev, url]);
  }
};

// バレル検索からの下書き作成（URLパラメータ経由）
// /darts/new?draft=1&barrelId=xxx&barrelName=Gomez&barrelWeight=18
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  if (params.get('draft') === '1') {
    setBarrelName(params.get('barrelName') || '');
    setBarrelWeight(Number(params.get('barrelWeight')) || 0);
    // ...
  }
}, []);
```

### 5-4. BarrelCard（`components/barrels/BarrelCard.tsx`）— 状態管理の注意点

ブックマーク状態の管理で**3層の優先順位パターン**を使っている:

```typescript
// 3つの状態ソース
const [localOverride, setLocalOverride] = useState<boolean | null>(null); // ユーザー操作
const [fetched, setFetched] = useState<boolean | null>(null); // Firestoreから取得

// 優先順位: ローカル操作 > 親からのprop > Firestore取得結果 > false
const bookmarked = localOverride ?? isBookmarked ?? fetched ?? false;
```

**なぜこうなっているか:**

- 親コンポーネントの `isBookmarked` propは、ユーザーがブックマーク操作しても即座に更新されない（親の再fetchが必要）
- 以前は `useEffect` で親のpropを `useState` に同期していたが、ユーザーのローカル操作を上書きしてしまうバグがあった
- `??`（Nullish Coalescing）で「まだ値がない」状態と「falseと確定」を区別している

### 5-5. MUI レスポンシブパターン

```tsx
// MUI の sx prop でブレークポイント別にスタイル指定
<Box sx={{
  display: 'flex',
  flexDirection: { xs: 'column', sm: 'row' },  // xs(~600px): 縦, sm(600px~): 横
  gap: { xs: 1, md: 2 },                        // モバイルは狭く、PCは広く
}}>

// ブレークポイント定義（MUI v7デフォルト）
// xs: 0px ~
// sm: 600px ~
// md: 900px ~
// lg: 1200px ~
// xl: 1536px ~
```

---

## 6. 外部サービス連携

### 6-1. Stripe（サブスクリプション決済）

**フロー:**

```
ユーザー → /pricing → 「PRO登録」ボタン
    ↓
POST /api/stripe/checkout
    → Stripe Checkout Session 作成
    → ユーザーをStripeの決済ページにリダイレクト
    ↓
Stripe決済ページ → 支払い完了
    ↓
POST /api/stripe/webhook  ← Stripeが自動的に呼ぶ
    → 署名検証（Webhook Secret）
    → イベント重複排除（stripeEvents コレクション）
    → users/{uid} の role を 'pro' に更新
```

**Webhook の実装ポイント（`app/api/stripe/webhook/route.ts`）:**

```typescript
// 1. 署名検証 — これがないと偽のWebhookを受け入れてしまう
const event = stripe.webhooks.constructEvent(
  await req.text(), // 生のリクエストボディ
  req.headers.get('stripe-signature'), // Stripeが付与する署名ヘッダー
  process.env.STRIPE_WEBHOOK_SECRET, // 照合用シークレット
);

// 2. 冪等性チェック — 同じイベントが2回来ても2回処理しない
const eventRef = adminDb.doc(`stripeEvents/${event.id}`);
const existing = await eventRef.get();
if (existing.exists) return NextResponse.json({ received: true });
await eventRef.set({ type: event.type, processed: true, createdAt: new Date() });

// 3. イベント種別ごとの処理
switch (event.type) {
  case 'checkout.session.completed': // 初回購入完了
  case 'customer.subscription.updated': // プラン変更・更新
  case 'customer.subscription.deleted': // 解約
  case 'invoice.payment_failed': // 支払い失敗
}
```

### 6-2. DARTSLIVE スクレイピング（`app/api/dartslive-stats/route.ts`）

公式APIがないため、Puppeteerでブラウザを自動操作してデータ取得。

**制約と設計:**

- Vercel Serverless Functions上でChromiumを起動（`@sparticuz/chromium` パッケージ）
- タイムアウト: 60秒（`maxDuration = 60`）
- 認証情報はリクエストボディで受け取り、**サーバーメモリ上でのみ使用**、永続化しない

```typescript
// 取得データ
{
  profile: { cardName, toorina, homeShop, profileImage },
  stats: {
    rating: 8.52,
    flight: 'BB',
    zeroOne: { avg: 52.30, best: 67.12 },
    cricket: { avg: 2.45, best: 3.80 },
    countUp: { avg: 520, best: 701 },
    awards: {
      'D-BULL': { monthly: 12, total: 456 },
      'S-BULL': { monthly: 34, total: 890 },
      'HAT-TRICK': { monthly: 2, total: 15 },
      // ...
    }
  },
  monthly: [ { month: '2025-01', rating: 8.1 }, ... ],
  games: [ { category: 'COUNT-UP', scores: [520, 480, ...] }, ... ],
}
```

### 6-3. LINE Messaging API

**機能:**

1. **アカウント連携** — WebアプリとLINEアカウントを紐づけ
2. **日次スタッツ通知** — Cronで自動取得 → LINE Pushメッセージ
3. **コンディション記録** — LINEチャットで「★3」→ メモ入力 → Firestore保存

**連携フロー:**

```
[Webアプリ] POST /api/line/link → 8桁コード生成（10分有効）
    ↓
[ユーザー] LINEで「12345678」と送信
    ↓
[LINE] POST /api/line/webhook
    → 署名検証（timingSafeEqual）
    → lineLinkCodes/{code} を検索
    → users/{uid} に lineUserId をセット
    → 連携完了メッセージ送信
```

**日次Cron（`app/api/cron/daily-stats/route.ts`）:**

```
Vercel Cron → POST /api/cron/daily-stats (Bearer token認証)
    ↓
LINE連携ユーザーを全件取得
    ↓
各ユーザーごとに:
  1. 暗号化されたDL認証情報を復号
  2. Puppeteerでスクレイピング
  3. 前回と変化があれば → LINE Push通知
  4. 会話状態を 'waiting_condition' に設定
```

### 6-4. アフィリエイト（`lib/affiliate.ts`）

バレル商品から6つのショップへの購入リンクを生成:

```typescript
// lib/affiliate.ts
export function getShopLinks(barrel: BarrelProduct): ShopLink[] {
  const searchQuery = `${barrel.brand} ${barrel.name}`;
  return [
    { name: 'ダーツハイブ', url: toDartshiveAffiliateUrl(searchQuery) }, // A8.net経由
    { name: 'エスダーツ', url: toSdartsSearchUrl(searchQuery) },
    { name: 'MAXIM', url: toMaximSearchUrl(searchQuery) },
    { name: 'TiTO', url: toTitoSearchUrl(searchQuery) },
    { name: '楽天市場', url: toRakutenSearchUrl(searchQuery) }, // アフィリエイトID付き
    { name: 'Amazon', url: toAmazonSearchUrl(searchQuery) }, // アソシエイトタグ付き
  ];
}
```

**UIコンポーネント（`components/affiliate/AffiliateButton.tsx`）:**

- ドロップダウンメニューで6ショップを選択
- すべて `target="_blank"` + `rel="noopener noreferrer"` で外部遷移

---

## 7. ビジネスロジック

### 7-1. 権限管理（`lib/permissions.ts`）

3つのロールと権限マトリクス:

```typescript
// lib/permissions.ts
type UserRole = 'admin' | 'pro' | 'general';

export function isPro(role?: string): boolean {
  return role === 'pro' || role === 'admin';
}
export function isAdmin(role?: string): boolean {
  return role === 'admin';
}
export function canUseDartslive(role?: string): boolean {
  return isPro(role); // Pro以上
}
export function canCreateDiscussion(role?: string): boolean {
  return isPro(role); // Pro以上
}
export function canReplyDiscussion(role?: string): boolean {
  return !!role; // ログインしていれば誰でも
}

// セッティング登録上限
export function getSettingsLimit(role?: string): number | null {
  return isPro(role) ? null : 1; // 無料: 1個, Pro: 無制限
}
```

### 7-2. API ミドルウェア（`lib/api-middleware.ts`）

APIルートの認証・エラーハンドリングを共通化する合成パターン:

```typescript
// 使い方（API Route内）
export const POST = withErrorHandler(
  // 3. try-catch + Sentry
  withPermission(
    // 2. 権限チェック
    canUseDartslive, // ← permissions.tsの関数を渡す
    'DARTSLIVE連携はPROプラン以上です',
    async (req, { userId, role }) => {
      // 1. 実際の処理
      // ここに来たときは認証+権限が保証されている
      return NextResponse.json({ ok: true });
    },
  ),
  'DARTSLIVE error',
);
```

**レートリミット:**

```typescript
// インメモリMap（Vercelのサーバーレス環境ではインスタンス間で共有されない）
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
// → 60リクエスト/分/IP
// → 本格運用ではRedisベースに変更すべき（後述の懸念点参照）
```

### 7-3. レーティング計算（`lib/dartslive-rating.ts`）

DARTSLIVE のレーティング計算式を再実装:

```typescript
// 01レーティング
function calc01Rating(ppd: number): number {
  if (ppd < 40) return 1;
  if (ppd < 95) return (ppd - 30) / 5; // PPD 40 → Rt2, PPD 80 → Rt10
  return (ppd - 4) / 7; // PPD 95以上は緩やかなカーブ
}

// Cricketレーティング
function calcCriRating(mpr: number): number {
  if (mpr < 1.3) return 1;
  if (mpr < 3.5) return (mpr * 100 - 90) / 20; // MPR 1.3 → Rt2
  return (mpr * 100 - 25) / 25; // MPR 3.5以上
}

// 総合レーティング = (01Rt + CriRt) / 2
function calcRating(ppd: number, mpr: number): number {
  return (calc01Rating(ppd) + calcCriRating(mpr)) / 2;
}

// 逆算: 目標RtのためにPPDいくつ必要？
function ppdForRating(targetRt: number): number {
  // ...
}
```

### 7-4. バレルレコメンドエンジン（`lib/recommend-barrels.ts`）

100点満点のスコアリング:

| 要素     | 配点 | ロジック                    |
| -------- | ---- | --------------------------- |
| 重量     | 30点 | 理想との差3g以内で線形減衰  |
| 最大径   | 25点 | 理想との差1mm以内で線形減衰 |
| 全長     | 25点 | 理想との差6mm以内で線形減衰 |
| カット   | 15点 | 完全一致=15、部分一致=8     |
| ブランド | 5点  | 完全一致のみ                |

```typescript
// 3つの入口
recommendBarrels(userDarts); // ユーザーの既存セッティングから分析
recommendFromBarrelsWithAnalysis(barrels, textOffset); // 選択バレルから + テキスト補正
recommendFromQuizWithAnalysis(answers); // 6問の診断クイズから
```

---

## 8. 知っておくべき設計判断と懸念点

### 設計判断

| 判断                                              | 理由                                                                                                                                   |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **全ページ`'use client'`**                        | Firestore Client SDKをブラウザで使うため。Server Componentsにすると全クエリをAPI Route経由にする必要があり、開発コストが大幅増加       |
| **NextAuth + Firebase Auth のデュアル認証**       | NextAuthだけだとFirestoreセキュリティルールが使えない。Firebase Authだけだとサーバーサイドのセッション管理が面倒                       |
| **グローバル状態管理なし（Redux/Zustand不使用）** | ページ単位でデータが完結するため、propsとContextで十分。スタッツページは複雑だが、データの流れは上→下の一方向                          |
| **Recharts**                                      | MUI公式のチャートライブラリ（MUI X Charts）より軽量で、カスタマイズ自由度が高い。SSR非対応だが全ページがClient Componentなので問題なし |
| **Puppeteerスクレイピング**                       | DARTSLIVE公式APIが存在しないため唯一の手段。法的リスクは利用規約の範囲内（個人データの自己取得）                                       |
| **インメモリレートリミット**                      | 外部依存（Redis等）なしでシンプル。サーバーレス環境ではインスタンス間で共有されないが、個人アプリの規模では十分                        |

### 知っておくべき懸念点

**1. Puppeteer の不安定性**

- DARTSLIVEサイトのHTML構造変更で即座に壊れる
- Vercelの関数タイムアウト（60秒）内に処理が完了しないケースがある
- `@sparticuz/chromium` パッケージのバージョンとChromiumの互換性問題が起きることがある

**2. Firestore のコスト**

- 読み取り課金モデル（50,000読み取り/日が無料枠）
- ホーム画面でセッティング一覧+バレルランキングを取得するだけで数十読み取りが発生
- ユーザー増加時はFirestoreのクエリ最適化やキャッシュ戦略が必要

**3. セキュリティルールの複雑性**

- `firestore.rules` が約170行で、ロール判定のためにユーザードキュメントを `get()` する箇所がある
- このFirestore読み取りも課金対象（セキュリティルール内の `get()` は1回の読み取りとしてカウント）

**4. レートリミットの限界**

- `lib/api-middleware.ts` のレートリミットはインメモリMapベース
- Vercelのサーバーレス関数は複数インスタンスが独立に起動するため、**インスタンス間でリミットが共有されない**
- 本格運用時は Vercel KV や Upstash Redis への移行を検討

**5. 画像アップロードパスの注意**

- Storage ルール: `match /darts/{userId}/{allPaths=**}` — パスにユーザーIDが含まれる
- アップロードコード: `ref(storage, \`darts/${session.user.id}/${dartId}/${file.name}\`)`
- この2つが一致しないとPermission Deniedになる（実際に起きたバグ）

**6. NextAuth JWT の更新タイミング**

- ロール変更（general→pro）はStripe Webhookで即座にFirestoreに反映される
- しかしNextAuthのJWTは次回トークンリフレッシュまで古いroleを持つ
- `jwt` コールバックで毎回Firestoreからroleを再取得して対策済みだが、これも読み取りコストが発生する

**7. ENCRYPTION_KEY のローテーション手順**

DL認証情報の暗号化に使用する `ENCRYPTION_KEY`（AES-256-GCM）を更新する手順:

```bash
# 1. 新しい鍵を生成
openssl rand -hex 32

# 2. Vercel に新しい鍵を設定
#    Vercel Dashboard → Settings → Environment Variables → ENCRYPTION_KEY を更新

# 3. 既存の暗号化データを再暗号化
#    現時点では既存の暗号化データ（users/{uid}/dartsliveCache の encryptedEmail/encryptedPassword）は
#    旧鍵で暗号化されているため、鍵変更後は復号に失敗する。
#    → 対象ユーザーに LINE から DL 認証情報を再登録してもらう必要がある。
#
#    もしダウンタイムなしで移行したい場合:
#    a) 新旧両方の鍵で復号を試みるフォールバック処理を lib/crypto.ts に追加
#    b) 全ユーザーの暗号化データを旧鍵で復号 → 新鍵で再暗号化する移行スクリプトを実行
#    c) フォールバック処理を削除

# 4. .env.local も更新
#    ENCRYPTION_KEY=<新しい鍵>

# 5. デプロイ
vercel --prod
```

---

## 9. テスト・CI・デプロイ

### テスト（Vitest）

```bash
npm test          # テスト実行
npm run test:watch # ウォッチモード
```

**テストされているもの（`lib/__tests__/`）:**
| ファイル | 内容 | テスト数 |
|---------|------|---------|
| `api-middleware.test.ts` | 認証・権限・エラーハンドリング | 10 |
| `permissions.test.ts` | 全権限関数の正常系/異常系 | ~20 |
| `dartslive-percentile.test.ts` | パーセンタイル計算・補間 | ~15 |
| `route.test.ts` (Stripe) | Webhook署名検証・イベント処理 | 6 |
| **合計** | | **65** |

**テストされていないもの:**

- Reactコンポーネント（React Testing Library未導入）
- Firestoreセキュリティルール（Firebase Emulator未使用）
- E2Eテスト（Playwright/Cypress未導入）
- Puppeteerスクレイピング（モックブラウザテストなし）

### CI（GitHub Actions）

```yaml
# .github/workflows/ci.yml（推定構成）
- npm ci
- npm run lint # ESLint
- npm run build # Next.jsビルド（型エラー検出）
- npm test # Vitest
```

### デプロイ

**自動デプロイ:**

- `git push origin main` → Vercelが自動検知してビルド・デプロイ

**手動デプロイ:**

```bash
vercel --prod     # Vercel CLIで即座にプロダクションデプロイ
```

**環境変数の管理:**

- ローカル: `.env.local`（Git管理外）
- Vercel: ダッシュボードの Environment Variables で設定
- 全環境変数の一覧は `docs/ARCHITECTURE.md` を参照

---

## 10. ファイル索引

よく触るファイルへのクイックリファレンス。

### ページ

| URL                  | ファイル                         | 概要                   |
| -------------------- | -------------------------------- | ---------------------- |
| `/`                  | `app/page.tsx`                   | ホーム画面             |
| `/darts`             | `app/darts/page.tsx`             | セッティング一覧       |
| `/darts/new`         | `app/darts/new/page.tsx`         | セッティング登録       |
| `/darts/[id]`        | `app/darts/[id]/page.tsx`        | セッティング詳細       |
| `/barrels`           | `app/barrels/page.tsx`           | バレル検索             |
| `/barrels/recommend` | `app/barrels/recommend/page.tsx` | おすすめバレル         |
| `/barrels/simulator` | `app/barrels/simulator/page.tsx` | 実寸シミュレーター     |
| `/barrels/quiz`      | `app/barrels/quiz/page.tsx`      | バレル診断             |
| `/stats`             | `app/stats/page.tsx`             | スタッツダッシュボード |
| `/articles`          | `app/articles/page.tsx`          | 記事一覧               |
| `/discussions`       | `app/discussions/page.tsx`       | 掲示板                 |
| `/bookmarks`         | `app/bookmarks/page.tsx`         | ブックマーク           |
| `/darts/compare`     | `app/darts/compare/page.tsx`     | セッティング比較       |
| `/darts/history`     | `app/darts/history/page.tsx`     | セッティング使用履歴   |
| `/reference`         | `app/reference/page.tsx`         | シャフト早見表         |
| `/pricing`           | `app/pricing/page.tsx`           | 料金プラン             |

### API

| エンドポイント               | ファイル                            | 用途                |
| ---------------------------- | ----------------------------------- | ------------------- |
| `POST /api/dartslive-stats`  | `app/api/dartslive-stats/route.ts`  | DLスクレイピング    |
| `GET /api/dartslive-stats`   | 同上                                | キャッシュ取得      |
| `POST /api/stripe/checkout`  | `app/api/stripe/checkout/route.ts`  | 決済セッション作成  |
| `POST /api/stripe/webhook`   | `app/api/stripe/webhook/route.ts`   | Stripe Webhook      |
| `POST /api/line/webhook`     | `app/api/line/webhook/route.ts`     | LINE Webhook        |
| `POST /api/line/link`        | `app/api/line/link/route.ts`        | LINE連携コード発行  |
| `POST /api/cron/daily-stats` | `app/api/cron/daily-stats/route.ts` | 日次バッチ          |
| `GET /api/stats-history`     | `app/api/stats-history/route.ts`    | 期間別スタッツ      |
| `GET /api/og`                | `app/api/og/route.ts`               | OGP画像生成（Edge） |

### コア

| ファイル                      | 役割                 |
| ----------------------------- | -------------------- |
| `types/index.ts`              | 全型定義             |
| `lib/auth.ts`                 | NextAuth設定         |
| `lib/firebase.ts`             | Client SDK初期化     |
| `lib/firebase-admin.ts`       | Admin SDK初期化      |
| `lib/permissions.ts`          | 権限管理             |
| `lib/api-middleware.ts`       | API共通処理          |
| `lib/affiliate.ts`            | アフィリエイトリンク |
| `lib/recommend-barrels.ts`    | レコメンドエンジン   |
| `lib/dartslive-rating.ts`     | Rt計算               |
| `lib/dartslive-percentile.ts` | パーセンタイル       |
| `lib/dartslive-colors.ts`     | フライト色定義       |
| `firestore.rules`             | DBセキュリティルール |
| `storage.rules`               | ストレージルール     |
| `components/Providers.tsx`    | Context全体ラッパー  |

### スタッツコンポーネント（`components/stats/`）

| コンポーネント          | 使っているチャート              |
| ----------------------- | ------------------------------- |
| `BullStatsCard.tsx`     | PieChart（ドーナツ）+ LineChart |
| `CountUpDeltaChart.tsx` | BarChart（±差分）               |
| `MonthlyTrendChart.tsx` | LineChart                       |
| `RecentGamesChart.tsx`  | ComposedChart（Bar + Line）     |
| `GameStatsCards.tsx`    | なし（数値表示のみ）            |
| `RatingHeroCard.tsx`    | なし（大きなRt表示）            |
| `RatingTargetCard.tsx`  | なし（テーブル表示）            |
| `AwardsTable.tsx`       | なし（MUI Table）               |
| `PercentileChip.tsx`    | なし（再利用可能バッジ）        |
