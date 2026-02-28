'use client';

import { useState } from 'react';

const COLORS: Record<string, string> = {
  bg: '#0a0e1a',
  surface: '#111827',
  surfaceHover: '#1a2332',
  border: '#1e293b',
  text: '#e2e8f0',
  textMuted: '#94a3b8',
  textDim: '#64748b',
  blue: '#38bdf8',
  green: '#34d399',
  amber: '#fbbf24',
  pink: '#f472b6',
  purple: '#a78bfa',
  red: '#f87171',
  cyan: '#22d3ee',
  orange: '#fb923c',
};

interface TabProps {
  label: string;
  active: boolean;
  onClick: () => void;
  color: string;
}

function Tab({ label, active, onClick, color }: TabProps) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 16px',
        borderRadius: 8,
        border: `1px solid ${active ? color : COLORS.border}`,
        background: active ? `${color}15` : 'transparent',
        color: active ? color : COLORS.textDim,
        fontSize: 11,
        fontWeight: 600,
        fontFamily: "'JetBrains Mono',monospace",
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );
}

/* ====== FEATURE MAP ====== */

interface Feature {
  name: string;
  role: string;
  note?: string;
}

interface FeatureGroup {
  id: string;
  label: string;
  icon: string;
  color: string;
  features: Feature[];
}

const featureGroups: FeatureGroup[] = [
  {
    id: 'auth',
    label: '認証・ユーザー',
    icon: '🔐',
    color: COLORS.purple,
    features: [
      { name: 'メール/パスワード認証', role: 'all' },
      { name: 'Google OAuth', role: 'all' },
      { name: 'パスワードリセット', role: 'all' },
      { name: 'プロフィール編集', role: 'auth' },
      { name: 'ロール管理', role: 'admin' },
    ],
  },
  {
    id: 'settings',
    label: 'セッティング管理',
    icon: '🎯',
    color: COLORS.green,
    features: [
      { name: '登録 (3件 / 無制限)', role: 'auth', note: 'general: 3件, PRO: ∞' },
      { name: '一覧・検索・フィルタ', role: 'all' },
      { name: '詳細閲覧', role: 'all' },
      { name: '編集・削除', role: 'auth' },
      { name: '比較 (差分カラー)', role: 'all' },
      { name: '使用履歴', role: 'auth' },
      { name: 'いいね・コメント・ブックマーク', role: 'auth' },
      { name: 'OGP付きシェア', role: 'all' },
    ],
  },
  {
    id: 'barrels',
    label: 'バレルDB',
    icon: '🔍',
    color: COLORS.amber,
    features: [
      { name: 'スペック横断検索 (7,000+)', role: 'all' },
      { name: '売上ランキング', role: 'all' },
      { name: '実寸シミュレーター', role: 'all' },
      { name: '診断クイズ (6問)', role: 'all' },
      { name: 'レコメンドエンジン', role: 'all', note: '100点スコアリング' },
      { name: 'アフィリエイト (6ショップ)', role: 'all' },
    ],
  },
  {
    id: 'stats',
    label: 'スタッツ (53コンポ)',
    icon: '📊',
    color: COLORS.blue,
    features: [
      { name: '手動スタッツ記録', role: 'auth' },
      { name: 'DARTSLIVE自動連携', role: 'pro', note: 'Puppeteer' },
      { name: 'Rating/01/Cricket/CU 推移', role: 'pro' },
      { name: 'スキルレーダー・DNA', role: 'pro' },
      { name: 'ヒートマップ・疲労分析', role: 'pro' },
      { name: 'AI練習レコメンド', role: 'pro' },
      { name: 'カレンダー表示', role: 'auth' },
      { name: 'CSVエクスポート', role: 'pro' },
    ],
  },
  {
    id: 'community',
    label: 'コミュニティ',
    icon: '📢',
    color: COLORS.cyan,
    features: [
      { name: 'ディスカッション (6カテゴリ)', role: 'auth' },
      { name: '返信 (Rt・バレル表示)', role: 'auth' },
      { name: '記事投稿 (Markdown)', role: 'admin' },
      { name: 'ピン留め・ロック', role: 'admin' },
    ],
  },
  {
    id: 'shops',
    label: 'マイショップ',
    icon: '🏪',
    color: COLORS.orange,
    features: [
      { name: 'ブックマーク・リスト管理', role: 'auth', note: 'general: 5件, PRO: ∞' },
      { name: 'URL自動取得', role: 'auth' },
      { name: '路線フィルター', role: 'auth' },
      { name: 'マップ表示 (Leaflet)', role: 'auth' },
      { name: 'タグ・メモ・評価', role: 'auth' },
    ],
  },
  {
    id: 'engagement',
    label: 'エンゲージメント',
    icon: '⭐',
    color: COLORS.pink,
    features: [
      { name: 'XP / 14種ルール', role: 'auth' },
      { name: '30段階ランク', role: 'auth' },
      { name: '12種の実績', role: 'auth' },
      { name: '目標トラッキング', role: 'pro' },
      { name: '紙吹雪演出', role: 'auth' },
    ],
  },
  {
    id: 'integration',
    label: '外部連携',
    icon: '🔗',
    color: COLORS.red,
    features: [
      { name: 'LINE アカウント連携', role: 'auth' },
      { name: '週次/月次レポート配信', role: 'pro' },
      { name: 'Stripe サブスクリプション', role: 'all' },
      { name: 'Push通知 (VAPID)', role: 'pro' },
    ],
  },
  {
    id: 'platform',
    label: 'プラットフォーム',
    icon: '📱',
    color: COLORS.textMuted,
    features: [
      { name: 'PWA (Serwist)', role: 'all' },
      { name: 'iOS (Capacitor 8)', role: 'all' },
      { name: 'ダークモード', role: 'all' },
      { name: 'レスポンシブ', role: 'all' },
    ],
  },
];

function roleColor(r: string): string {
  return r === 'pro' ? COLORS.pink : r === 'admin' ? COLORS.red : r === 'auth' ? COLORS.blue : COLORS.textDim;
}

function roleLabel(r: string): string {
  return r === 'pro' ? 'PRO' : r === 'admin' ? 'ADMIN' : r === 'auth' ? 'AUTH' : 'PUBLIC';
}

function FeatureMap() {
  const [hover, setHover] = useState<string | null>(null);
  const total = featureGroups.reduce((a, g) => a + g.features.length, 0);

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
        <span style={{ color: COLORS.text, fontSize: 12, fontWeight: 700 }}>📋 {total} Features</span>
        {[
          { l: 'PUBLIC', c: COLORS.textDim },
          { l: 'AUTH', c: COLORS.blue },
          { l: 'PRO', c: COLORS.pink },
          { l: 'ADMIN', c: COLORS.red },
        ].map((x) => (
          <span
            key={x.l}
            style={{
              padding: '2px 8px',
              borderRadius: 4,
              background: `${x.c}15`,
              border: `1px solid ${x.c}30`,
              color: x.c,
              fontSize: 9,
            }}
          >
            {x.l}
          </span>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {featureGroups.map((g) => (
          <div
            key={g.id}
            style={{
              background: COLORS.surface,
              borderRadius: 10,
              border: `1px solid ${COLORS.border}`,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '10px 14px',
                background: `${g.color}10`,
                borderBottom: `1px solid ${COLORS.border}`,
              }}
            >
              <span style={{ color: g.color, fontSize: 12, fontWeight: 700 }}>
                {g.icon} {g.label}
              </span>
              <span style={{ color: COLORS.textDim, fontSize: 9, marginLeft: 8 }}>{g.features.length} features</span>
            </div>
            <div style={{ padding: '8px 10px' }}>
              {g.features.map((f, i) => (
                <div
                  key={i}
                  onMouseEnter={() => setHover(`${g.id}-${i}`)}
                  onMouseLeave={() => setHover(null)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '5px 6px',
                    borderRadius: 6,
                    background: hover === `${g.id}-${i}` ? COLORS.surfaceHover : 'transparent',
                    transition: 'background 0.15s',
                  }}
                >
                  <span style={{ color: COLORS.text, fontSize: 9.5 }}>{f.name}</span>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    {f.note && <span style={{ color: COLORS.textDim, fontSize: 7.5 }}>{f.note}</span>}
                    <span
                      style={{
                        padding: '1px 5px',
                        borderRadius: 3,
                        background: `${roleColor(f.role)}15`,
                        color: roleColor(f.role),
                        fontSize: 7,
                        fontWeight: 600,
                      }}
                    >
                      {roleLabel(f.role)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ====== PERSONA ====== */

interface Persona {
  name: string;
  sub: string;
  icon: string;
  rt: string;
  exp: string;
  color: string;
  needs: string[];
  journey: string[];
  keyFeatures: string[];
}

const personas: Persona[] = [
  {
    name: 'Aさん',
    sub: '初心者',
    icon: '🟢',
    rt: 'Rt.3',
    exp: '3ヶ月',
    color: COLORS.green,
    needs: ['他人のセッティングを参考にしたい', '自分の成長を記録したい', 'バレル選びに迷っている'],
    journey: ['セッティング閲覧', 'バレル診断クイズ', '手動スタッツ記録', 'セッティング登録'],
    keyFeatures: ['バレル検索', '診断クイズ', 'セッティング閲覧', '手動記録'],
  },
  {
    name: 'Bさん',
    sub: '中級者',
    icon: '🔵',
    rt: 'Rt.8',
    exp: '2年',
    color: COLORS.blue,
    needs: ['バレル買い替えの検討', 'スタッツ推移の分析', '練習の方向性を知りたい'],
    journey: ['DARTSLIVE連携', 'スタッツ分析', 'レコメンド', 'ショップ探索', '目標設定'],
    keyFeatures: ['DL自動連携', '53コンポ分析', 'レコメンド', '目標管理'],
  },
  {
    name: 'Cさん',
    sub: '上級者',
    icon: '🟣',
    rt: 'Rt.14',
    exp: '5年',
    color: COLORS.purple,
    needs: ['セッティング情報の発信', 'コミュニティでの知見共有', '最高の練習環境整備'],
    journey: ['セッティング共有', 'ディスカッション投稿', 'レポート確認', 'ショップ管理'],
    keyFeatures: ['セッティング共有', 'ディスカッション', 'LINE通知', 'マイショップ'],
  },
];

function PersonaView() {
  return (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
      {personas.map((p) => (
        <div
          key={p.name}
          style={{
            width: 280,
            background: COLORS.surface,
            borderRadius: 12,
            border: `1px solid ${p.color}30`,
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '16px',
              background: `${p.color}08`,
              borderBottom: `1px solid ${p.color}20`,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 32 }}>{p.icon}</div>
            <div style={{ color: p.color, fontSize: 16, fontWeight: 700, marginTop: 4 }}>{p.name}</div>
            <div style={{ color: COLORS.textMuted, fontSize: 10 }}>
              {p.sub} ─ {p.rt} ─ 経験{p.exp}
            </div>
          </div>
          {/* Needs */}
          <div style={{ padding: '12px 16px' }}>
            <div
              style={{ color: p.color, fontSize: 9, fontWeight: 700, marginBottom: 6, letterSpacing: '0.05em' }}
            >
              NEEDS
            </div>
            {p.needs.map((n, i) => (
              <div
                key={i}
                style={{
                  color: COLORS.textMuted,
                  fontSize: 9.5,
                  padding: '3px 0',
                  borderBottom: i < p.needs.length - 1 ? `1px solid ${COLORS.border}` : 'none',
                }}
              >
                • {n}
              </div>
            ))}
          </div>
          {/* Journey */}
          <div style={{ padding: '0 16px 12px' }}>
            <div
              style={{ color: p.color, fontSize: 9, fontWeight: 700, marginBottom: 6, letterSpacing: '0.05em' }}
            >
              USER JOURNEY
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {p.journey.map((j, i) => (
                <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span
                    style={{
                      padding: '2px 7px',
                      borderRadius: 4,
                      background: `${p.color}12`,
                      border: `1px solid ${p.color}25`,
                      color: p.color,
                      fontSize: 8.5,
                    }}
                  >
                    {j}
                  </span>
                  {i < p.journey.length - 1 && (
                    <span style={{ color: COLORS.textDim, fontSize: 10 }}>→</span>
                  )}
                </span>
              ))}
            </div>
          </div>
          {/* Key Features */}
          <div
            style={{
              padding: '10px 16px',
              background: `${p.color}05`,
              borderTop: `1px solid ${p.color}15`,
            }}
          >
            <div style={{ color: p.color, fontSize: 9, fontWeight: 700, marginBottom: 4 }}>KEY FEATURES</div>
            <div style={{ color: COLORS.textMuted, fontSize: 9 }}>{p.keyFeatures.join(' · ')}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ====== NON-FUNCTIONAL REQUIREMENTS ====== */

interface NfrItem {
  metric: string;
  value: string;
  status: string;
  detail: string;
}

interface NfrCategory {
  label: string;
  icon: string;
  color: string;
  items: NfrItem[];
}

const nfrCategories: NfrCategory[] = [
  {
    label: 'パフォーマンス',
    icon: '⚡',
    color: COLORS.green,
    items: [
      { metric: 'FCP', value: '< 2秒', status: '✅', detail: 'Vercel CDN + Edge Network' },
      { metric: 'ページ遷移', value: 'CSR', status: '✅', detail: 'App Router Client Navigation' },
      { metric: '画像最適化', value: 'Next/Image', status: '✅', detail: 'Firebase Storage + CDN' },
      { metric: 'オフラインキャッシュ', value: 'Serwist', status: '✅', detail: 'PWA Service Worker' },
    ],
  },
  {
    label: 'セキュリティ',
    icon: '🛡️',
    color: COLORS.red,
    items: [
      { metric: '認証', value: 'JWT + Firebase', status: '✅', detail: 'NextAuth.js デュアル認証' },
      { metric: '認可', value: 'RBAC 3ロール', status: '✅', detail: 'admin / pro / general' },
      { metric: 'レートリミット', value: '60 req/min', status: '✅', detail: 'Upstash Redis IP-based' },
      { metric: 'Webhook検証', value: 'HMAC + 署名', status: '✅', detail: 'Stripe + LINE timingSafe' },
      { metric: '暗号化', value: 'AES-256-GCM', status: '✅', detail: 'DL認証情報保護' },
      { metric: 'SSRF防止', value: 'ホワイトリスト', status: '✅', detail: 'OGP画像生成' },
      { metric: 'CSP', value: 'nonce方式', status: '✅', detail: 'セキュリティヘッダー7種' },
      { metric: 'SVGブロック', value: 'XSS防止', status: '✅', detail: '画像プロキシ' },
    ],
  },
  {
    label: '可用性',
    icon: '🟢',
    color: COLORS.blue,
    items: [
      { metric: 'ホスティング', value: 'Vercel', status: '✅', detail: '自動スケーリング' },
      { metric: 'データベース', value: 'Firestore', status: '✅', detail: 'SLA 99.999%' },
      { metric: 'エラー監視', value: 'Sentry', status: '✅', detail: 'リアルタイム例外追跡' },
      { metric: 'CI/CD', value: 'GitHub Actions', status: '✅', detail: 'lint + format + test + build' },
    ],
  },
  {
    label: 'テスト',
    icon: '🧪',
    color: COLORS.purple,
    items: [
      { metric: 'ユニットテスト', value: '158+ tests', status: '✅', detail: 'Vitest' },
      { metric: 'UIカタログ', value: 'Storybook', status: '✅', detail: 'コンポーネントカタログ' },
      { metric: '型安全', value: 'strict mode', status: '✅', detail: 'TypeScript 5' },
      { metric: 'フォーマット', value: 'Prettier', status: '✅', detail: 'CI/CD統合' },
    ],
  },
  {
    label: 'スケール',
    icon: '📈',
    color: COLORS.amber,
    items: [
      { metric: 'バレルDB', value: '7,000+', status: '📊', detail: 'スクリプトインポート' },
      { metric: 'スタッツコンポ', value: '53', status: '📊', detail: 'モジュラー設計' },
      { metric: 'API Routes', value: '25+', status: '📊', detail: 'Serverless Functions' },
      { metric: 'ページ数', value: '30+', status: '📊', detail: 'App Router' },
    ],
  },
];

function NfrDashboard() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
      {nfrCategories.map((cat) => (
        <div
          key={cat.label}
          style={{
            background: COLORS.surface,
            borderRadius: 10,
            border: `1px solid ${COLORS.border}`,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '10px 14px',
              background: `${cat.color}08`,
              borderBottom: `1px solid ${COLORS.border}`,
            }}
          >
            <span style={{ color: cat.color, fontSize: 12, fontWeight: 700 }}>
              {cat.icon} {cat.label}
            </span>
          </div>
          <div style={{ padding: '6px 8px' }}>
            {cat.items.map((item, i) => (
              <div
                key={i}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '20px 1fr 70px',
                  alignItems: 'center',
                  padding: '6px 8px',
                  borderRadius: 6,
                  gap: 6,
                }}
              >
                <span style={{ fontSize: 11 }}>{item.status}</span>
                <div>
                  <div style={{ color: COLORS.text, fontSize: 9.5, fontWeight: 600 }}>{item.metric}</div>
                  <div style={{ color: COLORS.textDim, fontSize: 8 }}>{item.detail}</div>
                </div>
                <span
                  style={{
                    textAlign: 'right',
                    color: cat.color,
                    fontSize: 9,
                    fontWeight: 600,
                    padding: '2px 6px',
                    borderRadius: 4,
                    background: `${cat.color}10`,
                  }}
                >
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ====== TECH SELECTION MATRIX ====== */

interface TechDecision {
  category: string;
  choice: string;
  alternatives: string[];
  reasons: string[];
  color: string;
}

const techDecisions: TechDecision[] = [
  {
    category: 'フレームワーク',
    choice: 'Next.js 16',
    alternatives: ['Remix', 'Nuxt.js', 'SvelteKit'],
    reasons: ['App Router直感的', 'Vercel親和性', 'SSR/SSG柔軟', 'React 19対応'],
    color: COLORS.blue,
  },
  {
    category: 'UI',
    choice: 'MUI v7 + Tailwind v4',
    alternatives: ['shadcn/ui', 'Chakra UI', 'Ant Design'],
    reasons: ['豊富なコンポーネント', 'ダークモード対応', '日本語入力親和性', 'Tailwindで微調整'],
    color: COLORS.purple,
  },
  {
    category: 'DB',
    choice: 'Cloud Firestore',
    alternatives: ['PostgreSQL', 'MongoDB', 'PlanetScale'],
    reasons: ['NoSQLスキーマレス', 'リアルタイム対応', 'セキュリティルール', 'Firebase統合'],
    color: COLORS.amber,
  },
  {
    category: '認証',
    choice: 'NextAuth + Firebase Auth',
    alternatives: ['Auth0', 'Clerk', 'Supabase Auth'],
    reasons: ['JWT+ロール管理', 'Google OAuth統合', 'Next.js標準', '無料枠十分'],
    color: COLORS.green,
  },
  {
    category: '決済',
    choice: 'Stripe',
    alternatives: ['PayPal', 'Square', 'Paddle'],
    reasons: ['Webhook完結', 'サブスク対応', 'Portal UI提供', '日本対応'],
    color: COLORS.pink,
  },
  {
    category: 'ホスティング',
    choice: 'Vercel',
    alternatives: ['Cloudflare Pages', 'Netlify', 'AWS Amplify'],
    reasons: ['Next.js最適', 'Edge Network', 'Cron対応', '自動スケール'],
    color: COLORS.textMuted,
  },
];

function TechMatrix() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {techDecisions.map((t) => (
        <div
          key={t.category}
          style={{
            background: COLORS.surface,
            borderRadius: 10,
            border: `1px solid ${COLORS.border}`,
            padding: '14px 16px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 8,
            }}
          >
            <div>
              <span style={{ color: COLORS.textDim, fontSize: 9, fontWeight: 600 }}>{t.category}</span>
              <span style={{ color: t.color, fontSize: 14, fontWeight: 700, marginLeft: 10 }}>{t.choice}</span>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {t.alternatives.map((a) => (
                <span
                  key={a}
                  style={{
                    padding: '2px 6px',
                    borderRadius: 4,
                    background: `${COLORS.red}08`,
                    border: `1px solid ${COLORS.red}15`,
                    color: COLORS.textDim,
                    fontSize: 8,
                    textDecoration: 'line-through',
                    opacity: 0.6,
                  }}
                >
                  {a}
                </span>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {t.reasons.map((r, i) => (
              <span
                key={i}
                style={{
                  padding: '3px 8px',
                  borderRadius: 5,
                  background: `${t.color}10`,
                  border: `1px solid ${t.color}20`,
                  color: t.color,
                  fontSize: 8.5,
                }}
              >
                ✓ {r}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ====== MAIN ====== */

export default function RequirementsViz() {
  const [tab, setTab] = useState('features');

  return (
    <div
      style={{
        background: COLORS.bg,
        minHeight: '100vh',
        padding: '24px 16px',
        fontFamily: "'JetBrains Mono','SF Mono',monospace",
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <h1 style={{ color: COLORS.text, fontSize: 24, fontWeight: 700, margin: 0 }}>
          <span style={{ color: COLORS.amber }}>📋</span> Darts Lab — Requirements Overview
        </h1>
        <p style={{ color: COLORS.textDim, fontSize: 11, margin: '6px 0 0', letterSpacing: '0.1em' }}>
          23 FEATURES · 3 USER ROLES · 9 CATEGORIES · FULL-STACK SERVERLESS
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 8,
          justifyContent: 'center',
          marginBottom: 20,
          flexWrap: 'wrap',
        }}
      >
        <Tab label="📋 機能マップ" active={tab === 'features'} onClick={() => setTab('features')} color={COLORS.green} />
        <Tab label="👤 ペルソナ" active={tab === 'personas'} onClick={() => setTab('personas')} color={COLORS.blue} />
        <Tab label="🛡️ 非機能要件" active={tab === 'nfr'} onClick={() => setTab('nfr')} color={COLORS.red} />
        <Tab label="⚙️ 技術選定" active={tab === 'tech'} onClick={() => setTab('tech')} color={COLORS.purple} />
      </div>

      <div style={{ maxWidth: 920, margin: '0 auto' }}>
        {tab === 'features' && <FeatureMap />}
        {tab === 'personas' && <PersonaView />}
        {tab === 'nfr' && <NfrDashboard />}
        {tab === 'tech' && <TechMatrix />}
      </div>
    </div>
  );
}
