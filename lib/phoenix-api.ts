/**
 * PHOENIX ダーツ API クライアント（管理者限定）
 *
 * 認証: account-api.phoenixdarts.com → Bearer token
 * トークンブリッジ: /auth/tokens/pxnid → vs.phoenixdarts.com用セッション
 * スタッツ: vs.phoenixdarts.com/jp/mypage_user/myinfo (PXNID cookie)
 */

// ─── 型定義 ──────────────────────────────────

export interface PxLoginResult {
  token: string;
  mainCardCSeq: number;
  mid: string;
  isPayed: boolean;
}

export interface PxStats {
  rating: number | null;
  ppd: number | null;
  mpr: number | null;
  className: string | null;
  countUpAvg: number | null;
}

// ─── 定数 ───────────────────────────────────

const PX_ACCOUNT_API = 'https://account-api.phoenixdarts.com';
const PX_VS_BASE = 'https://vs.phoenixdarts.com';
const PX_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// ─── API関数 ─────────────────────────────────

/**
 * PHOENIX ログイン → Bearer token + ユーザー情報取得
 */
export async function pxLogin(email: string, password: string): Promise<PxLoginResult> {
  const res = await fetch(`${PX_ACCOUNT_API}/members/sign-in`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': PX_USER_AGENT,
    },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const bodyText = await res.text().catch(() => '');
    throw new Error(
      `PX_LOGIN_FAILED: ${res.status} ${res.statusText} — ${bodyText.slice(0, 200)}`,
    );
  }

  const data = (await res.json()) as Record<string, unknown>;

  // トークン取得
  const token = (data.token ?? data.accessToken ?? '') as string;
  if (!token) {
    throw new Error('PX_LOGIN_FAILED: トークンが取得できません');
  }

  // ユーザー情報抽出
  const member = (data.member ?? data.user ?? data) as Record<string, unknown>;
  const cards = (member.cards ?? []) as Array<Record<string, unknown>>;
  const mainCard = cards.find((c) => c.isMain || c.is_main) ?? cards[0];
  const mainCardCSeq = Number(mainCard?.cSeq ?? mainCard?.c_seq ?? mainCard?.cardSeq ?? 0);
  const mid = String(member.mid ?? member.id ?? '');
  const isPayed = Boolean(member.isPayed ?? member.is_payed ?? member.isPaid ?? false);

  return { token, mainCardCSeq, mid, isPayed };
}

/**
 * トークンブリッジ: Bearer token → PXNID セッションCookie取得
 */
async function pxGetSessionCookie(token: string): Promise<string> {
  const res = await fetch(`${PX_VS_BASE}/auth/tokens/pxnid`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': PX_USER_AGENT,
    },
    redirect: 'manual',
  });

  // Set-Cookie ヘッダーから PXNID を抽出
  const setCookies = res.headers.getSetCookie?.() ?? [];
  for (const cookie of setCookies) {
    const match = cookie.match(/PXNID=([^;]+)/);
    if (match) return match[1];
  }

  // レスポンスボディにトークンが含まれる場合
  if (res.ok || res.status === 200 || res.status === 201) {
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    const pxnid = (data.pxnid ?? data.token ?? data.session ?? '') as string;
    if (pxnid) return pxnid;
  }

  throw new Error(`PX_SESSION_FAILED: PXNIDセッションが取得できません (${res.status})`);
}

/**
 * PHOENIXスタッツ取得 — マイページHTMLをパースして抽出
 */
export async function pxFetchStats(token: string, _cSeq: number): Promise<PxStats> {
  // Step 1: トークンブリッジでPXNIDセッション取得
  const pxnid = await pxGetSessionCookie(token);

  // Step 2: マイページHTML取得
  const res = await fetch(`${PX_VS_BASE}/jp/mypage_user/myinfo/page/1`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Cookie: `PXNID=${pxnid}`,
      'User-Agent': PX_USER_AGENT,
    },
  });

  if (!res.ok) {
    throw new Error(`PX_STATS_FAILED: スタッツ取得エラー (${res.status})`);
  }

  const html = await res.text();

  // Step 3: HTMLからスタッツを抽出
  return parseStatsHtml(html);
}

/**
 * PHOENIXマイページHTMLからスタッツを正規表現で抽出
 */
function parseStatsHtml(html: string): PxStats {
  const extractValue = (id: string): string | null => {
    // パターン1: id="sc_rating" 等の要素内テキスト
    const pattern1 = new RegExp(`id=["']${id}["'][^>]*>([^<]+)<`, 'i');
    const m1 = html.match(pattern1);
    if (m1) return m1[1].trim();

    // パターン2: class="sc_rating" 等
    const pattern2 = new RegExp(`class=["'][^"']*${id}[^"']*["'][^>]*>([^<]+)<`, 'i');
    const m2 = html.match(pattern2);
    if (m2) return m2[1].trim();

    return null;
  };

  const parseNum = (val: string | null): number | null => {
    if (!val) return null;
    const cleaned = val.replace(/[^\d.]/g, '');
    const n = parseFloat(cleaned);
    return isNaN(n) ? null : n;
  };

  const rating = parseNum(extractValue('sc_rating'));
  const ppd = parseNum(extractValue('sc_ppd'));
  const mpr = parseNum(extractValue('sc_mpr'));
  const className = extractValue('sc_class');
  const countUpAvg = parseNum(extractValue('sc_countup'));

  console.log(`[PX-API] パース結果: rating=${rating}, ppd=${ppd}, mpr=${mpr}, class=${className}`);

  return { rating, ppd, mpr, className, countUpAvg };
}

/**
 * 統合関数: ログイン → スタッツ取得
 */
export async function pxSync(
  email: string,
  password: string,
): Promise<PxStats & { isPayed: boolean }> {
  console.log('[PX-API] ログイン中...');
  const { token, mainCardCSeq, isPayed } = await pxLogin(email, password);
  console.log(`[PX-API] ログイン成功 (cSeq=${mainCardCSeq}, isPayed=${isPayed})`);

  console.log('[PX-API] スタッツ取得中...');
  const stats = await pxFetchStats(token, mainCardCSeq);
  console.log('[PX-API] スタッツ取得完了');

  return { ...stats, isPayed };
}
