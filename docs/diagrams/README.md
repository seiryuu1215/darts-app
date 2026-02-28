# Darts Lab — インタラクティブ設計図（TSXソース）

> 最終更新: 2026-03-01

## ライブビューア

**[設計図ビューア → https://portfolio-seiryuu.vercel.app/projects/darts-lab](https://portfolio-seiryuu.vercel.app/projects/darts-lab)**

クリック操作で詳細表示・タブ切替が可能な SVG / React ベースの設計図です。

## ファイル一覧

| ファイル | 設計図 | 内容 |
|---|---|---|
| `Architecture.tsx` | 📐 アーキテクチャ | Client → Vercel → Firebase → 外部サービスの全体構成 |
| `ERDiagram.tsx` | 🗄️ ER図 | Firestore 12コレクション + 11サブコレクション + リレーション |
| `AuthPaymentFlow.tsx` | 🔐 認証・課金 | NextAuth JWT フロー / Stripe Webhook / LINE連携 |
| `CronFlow.tsx` | ⏰ Cronバッチ | 日次自動パイプライン（9ステップ + XPルール14種） |
| `PageFlow.tsx` | 📱 画面遷移 | 30+ページ × ロール別アクセス制御 |
| `ApiDataFlow.tsx` | 🔄 API・データフロー | 25+ APIルート / セキュリティレイヤー |
| `RequirementsViz.tsx` | 📋 要件・ペルソナ | 機能マップ / ペルソナ / 非機能要件 / 技術選定 |

## 技術仕様

- React + TypeScript（`'use client'` コンポーネント）
- インラインSVG + CSS-in-JS スタイル
- 外部依存なし（React のみ）
- ポートフォリオサイト（Next.js）からの `dynamic(() => import(...))` でロード
