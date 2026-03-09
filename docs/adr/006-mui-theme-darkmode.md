# ADR-006: MUI v7 テーマ設計とダークモード

## ステータス

採用済み

## コンテキスト

UI フレームワークとして MUI (Material UI) を採用しており、ダークモード対応が必要。当初、多くのコンポーネントでハードコード色が使用されていた（167箇所）。

## 決定

**MUI v7 のテーマトークンシステム** を全面的に活用し、全てのカラー値をテーマトークンに移行する。

## 設計方針

### テーマ構成

- `components/Providers.tsx` でテーマを一元管理
- `ColorModeContext` による ダーク/ライト切替
- `localStorage` にモード永続化
- CSS による FOUC 防止スクリプト（`layout.tsx` の `themeInitScript`）

### カラートークン戦略

```
❌ color: '#1976d2'           → ✅ color: 'primary.main'
❌ bgcolor: 'rgba(0,0,0,0.1)' → ✅ bgcolor: alpha(theme.palette.text.primary, 0.1)
❌ border: '1px solid #e0e0e0' → ✅ borderColor: 'divider'
```

### 段階的移行

1. **Phase 1**: レイアウト系（Header, Footer, Breadcrumbs）
2. **Phase 2**: ホーム画面コンポーネント
3. **Phase 3**: スタッツ・カレンダー系
4. **Phase 4**: 機能系（バレル検索、セッティング等）

## 代替案

| 選択肢       | 不採用理由                       |
| ------------ | -------------------------------- |
| CSS 変数のみ | MUI コンポーネントとの統合が弱い |
| Tailwind CSS | MUI との共存が複雑、学習コスト   |
| Chakra UI    | MUI からの移行コストが大きすぎる |

## 結果

- 167箇所のハードコード色をテーマトークンに移行完了
- `alpha()` ユーティリティで透明度付きカラーを統一的に生成
- ダーク/ライト両モードで一貫した視覚体験を提供
- FOUC 防止により、初回表示時のちらつきを解消
