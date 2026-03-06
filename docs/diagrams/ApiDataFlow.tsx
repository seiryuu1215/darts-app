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

interface EndpointRowProps {
  x: number;
  y: number;
  method: string;
  path: string;
  desc: string;
  auth?: string;
  color?: string;
}

function EndpointRow({ x, y, method, path, desc, auth }: EndpointRowProps) {
  const methodWidth =
    method === 'GET' ? 30 : method === 'POST' ? 35 : method === 'DELETE' ? 45 : 30;
  const methodCenter =
    method === 'GET' ? 15 : method === 'POST' ? 17 : method === 'DELETE' ? 22 : 15;
  const methodColor =
    method === 'GET' ? C.green : method === 'POST' ? C.blue : method === 'DELETE' ? C.red : C.amber;
  const textOffset = method === 'DELETE' ? 50 : 38;

  return (
    <g>
      <rect x={x} y={y} width={methodWidth} height={14} rx={3} fill={methodColor} opacity={0.15} />
      <text
        x={x + methodCenter}
        y={y + 8}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={methodColor}
        fontSize={7}
        fontWeight={700}
        fontFamily="'JetBrains Mono',monospace"
      >
        {method}
      </text>
      <text
        x={x + textOffset}
        y={y + 8}
        dominantBaseline="middle"
        fill={C.text}
        fontSize={8}
        fontWeight={500}
        fontFamily="'JetBrains Mono',monospace"
      >
        {path}
      </text>
      <text
        x={x + 300}
        y={y + 8}
        dominantBaseline="middle"
        fill={C.textDim}
        fontSize={7.5}
        fontFamily="'JetBrains Mono',monospace"
      >
        {desc}
      </text>
      {auth && (
        <>
          <rect
            x={x + 470}
            y={y}
            width={auth.length * 5 + 8}
            height={14}
            rx={3}
            fill={
              auth === 'admin'
                ? C.red
                : auth === 'PRO'
                  ? C.pink
                  : auth === 'cron'
                    ? C.purple
                    : C.blue
            }
            opacity={0.12}
          />
          <text
            x={x + 474}
            y={y + 8}
            dominantBaseline="middle"
            fill={
              auth === 'admin'
                ? C.red
                : auth === 'PRO'
                  ? C.pink
                  : auth === 'cron'
                    ? C.purple
                    : C.blue
            }
            fontSize={7}
            fontWeight={600}
            fontFamily="'JetBrains Mono',monospace"
          >
            {auth}
          </text>
        </>
      )}
    </g>
  );
}

interface SectionHeaderProps {
  x: number;
  y: number;
  w: number;
  label: string;
  icon: string;
  color: string;
}

function SectionHeader({ x, y, w, label, icon, color }: SectionHeaderProps) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={20} rx={4} fill={color} opacity={0.1} />
      <text
        x={x + 8}
        y={y + 11}
        dominantBaseline="middle"
        fill={color}
        fontSize={9}
        fontWeight={700}
        fontFamily="'JetBrains Mono',monospace"
      >
        {icon} {label}
      </text>
    </g>
  );
}

interface DataFlowBoxProps {
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  items: string[];
  color: string;
}

function DataFlowBox({ x, y, w, h, title, items, color }: DataFlowBoxProps) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={8}
        fill={C.surface}
        stroke={color}
        strokeWidth={1}
      />
      <rect x={x} y={y} width={w} height={20} rx={8} fill={color} opacity={0.12} />
      <rect x={x} y={y + 14} width={w} height={6} fill={color} opacity={0.12} />
      <text
        x={x + 10}
        y={y + 13}
        fill={color}
        fontSize={9}
        fontWeight={700}
        fontFamily="'JetBrains Mono',monospace"
      >
        {title}
      </text>
      {items.map((item, i) => (
        <text
          key={item}
          x={x + 10}
          y={y + 35 + i * 14}
          fill={C.textMuted}
          fontSize={8}
          fontFamily="'JetBrains Mono',monospace"
        >
          {item}
        </text>
      ))}
    </g>
  );
}

interface FlowArrowProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color?: string;
  label?: string;
}

function FlowArrow({ x1, y1, x2, y2, color = C.textDim, label }: FlowArrowProps) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const a = Math.atan2(y2 - y1, x2 - x1);
  const l = 5;
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={1} opacity={0.4} />
      <polygon
        points={`${x2},${y2} ${x2 - l * Math.cos(a - 0.4)},${y2 - l * Math.sin(a - 0.4)} ${x2 - l * Math.cos(a + 0.4)},${y2 - l * Math.sin(a + 0.4)}`}
        fill={color}
        opacity={0.5}
      />
      {label && (
        <g>
          <rect
            x={mx - label.length * 2.8 - 3}
            y={my - 6}
            width={label.length * 5.6 + 6}
            height={11}
            rx={2}
            fill={C.bg}
            opacity={0.95}
          />
          <text
            x={mx}
            y={my + 1}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={color}
            fontSize={7}
            fontFamily="'JetBrains Mono',monospace"
          >
            {label}
          </text>
        </g>
      )}
    </g>
  );
}

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
        padding: '8px 18px',
        borderRadius: 8,
        border: `1px solid ${active ? color : C.border}`,
        background: active ? `${color}15` : 'transparent',
        color: active ? color : C.textDim,
        fontSize: 12,
        fontWeight: 600,
        fontFamily: "'JetBrains Mono',monospace",
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );
}

function ApiEndpoints() {
  return (
    <svg viewBox="0 0 560 760" width="100%">
      <defs>
        <pattern id="apigrid" width="16" height="16" patternUnits="userSpaceOnUse">
          <path
            d="M 16 0 L 0 0 0 16"
            fill="none"
            stroke={C.border}
            strokeWidth="0.2"
            opacity="0.3"
          />
        </pattern>
      </defs>
      <rect width="560" height="760" fill="url(#apigrid)" opacity="0.4" />

      <SectionHeader
        x={10}
        y={10}
        w={540}
        label="認証 (Authentication)"
        icon="🔐"
        color={C.purple}
      />
      <EndpointRow
        x={15}
        y={38}
        method="GET"
        path="/api/auth/[...nextauth]"
        desc="NextAuth.js ハンドラー"
        auth="public"
      />
      <EndpointRow
        x={15}
        y={58}
        method="POST"
        path="/api/auth/[...nextauth]"
        desc="ログイン / ログアウト"
        auth="public"
      />

      <SectionHeader x={10} y={85} w={540} label="DARTSLIVE スタッツ" icon="🎯" color={C.blue} />
      <EndpointRow
        x={15}
        y={113}
        method="POST"
        path="/api/dartslive-stats"
        desc="手動スタッツ取得 (Puppeteer)"
        auth="auth"
      />
      <EndpointRow
        x={15}
        y={133}
        method="GET"
        path="/api/stats-history"
        desc="スタッツ履歴取得"
        auth="auth"
      />
      <EndpointRow
        x={15}
        y={153}
        method="GET"
        path="/api/stats-calendar"
        desc="カレンダー用スタッツ"
        auth="auth"
      />

      <SectionHeader x={10} y={180} w={540} label="Cron バッチ" icon="⏰" color={C.purple} />
      <EndpointRow
        x={15}
        y={208}
        method="GET"
        path="/api/cron/daily-stats"
        desc="日次スタッツ自動取得"
        auth="cron"
      />
      <EndpointRow
        x={15}
        y={228}
        method="GET"
        path="/api/cron/dartslive-api-sync"
        desc="DARTSLIVE API同期"
        auth="cron"
      />

      <SectionHeader x={10} y={255} w={540} label="Stripe 決済" icon="💳" color={C.pink} />
      <EndpointRow
        x={15}
        y={283}
        method="POST"
        path="/api/stripe/checkout"
        desc="Checkout Session作成"
        auth="auth"
      />
      <EndpointRow
        x={15}
        y={303}
        method="POST"
        path="/api/stripe/portal"
        desc="Customer Portal URL"
        auth="auth"
      />
      <EndpointRow
        x={15}
        y={323}
        method="POST"
        path="/api/stripe/webhook"
        desc="Webhook受信 (署名検証)"
        auth="public"
      />

      <SectionHeader x={10} y={350} w={540} label="LINE 連携" icon="💬" color={C.green} />
      <EndpointRow
        x={15}
        y={378}
        method="POST"
        path="/api/line/link"
        desc="連携コード生成"
        auth="auth"
      />
      <EndpointRow
        x={15}
        y={398}
        method="POST"
        path="/api/line/unlink"
        desc="連携解除"
        auth="auth"
      />
      <EndpointRow
        x={15}
        y={418}
        method="POST"
        path="/api/line/webhook"
        desc="Webhook (HMAC検証)"
        auth="public"
      />
      <EndpointRow
        x={15}
        y={438}
        method="POST"
        path="/api/line/save-dl-credentials"
        desc="DL認証情報保存 (AES)"
        auth="auth"
      />

      <SectionHeader x={10} y={465} w={540} label="プログレッション" icon="⭐" color={C.amber} />
      <EndpointRow
        x={15}
        y={493}
        method="POST"
        path="/api/progression"
        desc="XP付与 + レベル計算"
        auth="auth"
      />
      <EndpointRow x={15} y={513} method="GET" path="/api/goals" desc="目標一覧取得" auth="auth" />
      <EndpointRow x={15} y={533} method="POST" path="/api/goals" desc="目標作成" auth="auth" />
      <EndpointRow
        x={15}
        y={553}
        method="GET"
        path="/api/notifications"
        desc="通知一覧"
        auth="auth"
      />

      <SectionHeader x={10} y={580} w={540} label="ユーティリティ" icon="🔧" color={C.cyan} />
      <EndpointRow
        x={15}
        y={608}
        method="GET"
        path="/api/og"
        desc="OGP画像生成 (Edge Runtime)"
        auth="public"
      />
      <EndpointRow
        x={15}
        y={628}
        method="GET"
        path="/api/proxy-image"
        desc="画像プロキシ (HTTPS/SVGブロック)"
        auth="public"
      />
      <EndpointRow
        x={15}
        y={648}
        method="POST"
        path="/api/shops/fetch-url"
        desc="ショップURL自動解析"
        auth="auth"
      />
      <EndpointRow
        x={15}
        y={668}
        method="POST"
        path="/api/n01-import"
        desc="N01データインポート"
        auth="auth"
      />

      <SectionHeader x={10} y={695} w={540} label="ヘルスケア連携 ❤️" icon="🏥" color={C.red} />
      <EndpointRow
        x={15}
        y={723}
        method="GET"
        path="/api/health-metrics"
        desc="ヘルスメトリクス取得"
        auth="auth"
      />
      <EndpointRow
        x={15}
        y={743}
        method="GET"
        path="/api/health-correlation"
        desc="ダーツ×ヘルス相関データ"
        auth="auth"
      />
    </svg>
  );
}

function DataFlowDiagram() {
  return (
    <svg viewBox="0 0 800 620" width="100%">
      <defs>
        <pattern id="dfgrid" width="16" height="16" patternUnits="userSpaceOnUse">
          <path
            d="M 16 0 L 0 0 0 16"
            fill="none"
            stroke={C.border}
            strokeWidth="0.2"
            opacity="0.3"
          />
        </pattern>
      </defs>
      <rect width="800" height="620" fill="url(#dfgrid)" opacity="0.4" />

      <text
        x={400}
        y={20}
        textAnchor="middle"
        fill={C.blue}
        fontSize={11}
        fontWeight={700}
        fontFamily="'JetBrains Mono',monospace"
        opacity={0.7}
      >
        🔄 BARREL SEARCH → PURCHASE DATA FLOW
      </text>

      <DataFlowBox
        x={20}
        y={40}
        w={160}
        h={80}
        title="👤 ユーザー"
        color={C.blue}
        items={['バレル検索', 'スペックフィルター', 'ブランド/重量/径/長さ']}
      />
      <FlowArrow x1={180} y1={80} x2={220} y2={80} color={C.blue} label="query" />
      <DataFlowBox
        x={220}
        y={40}
        w={170}
        h={80}
        title="⚙️ Next.js App"
        color={C.purple}
        items={['Client SDK → Firestore', 'query(barrels, filters)', '7,000+ 全文検索']}
      />
      <FlowArrow x1={390} y1={80} x2={430} y2={80} color={C.amber} label="results" />
      <DataFlowBox
        x={430}
        y={40}
        w={160}
        h={80}
        title="🗄️ Firestore"
        color={C.amber}
        items={['barrels コレクション', '複合インデックス', 'BarrelProduct[]']}
      />

      <FlowArrow x1={300} y1={120} x2={300} y2={155} color={C.purple} />

      <DataFlowBox
        x={220}
        y={155}
        w={170}
        h={80}
        title="💡 レコメンドエンジン"
        color={C.green}
        items={['重量(30) + 径(25)', '長さ(25) + カット(15)', 'ブランド(5) = 100点']}
      />
      <FlowArrow x1={300} y1={235} x2={300} y2={270} color={C.green} />

      <DataFlowBox
        x={220}
        y={270}
        w={170}
        h={60}
        title="🛒 AffiliateButton"
        color={C.pink}
        items={['lib/affiliate.ts', 'getShopLinks(barrel)']}
      />

      <FlowArrow x1={390} y1={300} x2={440} y2={300} color={C.pink} />

      <rect
        x={440}
        y={291}
        width={130}
        height={18}
        rx={4}
        fill={C.surface}
        stroke={C.pink}
        strokeWidth={0.5}
      />
      <text
        x={505}
        y={301}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={C.textMuted}
        fontSize={8}
        fontFamily="'JetBrains Mono',monospace"
      >
        ダーツハイブ (A8.net)
      </text>

      <text
        x={650}
        y={50}
        textAnchor="middle"
        fill={C.cyan}
        fontSize={11}
        fontWeight={700}
        fontFamily="'JetBrains Mono',monospace"
        opacity={0.7}
      >
        ❓ QUIZ → RECOMMEND FLOW
      </text>
      <DataFlowBox
        x={610}
        y={65}
        w={170}
        h={70}
        title="❓ 診断クイズ"
        color={C.cyan}
        items={['6つの質問', 'playStyle/grip/weight', 'length/cut preference']}
      />
      <FlowArrow x1={695} y1={135} x2={695} y2={165} color={C.cyan} label="QuizAnswer" />
      <DataFlowBox
        x={610}
        y={165}
        w={170}
        h={60}
        title="🧠 recommendFromQuiz"
        color={C.cyan}
        items={['回答 → スコアリング', 'barrels query + filter']}
      />
      <FlowArrow x1={695} y1={225} x2={695} y2={255} color={C.cyan} />
      <DataFlowBox
        x={610}
        y={255}
        w={170}
        h={50}
        title="💡 パーソナライズ結果"
        color={C.green}
        items={['マッチ度% 付き表示', '→ AffiliateButton']}
      />

      <text
        x={400}
        y={410}
        textAnchor="middle"
        fill={C.blue}
        fontSize={11}
        fontWeight={700}
        fontFamily="'JetBrains Mono',monospace"
        opacity={0.7}
      >
        🎯 DARTSLIVE STATS SCRAPING PIPELINE
      </text>
      <DataFlowBox
        x={20}
        y={425}
        w={130}
        h={70}
        title="👤 PRO User"
        color={C.pink}
        items={['DL認証情報', 'AES-256-GCM', '暗号化保存']}
      />
      <FlowArrow x1={150} y1={460} x2={180} y2={460} color={C.purple} label="decrypt" />
      <DataFlowBox
        x={180}
        y={425}
        w={140}
        h={70}
        title="⚙️ Serverless Fn"
        color={C.purple}
        items={['Puppeteer 24', '@sparticuz/chromium', '共有インスタンス']}
      />
      <FlowArrow x1={320} y1={460} x2={350} y2={460} color={C.blue} label="scrape" />
      <DataFlowBox
        x={350}
        y={425}
        w={130}
        h={70}
        title="🎯 DARTSLIVE"
        color={C.blue}
        items={['/play/ ページ', '/monthly データ', '/playdata 詳細']}
      />
      <FlowArrow x1={480} y1={460} x2={510} y2={460} color={C.amber} label="parse" />
      <DataFlowBox
        x={510}
        y={425}
        w={130}
        h={70}
        title="🗄️ Firestore"
        color={C.amber}
        items={['dartsLiveStats', 'dartsliveCache', '差分検出+保存']}
      />
      <FlowArrow x1={640} y1={460} x2={670} y2={460} color={C.green} label="notify" />
      <DataFlowBox
        x={670}
        y={425}
        w={110}
        h={70}
        title="💬 LINE"
        color={C.green}
        items={['Flex Message', '週次/月次レポート', '実績通知']}
      />

      <text
        x={400}
        y={520}
        textAnchor="middle"
        fill={C.red}
        fontSize={11}
        fontWeight={700}
        fontFamily="'JetBrains Mono',monospace"
        opacity={0.7}
      >
        ❤️ HEALTHKIT DATA PIPELINE
      </text>
      <DataFlowBox
        x={20}
        y={535}
        w={120}
        h={70}
        title="🍎 HealthKit"
        color={C.red}
        items={['心拍 / HRV', '睡眠 / 歩数', 'Apple Watch']}
      />
      <FlowArrow x1={140} y1={570} x2={170} y2={570} color={C.red} label="Bridge" />
      <DataFlowBox
        x={170}
        y={535}
        w={130}
        h={70}
        title="📱 Capacitor"
        color={C.blue}
        items={['Swift Plugin', 'health-sync.ts', 'iOS Bridge']}
      />
      <FlowArrow x1={300} y1={570} x2={330} y2={570} color={C.amber} label="sync" />
      <DataFlowBox
        x={330}
        y={535}
        w={130}
        h={70}
        title="🗄️ Firestore"
        color={C.amber}
        items={['healthMetrics', 'サブコレクション', '10種メトリクス']}
      />
      <FlowArrow x1={460} y1={570} x2={490} y2={570} color={C.purple} label="API" />
      <DataFlowBox
        x={490}
        y={535}
        w={130}
        h={70}
        title="📊 Dashboard"
        color={C.purple}
        items={['ヘルス×ダーツ相関', 'ピアソン相関分析', 'インサイト自動生成']}
      />
    </svg>
  );
}

function SecurityLayer() {
  return (
    <svg viewBox="0 0 700 300" width="100%">
      <defs>
        <pattern id="secgrid" width="16" height="16" patternUnits="userSpaceOnUse">
          <path
            d="M 16 0 L 0 0 0 16"
            fill="none"
            stroke={C.border}
            strokeWidth="0.2"
            opacity="0.3"
          />
        </pattern>
      </defs>
      <rect width="700" height="300" fill="url(#secgrid)" opacity="0.4" />

      <text
        x={350}
        y={20}
        textAnchor="middle"
        fill={C.red}
        fontSize={11}
        fontWeight={700}
        fontFamily="'JetBrains Mono',monospace"
      >
        🛡️ API SECURITY LAYERS
      </text>

      <DataFlowBox
        x={20}
        y={40}
        w={120}
        h={50}
        title="📨 Request"
        color={C.blue}
        items={['Client / Webhook']}
      />
      <FlowArrow x1={140} y1={65} x2={170} y2={65} color={C.red} />

      <DataFlowBox
        x={170}
        y={35}
        w={120}
        h={60}
        title="🛡️ Rate Limit"
        color={C.red}
        items={['Upstash Redis', '60 req/min per IP']}
      />
      <FlowArrow x1={290} y1={65} x2={320} y2={65} color={C.red} />

      <DataFlowBox
        x={320}
        y={35}
        w={120}
        h={60}
        title="🔐 Auth Check"
        color={C.purple}
        items={['JWT検証', 'api-middleware.ts']}
      />
      <FlowArrow x1={440} y1={65} x2={470} y2={65} color={C.red} />

      <DataFlowBox
        x={470}
        y={35}
        w={110}
        h={60}
        title="👮 RBAC"
        color={C.amber}
        items={['permissions.ts', 'role判定']}
      />
      <FlowArrow x1={580} y1={65} x2={610} y2={65} color={C.green} />

      <DataFlowBox
        x={610}
        y={40}
        w={70}
        h={50}
        title="✅ Handler"
        color={C.green}
        items={['処理実行']}
      />

      <text
        x={20}
        y={125}
        fill={C.pink}
        fontSize={10}
        fontWeight={700}
        fontFamily="'JetBrains Mono',monospace"
      >
        Webhook 専用検証
      </text>

      {[
        { l: 'Stripe', d: 'constructEvent() 署名検証 + stripeEvents 重複排除', c: C.pink },
        { l: 'LINE', d: 'crypto.timingSafeEqual HMAC-SHA256 検証', c: C.green },
        { l: 'Cron', d: 'Bearer CRON_SECRET ヘッダー検証', c: C.purple },
      ].map((item, i) => (
        <g key={item.l}>
          <rect
            x={20}
            y={138 + i * 30}
            width={50}
            height={20}
            rx={4}
            fill={item.c}
            opacity={0.15}
          />
          <text
            x={45}
            y={150 + i * 30}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={item.c}
            fontSize={8}
            fontWeight={600}
            fontFamily="'JetBrains Mono',monospace"
          >
            {item.l}
          </text>
          <text
            x={80}
            y={150 + i * 30}
            dominantBaseline="middle"
            fill={C.textMuted}
            fontSize={8}
            fontFamily="'JetBrains Mono',monospace"
          >
            {item.d}
          </text>
        </g>
      ))}

      <text
        x={20}
        y={240}
        fill={C.amber}
        fontSize={10}
        fontWeight={700}
        fontFamily="'JetBrains Mono',monospace"
      >
        Firestore セキュリティルール
      </text>
      {[
        '• role / stripeCustomerId 等の自己変更ブロック',
        '• replyCount は +1 のみ許可',
        '• dartsliveCache / stripeEvents / lineConversations → Admin SDK 限定',
        '• Storage: 画像のみ (jpeg/png/gif/webp), 5MB制限, パス別権限',
      ].map((t, i) => (
        <text
          key={t}
          x={20}
          y={258 + i * 15}
          fill={C.textMuted}
          fontSize={8}
          fontFamily="'JetBrains Mono',monospace"
        >
          {t}
        </text>
      ))}
    </svg>
  );
}

export default function ApiDataFlowDiagram() {
  const [tab, setTab] = useState<'endpoints' | 'dataflow' | 'security'>('endpoints');

  return (
    <div style={{ fontFamily: "'JetBrains Mono','SF Mono',monospace" }}>
      <link
        href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <h2 style={{ color: C.text, fontSize: 24, fontWeight: 700, margin: 0 }}>
          <span style={{ color: C.green }}>🔄</span> Darts Lab — API & Data Flow
        </h2>
        <p style={{ color: C.textDim, fontSize: 11, margin: '6px 0 0', letterSpacing: '0.1em' }}>
          27+ API ROUTES · 6 AFFILIATE SHOPS · MULTI-LAYER SECURITY
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
        <Tab
          label="📡 API エンドポイント"
          active={tab === 'endpoints'}
          onClick={() => setTab('endpoints')}
          color={C.purple}
        />
        <Tab
          label="🔄 データフロー"
          active={tab === 'dataflow'}
          onClick={() => setTab('dataflow')}
          color={C.green}
        />
        <Tab
          label="🛡️ セキュリティ"
          active={tab === 'security'}
          onClick={() => setTab('security')}
          color={C.red}
        />
      </div>

      <div style={{ maxWidth: tab === 'endpoints' ? 600 : 840, margin: '0 auto' }}>
        {tab === 'endpoints' && <ApiEndpoints />}
        {tab === 'dataflow' && <DataFlowDiagram />}
        {tab === 'security' && <SecurityLayer />}
      </div>
    </div>
  );
}
