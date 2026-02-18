# 詳細設計書

## ドキュメント情報

| 項目           | 内容                                      |
| -------------- | ----------------------------------------- |
| プロジェクト名 | Darts App（ダーツセッティング管理アプリ） |
| バージョン     | 1.0                                       |
| 作成日         | 2025-02-09                                |

---

## 1. 画面設計

### 1.1 画面一覧

| #     | 画面名                 | パス                    |    認証     | 概要                                                              |
| ----- | ---------------------- | ----------------------- | :---------: | ----------------------------------------------------------------- |
| S-001 | トップページ           | `/`                     |    不要     | フィーチャーカード、注目ダーツ/記事、ログイン時はスタッツサマリー |
| S-002 | ログイン               | `/login`                |    不要     | メール/パスワード + Google OAuth                                  |
| S-003 | 新規登録               | `/register`             |    不要     | アカウント作成フォーム                                            |
| S-004 | セッティング一覧       | `/darts`                |    不要     | カード一覧、フィルタ、検索、おすすめタブ                          |
| S-005 | セッティング詳細       | `/darts/[id]`           |    不要     | スペック詳細、画像、コメント、いいね                              |
| S-006 | セッティング新規作成   | `/darts/new`            |    必要     | パーツ選択フォーム（バレル・チップ・シャフト・フライト）          |
| S-007 | セッティング編集       | `/darts/[id]/edit`      |    必要     | S-006と同一フォーム（既存データプリフィル）                       |
| S-008 | セッティング比較       | `/darts/compare`        |    不要     | 2つのセッティングを横並び比較                                     |
| S-009 | バレル検索             | `/barrels`              |    不要     | スペックフィルタ、ページネーション、ブックマーク                  |
| S-010 | スタッツダッシュボード | `/stats`                |    必要     | DARTSLIVE風UI、月間グラフ、直近プレイデータ                       |
| S-011 | スタッツ手動入力       | `/stats/new`            |    必要     | 各種スタッツ入力 + DARTSLIVE自動取得ダイアログ                    |
| S-012 | スタッツ編集           | `/stats/[id]/edit`      |    必要     | S-011と同一フォーム + 削除機能                                    |
| S-021 | スタッツカレンダー     | `/stats/calendar`       |    必要     | 月間カレンダー、プレイ日可視化、日別詳細パネル                    |
| S-013 | 記事一覧               | `/articles`             |    不要     | 記事カード一覧                                                    |
| S-014 | 記事詳細               | `/articles/[slug]`      |    不要     | Markdownレンダリング                                              |
| S-015 | 記事投稿               | `/articles/new`         | 必要(pro+)  | Markdown入力フォーム                                              |
| S-016 | 記事編集               | `/articles/[slug]/edit` | 必要(pro+)  | S-015と同一フォーム                                               |
| S-017 | ブックマーク           | `/bookmarks`            |    必要     | ダーツ/バレルのブックマーク一覧                                   |
| S-018 | プロフィール編集       | `/profile/edit`         |    必要     | ユーザー情報編集                                                  |
| S-019 | リファレンス           | `/reference`            |    不要     | シャフトスペック早見表                                            |
| S-020 | ユーザー管理           | `/admin/users`          | 必要(admin) | ロール変更                                                        |

### 1.2 画面遷移図

```
トップページ (/)
├── ログイン (/login) ←→ 新規登録 (/register)
├── セッティング一覧 (/darts)
│   ├── セッティング詳細 (/darts/[id])
│   │   └── セッティング編集 (/darts/[id]/edit) → 詳細に戻る
│   ├── セッティング新規作成 (/darts/new) → 一覧に戻る
│   └── セッティング比較 (/darts/compare)
├── バレル検索 (/barrels)
│   └── [このバレルで下書き作成] → セッティング新規作成
├── スタッツダッシュボード (/stats)
│   ├── スタッツカレンダー (/stats/calendar)
│   │   └── スタッツ編集 (/stats/[id]/edit?from=calendar) → カレンダーに戻る
│   ├── スタッツ手動入力 (/stats/new) → ダッシュボードに戻る
│   └── スタッツ編集 (/stats/[id]/edit) → ダッシュボードに戻る
├── 記事一覧 (/articles)
│   ├── 記事詳細 (/articles/[slug])
│   │   └── 記事編集 (/articles/[slug]/edit)
│   └── 記事投稿 (/articles/new)
├── ブックマーク (/bookmarks)
├── プロフィール編集 (/profile/edit)
├── リファレンス (/reference)
└── ユーザー管理 (/admin/users)
```

### 1.3 主要画面のワイヤーフレーム概要

#### S-010: スタッツダッシュボード

`app/stats/page.tsx` はオーケストレーター（約295行）として機能し、14個のコンポーネント（`components/stats/`）にUIを委譲。

```
┌──────────────────────────────────────────┐
│ [ダーツライブから取得] ボタン              │
├──────────────────────────────────────────┤
│  1. PlayerProfileCard                    │
│  ┌────────────────────────────────────┐  │
│  │ [📷] カード名  @通り名              │  │
│  │ 🏠 ホームショップ名  [地図で開く]   │  │
│  └────────────────────────────────────┘  │
│                                          │
│  2. RatingHeroCard                       │
│  ┌────────────────────────────────────┐  │
│  │ [FLIGHT BB] [上位X%]               │  │
│  │  10.40  ±0.20 ↑                   │  │
│  │  [===== Rt進捗バー =====]          │  │
│  └────────────────────────────────────┘  │
│                                          │
│  3. PeriodStatsPanel                     │
│  [今日] [今週] [今月] [累計] ← タブ      │
│  Avg Rt / Avg PPD / Avg MPR / ゲーム数  │
│                                          │
│  4. GameStatsCards (パーセンタイル付き)   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │ 01 (赤)  │ │ Cri (青) │ │ CU (緑)  │ │
│  │ PPD:23.4 │ │ MPR:2.10 │ │ AVG:521  │ │
│  │ 上位15%  │ │ 上位20%  │ │ 上位30%  │ │
│  └──────────┘ └──────────┘ └──────────┘ │
│                                          │
│  5. BullStatsCard                        │
│  ┌────────────────────────────────────┐  │
│  │ D-BULL:142 S-BULL:358 累計:500    │  │
│  │ [ドーナツチャート] [月間バーチャート]│  │
│  └────────────────────────────────────┘  │
│                                          │
│  6. CountUpDeltaChart                    │
│  ┌────────────────────────────────────┐  │
│  │ ±差分バー（緑=UP, 赤=DOWN）直近30回│  │
│  └────────────────────────────────────┘  │
│                                          │
│  7. RatingTargetCard                     │
│  8. MonthlyTrendChart (LineChart 12ヶ月) │
│  9. RecentGamesChart (ComposedChart)     │
│ 10. RecentDaySummary                     │
│ 11. AwardsTable                          │
│ 12. 使用中ダーツ                          │
│ 13. CSVエクスポート                       │
│ 14. 手動記録リンク                        │
│ 15. PRSiteSection（おすすめブランド3社）  │
└──────────────────────────────────────────┘
```

---

## 2. 状態管理設計

### 2.1 方針

| 方針             | 説明                                                            |
| ---------------- | --------------------------------------------------------------- |
| React State中心  | グローバル状態管理ライブラリ（Redux等）は使用しない             |
| ローカルステート | 各ページで `useState` / `useEffect` によるFirestoreデータ取得   |
| セッション       | NextAuth `useSession()` でクライアントサイド認証状態管理        |
| テーマ           | React Context (`Providers.tsx`) でダークモード/ライトモード管理 |

### 2.2 主要な状態の分類

| カテゴリ     | 管理方法                  | スコープ       | 例                                     |
| ------------ | ------------------------- | -------------- | -------------------------------------- |
| 認証状態     | NextAuth SessionProvider  | アプリ全体     | `session.user.id`, `session.user.role` |
| テーマ       | React Context (Providers) | アプリ全体     | `darkMode: boolean`                    |
| ページデータ | useState + useEffect      | ページローカル | ダーツ一覧、バレル検索結果             |
| フォーム入力 | useState                  | コンポーネント | 各入力フィールドの値                   |
| UI状態       | useState                  | コンポーネント | ダイアログ開閉、ローディング、エラー   |

### 2.3 データフェッチパターン

```typescript
// 標準的なFirestoreデータ取得パターン
const [data, setData] = useState<Type[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  if (!session?.user?.id) return;

  const q = query(
    collection(db, 'collectionName'),
    where('userId', '==', session.user.id),
    orderBy('createdAt', 'desc'),
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setData(items);
    setLoading(false);
  });

  return () => unsubscribe();
}, [session?.user?.id]);
```

---

## 3. API設計

### 3.1 エンドポイント一覧

#### API-001: NextAuth 認証

| 項目           | 内容                                             |
| -------------- | ------------------------------------------------ |
| エンドポイント | `/api/auth/[...nextauth]`                        |
| メソッド       | GET, POST                                        |
| 認証           | 不要（認証処理自体）                             |
| 処理           | NextAuth.jsによるセッション管理、JWTの発行・検証 |

#### API-002: DARTSLIVE スタッツ取得

| 項目           | 内容                        |
| -------------- | --------------------------- |
| エンドポイント | `/api/dartslive-stats`      |
| メソッド       | POST                        |
| 認証           | 必要（NextAuth セッション） |
| タイムアウト   | 60秒 (`maxDuration: 60`)    |

**リクエスト:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**レスポンス（成功）:**

```json
{
  "success": true,
  "data": {
    "current": {
      "cardName": "カード名",
      "rating": 10.4,
      "ratingInt": 10,
      "flight": "BB",
      "stats01Avg": 23.45,
      "statsCriAvg": 2.1,
      "statsPraAvg": 521.3,
      "stats01Best": 35.2,
      "statsCriBest": 4.5,
      "statsPraBest": 780,
      "awards": {
        "HAT TRICK": { "monthly": 5, "total": 120 },
        "TON 80": { "monthly": 1, "total": 15 }
      }
    },
    "monthly": {
      "rating": [{ "month": "2025/01", "value": 10.2 }],
      "zeroOne": [{ "month": "2025/01", "value": 22.8 }],
      "cricket": [{ "month": "2025/01", "value": 2.05 }],
      "countUp": [{ "month": "2025/01", "value": 510 }]
    },
    "recentGames": {
      "dayStats": {
        "best01": 30.5,
        "bestCri": 3.2,
        "bestCountUp": 650,
        "avg01": 24.1,
        "avgCri": 2.1,
        "avgCountUp": 520
      },
      "games": [{ "category": "01 GAMES", "scores": [25.3, 22.1, 28.4] }],
      "shops": ["ダーツショップA"]
    },
    "prev": {
      "rating": 10.2,
      "stats01Avg": 22.25,
      "statsCriAvg": 2.05,
      "statsPraAvg": 509.5
    }
  }
}
```

**レスポンス（エラー）:**

```json
{ "error": "ログインに失敗しました。メールアドレスとパスワードを確認してください。" }
```

| ステータス | 説明                                            |
| ---------- | ----------------------------------------------- |
| 200        | 成功                                            |
| 400        | バリデーションエラー（メール/パスワード未入力） |
| 401        | 未ログイン or DARTSLIVEログイン失敗             |
| 500        | スクレイピングエラー                            |

#### API-003: 画像プロキシ

| 項目             | 内容                                                       |
| ---------------- | ---------------------------------------------------------- |
| エンドポイント   | `/api/proxy-image`                                         |
| メソッド         | GET                                                        |
| 認証             | 不要                                                       |
| クエリパラメータ | `url` - プロキシ対象の画像URL                              |
| 処理             | User-Agentを付与して外部画像を取得し、レスポンスとして返却 |

#### API-004: ユーザーロール更新

| 項目           | 内容                     |
| -------------- | ------------------------ |
| エンドポイント | `/api/admin/update-role` |
| メソッド       | POST                     |
| 認証           | 必要（admin のみ）       |

**リクエスト:**

```json
{
  "userId": "abc123",
  "role": "pro"
}
```

---

## 4. 認証フロー詳細

### 4.1 ログインフロー（メール/パスワード）

```
1. ユーザーがログインフォームに入力
2. LoginForm → signIn('credentials', { email, password })
3. NextAuth authorize() コールバック:
   a. Firebase Auth: signInWithEmailAndPassword(auth, email, password)
   b. 成功 → Firebase uid 取得
   c. Firestore: doc('users', uid) 取得 → role 取得
   d. adminメールチェック: mt.oikawa@gmail.com → role='admin' 自動昇格
   e. return { id: uid, email, name, role }
4. NextAuth jwt() コールバック:
   a. token.sub = user.id
   b. token.role = user.role
5. クライアントにJWT Cookieが設定される
6. 以降のリクエストでは useSession() / getServerSession() で認証状態を取得
```

### 4.2 ログインフロー（Google OAuth）

```
1. ユーザーが「Googleでログイン」をクリック
2. Google OAuth画面にリダイレクト
3. 認証完了 → NextAuth signIn() コールバック
4. Firebase Auth にユーザー作成/更新
5. Firestore users/{uid} ドキュメント作成/更新
6. JWT発行 → Cookie設定
```

### 4.3 セッション検証

```typescript
// クライアントサイド
const { data: session, status } = useSession();
if (status === 'unauthenticated') {
  router.push('/login');
}

// サーバーサイド（API Route）
const session = await getServerSession(authOptions);
if (!session?.user?.id) {
  return NextResponse.json({ error: '未ログインです' }, { status: 401 });
}
```

### 4.4 ロールベースアクセス制御

```typescript
// 管理者チェック（API Route）
if (session.user.role !== 'admin') {
  return NextResponse.json({ error: '権限がありません' }, { status: 403 });
}

// 記事投稿権限チェック（クライアント）
if (session?.user?.role !== 'pro' && session?.user?.role !== 'admin') {
  router.push('/');
}
```

---

## 5. コンポーネント設計

### 5.1 コンポーネントツリー（主要部分）

```
RootLayout (app/layout.tsx)
└── Providers (SessionProvider + ThemeProvider)
    ├── Header
    │   ├── PC: AppBar + Navigation Links
    │   ├── Mobile: Drawer + Menu Items
    │   └── UserAvatar + Logout
    ├── [Page Content]
    │   ├── DartsPage
    │   │   ├── SearchBar + Filters
    │   │   └── DartCard[] (grid)
    │   ├── DartDetailPage
    │   │   ├── DartDetail (specs + images)
    │   │   ├── CommentList
    │   │   └── CommentForm
    │   ├── DartFormPage (new/edit)
    │   │   └── DartForm
    │   │       ├── BarrelSection (brand, specs, cut[])
    │   │       ├── TipSection (presets + custom)
    │   │       ├── ShaftSection (presets + custom)
    │   │       ├── FlightSection (presets + CONDOR AXE)
    │   │       └── ImageUpload
    │   ├── StatsPage (orchestrator ~295行, components/stats/ に委譲)
    │   │   ├── PlayerProfileCard (通り名・ホームショップ・Google Maps)
    │   │   ├── RatingHeroCard (flight-colored + PercentileChip)
    │   │   ├── PeriodStatsPanel (今日/今週/今月/累計タブ)
    │   │   ├── GameStatsCards (01/Cri/CU + PercentileChip)
    │   │   ├── BullStatsCard (D-BULL/S-BULL ドーナツ+バー)
    │   │   ├── CountUpDeltaChart (±差分バーチャート)
    │   │   ├── RatingTargetCard (Rt目標分析)
    │   │   ├── MonthlyTrendChart (Recharts LineChart)
    │   │   ├── RecentGamesChart (ComposedChart)
    │   │   ├── RecentDaySummary (直近プレイ日)
    │   │   ├── AwardsTable (ブル以外のアワード)
    │   │   ├── PercentileChip (再利用可能な上位X%バッジ)
    │   │   ├── PRSiteSection (おすすめブランド3社)
    │   │   └── StatsLoginDialog (DARTSLIVE連携ダイアログ)
    │   └── BarrelsPage
    │       ├── FilterPanel
    │       └── BarrelCard[] (grid)
    └── Footer
```

### 5.2 主要コンポーネントの責務

| コンポーネント      | 責務                           | props/state                                                      |
| ------------------- | ------------------------------ | ---------------------------------------------------------------- |
| `DartForm`          | セッティング入力の全管理       | 15+ state variables (barrel, tip, shaft, flight specs)           |
| `DartCard`          | セッティング一覧のカード表示   | `dart: Dart`, `onLike`, `isLiked`, `isBookmarked`                |
| `BarrelCard`        | バレル製品カード               | `barrel: BarrelProduct`, `isBookmarked`, `onBookmark`            |
| `CommentList`       | コメント一覧の表示・削除       | `dartId`, `comments[]`, `currentUserId`                          |
| `Providers`         | テーマ・セッション提供         | `children`, `darkMode` context                                   |
| `PlayerProfileCard` | DARTSLIVEプロフィール表示      | `cardName`, `toorina`, `homeShop`, `cardImageUrl`, `flightColor` |
| `RatingHeroCard`    | レーティング+フライト+進捗バー | `rating`, `ratingPrev`, `flight`, `flightColor`, `streak`        |
| `PeriodStatsPanel`  | 期間別スタッツ集計表示         | `periodTab`, `summary`, `records`, `loading`                     |
| `GameStatsCards`    | 3カテゴリスタッツカード        | `stats01Avg`, `statsCriAvg`, `statsPraAvg` + prev + percentile   |
| `BullStatsCard`     | ブル統計+チャート              | `awards` (D-BULL/S-BULL)                                         |
| `CountUpDeltaChart` | COUNT-UP±差分可視化            | `games` (recentGames.games)                                      |
| `PercentileChip`    | 上位X%バッジ（再利用）         | `type: 'rating'\|'ppd'\|'mpr'\|'countup'`, `value`               |
| `PRSiteSection`     | おすすめブランドPRカード       | なし（静的データ）                                               |
| `CalendarGrid`      | カレンダー月表示・日選択       | `year`, `month`, `records`, `selectedDate`, `onSelectDate`       |
| `DayDetailPanel`    | 選択日の詳細スタッツ表示       | `date`, `records`                                                |

---

## 6. セキュリティ設計

### 6.1 フロントエンドのセキュリティ

| 対策         | 実装                                                            |
| ------------ | --------------------------------------------------------------- |
| XSS防止      | React の自動エスケープ、`dangerouslySetInnerHTML` 不使用        |
| Markdown XSS | `react-markdown` のサニタイズ（HTMLタグ除去）                   |
| CSRF         | NextAuth.js の組み込みCSRF保護                                  |
| 秘密情報     | `NEXT_PUBLIC_` プレフィックスのない環境変数はサーバーサイドのみ |

### 6.2 APIルートのセキュリティ

| 対策               | 実装                                                                        |
| ------------------ | --------------------------------------------------------------------------- |
| 認証チェック       | 全APIルートで `getServerSession()` による認証検証                           |
| 認可チェック       | ロール別アクセス制御（admin API は admin ロールのみ）                       |
| 入力バリデーション | リクエストボディの必須フィールドチェック                                    |
| エラーハンドリング | 内部エラーの詳細をクライアントに露出しない（500レスポンスは汎用メッセージ） |

### 6.3 データベースのセキュリティ

| 対策            | 実装                                                              |
| --------------- | ----------------------------------------------------------------- |
| Firestoreルール | ユーザー単位の読み書き制限                                        |
| Admin SDK       | サーバーサイドAPI はセキュリティルールをバイパス（Admin SDK使用） |
| 非正規化データ  | ユーザー名等の変更時は関連ドキュメントの更新が必要（整合性管理）  |

### 6.4 DARTSLIVE連携のセキュリティ

| リスク                 | 対策                                           |
| ---------------------- | ---------------------------------------------- |
| 認証情報の漏洩         | メモリ上でのみ使用、Firestore/ログへの保存禁止 |
| ブラウザプロセスの残存 | `finally` ブロックでの確実なブラウザ終了       |
| サーバーサイド実行     | フロントエンドからの直接スクレイピング不可     |
| レート制限             | `maxDuration: 60` によるタイムアウト設定       |

---

## 7. エラーハンドリング設計

### 7.1 エラー分類

| レベル               | 例                                | ハンドリング                             |
| -------------------- | --------------------------------- | ---------------------------------------- |
| バリデーション       | 必須項目未入力                    | Alert コンポーネントでインライン表示     |
| 認証エラー           | 未ログイン、権限不足              | ログインページへリダイレクト             |
| API通信エラー        | ネットワーク障害                  | 「通信エラーが発生しました」トースト表示 |
| Firestoreエラー      | 権限不足、ドキュメント未存在      | エラーメッセージ表示 + コンソールログ    |
| スクレイピングエラー | DARTSLIVEサイト変更・タイムアウト | 詳細エラーメッセージ + サーバーログ      |

### 7.2 エラーメッセージ方針

- ユーザー向けメッセージは日本語で簡潔に
- 技術的詳細はサーバーログ（`console.error`）に出力
- セキュリティ上、スタックトレースはクライアントに返さない
