'use client';

import { useState } from 'react';

const COLORS: Record<string, string> = {
  bg: '#0a0e1a',
  surface: '#111827',
  surfaceHover: '#1a2332',
  border: '#1e293b',
  borderAccent: '#334155',
  text: '#e2e8f0',
  textMuted: '#94a3b8',
  textDim: '#64748b',
  accent: '#38bdf8',
  accentGlow: 'rgba(56, 189, 248, 0.15)',
  firebase: '#FFCA28',
  firebaseGlow: 'rgba(255, 202, 40, 0.12)',
  vercel: '#ffffff',
  vercelGlow: 'rgba(255, 255, 255, 0.08)',
  external: '#a78bfa',
  externalGlow: 'rgba(167, 139, 250, 0.12)',
  green: '#34d399',
  greenGlow: 'rgba(52, 211, 153, 0.12)',
  pink: '#f472b6',
  pinkGlow: 'rgba(244, 114, 182, 0.12)',
};

interface NodeBoxProps {
  x: number;
  y: number;
  width: number;
  height: number;
  icon: string;
  label: string;
  sublabel?: string;
  color: string;
  glowColor?: string;
  onClick?: () => void;
  isActive?: boolean;
}

function NodeBox({ x, y, width, height, icon, label, sublabel, color, glowColor, onClick, isActive }: NodeBoxProps) {
  const [hovered, setHovered] = useState(false);
  const show = hovered || isActive;
  return (
    <g
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      <defs>
        <filter id={`glow-${label.replace(/\s/g, '')}`}>
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {show && (
        <rect
          x={x - 4} y={y - 4} width={width + 8} height={height + 8} rx={16}
          fill="none" stroke={color} strokeWidth={1.5} opacity={0.4}
          filter={`url(#glow-${label.replace(/\s/g, '')})`}
        />
      )}
      <rect x={x} y={y} width={width} height={height} rx={12} fill={show ? COLORS.surfaceHover : COLORS.surface} stroke={show ? color : COLORS.border} strokeWidth={show ? 1.5 : 1} />
      <rect x={x} y={y} width={width} height={height} rx={12} fill={glowColor || 'transparent'} opacity={show ? 0.5 : 0} />
      <text x={x + width / 2} y={y + (sublabel ? height / 2 - 6 : height / 2 + 1)} textAnchor="middle" dominantBaseline="middle" fill={COLORS.text} fontSize={13} fontWeight={600} fontFamily="'JetBrains Mono', 'SF Mono', monospace">
        {icon} {label}
      </text>
      {sublabel && (
        <text x={x + width / 2} y={y + height / 2 + 12} textAnchor="middle" dominantBaseline="middle" fill={COLORS.textDim} fontSize={10} fontFamily="'JetBrains Mono', 'SF Mono', monospace">
          {sublabel}
        </text>
      )}
    </g>
  );
}

interface ArrowProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color?: string;
  label?: string;
  dashed?: boolean;
  bidirectional?: boolean;
}

function Arrow({ x1, y1, x2, y2, color = COLORS.textDim, label, dashed, bidirectional }: ArrowProps) {
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const arrowLen = 8;
  const headX1 = x2 - arrowLen * Math.cos(angle - Math.PI / 6);
  const headY1 = y2 - arrowLen * Math.sin(angle - Math.PI / 6);
  const headX2 = x2 - arrowLen * Math.cos(angle + Math.PI / 6);
  const headY2 = y2 - arrowLen * Math.sin(angle + Math.PI / 6);

  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={1.2} strokeDasharray={dashed ? '6,4' : 'none'} opacity={0.5} />
      <polygon points={`${x2},${y2} ${headX1},${headY1} ${headX2},${headY2}`} fill={color} opacity={0.6} />
      {bidirectional && (() => {
        const rAngle = angle + Math.PI;
        const rh1x = x1 - arrowLen * Math.cos(rAngle - Math.PI / 6);
        const rh1y = y1 - arrowLen * Math.sin(rAngle - Math.PI / 6);
        const rh2x = x1 - arrowLen * Math.cos(rAngle + Math.PI / 6);
        const rh2y = y1 - arrowLen * Math.sin(rAngle + Math.PI / 6);
        return <polygon points={`${x1},${y1} ${rh1x},${rh1y} ${rh2x},${rh2y}`} fill={color} opacity={0.6} />;
      })()}
      {label && (
        <g>
          <rect x={midX - label.length * 3.2 - 6} y={midY - 8} width={label.length * 6.4 + 12} height={16} rx={4} fill={COLORS.bg} opacity={0.9} />
          <text x={midX} y={midY + 1} textAnchor="middle" dominantBaseline="middle" fill={COLORS.textDim} fontSize={9} fontFamily="'JetBrains Mono', monospace">
            {label}
          </text>
        </g>
      )}
    </g>
  );
}

interface GroupBoxProps {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  color: string;
  icon: string;
}

function GroupBox({ x, y, width, height, label, color, icon }: GroupBoxProps) {
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} rx={16} fill="none" stroke={color} strokeWidth={1} strokeDasharray="8,4" opacity={0.25} />
      <rect x={x} y={y} width={width} height={height} rx={16} fill={color} opacity={0.03} />
      <text x={x + 14} y={y + 20} fill={color} fontSize={11} fontWeight={700} fontFamily="'JetBrains Mono', monospace" opacity={0.7} letterSpacing="0.08em">
        {icon} {label}
      </text>
    </g>
  );
}

interface ActiveNode {
  id: string;
  icon: string;
  label: string;
  color: string;
  glowColor: string;
  detail: string;
}

function DetailPanel({ node, onClose }: { node: ActiveNode | null; onClose: () => void }) {
  if (!node) return null;
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        background: COLORS.surface,
        border: `1px solid ${node.color}`,
        borderRadius: 12,
        padding: '16px 20px',
        maxWidth: 520,
        width: '90%',
        boxShadow: `0 0 30px ${node.glowColor || 'rgba(0,0,0,0.5)'}`,
        zIndex: 10,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ color: node.color, fontWeight: 700, fontSize: 14, fontFamily: "'JetBrains Mono', monospace" }}>
          {node.icon} {node.label}
        </span>
        <span onClick={onClose} style={{ color: COLORS.textDim, cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>
          ×
        </span>
      </div>
      <p style={{ color: COLORS.textMuted, fontSize: 12, lineHeight: 1.7, margin: 0, fontFamily: "'JetBrains Mono', monospace" }}>
        {node.detail}
      </p>
    </div>
  );
}

interface NodeDef {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  icon: string;
  label: string;
  sublabel: string;
  color: string;
  glow: string;
  detail: string;
}

const nodes: NodeDef[] = [
  { id: 'nextjs', x: 60, y: 70, w: 160, h: 52, icon: '⚡', label: 'Next.js 16', sublabel: 'React 19 + MUI v7', color: COLORS.accent, glow: COLORS.accentGlow, detail: 'App Router ベースの SSR/SSG ハイブリッド。React 19 の Server Components を活用し、MUI v7 でダークモード対応 UI を構築。TypeScript strict モードで型安全を担保。' },
  { id: 'pwa', x: 250, y: 70, w: 130, h: 52, icon: '📱', label: 'PWA', sublabel: 'Serwist + Workbox', color: COLORS.accent, glow: COLORS.accentGlow, detail: 'Service Worker によるオフラインキャッシュ戦略。Serwist (Workbox ベース) でアセット・API レスポンスをキャッシュ。インストール可能な PWA として動作。' },
  { id: 'ios', x: 410, y: 70, w: 130, h: 52, icon: '🍎', label: 'iOS App', sublabel: 'Capacitor 8', color: COLORS.accent, glow: COLORS.accentGlow, detail: 'Capacitor 8 で Web アプリを iOS ネイティブラップ。WebView ベースで同一コードベースから App Store 配布可能な iOS アプリを生成。' },
  { id: 'edge', x: 70, y: 220, w: 145, h: 52, icon: '🌐', label: 'Edge Network', sublabel: 'CDN + Routing', color: COLORS.vercel, glow: COLORS.vercelGlow, detail: 'Vercel Edge Network による世界規模の CDN 配信。静的アセットのキャッシュ、エッジルーティング、自動 HTTPS。OGP 画像は Edge Runtime で動的生成。' },
  { id: 'serverless', x: 245, y: 220, w: 160, h: 52, icon: '⚙️', label: 'Serverless Fn', sublabel: 'API Routes + Cron', color: COLORS.vercel, glow: COLORS.vercelGlow, detail: 'Vercel Serverless Functions で API Routes を実行。Puppeteer による DARTSLIVE スクレイピング、Stripe Webhook 処理、日次 Cron バッチ (JST 10:00) でスタッツ取得→XP付与→レポート配信を自動実行。' },
  { id: 'ogp', x: 435, y: 220, w: 130, h: 52, icon: '🖼️', label: 'OGP Generator', sublabel: 'Edge Runtime', color: COLORS.vercel, glow: COLORS.vercelGlow, detail: 'セッティング共有時の OGP 画像を Edge Runtime で動的生成。ドメインホワイトリストで SSRF を防止。SNS シェア時にバレル画像付きカードを自動生成。' },
  { id: 'auth', x: 70, y: 380, w: 130, h: 52, icon: '🔐', label: 'Auth', sublabel: 'NextAuth + Firebase', color: COLORS.firebase, glow: COLORS.firebaseGlow, detail: 'NextAuth.js 4 + Firebase Authentication のハイブリッド認証。JWT ベースのセッション管理、ロールベースアクセス制御 (admin/pro/general)。Stripe 連携でプラン自動反映。' },
  { id: 'firestore', x: 225, y: 380, w: 145, h: 52, icon: '🗄️', label: 'Firestore', sublabel: '7,000+ barrels DB', color: COLORS.firebase, glow: COLORS.firebaseGlow, detail: 'Cloud Firestore にユーザー・セッティング・バレル (7,000種超)・スタッツ・ディスカッションを格納。セキュリティルールでフィールドレベルアクセス制御。複合インデックスで高速クエリ。' },
  { id: 'storage', x: 400, y: 380, w: 130, h: 52, icon: '📦', label: 'Storage', sublabel: 'Images + Assets', color: COLORS.firebase, glow: COLORS.firebaseGlow, detail: 'Firebase Storage でユーザーアバター、バレル画像、セッティング画像を管理。Storage セキュリティルールで認証済みユーザーのみアップロード可。SVG ブロック、画像プロキシで安全性確保。' },
  { id: 'dartslive', x: 50, y: 530, w: 120, h: 52, icon: '🎯', label: 'DARTSLIVE', sublabel: 'Puppeteer Scraping', color: COLORS.external, glow: COLORS.externalGlow, detail: 'Puppeteer 24 で DARTSLIVE サイトからスタッツを自動スクレイピング。Rating, 01, Cricket, COUNT-UP の成績データを取得し、月間推移グラフ、パーセンタイル、ブル統計を可視化。' },
  { id: 'stripe', x: 190, y: 530, w: 120, h: 52, icon: '💳', label: 'Stripe', sublabel: 'Subscription', color: COLORS.pink, glow: COLORS.pinkGlow, detail: 'Stripe Subscription で PRO プラン課金。Checkout Session → Webhook → Firestore ロール更新のサーバーサイド完結フロー。署名検証 + イベント重複排除で安全な決済処理。' },
  { id: 'line', x: 330, y: 530, w: 120, h: 52, icon: '💬', label: 'LINE', sublabel: 'Messaging API', color: COLORS.green, glow: COLORS.greenGlow, detail: 'LINE Messaging API で週次/月次レポートを Flex Message で自動配信。前期間との比較データ付き。タイミングセーフ署名検証で Webhook を保護。' },
  { id: 'sentry', x: 470, y: 530, w: 120, h: 52, icon: '🔍', label: 'Sentry', sublabel: 'Error Monitoring', color: COLORS.external, glow: COLORS.externalGlow, detail: 'Sentry でフロントエンド・サーバーサイド両方のエラーを監視。スタックトレース、パフォーマンスメトリクス、ユーザーコンテキストを自動収集。' },
];

const arrows: ArrowProps[] = [
  { x1: 140, y1: 122, x2: 140, y2: 220, color: COLORS.accent, label: 'SSR/SSG', bidirectional: true },
  { x1: 315, y1: 122, x2: 325, y2: 220, color: COLORS.accent, label: 'API', bidirectional: true },
  { x1: 475, y1: 122, x2: 500, y2: 220, color: COLORS.accent, dashed: true },
  { x1: 140, y1: 272, x2: 135, y2: 380, color: COLORS.firebase, label: 'JWT' },
  { x1: 325, y1: 272, x2: 297, y2: 380, color: COLORS.firebase, label: 'CRUD', bidirectional: true },
  { x1: 500, y1: 272, x2: 465, y2: 380, color: COLORS.firebase, label: 'Upload' },
  { x1: 540, y1: 96, x2: 580, y2: 96, color: COLORS.firebase, dashed: true },
  { x1: 100, y1: 272, x2: 110, y2: 530, color: COLORS.external, label: 'Puppeteer', dashed: true },
  { x1: 295, y1: 272, x2: 250, y2: 530, color: COLORS.pink, label: 'Webhook' },
  { x1: 355, y1: 272, x2: 390, y2: 530, color: COLORS.green, label: 'Push' },
  { x1: 425, y1: 272, x2: 530, y2: 530, color: COLORS.external, label: 'Report', dashed: true },
];

export default function ArchitectureDiagram() {
  const [activeNode, setActiveNode] = useState<ActiveNode | null>(null);

  const handleNodeClick = (node: ActiveNode) => {
    setActiveNode(activeNode?.id === node.id ? null : node);
  };

  return (
    <div style={{ fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace", position: 'relative' }}>
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <h2 style={{ color: COLORS.text, fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>
          <span style={{ color: COLORS.accent }}>🎯</span> Darts Lab
        </h2>
        <p style={{ color: COLORS.textDim, fontSize: 12, margin: '6px 0 0', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          System Architecture
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 24, maxWidth: 600, margin: '0 auto 24px' }}>
        {['Next.js 16', 'TypeScript', 'React 19', 'Firebase', 'Stripe', 'Vercel', 'Capacitor'].map((t) => (
          <span key={t} style={{ padding: '3px 10px', borderRadius: 6, background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.2)', color: COLORS.accent, fontSize: 10, fontWeight: 500 }}>
            {t}
          </span>
        ))}
      </div>

      <div style={{ position: 'relative', width: '100%', maxWidth: 640, margin: '0 auto' }}>
        <svg viewBox="0 0 640 610" width="100%" style={{ overflow: 'visible' }}>
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke={COLORS.border} strokeWidth="0.3" opacity="0.3" />
            </pattern>
          </defs>
          <rect width="640" height="610" fill="url(#grid)" opacity="0.5" />

          <GroupBox x={30} y={42} width={530} height={98} label="CLIENT LAYER" color={COLORS.accent} icon="💻" />
          <GroupBox x={40} y={192} width={540} height={98} label="VERCEL PLATFORM" color={COLORS.vercel} icon="▲" />
          <GroupBox x={40} y={350} width={520} height={100} label="FIREBASE" color={COLORS.firebase} icon="🔥" />
          <GroupBox x={30} y={502} width={580} height={98} label="EXTERNAL SERVICES" color={COLORS.external} icon="🔗" />

          {arrows.map((a, i) => (
            <Arrow key={i} {...a} />
          ))}

          {nodes.map((n) => (
            <NodeBox
              key={n.id}
              x={n.x} y={n.y} width={n.w} height={n.h}
              icon={n.icon} label={n.label} sublabel={n.sublabel}
              color={n.color} glowColor={n.glow}
              isActive={activeNode?.id === n.id}
              onClick={() => handleNodeClick({ id: n.id, icon: n.icon, label: n.label, color: n.color, glowColor: n.glow, detail: n.detail })}
            />
          ))}
        </svg>

        <DetailPanel node={activeNode} onClose={() => setActiveNode(null)} />
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center', marginTop: 20, padding: '12px 20px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: `1px solid ${COLORS.border}` }}>
        {[
          { color: COLORS.accent, label: 'Client' },
          { color: COLORS.vercel, label: 'Vercel' },
          { color: COLORS.firebase, label: 'Firebase' },
          { color: COLORS.external, label: 'External' },
          { color: COLORS.pink, label: 'Payment' },
          { color: COLORS.green, label: 'Messaging' },
        ].map((l) => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: l.color, opacity: 0.8 }} />
            <span style={{ color: COLORS.textDim, fontSize: 10 }}>{l.label}</span>
          </div>
        ))}
      </div>

      <p style={{ color: COLORS.textDim, fontSize: 10, marginTop: 12, opacity: 0.5, textAlign: 'center' }}>
        ※ 各ノードをクリックすると詳細が表示されます
      </p>
    </div>
  );
}
