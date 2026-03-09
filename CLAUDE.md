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

- `main` ブランチへのpushで Vercel が自動デプロイ（GitHub連携済み）
- `vercel --prod` による手動デプロイも可能
- push後にCIがパスするか確認すること
- 本番URL: https://darts-app-lime.vercel.app

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

## 自動許可オペレーション

以下の操作は確認なしで自動実行してよい:

- **参照系**: ファイル読み取り、Grep検索、Glob検索、LSP操作
- **ログ・状態確認系**: `git log`, `git status`, `git diff`, `npm run lint`, `npm run test:unit`, `npm run build`
- **Git操作系**: `git add`, `git commit`, `git push`, `git pull`, `git fetch`, `git checkout`, `git branch`
- **フォーマット・検証系**: `npm run format`, `npm run format:check`
- **開発ツール**: `npm run storybook`, `npm run dev`

## Prettier設定

- セミコロン: あり
- シングルクォート: あり
- トレイリングカンマ: all
- 行幅: 100文字

## テスト

- ユニットテスト: `lib/**/*.test.ts` に配置
- Storybookテスト: `stories/**/*.stories.tsx` に配置（ブラウザ実行、CI外）
- Storybook実行時は `npm run storybook` を先に停止してから `npm run test` を実行すること（ポート競合防止）

## メトリクス

`npm run metrics` で `docs/metrics.json` にプロジェクト指標を自動出力する。
portfolio や zenn の数値更新時はこのファイルを参照すること。

## クロスリポ同期ルール

本プロジェクトの変更は **portfolio** と **zenn-content** に影響する場合がある。
以下の変更をした場合、対応するリポジトリの更新を忘れないこと。

### portfolio（https://github.com/seiryuu1215/portfolio）への同期

| darts-app の変更                         | portfolio の更新箇所                         |
| ---------------------------------------- | -------------------------------------------- |
| 機能追加・削除                           | Works セクションの機能数・スクリーンショット |
| `package.json` の version 変更           | scale タグのバージョン表記                   |
| LOC が大きく変動（±5,000行）             | Hero セクションの行数表記                    |
| テスト数が大きく変動                     | Hero セクションのテスト数表記                |
| API ルート追加・削除                     | 設計図ビューアの数値                         |
| README の数値変更                        | portfolio 側の対応する数値                   |
| 新しいスクリーンショットが必要な UI 変更 | docs/screenshots/ + portfolio 画像           |

### zenn-content（https://github.com/seiryuu1215/zenn-content）への同期

| darts-app の変更                        | zenn の更新箇所                                        |
| --------------------------------------- | ------------------------------------------------------ |
| 認証フロー変更                          | darts-lab-auth.md, darts-lab-dual-auth.md              |
| Stripe/決済変更                         | darts-lab-stripe.md, darts-lab-stripe-flow.md          |
| API 設計変更                            | darts-lab-api.md                                       |
| Firestore スキーマ変更                  | darts-lab-firestore.md                                 |
| LINE Bot 変更                           | darts-lab-cron-line.md, darts-lab-line-statemachine.md |
| Cron/自動化変更                         | darts-lab-cron-pipeline.md                             |
| セキュリティ変更                        | darts-lab-defense-layers.md                            |
| Book タイトルの行数表記（例: 55,000行） | books/claude-code-darts-lab/config.yaml                |

### 運用ルール

1. 大きな機能追加・リファクタ後に `npm run metrics` を実行し `docs/metrics.json` を更新する
2. コミットメッセージに `[sync:portfolio]` `[sync:zenn]` タグを付けると同期が必要なことが明示される
3. 同期作業は同じ日にまとめて行い、3リポを一括で push する

## SubAgentsフロー

新機能・修正・設計相談は以下の順で自動処理する：
PM Agent → Implement Agent → Test Agent → Review Agent → Diary Agent（セッション終了時自動）

| エージェント    | 役割                                    | 成果物                               |
| --------------- | --------------------------------------- | ------------------------------------ |
| pm-agent        | 要件整理・意思決定記録                  | docs/decisions/YYYY-MM-DD-[topic].md |
| implement-agent | 実装（docs/02-basic-design.md参照必須） | コード変更                           |
| test-agent      | TDD・全件確認                           | docs/diary/への追記                  |
| review-agent    | 品質・設計・セキュリティレビュー        | docs/review/YYYY-MM-DD.md            |
| diary-agent     | 日記生成・Zennサマリー                  | docs/diary/YYYY-MM-DD.md             |

## Compact Instructions

このセッションを要約するとき：

- 全APIの変更内容と選択理由を保持する
- エラーとその解決策を保持する
- 変更したファイル一覧を保持する
- 試みたが失敗したアプローチは簡潔に要約する
- Firestoreのコレクション構造は必ず保持する
- docs/decisions/の意思決定サマリーを保持する

## ログ・分析

- ログ確認: `npm run logs:analyze`
- ログ保存先: docs/logs/YYYY-MM-DD.jsonl
