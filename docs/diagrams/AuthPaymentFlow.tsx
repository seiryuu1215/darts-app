'use client';

import { useState } from 'react';

const C: Record<string, string> = {
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
};

interface FlowStepProps {
  x: number; y: number; w: number; h: number;
  label: string; sublabel?: string; icon: string; color: string; pulse?: boolean;
}

function FlowStep({ x, y, w, h, label, sublabel, icon, color, pulse }: FlowStepProps) {
  return (
    <g>
      {pulse && (
        <rect x={x - 2} y={y - 2} width={w + 4} height={h + 4} rx={10} fill="none" stroke={color} strokeWidth={1} opacity={0.3}>
          <animate attributeName="opacity" values="0.3;0.1;0.3" dur="2s" repeatCount="indefinite" />
        </rect>
      )}
      <rect x={x} y={y} width={w} height={h} rx={8} fill={C.surface} stroke={color} strokeWidth={1.2} />
      <rect x={x} y={y} width={w} height={h} rx={8} fill={color} opacity={0.06} />
      <text x={x + w / 2} y={y + (sublabel ? h / 2 - 5 : h / 2 + 1)} textAnchor="middle" dominantBaseline="middle" fill={C.text} fontSize={11} fontWeight={600} fontFamily="'JetBrains Mono',monospace">
        {icon} {label}
      </text>
      {sublabel && (
        <text x={x + w / 2} y={y + h / 2 + 10} textAnchor="middle" dominantBaseline="middle" fill={C.textDim} fontSize={8.5} fontFamily="'JetBrains Mono',monospace">
          {sublabel}
        </text>
      )}
    </g>
  );
}

interface ArrowProps {
  x1: number; y1: number; x2: number; y2: number;
  color?: string; label?: string; dashed?: boolean;
}

function Arrow({ x1, y1, x2, y2, color = C.textDim, label, dashed }: ArrowProps) {
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const aLen = 7;
  const h1x = x2 - aLen * Math.cos(angle - Math.PI / 7);
  const h1y = y2 - aLen * Math.sin(angle - Math.PI / 7);
  const h2x = x2 - aLen * Math.cos(angle + Math.PI / 7);
  const h2y = y2 - aLen * Math.sin(angle + Math.PI / 7);
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={1.2} strokeDasharray={dashed ? '5,3' : 'none'} opacity={0.5} />
      <polygon points={`${x2},${y2} ${h1x},${h1y} ${h2x},${h2y}`} fill={color} opacity={0.6} />
      {label && (
        <g>
          <rect x={midX - label.length * 3 - 5} y={midY - 8} width={label.length * 6 + 10} height={14} rx={3} fill={C.bg} opacity={0.95} />
          <text x={midX} y={midY + 1} textAnchor="middle" dominantBaseline="middle" fill={color} fontSize={8} fontWeight={500} fontFamily="'JetBrains Mono',monospace">{label}</text>
        </g>
      )}
    </g>
  );
}

function SectionLabel({ x, y, text, color }: { x: number; y: number; text: string; color: string }) {
  return <text x={x} y={y} fill={color} fontSize={11} fontWeight={700} fontFamily="'JetBrains Mono',monospace" opacity={0.6} letterSpacing="0.1em">{text}</text>;
}

function Badge({ x, y, label, color }: { x: number; y: number; label: string; color: string }) {
  return (
    <g>
      <rect x={x} y={y} width={label.length * 6 + 12} height={18} rx={9} fill={color} opacity={0.15} stroke={color} strokeWidth={0.5} />
      <text x={x + label.length * 3 + 6} y={y + 10} textAnchor="middle" dominantBaseline="middle" fill={color} fontSize={8} fontWeight={600} fontFamily="'JetBrains Mono',monospace">{label}</text>
    </g>
  );
}

interface TabButtonProps {
  label: string; active: boolean; onClick: () => void; color: string;
}

function TabButton({ label, active, onClick, color }: TabButtonProps) {
  return (
    <button onClick={onClick} style={{
      padding: '8px 20px', borderRadius: 8, border: `1px solid ${active ? color : C.border}`,
      background: active ? `${color}15` : 'transparent', color: active ? color : C.textDim,
      fontSize: 12, fontWeight: 600, fontFamily: "'JetBrains Mono',monospace", cursor: 'pointer', transition: 'all 0.2s',
    }}>{label}</button>
  );
}

function AuthFlow() {
  return (
    <svg viewBox="0 0 780 380" width="100%">
      <defs><pattern id="grid1" width="16" height="16" patternUnits="userSpaceOnUse"><path d="M 16 0 L 0 0 0 16" fill="none" stroke={C.border} strokeWidth="0.2" opacity="0.3" /></pattern></defs>
      <rect width="780" height="380" fill="url(#grid1)" opacity="0.4" />
      <SectionLabel x={20} y={20} text="🔐 AUTHENTICATION FLOW" color={C.blue} />
      <FlowStep x={20} y={40} w={140} h={44} label="ユーザー" sublabel="Browser / PWA" icon="👤" color={C.blue} />
      <FlowStep x={240} y={40} w={150} h={44} label="NextAuth.js" sublabel="/api/auth/[...nextauth]" icon="⚙️" color={C.purple} />
      <FlowStep x={480} y={40} w={140} h={44} label="Firebase Auth" sublabel="Email + Google OAuth" icon="🔥" color={C.amber} />
      <FlowStep x={700} y={40} w={60} h={44} label="FS" sublabel="Firestore" icon="" color={C.amber} />
      <Arrow x1={160} y1={62} x2={240} y2={62} color={C.blue} label="ログイン要求" />
      <Arrow x1={390} y1={62} x2={480} y2={62} color={C.purple} label="signIn" />
      <Arrow x1={480} y1={90} x2={390} y2={120} color={C.amber} label="uid + token" />
      <FlowStep x={480} y={110} w={140} h={36} label="認証成功" sublabel="uid 返却" icon="✅" color={C.green} />
      <Arrow x1={620} y1={128} x2={700} y2={128} color={C.amber} label="role取得" />
      <FlowStep x={695} y={150} w={70} h={32} label="users/{uid}" icon="" color={C.amber} />
      <Arrow x1={695} y1={166} x2={390} y2={170} color={C.amber} label="role: admin|pro|general" />
      <FlowStep x={240} y={110} w={150} h={80} label="JWT 生成" sublabel="sub=uid, role=..." icon="🎫" color={C.purple} pulse />
      <Arrow x1={240} y1={150} x2={160} y2={210} color={C.blue} label="Set-Cookie (JWT)" />
      <FlowStep x={20} y={200} w={140} h={44} label="認証済み" sublabel="JWT セッション保持" icon="✅" color={C.green} />
      <SectionLabel x={20} y={280} text="ROLE-BASED ACCESS CONTROL" color={C.purple} />
      <Badge x={20} y={295} label="general (無料)" color={C.textMuted} />
      <Badge x={140} y={295} label="pro (有料)" color={C.pink} />
      <Badge x={240} y={295} label="admin" color={C.red} />
      <FlowStep x={20} y={320} w={100} h={36} label="セッティング3件" icon="" color={C.textMuted} />
      <FlowStep x={140} y={320} w={100} h={36} label="無制限 + DL連携" icon="" color={C.pink} />
      <FlowStep x={260} y={320} w={100} h={36} label="全機能 + 管理" icon="" color={C.red} />
      <FlowStep x={420} y={280} w={200} h={80} label="lib/permissions.ts" sublabel="canCreateDart(role)\ncanAccessPro(role)\nisAdmin(role)" icon="🛡️" color={C.purple} />
      <FlowStep x={660} y={290} w={100} h={60} label="Middleware" sublabel="api-middleware.ts" icon="🔒" color={C.purple} />
      <Arrow x1={620} y1={320} x2={660} y2={320} color={C.purple} label="check" />
    </svg>
  );
}

function PaymentFlow() {
  return (
    <svg viewBox="0 0 780 400" width="100%">
      <defs><pattern id="grid2" width="16" height="16" patternUnits="userSpaceOnUse"><path d="M 16 0 L 0 0 0 16" fill="none" stroke={C.border} strokeWidth="0.2" opacity="0.3" /></pattern></defs>
      <rect width="780" height="400" fill="url(#grid2)" opacity="0.4" />
      <SectionLabel x={20} y={20} text="💳 STRIPE SUBSCRIPTION FLOW" color={C.pink} />
      <FlowStep x={20} y={40} w={130} h={44} label="ユーザー" sublabel="/pricing ページ" icon="👤" color={C.blue} />
      <FlowStep x={230} y={40} w={160} h={44} label="API Routes" sublabel="/api/stripe/*" icon="⚙️" color={C.purple} />
      <FlowStep x={480} y={40} w={130} h={44} label="Stripe" sublabel="Subscription API" icon="💳" color={C.pink} />
      <FlowStep x={700} y={40} w={60} h={44} label="FS" sublabel="Firestore" icon="" color={C.amber} />
      <Arrow x1={150} y1={62} x2={230} y2={62} color={C.blue} label="PRO申込" />
      <Arrow x1={390} y1={55} x2={480} y2={55} color={C.purple} label="createSession" />
      <Arrow x1={480} y1={70} x2={390} y2={100} color={C.pink} label="Session URL" />
      <Arrow x1={230} y1={100} x2={150} y2={115} color={C.purple} label="リダイレクト" />
      <FlowStep x={20} y={120} w={130} h={44} label="Stripe決済画面" sublabel="カード入力" icon="💳" color={C.pink} pulse />
      <Arrow x1={150} y1={142} x2={480} y2={142} color={C.pink} label="支払い完了" />
      <FlowStep x={480} y={170} w={130} h={44} label="Webhook送信" sublabel="checkout.completed" icon="📨" color={C.pink} />
      <Arrow x1={480} y1={192} x2={390} y2={192} color={C.pink} label="署名付き POST" />
      <FlowStep x={230} y={170} w={160} h={70} label="Webhook処理" sublabel="" icon="🔍" color={C.purple} />
      <text x={240} y={210} fill={C.textMuted} fontSize={8} fontFamily="'JetBrains Mono',monospace">1. stripe.webhooks.constructEvent</text>
      <text x={240} y={222} fill={C.textMuted} fontSize={8} fontFamily="'JetBrains Mono',monospace">2. stripeEvents 重複チェック</text>
      <text x={240} y={234} fill={C.textMuted} fontSize={8} fontFamily="'JetBrains Mono',monospace">3. ロール更新 → PRO</text>
      <Arrow x1={390} y1={205} x2={700} y2={205} color={C.amber} label="role: 'pro' 更新" />
      <FlowStep x={695} y={215} w={70} h={32} label="users/{uid}" icon="" color={C.amber} />
      <Arrow x1={695} y1={247} x2={695} y2={270} color={C.amber} />
      <FlowStep x={660} y={270} w={105} h={32} label="stripeEvents" sublabel="" icon="📋" color={C.pink} />
      <Arrow x1={230} y1={240} x2={150} y2={275} color={C.green} label="PRO有効化" />
      <FlowStep x={20} y={270} w={130} h={44} label="PRO ユーザー" sublabel="全機能アンロック" icon="⭐" color={C.green} pulse />
      <SectionLabel x={20} y={350} text="SUBSCRIPTION LIFECYCLE" color={C.pink} />
      <FlowStep x={20} y={360} w={100} h={30} label="active" icon="" color={C.green} />
      <Arrow x1={120} y1={375} x2={160} y2={375} color={C.textDim} />
      <FlowStep x={160} y={360} w={100} h={30} label="past_due" icon="" color={C.amber} />
      <Arrow x1={260} y1={375} x2={300} y2={375} color={C.textDim} />
      <FlowStep x={300} y={360} w={100} h={30} label="canceled" icon="" color={C.red} />
      <Arrow x1={400} y1={375} x2={440} y2={375} color={C.textDim} />
      <FlowStep x={440} y={360} w={100} h={30} label="→ general" icon="" color={C.textMuted} />
      <FlowStep x={580} y={355} w={180} h={36} label="Stripe Customer Portal" sublabel="プラン変更・解約" icon="🔧" color={C.pink} />
    </svg>
  );
}

function LineFlow() {
  return (
    <svg viewBox="0 0 780 340" width="100%">
      <defs><pattern id="grid3" width="16" height="16" patternUnits="userSpaceOnUse"><path d="M 16 0 L 0 0 0 16" fill="none" stroke={C.border} strokeWidth="0.2" opacity="0.3" /></pattern></defs>
      <rect width="780" height="340" fill="url(#grid3)" opacity="0.4" />
      <SectionLabel x={20} y={20} text="💬 LINE ACCOUNT LINKING FLOW" color={C.green} />
      <FlowStep x={20} y={40} w={130} h={44} label="ユーザー" sublabel="Webアプリ" icon="👤" color={C.blue} />
      <FlowStep x={240} y={40} w={160} h={44} label="API Routes" sublabel="/api/line/*" icon="⚙️" color={C.purple} />
      <FlowStep x={500} y={40} w={130} h={44} label="LINE" sublabel="Messaging API" icon="💬" color={C.green} />
      <FlowStep x={700} y={40} w={60} h={44} label="FS" sublabel="" icon="" color={C.amber} />
      <Arrow x1={150} y1={55} x2={240} y2={55} color={C.blue} label="連携開始" />
      <Arrow x1={400} y1={55} x2={700} y2={55} color={C.amber} label="lineLinkCodes 保存" />
      <Arrow x1={240} y1={70} x2={150} y2={105} color={C.purple} label="6桁コード返却" />
      <FlowStep x={20} y={105} w={130} h={36} label="コード表示" sublabel="期限: 5分" icon="🔑" color={C.cyan} />
      <Arrow x1={90} y1={141} x2={90} y2={175} color={C.green} />
      <FlowStep x={20} y={175} w={130} h={36} label="LINEでコード送信" sublabel="" icon="📱" color={C.green} />
      <Arrow x1={150} y1={193} x2={500} y2={193} color={C.green} label="メッセージ" />
      <Arrow x1={500} y1={193} x2={400} y2={193} color={C.green} label="Webhook" />
      <FlowStep x={240} y={175} w={160} h={50} label="Webhook処理" sublabel="HMAC署名検証\ntimingSafeEqual" icon="🔍" color={C.purple} />
      <Arrow x1={400} y1={200} x2={700} y2={230} color={C.amber} label="コード照合 + 紐付け" />
      <FlowStep x={665} y={230} w={100} h={50} label="lineConversations" sublabel="userId紐付け" icon="" color={C.amber} />
      <Arrow x1={400} y1={225} x2={500} y2={260} color={C.green} label="連携完了メッセージ" />
      <SectionLabel x={20} y={280} text="📊 DAILY NOTIFICATION (Cron)" color={C.green} />
      <FlowStep x={20} y={295} w={120} h={30} label="Vercel Cron" sublabel="" icon="⏰" color={C.purple} />
      <Arrow x1={140} y1={310} x2={240} y2={310} color={C.purple} />
      <FlowStep x={240} y={295} w={140} h={30} label="スタッツ集計" sublabel="" icon="📈" color={C.purple} />
      <Arrow x1={380} y1={310} x2={500} y2={310} color={C.green} />
      <FlowStep x={500} y={295} w={140} h={30} label="Flex Message送信" sublabel="" icon="💬" color={C.green} />
      <Arrow x1={640} y1={310} x2={700} y2={310} color={C.green} />
      <FlowStep x={700} y={295} w={60} h={30} label="User" sublabel="" icon="👤" color={C.blue} />
    </svg>
  );
}

export default function AuthPaymentFlowDiagram() {
  const [tab, setTab] = useState<'auth' | 'payment' | 'line'>('auth');

  return (
    <div style={{ fontFamily: "'JetBrains Mono','SF Mono',monospace" }}>
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <h2 style={{ color: C.text, fontSize: 24, fontWeight: 700, margin: 0 }}>
          <span style={{ color: C.pink }}>🔐</span> Darts Lab — Auth & Payment Flow
        </h2>
        <p style={{ color: C.textDim, fontSize: 11, margin: '6px 0 0', letterSpacing: '0.1em' }}>
          AUTHENTICATION · STRIPE SUBSCRIPTION · LINE INTEGRATION
        </p>
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
        <TabButton label="🔐 認証フロー" active={tab === 'auth'} onClick={() => setTab('auth')} color={C.blue} />
        <TabButton label="💳 Stripe 課金" active={tab === 'payment'} onClick={() => setTab('payment')} color={C.pink} />
        <TabButton label="💬 LINE 連携" active={tab === 'line'} onClick={() => setTab('line')} color={C.green} />
      </div>
      <div style={{ maxWidth: 820, margin: '0 auto' }}>
        {tab === 'auth' && <AuthFlow />}
        {tab === 'payment' && <PaymentFlow />}
        {tab === 'line' && <LineFlow />}
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginTop: 20, maxWidth: 700, margin: '20px auto 0' }}>
        {['JWT署名検証', 'RBAC 3ロール', 'Stripe署名検証', 'イベント重複排除', 'HMAC タイミングセーフ', 'AES-256-GCM暗号化', 'IP レートリミット'].map((s) => (
          <span key={s} style={{ padding: '3px 10px', borderRadius: 6, background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.15)', color: C.red, fontSize: 9, fontWeight: 500 }}>
            🛡️ {s}
          </span>
        ))}
      </div>
    </div>
  );
}
