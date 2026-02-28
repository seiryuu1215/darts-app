'use client';

import { useState, useCallback } from 'react';

const C: Record<string, string> = {
  bg: '#0a0e1a',
  surface: '#111827',
  surfaceHover: '#1a2332',
  border: '#1e293b',
  text: '#e2e8f0',
  textMuted: '#94a3b8',
  textDim: '#64748b',
  blue: '#38bdf8',
  blueGlow: 'rgba(56,189,248,0.15)',
  amber: '#fbbf24',
  amberGlow: 'rgba(251,191,36,0.12)',
  green: '#34d399',
  greenGlow: 'rgba(52,211,153,0.12)',
  purple: '#a78bfa',
  purpleGlow: 'rgba(167,139,250,0.12)',
  pink: '#f472b6',
  pinkGlow: 'rgba(244,114,182,0.12)',
  cyan: '#22d3ee',
  cyanGlow: 'rgba(34,211,238,0.12)',
  red: '#f87171',
  redGlow: 'rgba(248,113,113,0.12)',
};

interface Field {
  n: string;
  t: string;
}

interface Collection {
  id: string;
  label: string;
  icon: string;
  x: number;
  y: number;
  w: number;
  color: string;
  glow: string;
  fields: Field[];
  subs: string[];
  adminOnly?: boolean;
}

interface Relation {
  from: string;
  to: string;
  label: string;
  type: string;
  dashed?: boolean;
}

const collections: Collection[] = [
  {
    id: 'users', label: 'users', icon: '👤', x: 400, y: 30, w: 220, color: C.blue, glow: C.blueGlow,
    fields: [
      { n: 'displayName', t: 'string' }, { n: 'email', t: 'string' },
      { n: 'role', t: '"admin"|"pro"|"general"' }, { n: 'xp / level / rank', t: 'number / string' },
      { n: 'stripeCustomerId', t: 'string?' }, { n: 'subscriptionStatus', t: 'string?' },
      { n: 'dlCredentialsEncrypted', t: 'AES-256-GCM' }, { n: 'lineUserId', t: 'string?' },
      { n: 'achievements[]', t: 'string[]' },
    ],
    subs: ['dartsLiveStats/{date}', 'dartsliveCache/latest', 'goals/{goalId}', 'xpHistory/{xpId}', 'notifications/{id}', 'settingHistory/{id}', 'shopBookmarks/{id}', 'shopLists/{id}', 'dartLikes/{dartId}', 'dartBookmarks/{dartId}', 'barrelBookmarks/{id}'],
  },
  {
    id: 'darts', label: 'darts', icon: '🎯', x: 50, y: 30, w: 200, color: C.green, glow: C.greenGlow,
    fields: [
      { n: 'userId', t: 'string (FK→users)' }, { n: 'title', t: 'string' },
      { n: 'barrel', t: '{name,brand,weight,…}' }, { n: 'tip', t: '{name,type,length,…}' },
      { n: 'shaft', t: '{name,length,weight}' }, { n: 'flight', t: '{name,shape,weight}' },
      { n: 'imageUrls[]', t: 'string[]' }, { n: 'likeCount', t: 'number' }, { n: 'isDraft', t: 'boolean' },
    ],
    subs: [],
  },
  {
    id: 'barrels', label: 'barrels', icon: '🔍', x: 50, y: 340, w: 200, color: C.amber, glow: C.amberGlow,
    fields: [
      { n: 'name', t: 'string' }, { n: 'brand', t: 'string' },
      { n: 'weight / diameter / length', t: 'number' }, { n: 'cut', t: 'string' },
      { n: 'imageUrl / productUrl', t: 'string' }, { n: 'source', t: '"dartshive"' },
    ],
    subs: [],
  },
  {
    id: 'barrelRanking', label: 'barrelRanking', icon: '🏆', x: 50, y: 560, w: 200, color: C.amber, glow: C.amberGlow,
    fields: [{ n: 'rank', t: 'number' }, { n: 'name / imageUrl', t: 'string' }, { n: 'price', t: 'string' }],
    subs: [],
  },
  {
    id: 'comments', label: 'comments', icon: '💬', x: 50, y: 700, w: 200, color: C.cyan, glow: C.cyanGlow,
    fields: [
      { n: 'dartId', t: 'string (FK→darts)' }, { n: 'userId', t: 'string (FK→users)' },
      { n: 'userName', t: 'string (非正規化)' }, { n: 'text', t: 'string' },
    ],
    subs: [],
  },
  {
    id: 'discussions', label: 'discussions', icon: '📢', x: 400, y: 500, w: 220, color: C.purple, glow: C.purpleGlow,
    fields: [
      { n: 'title / content', t: 'string' }, { n: 'category', t: '6 categories' },
      { n: 'userId / userName', t: 'string' }, { n: 'userRating / userBarrelName', t: '非正規化' },
      { n: 'isPinned / isLocked', t: 'boolean' }, { n: 'replyCount', t: 'number' },
    ],
    subs: [],
  },
  {
    id: 'replies', label: 'replies', icon: '↩️', x: 400, y: 720, w: 220, color: C.purple, glow: C.purpleGlow,
    fields: [
      { n: 'discussionId', t: 'string (FK)' }, { n: 'userId / userName', t: 'string' },
      { n: 'userRating', t: 'number?' }, { n: 'body', t: 'string' },
    ],
    subs: [],
  },
  {
    id: 'articles', label: 'articles', icon: '📝', x: 750, y: 30, w: 200, color: C.cyan, glow: C.cyanGlow,
    fields: [
      { n: 'slug / title', t: 'string' }, { n: 'content', t: 'Markdown' },
      { n: 'tags[]', t: 'string[]' }, { n: 'isDraft / isFeatured', t: 'boolean' },
      { n: 'userId', t: 'string (FK→users)' },
    ],
    subs: [],
  },
  {
    id: 'stripeEvents', label: 'stripeEvents', icon: '💳', x: 750, y: 260, w: 200, color: C.pink, glow: C.pinkGlow,
    fields: [{ n: 'type', t: 'string' }, { n: 'data', t: 'object' }, { n: 'processedAt', t: 'Timestamp' }],
    subs: [], adminOnly: true,
  },
  {
    id: 'lineConversations', label: 'lineConversations', icon: '💬', x: 750, y: 430, w: 200, color: C.green, glow: C.greenGlow,
    fields: [{ n: 'userId', t: 'string (FK→users)' }, { n: 'lineUserId', t: 'string' }, { n: 'state', t: 'string' }],
    subs: [], adminOnly: true,
  },
  {
    id: 'lineLinkCodes', label: 'lineLinkCodes', icon: '🔗', x: 750, y: 580, w: 200, color: C.green, glow: C.greenGlow,
    fields: [{ n: 'firebaseUid', t: 'string' }, { n: 'expiresAt', t: 'Timestamp' }],
    subs: [], adminOnly: true,
  },
  {
    id: 'config', label: 'config', icon: '⚙️', x: 750, y: 720, w: 200, color: C.red, glow: C.redGlow,
    fields: [{ n: 'pricingPlans', t: 'object' }],
    subs: [], adminOnly: true,
  },
];

const relations: Relation[] = [
  { from: 'darts', to: 'users', label: 'userId', type: 'N:1' },
  { from: 'comments', to: 'darts', label: 'dartId', type: 'N:1' },
  { from: 'comments', to: 'users', label: 'userId', type: 'N:1' },
  { from: 'discussions', to: 'users', label: 'userId', type: 'N:1' },
  { from: 'replies', to: 'discussions', label: 'discussionId', type: 'N:1' },
  { from: 'articles', to: 'users', label: 'userId', type: 'N:1' },
  { from: 'lineConversations', to: 'users', label: 'userId', type: '1:1' },
  { from: 'stripeEvents', to: 'users', label: 'via webhook', type: 'N:1', dashed: true },
];

function CollectionBox({ col, isActive, onClick }: { col: Collection; isActive: boolean; onClick: (col: Collection) => void }) {
  const [hov, setHov] = useState(false);
  const show = hov || isActive;
  const headerH = 32;
  const fieldH = 18;
  const subHeaderH = col.subs.length > 0 ? 22 : 0;
  const subH = col.subs.length * 16;
  const totalH = headerH + col.fields.length * fieldH + 8 + subHeaderH + subH + (col.subs.length > 0 ? 8 : 0);

  return (
    <g onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} onClick={() => onClick(col)} style={{ cursor: 'pointer' }}>
      {show && <rect x={col.x - 3} y={col.y - 3} width={col.w + 6} height={totalH + 6} rx={12} fill="none" stroke={col.color} strokeWidth={1.5} opacity={0.4} />}
      <rect x={col.x} y={col.y} width={col.w} height={totalH} rx={10} fill={show ? C.surfaceHover : C.surface} stroke={show ? col.color : C.border} strokeWidth={show ? 1.5 : 1} />
      <rect x={col.x} y={col.y} width={col.w} height={headerH} rx={10} fill={col.color} opacity={0.15} />
      <rect x={col.x} y={col.y + headerH - 6} width={col.w} height={6} fill={col.color} opacity={0.15} />
      <text x={col.x + 10} y={col.y + 21} fill={col.color} fontSize={12} fontWeight={700} fontFamily="'JetBrains Mono',monospace">
        {col.icon} {col.label}
      </text>
      {col.adminOnly && (
        <text x={col.x + col.w - 10} y={col.y + 20} textAnchor="end" fill={C.red} fontSize={8} fontFamily="'JetBrains Mono',monospace" opacity={0.8}>
          🔒 ADMIN
        </text>
      )}
      {col.fields.map((f, i) => (
        <g key={f.n}>
          <text x={col.x + 10} y={col.y + headerH + 14 + i * fieldH} fill={C.text} fontSize={9.5} fontFamily="'JetBrains Mono',monospace">{f.n}</text>
          <text x={col.x + col.w - 8} y={col.y + headerH + 14 + i * fieldH} textAnchor="end" fill={C.textDim} fontSize={8} fontFamily="'JetBrains Mono',monospace">{f.t}</text>
        </g>
      ))}
      {col.subs.length > 0 && (
        <>
          <line x1={col.x + 8} y1={col.y + headerH + col.fields.length * fieldH + 8} x2={col.x + col.w - 8} y2={col.y + headerH + col.fields.length * fieldH + 8} stroke={C.border} strokeWidth={0.5} />
          <text x={col.x + 10} y={col.y + headerH + col.fields.length * fieldH + 24} fill={col.color} fontSize={9} fontWeight={600} fontFamily="'JetBrains Mono',monospace" opacity={0.7}>
            ┗ subcollections
          </text>
          {col.subs.map((s, i) => (
            <text key={s} x={col.x + 20} y={col.y + headerH + col.fields.length * fieldH + 40 + i * 16} fill={C.textMuted} fontSize={8.5} fontFamily="'JetBrains Mono',monospace">
              ├─ {s}
            </text>
          ))}
        </>
      )}
    </g>
  );
}

function RelationLine({ rel, colMap }: { rel: Relation; colMap: Record<string, Collection> }) {
  const from = colMap[rel.from];
  const to = colMap[rel.to];
  if (!from || !to) return null;
  const fx = from.x + from.w;
  const fy = from.y + 16;
  const tx = to.x;
  const ty = to.y + 16;
  const midX = (fx + tx) / 2;

  return (
    <g>
      <path d={`M ${fx} ${fy} C ${midX} ${fy}, ${midX} ${ty}, ${tx} ${ty}`} fill="none" stroke={C.textDim} strokeWidth={1} strokeDasharray={rel.dashed ? '4,3' : 'none'} opacity={0.35} />
      <circle cx={tx} cy={ty} r={3} fill={to.color} opacity={0.6} />
      <rect x={midX - rel.type.length * 3 - 4} y={(fy + ty) / 2 - 8} width={rel.type.length * 6 + 8} height={14} rx={3} fill={C.bg} opacity={0.9} />
      <text x={midX} y={(fy + ty) / 2 + 1} textAnchor="middle" dominantBaseline="middle" fill={C.textDim} fontSize={8} fontFamily="'JetBrains Mono',monospace">
        {rel.type}
      </text>
    </g>
  );
}

export default function ERDiagramDiagram() {
  const [active, setActive] = useState<Collection | null>(null);
  const colMap: Record<string, Collection> = {};
  collections.forEach((c) => (colMap[c.id] = c));

  const handleClick = useCallback((col: Collection) => {
    setActive((prev) => (prev?.id === col.id ? null : col));
  }, []);

  return (
    <div style={{ fontFamily: "'JetBrains Mono','SF Mono',monospace" }}>
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <h2 style={{ color: C.text, fontSize: 24, fontWeight: 700, margin: 0 }}>
          <span style={{ color: C.amber }}>🗄️</span> Darts Lab — Firestore ER Diagram
        </h2>
        <p style={{ color: C.textDim, fontSize: 11, margin: '6px 0 0', letterSpacing: '0.1em' }}>
          CLOUD FIRESTORE COLLECTION DESIGN — NoSQL Document Model
        </p>
      </div>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 16, maxWidth: 700, margin: '0 auto 16px' }}>
        {[
          { label: '非正規化', desc: 'userName等を埋め込み' },
          { label: 'サブコレクション', desc: 'ユーザー固有データ分離' },
          { label: 'キャッシュDoc', desc: 'dartsliveCache/latest' },
        ].map((p) => (
          <div key={p.label} style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.15)' }}>
            <span style={{ color: C.blue, fontSize: 10, fontWeight: 600 }}>{p.label}</span>
            <span style={{ color: C.textDim, fontSize: 9, marginLeft: 6 }}>{p.desc}</span>
          </div>
        ))}
      </div>

      <div style={{ width: '100%', maxWidth: 1000, margin: '0 auto', position: 'relative' }}>
        <svg viewBox="0 0 1000 880" width="100%" style={{ overflow: 'visible' }}>
          <defs>
            <pattern id="ergrid" width="16" height="16" patternUnits="userSpaceOnUse">
              <path d="M 16 0 L 0 0 0 16" fill="none" stroke={C.border} strokeWidth="0.2" opacity="0.3" />
            </pattern>
          </defs>
          <rect width="1000" height="880" fill="url(#ergrid)" opacity="0.4" />

          <text x={150} y={20} textAnchor="middle" fill={C.green} fontSize={10} fontWeight={600} opacity={0.5} fontFamily="'JetBrains Mono',monospace">CONTENT</text>
          <text x={510} y={490} textAnchor="middle" fill={C.purple} fontSize={10} fontWeight={600} opacity={0.5} fontFamily="'JetBrains Mono',monospace">COMMUNITY</text>
          <text x={850} y={20} textAnchor="middle" fill={C.pink} fontSize={10} fontWeight={600} opacity={0.5} fontFamily="'JetBrains Mono',monospace">SYSTEM / ADMIN</text>

          {relations.map((r, i) => (
            <RelationLine key={i} rel={r} colMap={colMap} />
          ))}
          {collections.map((col) => (
            <CollectionBox key={col.id} col={col} isActive={active?.id === col.id} onClick={handleClick} />
          ))}
        </svg>

        {active && (
          <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', background: C.surface, border: `1px solid ${active.color}`, borderRadius: 12, padding: '14px 18px', maxWidth: 500, width: '90%', boxShadow: `0 0 24px ${active.glow}`, zIndex: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ color: active.color, fontWeight: 700, fontSize: 13 }}>{active.icon} {active.label}</span>
              <span onClick={() => setActive(null)} style={{ color: C.textDim, cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</span>
            </div>
            <div style={{ color: C.textMuted, fontSize: 11, lineHeight: 1.7 }}>
              <div style={{ marginBottom: 4 }}><span style={{ color: C.text, fontWeight: 600 }}>Fields: </span>{active.fields.map((f) => f.n).join(', ')}</div>
              {active.subs.length > 0 && <div><span style={{ color: C.text, fontWeight: 600 }}>Subcollections: </span>{active.subs.join(', ')}</div>}
              {active.adminOnly && <div style={{ color: C.red, marginTop: 4, fontSize: 10 }}>🔒 Admin SDK のみアクセス可（セキュリティルールで client read/write: false）</div>}
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginTop: 16 }}>
        {[
          { c: C.blue, l: 'Users (Core)' }, { c: C.green, l: 'Settings & LINE' },
          { c: C.amber, l: 'Barrels' }, { c: C.purple, l: 'Community' },
          { c: C.cyan, l: 'Content' }, { c: C.pink, l: 'Payment' }, { c: C.red, l: 'Admin Only' },
        ].map((x) => (
          <div key={x.l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: x.c, opacity: 0.8 }} />
            <span style={{ color: C.textDim, fontSize: 9 }}>{x.l}</span>
          </div>
        ))}
      </div>
      <p style={{ color: C.textDim, fontSize: 9, textAlign: 'center', marginTop: 8, opacity: 0.5 }}>
        ※ 各コレクションをクリックすると詳細が表示されます｜7,000+ barrels DB / 12 collections / 11 subcollections
      </p>
    </div>
  );
}
