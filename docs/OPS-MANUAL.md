# 運用保守マニュアル

## 概要

Darts Lab の運用・保守に関する手順書。

---

## 1. Cron ジョブ一覧

| ジョブ           | パス                           | スケジュール               | 説明                                       |
| ---------------- | ------------------------------ | -------------------------- | ------------------------------------------ |
| 日次スタッツ同期 | `/api/cron/daily-stats`        | 毎日 01:00 UTC (10:00 JST) | DARTSLIVE スタッツ取得 + XP付与 + LINE配信 |
| API同期          | `/api/cron/dartslive-api-sync` | 毎日 01:00 UTC             | DARTSLIVE API 経由のデータ同期             |
| デモリセット     | `/api/cron/reset-demo`         | 毎日 01:00 UTC             | デモアカウントデータの初期化               |

### 認証

全 Cron ジョブは `CRON_SECRET` で認証。Vercel の Cron 設定から自動実行。

### 監視

- Vercel ダッシュボードの Functions タブでログ確認
- Sentry でエラーアラートを受信

## 2. インシデント対応手順

### 2.1 重大度分類

| レベル | 定義                         | 対応時間           |
| ------ | ---------------------------- | ------------------ |
| P1     | サービス全停止               | 即座               |
| P2     | 主要機能障害（認証、決済）   | 1時間以内          |
| P3     | 部分障害（特定画面のエラー） | 24時間以内         |
| P4     | 軽微な問題                   | 次回リリースで対応 |

### 2.2 対応フロー

1. **検知**: Sentry アラート or ユーザー報告
2. **影響範囲確認**: Vercel Functions ログで確認
3. **原因特定**: Sentry のスタックトレースを確認
4. **対応**:
   - ホットフィックス → `main` ブランチに直接 push
   - ロールバック → Vercel ダッシュボードから前のデプロイに切り替え
5. **報告**: X で障害情報を告知（必要に応じて）

## 3. Firestore バックアップ・リストア

### 3.1 バックアップ

Firebase Console → Firestore → エクスポート

```bash
gcloud firestore export gs://YOUR_BUCKET/backups/$(date +%Y%m%d)
```

### 3.2 リストア

```bash
gcloud firestore import gs://YOUR_BUCKET/backups/20260301
```

### 3.3 推奨頻度

- 週次の自動バックアップを設定
- 大規模データ移行前に手動バックアップ

## 4. Vercel デプロイ管理

### 4.1 通常デプロイ

```bash
git push origin main
# Vercel が自動検知してビルド・デプロイ
```

### 4.2 手動デプロイ

```bash
vercel --prod
```

### 4.3 ロールバック

1. Vercel ダッシュボード → Deployments
2. 正常だった前のデプロイを選択
3. 「Promote to Production」をクリック

### 4.4 環境変数更新

1. Vercel ダッシュボード → Settings → Environment Variables
2. 値を更新
3. 再デプロイが必要（`vercel --prod` or 空コミット push）

## 5. Sentry アラート対応

### 5.1 アラート種類

- **エラー率上昇**: 5分間でエラー数が閾値超過
- **新規エラー**: 未知のエラーパターン検出
- **パフォーマンス劣化**: レスポンスタイムの有意な増加

### 5.2 対応手順

1. Sentry ダッシュボードでエラー詳細を確認
2. スタックトレースから原因箇所を特定
3. 影響ユーザー数を確認
4. 修正 → テスト → デプロイ
5. Sentry 上でイシューを Resolve

## 6. ヘルスチェック

### 6.1 エンドポイント

```
GET /api/health
```

レスポンス:

```json
{
  "status": "ok",
  "firestore": { "latency": 45 },
  "timestamp": "2026-03-10T..."
}
```

### 6.2 外部監視

- Vercel の Uptime Monitoring を活用
- `/api/health` を定期的にポーリング

## 7. セキュリティ運用

### 7.1 定期作業

- **月次**: `npm audit` でセキュリティ脆弱性チェック
- **四半期**: 依存パッケージの major バージョン更新検討
- **随時**: Sentry のセキュリティアラート対応

### 7.2 シークレット管理

- 全シークレットは Vercel の Environment Variables で管理
- `.env.local` はリポジトリに含めない（`.gitignore` で除外済み）
- ローテーション対象: `CRON_SECRET`, `NEXTAUTH_SECRET`

## 8. パフォーマンス監視

### 8.1 主要メトリクス

- **TTFB**: 目標 200ms 以下
- **LCP**: 目標 2.5s 以下
- **CLS**: 目標 0.1 以下

### 8.2 確認方法

- Vercel Analytics（Speed Insights）
- Chrome DevTools → Lighthouse
- Web Vitals レポート
