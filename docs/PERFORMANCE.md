# パフォーマンス計測

## 概要

主要ページの Lighthouse パフォーマンス計測結果。

## 計測方法

```bash
npx lighthouse https://darts-app-lime.vercel.app --output=json --output-path=./docs/lighthouse-report.json
```

## 目標値

| メトリクス     | 目標 | 説明                         |
| -------------- | ---- | ---------------------------- |
| Performance    | 90+  | ページ読み込みパフォーマンス |
| Accessibility  | 90+  | アクセシビリティスコア       |
| Best Practices | 90+  | ベストプラクティス準拠       |
| SEO            | 90+  | 検索エンジン最適化           |

## 主要ページ計測結果

計測対象:

- `/` — ホームページ
- `/barrels` — バレル検索
- `/stats/calendar` — カレンダー
- `/login` — ログイン
- `/pricing` — 料金プラン

> 初回計測後にこのファイルを更新してください。

## 最適化施策

### 実施済み

- Next.js Image コンポーネントによる画像最適化
- dynamic import による遅延読み込み
- Service Worker (Serwist) によるキャッシュ戦略
- CSS-in-JS (Emotion) のサーバーサイド抽出

### 改善候補

- バレル画像のプレースホルダー表示
- Firestore クエリのインデックス最適化
- クリティカル CSS のインライン化
