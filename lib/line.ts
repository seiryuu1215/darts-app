import { createHmac, timingSafeEqual } from 'crypto';
import type { MissDirectionResult } from './stats-math';
import type { HeatmapData } from './heatmap-data';
import { getSegmentLabel } from './heatmap-data';
import type { CuSessionComparison } from './countup-session-compare';
import type { PracticeRecommendation } from './practice-recommendations';
import type { TrendResult, CrossSignal } from './stats-trend';
import type { RoundAnalysis } from './countup-round-analysis';

const LINE_API_BASE = 'https://api.line.me/v2/bot';

/** LINE Webhook 署名検証 (HMAC-SHA256, timing-safe) */
export function validateLineSignature(body: string, signature: string): boolean {
  const secret = process.env.LINE_CHANNEL_SECRET;
  if (!secret) return false;
  const hash = createHmac('sha256', secret).update(body).digest('base64');
  try {
    return timingSafeEqual(Buffer.from(hash, 'base64'), Buffer.from(signature, 'base64'));
  } catch {
    return false;
  }
}

/** Push メッセージ送信 */
export async function sendLinePushMessage(
  lineUserId: string,
  messages: object[],
): Promise<boolean> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) return false;

  const payload = JSON.stringify({ to: lineUserId, messages });
  const res = await fetch(`${LINE_API_BASE}/message/push`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: payload,
  });
  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    console.error(
      `[LINE Push] 送信失敗 (${res.status}): ${errBody.slice(0, 300)}, payload=${(payload.length / 1024).toFixed(1)}KB`,
    );
  }
  return res.ok;
}

/** Reply メッセージ送信 */
export async function replyLineMessage(replyToken: string, messages: object[]): Promise<void> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) return;

  const res = await fetch(`${LINE_API_BASE}/message/reply`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ replyToken, messages }),
  });
  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    console.error(`[LINE Reply] 送信失敗 (${res.status}): ${errBody.slice(0, 300)}`);
  }
}

const CONDITION_LABELS: Record<number, string> = {
  1: '絶不調',
  2: '不調',
  3: '普通',
  4: '好調',
  5: '絶好調',
};

export function getConditionLabel(condition: number): string {
  return CONDITION_LABELS[condition] || '';
}

/** Rating整数値からフライトカラーを取得 */
function getRatingColor(rating: number | null): string {
  if (rating == null) return '#333333';
  const rt = Math.floor(rating);
  if (rt >= 14) return '#FDD835'; // SA
  if (rt >= 12) return '#E65100'; // AA
  if (rt >= 10) return '#FF9800'; // A
  if (rt >= 8) return '#7B1FA2'; // BB
  if (rt >= 6) return '#1E88E5'; // B
  if (rt >= 4) return '#00ACC1'; // CC
  if (rt >= 2) return '#4CAF50'; // C
  return '#808080'; // N
}

/** コンディション入力用 Quick Reply (★1〜★5) */
export const CONDITION_QUICK_REPLY = {
  items: [1, 2, 3, 4, 5].map((n) => ({
    type: 'action',
    action: { type: 'message', label: `★${n}`, text: `★${n}` },
  })),
};

/** スタッツ通知用 Flex Message + Quick Reply (★1〜★5) */
export function buildStatsFlexMessage(stats: {
  date: string;
  rating: number | null;
  ppd: number | null;
  mpr: number | null;
  prevRating?: number | null;
  gamesPlayed?: number | null;
  awards?: {
    dBull?: number;
    sBull?: number;
    hatTricks?: number;
    ton80?: number;
    lowTon?: number;
    highTon?: number;
    threeInABed?: number;
    threeInABlack?: number;
    whiteHorse?: number;
  };
  prevAwards?: {
    dBull?: number;
    sBull?: number;
    hatTricks?: number;
    ton80?: number;
    lowTon?: number;
    highTon?: number;
    threeInABed?: number;
    threeInABlack?: number;
    whiteHorse?: number;
  };
}): object {
  const ratingStr = stats.rating?.toFixed(2) ?? '--';
  const ppdStr = stats.ppd?.toFixed(2) ?? '--';
  const mprStr = stats.mpr?.toFixed(2) ?? '--';
  const ratingColor = getRatingColor(stats.rating);

  // Rating 変動表示
  const ratingChangeContents: object[] = [];
  if (stats.rating != null && stats.prevRating != null) {
    const diff = stats.rating - stats.prevRating;
    if (diff !== 0) {
      const sign = diff > 0 ? '+' : '';
      const color = diff > 0 ? '#4CAF50' : '#E53935';
      ratingChangeContents.push({
        type: 'text',
        text: `${sign}${diff.toFixed(2)}`,
        size: 'xs',
        color,
      });
    }
  }

  // Awards 差分セクション構築（prevAwards がある場合のみ日次差分を表示）
  const awardsContents: object[] = [];
  if (stats.awards && stats.prevAwards) {
    const a = stats.awards;
    const pa = stats.prevAwards;

    type AwardKey =
      | 'hatTricks'
      | 'ton80'
      | 'lowTon'
      | 'highTon'
      | 'threeInABed'
      | 'threeInABlack'
      | 'whiteHorse'
      | 'dBull'
      | 'sBull';
    const awardDefs: { label: string; key: AwardKey }[] = [
      { label: 'HAT TRICK', key: 'hatTricks' },
      { label: 'TON 80', key: 'ton80' },
      { label: 'LOW TON', key: 'lowTon' },
      { label: 'HIGH TON', key: 'highTon' },
      { label: '3 IN A BED', key: 'threeInABed' },
      { label: '3 - BLACK', key: 'threeInABlack' },
      { label: 'WHITE HRS', key: 'whiteHorse' },
      { label: 'D-BULL', key: 'dBull' },
      { label: 'S-BULL', key: 'sBull' },
    ];

    const awardItems = awardDefs
      .map((def) => {
        const current = a[def.key] ?? 0;
        const prev = pa[def.key] ?? 0;
        const value = current - prev;
        return { label: def.label, value };
      })
      .filter((item) => item.value > 0);

    if (awardItems.length > 0) {
      awardsContents.push({
        type: 'separator',
        margin: 'md',
      });
      awardsContents.push({
        type: 'text',
        text: 'AWARDS',
        size: 'sm',
        weight: 'bold',
        margin: 'md',
        color: '#555555',
      });

      // 2列レイアウトで表示
      for (let i = 0; i < awardItems.length; i += 2) {
        const left = awardItems[i];
        const right = awardItems[i + 1];
        const rowContents: object[] = [
          {
            type: 'box',
            layout: 'horizontal',
            flex: 1,
            contents: [
              { type: 'text', text: left.label, size: 'xxs', color: '#888888', flex: 3 },
              {
                type: 'text',
                text: `+${left.value}`,
                size: 'xxs',
                color: '#333333',
                flex: 1,
                align: 'end',
              },
            ],
          },
        ];
        if (right) {
          rowContents.push({
            type: 'box',
            layout: 'horizontal',
            flex: 1,
            contents: [
              { type: 'text', text: right.label, size: 'xxs', color: '#888888', flex: 3 },
              {
                type: 'text',
                text: `+${right.value}`,
                size: 'xxs',
                color: '#333333',
                flex: 1,
                align: 'end',
              },
            ],
          });
        }
        awardsContents.push({
          type: 'box',
          layout: 'horizontal',
          spacing: 'md',
          margin: 'sm',
          contents: rowContents,
        });
      }
    }
  }

  return {
    type: 'flex',
    altText: `リザルト: Rt.${ratingStr} / PPD ${ppdStr} / MPR ${mprStr}`,
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#1976d2',
        paddingAll: '16px',
        contents: [
          {
            type: 'text',
            text: 'Darts Lab',
            color: '#ffffff',
            size: 'sm',
            weight: 'bold',
          },
          {
            type: 'text',
            text: 'リザルト',
            color: '#ffffffcc',
            size: 'xs',
          },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '16px',
        spacing: 'md',
        contents: [
          {
            type: 'text',
            text: stats.date,
            size: 'sm',
            color: '#888888',
          },
          {
            type: 'box',
            layout: 'horizontal',
            spacing: 'md',
            contents: [
              {
                type: 'box',
                layout: 'vertical',
                flex: 1,
                contents: [
                  { type: 'text', text: 'Rating', size: 'xs', color: '#888888' },
                  { type: 'text', text: ratingStr, size: 'xl', weight: 'bold', color: ratingColor },
                  ...ratingChangeContents,
                ],
              },
              {
                type: 'box',
                layout: 'vertical',
                flex: 1,
                contents: [
                  { type: 'text', text: 'PPD', size: 'xs', color: '#888888' },
                  { type: 'text', text: ppdStr, size: 'xl', weight: 'bold' },
                ],
              },
              {
                type: 'box',
                layout: 'vertical',
                flex: 1,
                contents: [
                  { type: 'text', text: 'MPR', size: 'xs', color: '#888888' },
                  { type: 'text', text: mprStr, size: 'xl', weight: 'bold' },
                ],
              },
            ],
          },
          ...(stats.gamesPlayed != null
            ? [
                {
                  type: 'text' as const,
                  text: `ゲーム数: ${stats.gamesPlayed}`,
                  size: 'sm' as const,
                  color: '#888888',
                },
              ]
            : []),
          ...awardsContents,
          {
            type: 'text',
            text: '調子はどうでしたか？',
            size: 'sm',
            weight: 'bold',
            margin: 'md',
          },
        ],
      },
    },
    quickReply: CONDITION_QUICK_REPLY,
  };
}

/** 実績解除通知 Flex Message */
export function buildAchievementFlexMessage(
  achievements: { name: string; icon: string }[],
): object {
  const bodyContents: object[] = [
    {
      type: 'text',
      text: '🏆 実績解除!',
      weight: 'bold',
      size: 'lg',
      color: '#333333',
    },
    {
      type: 'separator',
      margin: 'md',
    },
  ];

  for (const a of achievements) {
    bodyContents.push({
      type: 'text',
      text: `${a.icon} ${a.name}`,
      size: 'sm',
      margin: 'md',
      color: '#333333',
    });
  }

  return {
    type: 'flex',
    altText: `実績解除: ${achievements.map((a) => a.name).join(', ')}`,
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#FF6F00',
        paddingAll: '16px',
        contents: [
          {
            type: 'text',
            text: 'Darts Lab',
            color: '#ffffff',
            size: 'sm',
            weight: 'bold',
          },
          {
            type: 'text',
            text: '実績',
            color: '#ffffffcc',
            size: 'xs',
          },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '16px',
        spacing: 'sm',
        contents: bodyContents,
      },
    },
  };
}

/** 完了通知メッセージ */
export function buildCompletionMessage(stats: {
  rating: number | null;
  ppd: number | null;
  condition: number;
  memo: string;
  challenge: string;
}): object {
  const condLabel = getConditionLabel(stats.condition);
  const ratingStr = stats.rating?.toFixed(2) ?? '--';
  const ppdStr = stats.ppd?.toFixed(2) ?? '--';
  const memoStr = stats.memo || 'なし';
  const challengeStr = stats.challenge || 'なし';

  return {
    type: 'text',
    text: `記録しました！\nRt.${ratingStr} / PPD ${ppdStr} / ★${stats.condition} ${condLabel}\nメモ: ${memoStr}\n課題: ${challengeStr}`,
  };
}

// ──────────────────────────────
// Weekly / Monthly Report Flex Messages
// ──────────────────────────────

interface ReportFlexInput {
  periodLabel: string;
  playDays: number;
  totalGames: number;
  ratingStart: number | null;
  ratingEnd: number | null;
  ratingChange: number | null;
  avgPpd: number | null;
  avgMpr: number | null;
  bestDay: { date: string; rating: number } | null;
  worstDay: { date: string; rating: number } | null;
  awardsHighlights: { label: string; count: number }[];
  goalsAchieved: number;
  goalsActive: number;
  xpGained: number;
  prevPlayDays?: number;
  prevTotalGames?: number;
}

function buildReportBodyContents(report: ReportFlexInput, showDetail: boolean): object[] {
  const contents: object[] = [
    { type: 'text', text: report.periodLabel, size: 'sm', color: '#888888' },
    {
      type: 'box',
      layout: 'horizontal',
      spacing: 'md',
      margin: 'md',
      contents: [
        {
          type: 'box',
          layout: 'vertical',
          flex: 1,
          contents: [
            { type: 'text', text: 'プレイ日数', size: 'xs', color: '#888888' },
            { type: 'text', text: `${report.playDays}日`, size: 'lg', weight: 'bold' },
          ],
        },
        {
          type: 'box',
          layout: 'vertical',
          flex: 1,
          contents: [
            { type: 'text', text: 'ゲーム数', size: 'xs', color: '#888888' },
            { type: 'text', text: `${report.totalGames}`, size: 'lg', weight: 'bold' },
          ],
        },
      ],
    },
  ];

  // Rating 変動
  if (report.ratingChange != null) {
    const sign = report.ratingChange > 0 ? '+' : '';
    const rColor =
      report.ratingChange > 0 ? '#4CAF50' : report.ratingChange < 0 ? '#E53935' : '#888888';
    contents.push({
      type: 'box',
      layout: 'horizontal',
      margin: 'md',
      contents: [
        { type: 'text', text: 'Rating変動', size: 'xs', color: '#888888', flex: 2 },
        {
          type: 'text',
          text: `${sign}${report.ratingChange.toFixed(2)}`,
          size: 'sm',
          weight: 'bold',
          color: rColor,
          flex: 1,
          align: 'end',
        },
      ],
    });
  }

  // PPD / MPR (月次のみ)
  if (showDetail && (report.avgPpd != null || report.avgMpr != null)) {
    const ppdMprContents: object[] = [];
    if (report.avgPpd != null) {
      ppdMprContents.push({
        type: 'box',
        layout: 'vertical',
        flex: 1,
        contents: [
          { type: 'text', text: 'PPD', size: 'xs', color: '#888888' },
          { type: 'text', text: report.avgPpd.toFixed(2), size: 'sm', weight: 'bold' },
        ],
      });
    }
    if (report.avgMpr != null) {
      ppdMprContents.push({
        type: 'box',
        layout: 'vertical',
        flex: 1,
        contents: [
          { type: 'text', text: 'MPR', size: 'xs', color: '#888888' },
          { type: 'text', text: report.avgMpr.toFixed(2), size: 'sm', weight: 'bold' },
        ],
      });
    }
    contents.push({
      type: 'box',
      layout: 'horizontal',
      spacing: 'md',
      margin: 'md',
      contents: ppdMprContents,
    });
  }

  // Best day
  if (report.bestDay) {
    contents.push({
      type: 'box',
      layout: 'horizontal',
      margin: 'md',
      contents: [
        { type: 'text', text: 'ベストデイ', size: 'xs', color: '#888888', flex: 2 },
        {
          type: 'text',
          text: `${report.bestDay.date} (Rt.${report.bestDay.rating.toFixed(2)})`,
          size: 'xs',
          color: '#333333',
          flex: 3,
          align: 'end',
        },
      ],
    });
  }

  // Worst day (月次のみ)
  if (showDetail && report.worstDay) {
    contents.push({
      type: 'box',
      layout: 'horizontal',
      margin: 'sm',
      contents: [
        { type: 'text', text: 'ワーストデイ', size: 'xs', color: '#888888', flex: 2 },
        {
          type: 'text',
          text: `${report.worstDay.date} (Rt.${report.worstDay.rating.toFixed(2)})`,
          size: 'xs',
          color: '#333333',
          flex: 3,
          align: 'end',
        },
      ],
    });
  }

  // Awards highlights (上位5件)
  if (report.awardsHighlights.length > 0) {
    contents.push({ type: 'separator', margin: 'md' });
    contents.push({
      type: 'text',
      text: 'AWARDS',
      size: 'sm',
      weight: 'bold',
      margin: 'md',
      color: '#555555',
    });
    for (const award of report.awardsHighlights) {
      contents.push({
        type: 'box',
        layout: 'horizontal',
        margin: 'sm',
        contents: [
          { type: 'text', text: award.label, size: 'xxs', color: '#888888', flex: 3 },
          {
            type: 'text',
            text: `+${award.count}`,
            size: 'xxs',
            color: '#333333',
            flex: 1,
            align: 'end',
          },
        ],
      });
    }
  }

  // Goals
  if (report.goalsAchieved > 0 || report.goalsActive > 0) {
    contents.push({ type: 'separator', margin: 'md' });
    contents.push({
      type: 'text',
      text: `目標: ${report.goalsAchieved}達成 / ${report.goalsActive}進行中`,
      size: 'xs',
      color: '#555555',
      margin: 'md',
    });
  }

  // XP
  if (report.xpGained > 0) {
    contents.push({
      type: 'text',
      text: `XP獲得: +${report.xpGained}`,
      size: 'xs',
      color: '#4CAF50',
      margin: 'sm',
    });
  }

  // 前期比較
  if (report.prevPlayDays != null) {
    const daysDiff = report.playDays - report.prevPlayDays;
    const daysSign = daysDiff > 0 ? '+' : '';
    contents.push({ type: 'separator', margin: 'md' });
    contents.push({
      type: 'text',
      text: `前期比: プレイ日数 ${daysSign}${daysDiff}日`,
      size: 'xxs',
      color: '#888888',
      margin: 'md',
    });
  }

  return contents;
}

/** 週次レポート Flex Message */
export function buildWeeklyReportFlexMessage(report: ReportFlexInput): object {
  return {
    type: 'flex',
    altText: `Weekly Report: ${report.periodLabel}`,
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#1976d2',
        paddingAll: '16px',
        contents: [
          { type: 'text', text: 'Darts Lab', color: '#ffffff', size: 'sm', weight: 'bold' },
          { type: 'text', text: 'Weekly Report', color: '#ffffffcc', size: 'xs' },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '16px',
        spacing: 'sm',
        contents: buildReportBodyContents(report, false),
      },
    },
  };
}

/** 月次レポート Flex Message */
export function buildMonthlyReportFlexMessage(report: ReportFlexInput): object {
  return {
    type: 'flex',
    altText: `Monthly Report: ${report.periodLabel}`,
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#E65100',
        paddingAll: '16px',
        contents: [
          { type: 'text', text: 'Darts Lab', color: '#ffffff', size: 'sm', weight: 'bold' },
          { type: 'text', text: 'Monthly Report', color: '#ffffffcc', size: 'xs' },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '16px',
        spacing: 'sm',
        contents: buildReportBodyContents(report, true),
      },
    },
  };
}

// ──────────────────────────────
// COUNT-UP 分析 Flex Message
// ──────────────────────────────

export interface CuNotifyStats {
  date: string;
  gameCount: number;
  avgScore: number;
  maxScore: number;
  consistency: number;
  bullRate: number;
  // 前回比較（前回有効セッションとの差分）
  prevAvgScore?: number | null;
  prevConsistency?: number | null;
  prevBullRate?: number | null;
  // ミスパターン変化
  currentMissDir?: string | null;
  prevMissDir?: string | null;
  vectorXChange?: number | null;
  vectorYChange?: number | null;
  radiusChange?: number | null;
}

/** 差分表示ヘルパー ("+1.2" / "-0.5") */
function formatDelta(val: number | null | undefined, suffix: string = ''): string {
  if (val == null) return '';
  const sign = val > 0 ? '+' : '';
  return `${sign}${val.toFixed(1)}${suffix}`;
}

/** COUNT-UP 分析用 Flex Message */
export function buildCountUpFlexMessage(cu: CuNotifyStats): object {
  const bodyContents: object[] = [
    { type: 'text', text: cu.date, size: 'sm', color: '#888888' },
    {
      type: 'text',
      text: `${cu.gameCount}ゲーム`,
      size: 'xs',
      color: '#888888',
      margin: 'sm',
    },
    // スコア行
    {
      type: 'box',
      layout: 'horizontal',
      spacing: 'md',
      margin: 'md',
      contents: [
        {
          type: 'box',
          layout: 'vertical',
          flex: 1,
          contents: [
            { type: 'text', text: '平均', size: 'xs', color: '#888888' },
            { type: 'text', text: String(cu.avgScore), size: 'xl', weight: 'bold' },
          ],
        },
        {
          type: 'box',
          layout: 'vertical',
          flex: 1,
          contents: [
            { type: 'text', text: '最高', size: 'xs', color: '#888888' },
            { type: 'text', text: String(cu.maxScore), size: 'xl', weight: 'bold' },
          ],
        },
        {
          type: 'box',
          layout: 'vertical',
          flex: 1,
          contents: [
            { type: 'text', text: '安定性', size: 'xs', color: '#888888' },
            { type: 'text', text: String(cu.consistency), size: 'xl', weight: 'bold' },
          ],
        },
      ],
    },
    // ブル率
    {
      type: 'box',
      layout: 'horizontal',
      margin: 'md',
      contents: [
        { type: 'text', text: 'ブル率', size: 'xs', color: '#888888', flex: 2 },
        {
          type: 'text',
          text: `${cu.bullRate}%`,
          size: 'sm',
          weight: 'bold',
          flex: 1,
          align: 'end',
        },
      ],
    },
  ];

  // 前回比較セクション
  const hasPrevComparison =
    cu.prevAvgScore != null || cu.prevConsistency != null || cu.prevBullRate != null;

  if (hasPrevComparison) {
    bodyContents.push({ type: 'separator', margin: 'md' });
    bodyContents.push({
      type: 'text',
      text: '前回30G日との比較',
      size: 'sm',
      weight: 'bold',
      margin: 'md',
      color: '#555555',
    });

    const comparisonItems: { label: string; delta: string; color: string }[] = [];

    if (cu.prevAvgScore != null) {
      const d = cu.avgScore - cu.prevAvgScore;
      comparisonItems.push({
        label: '平均スコア',
        delta: formatDelta(d),
        color: d > 0 ? '#4CAF50' : d < 0 ? '#E53935' : '#888888',
      });
    }
    if (cu.prevConsistency != null) {
      const d = cu.consistency - cu.prevConsistency;
      comparisonItems.push({
        label: '安定性',
        delta: formatDelta(d, 'pt'),
        color: d > 0 ? '#4CAF50' : d < 0 ? '#E53935' : '#888888',
      });
    }
    if (cu.prevBullRate != null) {
      const d = cu.bullRate - cu.prevBullRate;
      comparisonItems.push({
        label: 'ブル率',
        delta: formatDelta(d, '%'),
        color: d > 0 ? '#4CAF50' : d < 0 ? '#E53935' : '#888888',
      });
    }

    for (const item of comparisonItems) {
      bodyContents.push({
        type: 'box',
        layout: 'horizontal',
        margin: 'sm',
        contents: [
          { type: 'text', text: item.label, size: 'xxs', color: '#888888', flex: 2 },
          {
            type: 'text',
            text: item.delta,
            size: 'xxs',
            color: item.color,
            weight: 'bold',
            flex: 1,
            align: 'end',
          },
        ],
      });
    }
  }

  // ミスパターン変化セクション
  const hasMissChange =
    cu.vectorXChange != null || cu.vectorYChange != null || cu.radiusChange != null;

  if (hasMissChange) {
    bodyContents.push({ type: 'separator', margin: 'md' });
    bodyContents.push({
      type: 'text',
      text: 'センサー変化',
      size: 'sm',
      weight: 'bold',
      margin: 'md',
      color: '#555555',
    });

    if (cu.vectorXChange != null) {
      bodyContents.push({
        type: 'box',
        layout: 'horizontal',
        margin: 'sm',
        contents: [
          { type: 'text', text: '横ずれ', size: 'xxs', color: '#888888', flex: 2 },
          {
            type: 'text',
            text: formatDelta(cu.vectorXChange, 'mm'),
            size: 'xxs',
            color: '#333333',
            flex: 1,
            align: 'end',
          },
        ],
      });
    }
    if (cu.vectorYChange != null) {
      bodyContents.push({
        type: 'box',
        layout: 'horizontal',
        margin: 'sm',
        contents: [
          { type: 'text', text: '縦ずれ', size: 'xxs', color: '#888888', flex: 2 },
          {
            type: 'text',
            text: formatDelta(cu.vectorYChange, 'mm'),
            size: 'xxs',
            color: '#333333',
            flex: 1,
            align: 'end',
          },
        ],
      });
    }
    if (cu.radiusChange != null) {
      const rColor = cu.radiusChange < 0 ? '#4CAF50' : cu.radiusChange > 0 ? '#E53935' : '#888888';
      bodyContents.push({
        type: 'box',
        layout: 'horizontal',
        margin: 'sm',
        contents: [
          { type: 'text', text: 'レンジ', size: 'xxs', color: '#888888', flex: 2 },
          {
            type: 'text',
            text: formatDelta(cu.radiusChange, 'mm'),
            size: 'xxs',
            color: rColor,
            weight: 'bold',
            flex: 1,
            align: 'end',
          },
        ],
      });
    }

    // ミス方向変化
    if (cu.currentMissDir && cu.prevMissDir && cu.currentMissDir !== cu.prevMissDir) {
      bodyContents.push({
        type: 'box',
        layout: 'horizontal',
        margin: 'sm',
        contents: [
          { type: 'text', text: 'ミス傾向', size: 'xxs', color: '#888888', flex: 2 },
          {
            type: 'text',
            text: `${cu.prevMissDir}→${cu.currentMissDir}`,
            size: 'xxs',
            color: '#333333',
            flex: 1,
            align: 'end',
          },
        ],
      });
    }
  }

  return {
    type: 'flex',
    altText: `COUNT-UP: 平均${cu.avgScore} / 最高${cu.maxScore} / ${cu.gameCount}G`,
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#2E7D32',
        paddingAll: '16px',
        contents: [
          { type: 'text', text: 'Darts Lab', color: '#ffffff', size: 'sm', weight: 'bold' },
          { type: 'text', text: 'COUNT-UP 分析', color: '#ffffffcc', size: 'xs' },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '16px',
        spacing: 'sm',
        contents: bodyContents,
      },
    },
  };
}

// ──────────────────────────────
// ロール別リッチ通知 Flex Bubbles
// ──────────────────────────────

/** ヘッダーブロック生成ヘルパー */
function buildBubbleHeader(title: string, subtitle: string, bgColor: string): object {
  return {
    type: 'box',
    layout: 'vertical',
    backgroundColor: bgColor,
    paddingAll: '16px',
    contents: [
      { type: 'text', text: 'Darts Lab', color: '#ffffff', size: 'sm', weight: 'bold' },
      { type: 'text', text: `${title} ${subtitle}`, color: '#ffffffcc', size: 'xs' },
    ],
  };
}

/** ミス方向分析 Flex Bubble (#7B1FA2 紫) */
export function buildMissDirectionFlexBubble(result: MissDirectionResult): object {
  const bodyContents: object[] = [];

  // ブル率/ダブルブル率
  bodyContents.push({
    type: 'box',
    layout: 'horizontal',
    spacing: 'md',
    contents: [
      {
        type: 'box',
        layout: 'vertical',
        flex: 1,
        contents: [
          { type: 'text', text: 'ブル率', size: 'xs', color: '#888888' },
          {
            type: 'text',
            text: `${result.bullRate.toFixed(1)}%`,
            size: 'lg',
            weight: 'bold',
          },
        ],
      },
      {
        type: 'box',
        layout: 'vertical',
        flex: 1,
        contents: [
          { type: 'text', text: 'D-BULL率', size: 'xs', color: '#888888' },
          {
            type: 'text',
            text: `${result.doubleBullRate.toFixed(1)}%`,
            size: 'lg',
            weight: 'bold',
          },
        ],
      },
    ],
  });

  // 8方向コンパス
  bodyContents.push({ type: 'separator', margin: 'md' });
  bodyContents.push({
    type: 'text',
    text: '8方向ミス分布',
    size: 'sm',
    weight: 'bold',
    margin: 'md',
    color: '#555555',
  });

  for (const dir of result.directions) {
    const isPrimary = dir.label === result.primaryDirection;
    bodyContents.push({
      type: 'box',
      layout: 'horizontal',
      margin: 'sm',
      contents: [
        {
          type: 'text',
          text: isPrimary ? `★${dir.label}` : dir.label,
          size: 'xxs',
          color: isPrimary ? '#7B1FA2' : '#888888',
          weight: isPrimary ? 'bold' : 'regular',
          flex: 2,
        },
        {
          type: 'text',
          text: `${dir.percentage}%`,
          size: 'xxs',
          color: isPrimary ? '#7B1FA2' : '#333333',
          weight: isPrimary ? 'bold' : 'regular',
          flex: 1,
          align: 'end',
        },
      ],
    });
  }

  // 偏り強度
  bodyContents.push({ type: 'separator', margin: 'md' });
  bodyContents.push({
    type: 'box',
    layout: 'horizontal',
    margin: 'md',
    contents: [
      { type: 'text', text: '主傾向', size: 'xxs', color: '#888888', flex: 2 },
      {
        type: 'text',
        text: `${result.primaryDirection} (${(result.directionStrength * 100).toFixed(0)}%)`,
        size: 'xxs',
        color: '#333333',
        weight: 'bold',
        flex: 2,
        align: 'end',
      },
    ],
  });

  // TOP3 ミスナンバー
  if (result.topMissNumbers.length > 0) {
    bodyContents.push({
      type: 'text',
      text: 'トップミスナンバー',
      size: 'sm',
      weight: 'bold',
      margin: 'md',
      color: '#555555',
    });
    for (const miss of result.topMissNumbers.slice(0, 3)) {
      bodyContents.push({
        type: 'box',
        layout: 'horizontal',
        margin: 'sm',
        contents: [
          { type: 'text', text: `${miss.number}`, size: 'xxs', color: '#888888', flex: 2 },
          {
            type: 'text',
            text: `${miss.count}回 (${miss.percentage.toFixed(1)}%)`,
            size: 'xxs',
            color: '#333333',
            flex: 2,
            align: 'end',
          },
        ],
      });
    }
  }

  return {
    type: 'bubble',
    header: buildBubbleHeader('ミス方向分析', '🎯', '#7B1FA2'),
    body: {
      type: 'box',
      layout: 'vertical',
      paddingAll: '16px',
      spacing: 'sm',
      contents: bodyContents,
    },
  };
}

/** ヒートマップサマリー Flex Bubble (#00695C ティール) */
export function buildHeatmapSummaryFlexBubble(data: HeatmapData): object {
  const bodyContents: object[] = [];

  // BULL内訳
  bodyContents.push({
    type: 'box',
    layout: 'horizontal',
    spacing: 'md',
    contents: [
      {
        type: 'box',
        layout: 'vertical',
        flex: 1,
        contents: [
          { type: 'text', text: 'D-BULL', size: 'xs', color: '#888888' },
          { type: 'text', text: String(data.doubleBullCount), size: 'lg', weight: 'bold' },
        ],
      },
      {
        type: 'box',
        layout: 'vertical',
        flex: 1,
        contents: [
          { type: 'text', text: 'S-BULL', size: 'xs', color: '#888888' },
          {
            type: 'text',
            text: String(data.bullCount - data.doubleBullCount),
            size: 'lg',
            weight: 'bold',
          },
        ],
      },
      {
        type: 'box',
        layout: 'vertical',
        flex: 1,
        contents: [
          { type: 'text', text: 'OUT', size: 'xs', color: '#888888' },
          { type: 'text', text: String(data.outCount), size: 'lg', weight: 'bold' },
        ],
      },
    ],
  });

  // トップ10ヒットセグメント（横棒グラフ風）
  bodyContents.push({ type: 'separator', margin: 'md' });
  bodyContents.push({
    type: 'text',
    text: 'トップヒットセグメント',
    size: 'sm',
    weight: 'bold',
    margin: 'md',
    color: '#555555',
  });

  const sorted = [...data.segments.entries()].sort(([, a], [, b]) => b - a).slice(0, 10);
  const topCount = sorted.length > 0 ? sorted[0][1] : 1;

  for (const [segId, count] of sorted) {
    const barFlex = Math.max(1, Math.round((count / topCount) * 8));
    const emptyFlex = Math.max(1, 9 - barFlex);
    const pct = data.totalDarts > 0 ? ((count / data.totalDarts) * 100).toFixed(1) : '0';

    bodyContents.push({
      type: 'box',
      layout: 'horizontal',
      margin: 'sm',
      contents: [
        {
          type: 'text',
          text: getSegmentLabel(segId),
          size: 'xxs',
          color: '#888888',
          flex: 2,
        },
        {
          type: 'box',
          layout: 'horizontal',
          flex: 5,
          contents: [
            {
              type: 'box',
              layout: 'vertical',
              flex: barFlex,
              height: '12px',
              backgroundColor: '#00695C',
              cornerRadius: '2px',
              contents: [],
            },
            {
              type: 'box',
              layout: 'vertical',
              flex: emptyFlex,
              contents: [],
            },
          ],
        },
        {
          type: 'text',
          text: `${pct}%`,
          size: 'xxs',
          color: '#333333',
          flex: 2,
          align: 'end',
        },
      ],
    });
  }

  return {
    type: 'bubble',
    header: buildBubbleHeader('ヒートマップ', '🔥', '#00695C'),
    body: {
      type: 'box',
      layout: 'vertical',
      paddingAll: '16px',
      spacing: 'sm',
      contents: bodyContents,
    },
  };
}

/** セッション比較 Flex Bubble (#0277BD ライトブルー) */
export function buildSessionComparisonFlexBubble(comparison: CuSessionComparison): object {
  const { prev, current, deltas, insights } = comparison;

  const bodyContents: object[] = [];

  // 日付ラベル
  bodyContents.push({
    type: 'box',
    layout: 'horizontal',
    contents: [
      { type: 'text', text: `前回: ${prev.date}`, size: 'xxs', color: '#888888', flex: 1 },
      {
        type: 'text',
        text: `今回: ${current.date}`,
        size: 'xxs',
        color: '#888888',
        flex: 1,
        align: 'end',
      },
    ],
  });

  // 2列比較行ヘルパー
  const compRow = (label: string, prevVal: string, currVal: string, delta: number): object => {
    const dSign = delta > 0 ? '+' : '';
    const dColor = delta > 0 ? '#4CAF50' : delta < 0 ? '#E53935' : '#888888';
    return {
      type: 'box',
      layout: 'horizontal',
      margin: 'sm',
      contents: [
        { type: 'text', text: label, size: 'xxs', color: '#888888', flex: 2 },
        { type: 'text', text: prevVal, size: 'xxs', color: '#333333', flex: 2, align: 'center' },
        {
          type: 'text',
          text: currVal,
          size: 'xxs',
          weight: 'bold',
          color: '#333333',
          flex: 2,
          align: 'center',
        },
        {
          type: 'text',
          text: `${dSign}${delta.toFixed(1)}`,
          size: 'xxs',
          weight: 'bold',
          color: dColor,
          flex: 2,
          align: 'end',
        },
      ],
    };
  };

  // ヘッダー行
  bodyContents.push({
    type: 'box',
    layout: 'horizontal',
    margin: 'md',
    contents: [
      { type: 'text', text: ' ', size: 'xxs', color: '#888888', flex: 2 },
      {
        type: 'text',
        text: '前回',
        size: 'xxs',
        color: '#888888',
        weight: 'bold',
        flex: 2,
        align: 'center',
      },
      {
        type: 'text',
        text: '今回',
        size: 'xxs',
        color: '#888888',
        weight: 'bold',
        flex: 2,
        align: 'center',
      },
      {
        type: 'text',
        text: '差分',
        size: 'xxs',
        color: '#888888',
        weight: 'bold',
        flex: 2,
        align: 'end',
      },
    ],
  });

  bodyContents.push(
    compRow('平均', String(prev.avgScore), String(current.avgScore), deltas.avgScore),
  );
  bodyContents.push(
    compRow('安定性', String(prev.consistency), String(current.consistency), deltas.consistency),
  );
  bodyContents.push(
    compRow('ブル率', `${prev.bullRate}%`, `${current.bullRate}%`, deltas.bullRate),
  );
  bodyContents.push(
    compRow('ワンブル', `${prev.oneBullRate}%`, `${current.oneBullRate}%`, deltas.oneBullRate),
  );
  bodyContents.push(
    compRow('ロートン', `${prev.lowTonRate}%`, `${current.lowTonRate}%`, deltas.lowTonRate),
  );
  bodyContents.push(
    compRow('ハット', `${prev.hatTrickRate}%`, `${current.hatTrickRate}%`, deltas.hatTrickRate),
  );

  // インサイト
  if (insights.length > 0) {
    bodyContents.push({ type: 'separator', margin: 'md' });
    bodyContents.push({
      type: 'text',
      text: 'インサイト',
      size: 'sm',
      weight: 'bold',
      margin: 'md',
      color: '#555555',
    });
    for (const insight of insights.slice(0, 3)) {
      bodyContents.push({
        type: 'text',
        text: `• ${insight}`,
        size: 'xxs',
        color: '#333333',
        margin: 'sm',
        wrap: true,
      });
    }
  }

  return {
    type: 'bubble',
    header: buildBubbleHeader('セッション比較', '📊', '#0277BD'),
    body: {
      type: 'box',
      layout: 'vertical',
      paddingAll: '16px',
      spacing: 'sm',
      contents: bodyContents,
    },
  };
}

/** 練習レコメンド Flex Bubble (#E65100 ディープオレンジ) */
export function buildRecommendationsFlexBubble(
  recs: PracticeRecommendation[],
  max: number,
): object {
  const bodyContents: object[] = [];
  const displayed = recs.slice(0, max);

  for (let i = 0; i < displayed.length; i++) {
    const rec = displayed[i];
    if (i > 0) bodyContents.push({ type: 'separator', margin: 'md' });

    const urgencyColor =
      rec.urgency === 'high' ? '#E53935' : rec.urgency === 'medium' ? '#FF9800' : '#4CAF50';
    const urgencyLabel = rec.urgency === 'high' ? '高' : rec.urgency === 'medium' ? '中' : '低';

    bodyContents.push({
      type: 'box',
      layout: 'horizontal',
      margin: i === 0 ? 'none' : 'md',
      contents: [
        {
          type: 'box',
          layout: 'vertical',
          width: '30px',
          height: '20px',
          backgroundColor: urgencyColor,
          cornerRadius: '4px',
          justifyContent: 'center',
          alignItems: 'center',
          contents: [
            { type: 'text', text: urgencyLabel, size: 'xxs', color: '#ffffff', weight: 'bold' },
          ],
        },
        {
          type: 'text',
          text: rec.title,
          size: 'sm',
          weight: 'bold',
          color: '#333333',
          flex: 1,
          margin: 'sm',
        },
      ],
    });

    bodyContents.push({
      type: 'text',
      text: rec.drill,
      size: 'xxs',
      color: '#555555',
      margin: 'sm',
      wrap: true,
    });
  }

  return {
    type: 'bubble',
    header: buildBubbleHeader('練習レコメンド', '💡', '#E65100'),
    body: {
      type: 'box',
      layout: 'vertical',
      paddingAll: '16px',
      spacing: 'sm',
      contents: bodyContents,
    },
  };
}

/** トレンド分析入力型 */
export interface TrendBubbleInput {
  metric: string;
  currentValue: number;
  trend: TrendResult;
  sma7: number | null;
  sma30: number | null;
  recentCrosses: CrossSignal[];
}

/** トレンド分析 Flex Bubble (#1565C0 ダークブルー) */
export function buildTrendFlexBubble(input: TrendBubbleInput): object {
  const { metric, currentValue, trend, sma7, sma30, recentCrosses } = input;

  const trendArrow = trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→';
  const bodyContents: object[] = [];

  // 現在値 + トレンド
  bodyContents.push({
    type: 'box',
    layout: 'horizontal',
    spacing: 'md',
    contents: [
      {
        type: 'box',
        layout: 'vertical',
        flex: 2,
        contents: [
          { type: 'text', text: metric, size: 'xs', color: '#888888' },
          { type: 'text', text: String(currentValue), size: 'xl', weight: 'bold' },
        ],
      },
      {
        type: 'box',
        layout: 'vertical',
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        contents: [
          {
            type: 'text',
            text: trendArrow,
            size: 'xxl',
            weight: 'bold',
            color: trend.color,
          },
        ],
      },
      {
        type: 'box',
        layout: 'vertical',
        flex: 2,
        contents: [
          { type: 'text', text: 'トレンド', size: 'xs', color: '#888888' },
          {
            type: 'text',
            text: trend.label,
            size: 'sm',
            weight: 'bold',
            color: trend.color,
          },
        ],
      },
    ],
  });

  // SMA比較
  if (sma7 != null || sma30 != null) {
    bodyContents.push({ type: 'separator', margin: 'md' });
    bodyContents.push({
      type: 'text',
      text: '移動平均',
      size: 'sm',
      weight: 'bold',
      margin: 'md',
      color: '#555555',
    });

    if (sma7 != null) {
      bodyContents.push({
        type: 'box',
        layout: 'horizontal',
        margin: 'sm',
        contents: [
          { type: 'text', text: 'SMA 7日', size: 'xxs', color: '#888888', flex: 2 },
          {
            type: 'text',
            text: sma7.toFixed(2),
            size: 'xxs',
            color: '#333333',
            weight: 'bold',
            flex: 1,
            align: 'end',
          },
        ],
      });
    }
    if (sma30 != null) {
      bodyContents.push({
        type: 'box',
        layout: 'horizontal',
        margin: 'sm',
        contents: [
          { type: 'text', text: 'SMA 30日', size: 'xxs', color: '#888888', flex: 2 },
          {
            type: 'text',
            text: sma30.toFixed(2),
            size: 'xxs',
            color: '#333333',
            weight: 'bold',
            flex: 1,
            align: 'end',
          },
        ],
      });
    }
  }

  // クロスシグナル
  if (recentCrosses.length > 0) {
    bodyContents.push({ type: 'separator', margin: 'md' });
    bodyContents.push({
      type: 'text',
      text: 'シグナル',
      size: 'sm',
      weight: 'bold',
      margin: 'md',
      color: '#555555',
    });
    for (const cross of recentCrosses.slice(-2)) {
      const icon = cross.type === 'golden' ? '🔼' : '🔽';
      const label = cross.type === 'golden' ? 'ゴールデンクロス' : 'デッドクロス';
      bodyContents.push({
        type: 'text',
        text: `${icon} ${cross.date} ${label}`,
        size: 'xxs',
        color: cross.type === 'golden' ? '#4CAF50' : '#E53935',
        margin: 'sm',
      });
    }
  }

  return {
    type: 'bubble',
    header: buildBubbleHeader('トレンド分析', '📈', '#1565C0'),
    body: {
      type: 'box',
      layout: 'vertical',
      paddingAll: '16px',
      spacing: 'sm',
      contents: bodyContents,
    },
  };
}

/** ラウンドパターン分析 Flex Bubble (#558B2F オリーブグリーン) */
export function buildRoundPatternFlexBubble(analysis: RoundAnalysis): object {
  const bodyContents: object[] = [];

  // パターンラベル
  bodyContents.push({
    type: 'box',
    layout: 'horizontal',
    contents: [
      {
        type: 'box',
        layout: 'vertical',
        backgroundColor: analysis.pattern.color,
        cornerRadius: '4px',
        paddingAll: '4px',
        flex: 0,
        contents: [
          {
            type: 'text',
            text: analysis.pattern.label,
            size: 'xs',
            color: '#ffffff',
            weight: 'bold',
          },
        ],
      },
      { type: 'filler' },
    ],
  });

  bodyContents.push({
    type: 'text',
    text: analysis.pattern.description,
    size: 'xxs',
    color: '#555555',
    margin: 'sm',
    wrap: true,
  });

  // 8ラウンド棒グラフ
  bodyContents.push({ type: 'separator', margin: 'md' });
  bodyContents.push({
    type: 'text',
    text: 'ラウンド別平均スコア',
    size: 'sm',
    weight: 'bold',
    margin: 'md',
    color: '#555555',
  });

  const maxAvg = Math.max(...analysis.rounds.map((r) => r.avgScore), 1);
  for (const round of analysis.rounds) {
    const barFlex = Math.max(1, Math.round((round.avgScore / maxAvg) * 8));
    const emptyFlex = Math.max(1, 9 - barFlex);
    const isBest = round.round === analysis.bestRound;
    const isWorst = round.round === analysis.worstRound;
    const barColor = isBest ? '#4CAF50' : isWorst ? '#E53935' : '#558B2F';

    bodyContents.push({
      type: 'box',
      layout: 'horizontal',
      margin: 'sm',
      contents: [
        {
          type: 'text',
          text: `R${round.round}`,
          size: 'xxs',
          color: '#888888',
          flex: 1,
        },
        {
          type: 'box',
          layout: 'horizontal',
          flex: 5,
          contents: [
            {
              type: 'box',
              layout: 'vertical',
              flex: barFlex,
              height: '12px',
              backgroundColor: barColor,
              cornerRadius: '2px',
              contents: [],
            },
            {
              type: 'box',
              layout: 'vertical',
              flex: emptyFlex,
              contents: [],
            },
          ],
        },
        {
          type: 'text',
          text: String(round.avgScore),
          size: 'xxs',
          color: '#333333',
          weight: isBest || isWorst ? 'bold' : 'regular',
          flex: 2,
          align: 'end',
        },
      ],
    });
  }

  // ベスト/ワースト
  bodyContents.push({ type: 'separator', margin: 'md' });
  bodyContents.push({
    type: 'box',
    layout: 'horizontal',
    margin: 'md',
    contents: [
      {
        type: 'text',
        text: `🏆 Best: R${analysis.bestRound}`,
        size: 'xxs',
        color: '#4CAF50',
        flex: 1,
      },
      {
        type: 'text',
        text: `📉 Worst: R${analysis.worstRound}`,
        size: 'xxs',
        color: '#E53935',
        flex: 1,
        align: 'end',
      },
    ],
  });

  return {
    type: 'bubble',
    header: buildBubbleHeader('ラウンドパターン', '📋', '#558B2F'),
    body: {
      type: 'box',
      layout: 'vertical',
      paddingAll: '16px',
      spacing: 'sm',
      contents: bodyContents,
    },
  };
}

/** センサー分析サマリー（ミス方向 + ヒートマップ + ラウンドパターンを1バブルに統合） */
export function buildSensorSummaryFlexBubble(
  missResult: MissDirectionResult | null,
  heatmapData: HeatmapData | null,
  roundAnalysis: RoundAnalysis | null,
): object {
  const bodyContents: object[] = [];

  // ミス方向セクション
  if (missResult) {
    bodyContents.push(
      {
        type: 'text',
        text: 'ミス方向',
        size: 'xs',
        color: '#aaaaaa',
        weight: 'bold',
      },
      {
        type: 'text',
        text: `主傾向: ${missResult.primaryDirection}（強度 ${Math.round(missResult.directionStrength * 100)}%）`,
        size: 'sm',
        color: '#ffffff',
        wrap: true,
      },
    );
  }

  // ヒートマップセクション
  if (heatmapData && heatmapData.totalDarts > 0) {
    const sorted = [...heatmapData.segments.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

    if (sorted.length > 0) {
      if (bodyContents.length > 0) {
        bodyContents.push({ type: 'separator', color: '#444444', margin: 'md' });
      }
      bodyContents.push({
        type: 'text',
        text: 'TOP5セグメント',
        size: 'xs',
        color: '#aaaaaa',
        weight: 'bold',
        margin: 'md',
      });

      const barItems: object[] = sorted.map(([segId, count]) => {
        const pct = Math.round((count / heatmapData.totalDarts) * 100);
        return {
          type: 'box',
          layout: 'horizontal',
          contents: [
            { type: 'text', text: getSegmentLabel(segId), size: 'xxs', color: '#ffffff', flex: 2 },
            {
              type: 'box',
              layout: 'vertical',
              flex: 5,
              contents: [
                {
                  type: 'box',
                  layout: 'vertical',
                  contents: [],
                  backgroundColor: '#7B1FA2',
                  width: `${Math.max(pct, 5)}%`,
                  height: '8px',
                  cornerRadius: '4px',
                },
              ],
              backgroundColor: '#333333',
              height: '8px',
              cornerRadius: '4px',
            },
            {
              type: 'text',
              text: `${pct}%`,
              size: 'xxs',
              color: '#aaaaaa',
              flex: 1,
              align: 'end',
            },
          ],
          spacing: 'sm',
          margin: 'xs',
        };
      });
      bodyContents.push(...barItems);
    }
  }

  // ラウンドパターンセクション
  if (roundAnalysis) {
    if (bodyContents.length > 0) {
      bodyContents.push({ type: 'separator', color: '#444444', margin: 'md' });
    }
    bodyContents.push(
      {
        type: 'text',
        text: 'ラウンドパターン',
        size: 'xs',
        color: '#aaaaaa',
        weight: 'bold',
        margin: 'md',
      },
      {
        type: 'text',
        text: `${roundAnalysis.pattern.label}　Best R${roundAnalysis.bestRound} / Worst R${roundAnalysis.worstRound}`,
        size: 'sm',
        color: '#ffffff',
        wrap: true,
      },
    );
  }

  if (bodyContents.length === 0) {
    bodyContents.push({
      type: 'text',
      text: 'データなし',
      size: 'sm',
      color: '#888888',
    });
  }

  return {
    type: 'bubble',
    header: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: 'センサー分析',
          size: 'sm',
          weight: 'bold',
          color: '#ffffff',
        },
      ],
      backgroundColor: '#7B1FA2',
      paddingAll: '12px',
    },
    body: {
      type: 'box',
      layout: 'vertical',
      backgroundColor: '#1a1a2e',
      paddingAll: '16px',
      spacing: 'sm',
      contents: bodyContents,
    },
  };
}

/** Flex Message からバブル部分を抽出 */
export function extractBubble(flexMessage: object): object | null {
  const msg = flexMessage as Record<string, unknown>;
  if (msg.type === 'bubble') return flexMessage;
  if (msg.type === 'flex') {
    const contents = msg.contents as Record<string, unknown> | undefined;
    if (contents?.type === 'bubble') return contents as object;
  }
  return null;
}

/** 複数バブルをカルーセルFlexメッセージに組み立て */
export function buildDailyCarouselMessage(bubbles: object[], quickReply?: object): object {
  if (bubbles.length === 0) {
    return { type: 'text', text: 'データがありません。' };
  }

  const msg: Record<string, unknown> = {
    type: 'flex',
    altText: 'Darts Lab デイリーレポート',
    contents:
      bubbles.length === 1 ? bubbles[0] : { type: 'carousel', contents: bubbles.slice(0, 12) },
  };

  if (quickReply) msg.quickReply = quickReply;
  return msg;
}
