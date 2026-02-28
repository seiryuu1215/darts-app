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

interface StepProps {
  x: number; y: number; w: number; h: number;
  label: string; sub?: string; icon: string; color: string; num?: string;
}

function Step({ x, y, w, h, label, sub, icon, color, num }: StepProps) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={8} fill={C.surface} stroke={color} strokeWidth={1} />
      <rect x={x} y={y} width={w} height={h} rx={8} fill={color} opacity={0.05} />
      {num && (
        <>
          <circle cx={x + 14} cy={y + 14} r={10} fill={color} opacity={0.2} />
          <text x={x + 14} y={y + 15} textAnchor="middle" dominantBaseline="middle" fill={color} fontSize={9} fontWeight={700} fontFamily="'JetBrains Mono',monospace">{num}</text>
        </>
      )}
      <text x={x + (num ? 30 : 10)} y={y + (sub ? h / 2 - 5 : h / 2 + 1)} fill={C.text} fontSize={10} fontWeight={600} fontFamily="'JetBrains Mono',monospace" dominantBaseline="middle">
        {icon} {label}
      </text>
      {sub && (
        <text x={x + (num ? 30 : 10)} y={y + h / 2 + 9} fill={C.textDim} fontSize={8} fontFamily="'JetBrains Mono',monospace" dominantBaseline="middle">
          {sub}
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
  const a = Math.atan2(y2 - y1, x2 - x1);
  const l = 6;
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={1} strokeDasharray={dashed ? '4,3' : 'none'} opacity={0.45} />
      <polygon points={`${x2},${y2} ${x2 - l * Math.cos(a - 0.4)},${y2 - l * Math.sin(a - 0.4)} ${x2 - l * Math.cos(a + 0.4)},${y2 - l * Math.sin(a + 0.4)}`} fill={color} opacity={0.6} />
      {label && (
        <g>
          <rect x={midX - label.length * 2.8 - 4} y={midY - 7} width={label.length * 5.6 + 8} height={13} rx={3} fill={C.bg} opacity={0.95} />
          <text x={midX} y={midY} textAnchor="middle" dominantBaseline="middle" fill={color} fontSize={7.5} fontFamily="'JetBrains Mono',monospace">{label}</text>
        </g>
      )}
    </g>
  );
}

function ConditionalBlock({ x, y, w, h, label, color }: { x: number; y: number; w: number; h: number; label: string; color: string }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={6} fill={C.bg} stroke={color} strokeWidth={1} strokeDasharray="4,2" opacity={0.8} />
      <text x={x + 8} y={y + 12} fill={color} fontSize={8} fontWeight={600} fontFamily="'JetBrains Mono',monospace" opacity={0.8}>{label}</text>
    </g>
  );
}

function XpTable() {
  return (
    <g>
      <rect x={540} y={365} width={230} height={160} rx={8} fill={C.surface} stroke={C.amber} strokeWidth={1} />
      <rect x={540} y={365} width={230} height={22} rx={8} fill={C.amber} opacity={0.12} />
      <rect x={540} y={381} width={230} height={6} fill={C.amber} opacity={0.12} />
      <text x={555} y={380} fill={C.amber} fontSize={10} fontWeight={700} fontFamily="'JetBrains Mono',monospace">⭐ XP ルール (14種)</text>
      {[
        ['スタッツ記録', '+5 XP'],
        ['Rating上昇', '+10 XP'],
        ['連続3日プレイ', '+5 XP'],
        ['連続7日', '+10 XP'],
        ['連続14日', '+15 XP'],
        ['連続30日', '+20 XP'],
        ['週間アクティブ(5日+)', '+25 XP'],
        ['月間アクティブ(20日+)', '+100 XP'],
      ].map((row, i) => (
        <g key={row[0]}>
          <text x={555} y={400 + i * 15} fill={C.textMuted} fontSize={8} fontFamily="'JetBrains Mono',monospace">{row[0]}</text>
          <text x={755} y={400 + i * 15} textAnchor="end" fill={C.green} fontSize={8} fontWeight={600} fontFamily="'JetBrains Mono',monospace">{row[1]}</text>
        </g>
      ))}
    </g>
  );
}

export default function CronFlowDiagram() {
  return (
    <div style={{ fontFamily: "'JetBrains Mono','SF Mono',monospace" }}>
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div style={{ textAlign: 'center', marginBottom: 12 }}>
        <h2 style={{ color: C.text, fontSize: 24, fontWeight: 700, margin: 0 }}>
          <span style={{ color: C.purple }}>⏰</span> Darts Lab — Cron Batch Pipeline
        </h2>
        <p style={{ color: C.textDim, fontSize: 11, margin: '6px 0 0', letterSpacing: '0.1em' }}>
          DAILY AUTOMATED PIPELINE — JST 10:00 (UTC 01:00)
        </p>
      </div>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
        {[
          { l: '/api/cron/daily-stats', t: '0 1 * * *' },
          { l: '/api/cron/dartslive-api-sync', t: '0 1 * * *' },
        ].map((c) => (
          <div key={c.l} style={{ padding: '6px 14px', borderRadius: 8, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.15)' }}>
            <span style={{ color: C.purple, fontSize: 10, fontWeight: 600 }}>{c.l}</span>
            <span style={{ color: C.textDim, fontSize: 9, marginLeft: 8 }}>{c.t}</span>
          </div>
        ))}
      </div>
      <div style={{ maxWidth: 820, margin: '0 auto' }}>
        <svg viewBox="0 0 800 550" width="100%">
          <defs>
            <pattern id="crongrid" width="16" height="16" patternUnits="userSpaceOnUse">
              <path d="M 16 0 L 0 0 0 16" fill="none" stroke={C.border} strokeWidth="0.2" opacity="0.3" />
            </pattern>
          </defs>
          <rect width="800" height="550" fill="url(#crongrid)" opacity="0.4" />

          <Step x={20} y={20} w={160} h={44} label="Vercel Cron" sub="Bearer CRON_SECRET" icon="⏰" color={C.purple} />
          <Arrow x1={180} y1={42} x2={220} y2={42} color={C.purple} label="GET" />
          <Step x={220} y={20} w={180} h={44} label="/api/cron/daily-stats" sub="Serverless Function" icon="⚙️" color={C.purple} />

          <Arrow x1={310} y1={64} x2={310} y2={90} color={C.amber} />
          <Step x={30} y={90} w={200} h={40} label="LINE連携ユーザー取得" sub="lineConversations コレクション" icon="👥" color={C.amber} num="1" />
          <Arrow x1={230} y1={110} x2={270} y2={110} color={C.textDim} label="loop" />

          <rect x={270} y={85} width={250} height={30} rx={6} fill={C.cyan} opacity={0.05} stroke={C.cyan} strokeWidth={0.5} strokeDasharray="4,2" />
          <text x={280} y={102} fill={C.cyan} fontSize={9} fontWeight={600} fontFamily="'JetBrains Mono',monospace" opacity={0.6}>🔄 各ユーザーに対して (try-catch 独立)</text>

          <Step x={30} y={145} w={200} h={40} label="DL認証情報取得" sub="AES-256-GCM 復号" icon="🔓" color={C.red} num="2" />

          <Arrow x1={130} y1={185} x2={130} y2={205} color={C.blue} />
          <Step x={30} y={205} w={200} h={50} label="DARTSLIVE スクレイピング" sub="Puppeteer (共有Chromium)\nRating/PPD/MPR/CU/Awards" icon="🎯" color={C.blue} num="3" />

          <Arrow x1={130} y1={255} x2={130} y2={275} color={C.amber} />
          <Step x={30} y={275} w={200} h={40} label="差分検出" sub="dartsliveCache/latest と比較" icon="🔍" color={C.amber} num="4" />

          <ConditionalBlock x={270} y={145} w={250} h={185} label="if 変更あり" color={C.green} />

          <Arrow x1={230} y1={165} x2={280} y2={165} color={C.green} />
          <Step x={280} y={155} w={225} h={36} label="dartsLiveStats 保存" sub="日次レコード作成 + キャッシュ更新" icon="💾" color={C.amber} num="5" />
          <Step x={280} y={200} w={225} h={36} label="XP自動付与" sub="差分ベース計算 → level/rank更新" icon="⭐" color={C.green} num="6" />
          <Step x={280} y={245} w={225} h={36} label="スタッツ変動通知" sub="LINE Flex Message" icon="📨" color={C.green} num="7" />
          <Step x={280} y={290} w={225} h={36} label="実績チェック + 解除" sub="12種の実績条件 → +10 XP" icon="🏅" color={C.purple} />

          <Arrow x1={130} y1={315} x2={130} y2={345} color={C.amber} />
          <Step x={30} y={345} w={200} h={40} label="目標自動達成判定" sub="goals コレクション走査" icon="🎯" color={C.cyan} num="8" />

          <ConditionalBlock x={270} y={340} w={250} h={80} label="if 日曜日" color={C.blue} />
          <Step x={280} y={360} w={225} h={22} label="週間アクティブ判定 (5日+)" sub="" icon="📅" color={C.blue} />
          <Step x={280} y={388} w={225} h={22} label="週次レポート LINE送信" sub="" icon="📊" color={C.blue} />

          <ConditionalBlock x={270} y={430} w={250} h={45} label="if 月初" color={C.pink} />
          <Step x={280} y={448} w={225} h={22} label="月次レポート LINE送信" sub="" icon="📈" color={C.pink} />

          <ConditionalBlock x={270} y={485} w={250} h={45} label="if 月末" color={C.amber} />
          <Step x={280} y={503} w={225} h={22} label="月間アクティブ判定 (20日+)" sub="" icon="📆" color={C.amber} />

          <Arrow x1={130} y1={385} x2={130} y2={500} color={C.textDim} dashed />
          <Step x={30} y={500} w={200} h={36} label="結果JSON返却" sub="success / no_change / error" icon="✅" color={C.green} num="9" />

          <XpTable />

          <rect x={540} y={20} width={230} height={70} rx={8} fill={C.surface} stroke={C.red} strokeWidth={1} />
          <text x={555} y={38} fill={C.red} fontSize={10} fontWeight={700} fontFamily="'JetBrains Mono',monospace">🛡️ エラーハンドリング</text>
          <text x={555} y={54} fill={C.textMuted} fontSize={8} fontFamily="'JetBrains Mono',monospace">• 各ユーザーtry-catch独立</text>
          <text x={555} y={66} fill={C.textMuted} fontSize={8} fontFamily="'JetBrains Mono',monospace">• Sentry自動レポート</text>
          <text x={555} y={78} fill={C.textMuted} fontSize={8} fontFamily="'JetBrains Mono',monospace">• 1ユーザー失敗 → 他は継続</text>

          <rect x={540} y={110} width={230} height={240} rx={8} fill={C.surface} stroke={C.amber} strokeWidth={1} />
          <rect x={540} y={110} width={230} height={22} rx={8} fill={C.amber} opacity={0.12} />
          <rect x={540} y={126} width={230} height={6} fill={C.amber} opacity={0.12} />
          <text x={555} y={125} fill={C.amber} fontSize={10} fontWeight={700} fontFamily="'JetBrains Mono',monospace">🗄️ Firestore 操作一覧</text>
          {[
            { op: 'CREATE', col: 'dartsLiveStats/{date}', c: C.green },
            { op: 'UPDATE', col: 'dartsliveCache/latest', c: C.blue },
            { op: 'UPDATE', col: 'users/{uid} (XP,level)', c: C.blue },
            { op: 'CREATE', col: 'xpHistory/{id}', c: C.green },
            { op: 'CREATE', col: 'notifications/{id}', c: C.green },
            { op: 'DELETE', col: 'goals/{id} (達成時)', c: C.red },
            { op: 'UPDATE', col: 'lineConversations', c: C.blue },
          ].map((item, i) => (
            <g key={item.col}>
              <rect x={555} y={140 + i * 28} width={50} height={16} rx={4} fill={item.c} opacity={0.12} />
              <text x={580} y={150 + i * 28} textAnchor="middle" dominantBaseline="middle" fill={item.c} fontSize={7.5} fontWeight={600} fontFamily="'JetBrains Mono',monospace">{item.op}</text>
              <text x={612} y={150 + i * 28} dominantBaseline="middle" fill={C.textMuted} fontSize={8} fontFamily="'JetBrains Mono',monospace">{item.col}</text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
