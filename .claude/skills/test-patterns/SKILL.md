---
name: test-patterns
description: テスト記述パターン。Vitest 4 + Testing Library + Storybook 10の書き方ルール。テスト作成・レビュー時に自動適用する。
---

## フレームワーク

- ユニットテスト: Vitest 4 + @testing-library/react
- UIテスト: Storybook 10
- E2E: Playwright

## ファイル配置

- ユニットテスト: **tests**/ファイル名.test.ts（tsxも可）
- Storybook: stories/コンポーネント名.stories.tsx

## 書き方ルール

- describe/itブロックを使う（testではなくit）
- テスト名は日本語「〜すること」形式
- モック: vi.mock()を使う。any禁止
- 非同期: async/await形式
- テスト実行前に storybook が起動中なら停止すること（ポート競合）

## TDD順序

1. 失敗するテストを先に書く
2. 最小限の実装でグリーンにする
3. リファクタリングする
