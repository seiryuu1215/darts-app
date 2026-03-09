---
name: commit-style
description: コミットメッセージ規約。実装完了時に自動適用する。
---

## フォーマット

`type: 日本語の説明`

## type一覧

feat / fix / docs / refactor / chore / update

## 例

- feat: ダーツセッション比較機能を追加
- fix: Firestoreクエリのページネーションバグを修正

## クロスリポ同期

以下の変更時はコミットメッセージに [sync:portfolio] または [sync:zenn] タグを付ける：

- 機能追加・削除 → [sync:portfolio]
- API設計・Firestore・認証・Stripe変更 → [sync:zenn]
