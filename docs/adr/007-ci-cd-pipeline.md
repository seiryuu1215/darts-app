# ADR-007: CI/CD パイプライン設計

## ステータス

採用済み

## コンテキスト

コード品質の維持とデプロイの自動化のため、CI/CD パイプラインを設計する必要があった。

## 決定

**GitHub Actions** + **Vercel** の組み合わせで、以下の 4 段階ゲートを設ける。

## パイプライン構成

### CI（GitHub Actions）

```
Push to main / PR → CI Pipeline
  ├── 1. Security Audit  (npm audit --audit-level=high)
  ├── 2. Lint            (npm run lint)
  ├── 3. Format Check    (npm run format:check)
  ├── 4. Unit Tests      (npm run test:unit — Vitest)
  ├── 5. Storybook Tests (npm run test:storybook)
  ├── 6. Build           (npm run build)
  └── 7. E2E Tests       (npx playwright test)
```

### CD（Vercel）

- `main` ブランチへの push で自動デプロイ
- PR ごとにプレビューデプロイを生成
- 手動デプロイ: `vercel --prod`

### 環境変数

- CI 環境ではダミーの Firebase/NextAuth シークレットを使用
- Stripe Webhook シークレットは CI で不要（テストは単体テストでカバー）

## タイムアウト

- 全体: 10 分
- Node.js: v22
- npm キャッシュ有効化

## テスト戦略

| レイヤー             | ツール     | 対象               | CI実行 |
| -------------------- | ---------- | ------------------ | ------ |
| 単体テスト           | Vitest     | lib/ のロジック    | ✓      |
| コンポーネントテスト | Storybook  | UIコンポーネント   | ✓      |
| E2E テスト           | Playwright | 主要ユーザーフロー | ✓      |

## 代替案

| 選択肢    | 不採用理由                            |
| --------- | ------------------------------------- |
| CircleCI  | GitHub Actions で十分、追加コスト不要 |
| Jenkins   | セルフホストの運用コスト              |
| GitLab CI | GitHub エコシステムとの統合が自然     |

## 結果

- 全 PR で自動テスト実行、品質の一貫性を確保
- ビルド失敗の早期検出（平均 CI 時間: 3-5 分）
- Vercel のプレビューデプロイで PR レビューが効率化
- format + lint のゲートにより、コードスタイルの統一を自動化
