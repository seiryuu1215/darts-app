import { createHmac, timingSafeEqual } from 'crypto';

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

  const res = await fetch(`${LINE_API_BASE}/message/push`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ to: lineUserId, messages }),
  });
  return res.ok;
}

/** Reply メッセージ送信 */
export async function replyLineMessage(replyToken: string, messages: object[]): Promise<void> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) return;

  await fetch(`${LINE_API_BASE}/message/reply`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ replyToken, messages }),
  });
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

  // Awards 差分セクション構築
  const awardsContents: object[] = [];
  if (stats.awards) {
    const a = stats.awards;
    const pa = stats.prevAwards ?? {};

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

    // 差分計算: prevAwards がある場合は diff のみ、ない場合は累計値を表示
    const hasPrev = stats.prevAwards != null;
    const awardItems = awardDefs
      .map((def) => {
        const current = a[def.key] ?? 0;
        const prev = pa[def.key] ?? 0;
        const value = hasPrev ? current - prev : current;
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
                text: hasPrev ? `+${left.value}` : String(left.value),
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
                text: hasPrev ? `+${right.value}` : String(right.value),
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
    quickReply: {
      items: [1, 2, 3, 4, 5].map((n) => ({
        type: 'action',
        action: {
          type: 'message',
          label: `★${n}`,
          text: `★${n}`,
        },
      })),
    },
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
