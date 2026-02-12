import { createHmac } from 'crypto';

const LINE_API_BASE = 'https://api.line.me/v2/bot';

/** LINE Webhook 署名検証 (HMAC-SHA256) */
export function validateLineSignature(body: string, signature: string): boolean {
  const secret = process.env.LINE_CHANNEL_SECRET;
  if (!secret) return false;
  const hash = createHmac('sha256', secret).update(body).digest('base64');
  return hash === signature;
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
export async function replyLineMessage(
  replyToken: string,
  messages: object[],
): Promise<void> {
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

/** スタッツ通知用 Flex Message + Quick Reply (★1〜★5) */
export function buildStatsFlexMessage(stats: {
  date: string;
  rating: number | null;
  ppd: number | null;
  mpr: number | null;
  gamesPlayed?: number | null;
}): object {
  const ratingStr = stats.rating?.toFixed(2) ?? '--';
  const ppdStr = stats.ppd?.toFixed(2) ?? '--';
  const mprStr = stats.mpr?.toFixed(2) ?? '--';

  return {
    type: 'flex',
    altText: `昨日のリザルト: Rt.${ratingStr} / PPD ${ppdStr} / MPR ${mprStr}`,
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
            text: '🎯 Darts Lab',
            color: '#ffffff',
            size: 'sm',
            weight: 'bold',
          },
          {
            type: 'text',
            text: '昨日のリザルト',
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
                  { type: 'text', text: ratingStr, size: 'xl', weight: 'bold' },
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

/** 完了通知メッセージ */
export function buildCompletionMessage(stats: {
  rating: number | null;
  ppd: number | null;
  condition: number;
  memo: string;
}): object {
  const condLabel = getConditionLabel(stats.condition);
  const ratingStr = stats.rating?.toFixed(2) ?? '--';
  const ppdStr = stats.ppd?.toFixed(2) ?? '--';
  const memoStr = stats.memo || 'なし';

  return {
    type: 'text',
    text: `記録しました！\nRt.${ratingStr} / PPD ${ppdStr} / ★${stats.condition} ${condLabel}\nメモ: ${memoStr}`,
  };
}
