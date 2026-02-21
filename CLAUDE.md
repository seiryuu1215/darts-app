# CLAUDE.md

## プロジェクト概要

ダーツプレイヤー向けWebアプリ（Next.js 16 + React 19 + MUI 7 + Firebase）。
DARTSLIVEアカウント連携、スタッツ分析、マイダーツ管理、記事投稿、ショップ管理等の機能を提供。

### ショップ機能

- ブックマーク（お気に入り・リスト分類・タグ・メモ・評価）
- 路線フィルター（`lib/line-stations.ts` で路線名・カラー定義）
- 訪問済み/未訪問フィルター + カード上の訪問済みバッジ
- 禁煙/分煙フィルター、タグフィルター

## 言語

- コード: 英語（変数名・コンポーネント名）
- コミットメッセージ・UI・コメント: 日本語
- Claude Codeとの会話: 日本語で応答してください

## 技術スタック

- Next.js 16 (App Router) + React 19
- MUI 7 (Material UI) — ダークテーマがデフォルト
- Firebase (Firestore + Auth) + NextAuth
- Stripe (サブスクリプション)
- Vitest 4 (ユニットテスト) + Storybook 10 (UIテスト)
- Vercel (デプロイ)

## コマンド

```bash
npm run dev          # 開発サーバー
npm run build        # プロダクションビルド
npm run lint         # ESLint
npm run format       # Prettier フォーマット
npm run format:check # Prettier チェック（CI用）
npm run test:unit    # ユニットテストのみ（CI用）
npm run test         # 全テスト（unit + storybook）
npm run storybook    # Storybook開発サーバー (port 6006)
```

## CI パイプライン

GitHub Actions (`.github/workflows/ci.yml`) で以下を実行:

1. `npm run lint`
2. `npm run format:check`
3. `npm run test:unit`
4. `npm run build`

## コード変更後の必須チェック

コードを変更したら、**コミット前に必ず以下を実行**:

1. `npm run format` — Prettierでフォーマット修正
2. `npm run lint` — エラーが0であること（warningは許容）
3. `npm run test:unit` — 全テストパス
4. `npm run build` — ビルド成功

これらが全てパスしてからコミットすること。

## コミット規約

- 形式: `type: 日本語の説明`
- type: `feat`, `fix`, `docs`, `refactor`, `release`, `chore`
- 例: `feat: スタッツ分析のモックデータ追加`

## デプロイ

- `main` ブランチへのpushで Vercel が自動デプロイ
- push後にCIがパスするか確認すること

## ディレクトリ構成

```
app/           — Next.js App Router ページ
components/    — 共通UIコンポーネント
lib/           — ユーティリティ・ビジネスロジック
stories/       — Storybook stories + モックデータ
scripts/       — 管理スクリプト（スクレイピング等）
types/         — TypeScript型定義
docs/          — 設計ドキュメント
```

## Prettier設定

- セミコロン: あり
- シングルクォート: あり
- トレイリングカンマ: all
- 行幅: 100文字

## テスト

- ユニットテスト: `lib/**/*.test.ts` に配置
- Storybookテスト: `stories/**/*.stories.tsx` に配置（ブラウザ実行、CI外）
- Storybook実行時は `npm run storybook` を先に停止してから `npm run test` を実行すること（ポート競合防止）
