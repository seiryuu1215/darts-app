---
name: darts-lab-conventions
description: Darts Lab固有のコーディング規約。APIルート・Firestore命名・MUI・コンポーネント設計のルール。実装・レビュー・PM作業時に自動適用する。
---

## 言語ルール

- コード（変数名・関数名・型名・ファイル名）: 英語
- コミットメッセージ・UIテキスト・コメント・ドキュメント: 日本語
- Claude Codeとの会話: 日本語で応答する

## TypeScript

- `any` 禁止。unknown + 型ガードを使う
- `as` キャストは最終手段
- ES Modules（import/export）。CommonJSのrequire禁止
- Prettierフォーマット必須

## Firestore命名

- コレクション名: camelCase（例: userProfiles, dartsSessions）
- フィールド名: camelCase
- ドキュメントID: 自動生成ID または uid

## APIルート（Next.js App Router）

- ファイル: app/api/[resource]/route.ts
- レスポンス: NextResponse.json({ data, error })
- エラー: 必ずtry-catchでハンドリング

## コンポーネント設計

- Server Components優先、必要な場合のみ 'use client'
- MUI 7のsx propsでスタイリング（Tailwind混在禁止）
- propsの型定義は必ずinterfaceで明示する
