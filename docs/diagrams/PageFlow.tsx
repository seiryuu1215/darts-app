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

interface PageNodeProps {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  path?: string;
  icon: string;
  color: string;
  role?: string;
  isActive?: boolean;
  onClick?: () => void;
}

function PageNode({ x, y, w, h, label, path, icon, color, role, isActive, onClick }: PageNodeProps) {
  const [hov, setHov] = useState(false);
  const show = hov || isActive;
  return (
    <g onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} onClick={onClick} style={{ cursor: 'pointer' }}>
      {show && <rect x={x - 2} y={y - 2} width={w + 4} height={h + 4} rx={10} fill="none" stroke={color} strokeWidth={1.5} opacity={0.4} />}
      <rect x={x} y={y} width={w} height={h} rx={8} fill={show ? C.surfaceHover : C.surface} stroke={show ? color : C.border} strokeWidth={show ? 1.2 : 0.8} />
      <text x={x + w / 2} y={y + (path ? h / 2 - 5 : h / 2 + 1)} textAnchor="middle" dominantBaseline="middle" fill={C.text} fontSize={9.5} fontWeight={600} fontFamily="'JetBrains Mono',monospace">
        {icon} {label}
      </text>
      {path && (
        <text x={x + w / 2} y={y + h / 2 + 8} textAnchor="middle" dominantBaseline="middle" fill={C.textDim} fontSize={7.5} fontFamily="'JetBrains Mono',monospace">
          {path}
        </text>
      )}
      {role && (
        <rect x={x + w - (role === 'admin' ? 38 : role === 'PRO' ? 30 : 22)} y={y + 3} width={role === 'admin' ? 35 : role === 'PRO' ? 27 : 19} height={13} rx={4} fill={role === 'admin' ? C.red : role === 'PRO' ? C.pink : C.textDim} opacity={0.2} />
      )}
      {role && (
        <text x={x + w - (role === 'admin' ? 21 : role === 'PRO' ? 17 : 13)} y={y + 11} textAnchor="middle" dominantBaseline="middle" fill={role === 'admin' ? C.red : role === 'PRO' ? C.pink : C.textDim} fontSize={7} fontWeight={600} fontFamily="'JetBrains Mono',monospace">
          {role}
        </text>
      )}
    </g>
  );
}

interface FlowArrowProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color?: string;
  dashed?: boolean;
}

function FlowArrow({ x1, y1, x2, y2, color = C.textDim, dashed }: FlowArrowProps) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const l = 5;
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={0.8} strokeDasharray={dashed ? '3,3' : 'none'} opacity={0.35} />
      <polygon points={`${x2},${y2} ${x2 - l * Math.cos(a - 0.4)},${y2 - l * Math.sin(a - 0.4)} ${x2 - l * Math.cos(a + 0.4)},${y2 - l * Math.sin(a + 0.4)}`} fill={color} opacity={0.5} />
    </g>
  );
}

interface GroupLabelProps {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  color: string;
  icon: string;
}

function GroupLabel({ x, y, w, h, label, color, icon }: GroupLabelProps) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={10} fill={color} opacity={0.03} stroke={color} strokeWidth={0.8} strokeDasharray="6,3" />
      <text x={x + 10} y={y + 14} fill={color} fontSize={9} fontWeight={700} fontFamily="'JetBrains Mono',monospace" opacity={0.6} letterSpacing="0.06em">
        {icon} {label}
      </text>
    </g>
  );
}

export default function PageFlowDiagram() {
  const [active, setActive] = useState<string | null>(null);

  return (
    <div style={{ fontFamily: "'JetBrains Mono','SF Mono',monospace" }}>
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <h2 style={{ color: C.text, fontSize: 24, fontWeight: 700, margin: 0 }}>
          <span style={{ color: C.cyan }}>📱</span> Darts Lab — Page Flow
        </h2>
        <p style={{ color: C.textDim, fontSize: 11, margin: '6px 0 0', letterSpacing: '0.1em' }}>
          30+ PAGES · APP ROUTER · ROLE-BASED ACCESS
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 14 }}>
        {[
          { c: C.textMuted, l: 'Public' },
          { c: C.blue, l: 'Auth Required' },
          { c: C.pink, l: 'PRO Only' },
          { c: C.red, l: 'Admin Only' },
        ].map((x) => (
          <div key={x.l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: x.c }} />
            <span style={{ color: C.textDim, fontSize: 9 }}>{x.l}</span>
          </div>
        ))}
        <span style={{ color: C.textDim, fontSize: 9, marginLeft: 8 }}>─ 直接遷移　┈┈ 購入導線</span>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <svg viewBox="0 0 960 700" width="100%">
          <defs>
            <pattern id="pgrid" width="16" height="16" patternUnits="userSpaceOnUse">
              <path d="M 16 0 L 0 0 0 16" fill="none" stroke={C.border} strokeWidth="0.2" opacity="0.3" />
            </pattern>
          </defs>
          <rect width="960" height="700" fill="url(#pgrid)" opacity="0.4" />

          {/* HOME - center top */}
          <PageNode x={410} y={20} w={140} h={42} label="ホーム" path="/" icon="🏠" color={C.blue} isActive={active === 'home'} onClick={() => setActive('home')} />

          {/* === SETTING MANAGEMENT === */}
          <GroupLabel x={15} y={90} w={230} h={260} label="セッティング管理" color={C.green} icon="🎯" />
          <PageNode x={25} y={115} w={210} h={36} label="セッティング一覧" path="/darts" icon="📋" color={C.blue} />
          <PageNode x={25} y={165} w={210} h={36} label="新規登録" path="/darts/new" icon="➕" color={C.blue} />
          <PageNode x={25} y={215} w={210} h={36} label="詳細" path="/darts/[id]" icon="🔎" color={C.blue} />
          <PageNode x={25} y={265} w={100} h={36} label="編集" path="/darts/[id]/edit" icon="✏️" color={C.blue} />
          <PageNode x={135} y={265} w={100} h={36} label="比較" path="/darts/compare" icon="⚖️" color={C.blue} />
          <PageNode x={25} y={315} w={210} h={28} label="セッティング履歴" path="/darts/history" icon="📜" color={C.blue} />

          {/* Arrows - Settings */}
          <FlowArrow x1={410} y1={41} x2={235} y2={133} color={C.green} />
          <FlowArrow x1={130} y1={151} x2={130} y2={165} color={C.green} />
          <FlowArrow x1={130} y1={201} x2={130} y2={215} color={C.green} />
          <FlowArrow x1={75} y1={251} x2={75} y2={265} color={C.green} />
          <FlowArrow x1={185} y1={251} x2={185} y2={265} color={C.green} />

          {/* === BARRELS === */}
          <GroupLabel x={260} y={90} w={230} h={260} label="バレル" color={C.amber} icon="🔍" />
          <PageNode x={270} y={115} w={210} h={36} label="バレル検索" path="/barrels" icon="🔍" color={C.blue} />
          <PageNode x={270} y={165} w={210} h={36} label="おすすめ" path="/barrels/recommend" icon="💡" color={C.blue} />
          <PageNode x={270} y={215} w={210} h={36} label="シミュレーター" path="/barrels/simulator" icon="📐" color={C.blue} />
          <PageNode x={270} y={265} w={210} h={36} label="診断クイズ" path="/barrels/quiz" icon="❓" color={C.blue} />
          <PageNode x={270} y={315} w={210} h={28} label="→ 外部ショップ" path="アフィリエイト6店" icon="🛒" color={C.amber} />

          <FlowArrow x1={440} y1={62} x2={375} y2={115} color={C.amber} />
          <FlowArrow x1={375} y1={151} x2={375} y2={165} color={C.amber} />
          <FlowArrow x1={375} y1={201} x2={375} y2={215} color={C.amber} />
          <FlowArrow x1={375} y1={251} x2={375} y2={265} color={C.amber} />
          <FlowArrow x1={375} y1={301} x2={375} y2={315} color={C.amber} dashed />

          {/* Cross link: quiz <-> recommend */}
          <FlowArrow x1={480} y1={283} x2={480} y2={201} color={C.amber} dashed />

          {/* Cross link: dart detail -> barrel search */}
          <FlowArrow x1={235} y1={233} x2={270} y2={133} color={C.amber} dashed />

          {/* === STATS === */}
          <GroupLabel x={505} y={90} w={230} h={260} label="スタッツ (53コンポーネント)" color={C.blue} icon="📊" />
          <PageNode x={515} y={115} w={210} h={36} label="ダッシュボード" path="/stats" icon="📊" color={C.blue} />
          <PageNode x={515} y={165} w={210} h={36} label="カレンダー" path="/stats/calendar" icon="📅" color={C.blue} />
          <PageNode x={515} y={215} w={210} h={36} label="手動記録" path="/stats/new" icon="✏️" color={C.blue} />
          <PageNode x={515} y={265} w={210} h={36} label="DL自動連携" path="DARTSLIVE連携" icon="🎯" color={C.pink} role="PRO" />
          <PageNode x={515} y={315} w={210} h={28} label="目標トラッキング" path="/stats (goals)" icon="🎯" color={C.pink} role="PRO" />

          <FlowArrow x1={520} y1={62} x2={620} y2={115} color={C.blue} />
          <FlowArrow x1={620} y1={151} x2={620} y2={165} color={C.blue} />
          <FlowArrow x1={620} y1={201} x2={620} y2={215} color={C.blue} />

          {/* === COMMUNITY === */}
          <GroupLabel x={750} y={90} w={195} h={260} label="コミュニティ" color={C.purple} icon="📢" />
          <PageNode x={758} y={115} w={180} h={36} label="ディスカッション" path="/discussions" icon="📢" color={C.blue} />
          <PageNode x={758} y={165} w={180} h={36} label="スレッド詳細" path="/discussions/[id]" icon="💬" color={C.blue} />
          <PageNode x={758} y={215} w={180} h={36} label="新規投稿" path="/discussions/new" icon="➕" color={C.pink} role="PRO" />
          <PageNode x={758} y={265} w={180} h={36} label="記事一覧" path="/articles" icon="📝" color={C.textMuted} />
          <PageNode x={758} y={315} w={180} h={28} label="記事詳細" path="/articles/[slug]" icon="📄" color={C.textMuted} />

          <FlowArrow x1={550} y1={41} x2={758} y2={133} color={C.purple} />
          <FlowArrow x1={848} y1={151} x2={848} y2={165} color={C.purple} />
          <FlowArrow x1={848} y1={251} x2={848} y2={265} color={C.purple} />
          <FlowArrow x1={848} y1={301} x2={848} y2={315} color={C.purple} />

          {/* === ROW 2: User & Shops === */}
          <GroupLabel x={15} y={370} w={285} h={165} label="ユーザー" color={C.cyan} icon="👤" />
          <PageNode x={25} y={395} w={130} h={36} label="プロフィール" path="/profile/edit" icon="👤" color={C.blue} />
          <PageNode x={165} y={395} w={128} h={36} label="ブックマーク" path="/bookmarks" icon="🔖" color={C.blue} />
          <PageNode x={25} y={445} w={130} h={36} label="レポート" path="/reports" icon="📈" color={C.pink} role="PRO" />
          <PageNode x={165} y={445} w={128} h={36} label="料金プラン" path="/pricing" icon="💰" color={C.textMuted} />
          <PageNode x={25} y={495} w={268} h={28} label="XP / レベル / 実績" path="progression system" icon="⭐" color={C.blue} />

          {/* Shops */}
          <GroupLabel x={315} y={370} w={230} h={165} label="マイショップ" color={C.green} icon="🏪" />
          <PageNode x={325} y={395} w={210} h={36} label="ショップ一覧" path="/shops" icon="🏪" color={C.blue} />
          <PageNode x={325} y={445} w={100} h={36} label="マップ" path="Leaflet" icon="🗺️" color={C.blue} />
          <PageNode x={435} y={445} w={100} h={36} label="リスト管理" path="tags/lists" icon="📋" color={C.blue} />
          <PageNode x={325} y={495} w={210} h={28} label="DARTSLIVEサーチ自動取得" path="URL貼付で自動登録" icon="🔗" color={C.blue} />

          {/* Admin */}
          <GroupLabel x={560} y={370} w={195} h={115} label="管理" color={C.red} icon="🔧" />
          <PageNode x={570} y={395} w={175} h={36} label="ユーザー管理" path="/admin" icon="👥" color={C.red} role="admin" />
          <PageNode x={570} y={445} w={175} h={36} label="記事投稿" path="/articles/new" icon="📝" color={C.red} role="admin" />

          {/* Info pages */}
          <GroupLabel x={770} y={370} w={175} h={165} label="情報" color={C.textMuted} icon="ℹ️" />
          <PageNode x={778} y={395} w={160} h={28} label="About" path="/about" icon="ℹ️" color={C.textMuted} />
          <PageNode x={778} y={430} w={160} h={28} label="利用規約" path="/terms" icon="📜" color={C.textMuted} />
          <PageNode x={778} y={465} w={160} h={28} label="プライバシー" path="/privacy" icon="🔒" color={C.textMuted} />
          <PageNode x={778} y={500} w={160} h={28} label="リファレンス" path="/reference" icon="📖" color={C.textMuted} />

          {/* Auth pages */}
          <GroupLabel x={560} y={500} w={195} h={90} label="認証" color={C.purple} icon="🔐" />
          <PageNode x={570} y={523} w={90} h={28} label="ログイン" path="/login" icon="" color={C.purple} />
          <PageNode x={665} y={523} w={80} h={28} label="登録" path="/register" icon="" color={C.purple} />
          <PageNode x={570} y={558} w={175} h={26} label="パスワードリセット" path="/forgot-password" icon="" color={C.purple} />

          {/* Pricing -> Stripe */}
          <FlowArrow x1={293} y1={463} x2={315} y2={500} color={C.pink} dashed />

          {/* Stats summary */}
          <rect x={15} y={555} width={530} height={130} rx={10} fill={C.surface} stroke={C.blue} strokeWidth={0.8} />
          <text x={30} y={575} fill={C.blue} fontSize={10} fontWeight={700} fontFamily="'JetBrains Mono',monospace">📊 スタッツダッシュボード 内訳 (53 コンポーネント)</text>
          {[
            ['Rating分析', 'RatingHeroCard / TargetCard / SimulatorCard / MomentumCard / BenchmarkCard / TrendCard'],
            ['ゲーム統計', 'GameStatsCards / DetailedGameStats / BullStats / CountUp分析 / 01分析 / Consistency'],
            ['可視化', 'MonthlyTrend / DailyHistory / CalendarGrid / DartboardHeatmap / SkillRadar / PlayerDNA'],
            ['インサイト', 'PerformanceInsights / PracticeRecommendations / SessionFatigue / SpeedAccuracy'],
            ['その他', 'AwardsTable / AwardPace / GameMix / ConditionCorrelation / StreakPattern / Percentile'],
          ].map((row, i) => (
            <g key={row[0]}>
              <text x={30} y={597 + i * 17} fill={C.cyan} fontSize={8} fontWeight={600} fontFamily="'JetBrains Mono',monospace">{row[0]}</text>
              <text x={110} y={597 + i * 17} fill={C.textDim} fontSize={7.5} fontFamily="'JetBrains Mono',monospace">{row[1]}</text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
