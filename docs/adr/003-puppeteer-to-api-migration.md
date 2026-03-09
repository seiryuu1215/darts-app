# ADR-003: Puppeteer → API スクレイピング移行

## ステータス

部分採用（Puppeteer 併用中）

## コンテキスト

DARTSLIVE のスタッツ取得は当初 Puppeteer によるブラウザ自動操作で実装されていた。以下の課題が顕在化:

- **パフォーマンス**: Chromium の起動に 3-5 秒、ページ読み込みに追加 2-3 秒
- **信頼性**: DARTSLIVE サイトのUI変更で頻繁にセレクタが壊れる
- **コスト**: Vercel Serverless での Chromium バイナリサイズ（約 50MB）
- **コールドスタート**: Lambda のコールドスタートが 5 秒以上になるケース

## 決定

DARTSLIVE の内部 API エンドポイントを利用する方式に段階的に移行する。ただし、一部のデータ（アワード詳細等）は API 未提供のため Puppeteer を残存させる。

## 実装

- `lib/dartslive-scraper.ts`: Puppeteer ベースのスクレイパー（レガシー）
- `lib/dartslive-api.ts`: API ベースのデータ取得（新規）
- `/api/cron/dartslive-api-sync`: API 経由の定期同期
- `/api/cron/daily-stats`: Puppeteer による補完データ取得

### リトライ戦略

- 指数バックオフ（1s, 3s）で最大 2 回リトライ
- ユーザーごとの try-catch 分離で、1 ユーザーの失敗が他に影響しない

## 代替案

| 選択肢        | 不採用理由                                   |
| ------------- | -------------------------------------------- |
| 完全 API 移行 | アワード詳細等の API 未提供データがある      |
| Playwright    | Puppeteer と同等の課題。軽量化のメリット薄い |
| 公式 API 待ち | DARTSLIVE の公式 API 提供予定なし            |

## 結果

- API 移行分のレスポンスタイムが 5-8 秒 → 1-2 秒に改善
- Cron ジョブの全体実行時間が約 60% 短縮
- `@sparticuz/chromium` でバイナリサイズを最適化し、Vercel での運用を継続
