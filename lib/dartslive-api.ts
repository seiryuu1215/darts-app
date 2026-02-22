/**
 * DARTSLIVE モバイルアプリ REST API クライアント（管理者限定）
 *
 * APKデコンパイルで発見したエンドポイントを使用。
 * ウェブスクレイピングより遥かにリッチなデータを取得可能。
 */

import type { ScrapedStats } from './dartslive-scraper';

// ─── 定数 ───────────────────────────────────
const DL_API_BASE = 'https://dlapp.dartslive.com/dataapi/action.jsp';
const DL_USER_AGENT = 'Umineko';
const DL_BASIC_AUTH = 'Basic ZGFydHMtZGV2LWZ0cDpXTHNrNHF6NFh1eXo=';

// ─── 型定義 ──────────────────────────────────

export interface DlApiCard {
  toId: string;
  cardId: string;
  cardName: string;
  kind: number; // 1=メインカード
}

export interface DlApiLoginResult {
  authKey: string;
  cards: DlApiCard[];
}

export interface DlApiUserData {
  rating: number | null;
  maxRating: number | null;
  maxRatingDate: string | null;
  stats01Avg: number | null;
  stats01Best: number | null;
  stats01WinRate: number | null;
  stats01BullRate: number | null;
  stats01ArrangeRate: number | null;
  stats01AvgBust: number | null;
  statsCriAvg: number | null;
  statsCriBest: number | null;
  statsCriWinRate: number | null;
  statsCriTripleRate: number | null;
  statsCriOpenCloseRate: number | null;
  stats01Avg100: number | null;
  statsCriAvg100: number | null;
}

export interface DlApiAward {
  awardId: string;
  awardName: string;
  monthly: number;
  total: number;
}

export interface DlApiMonthlyAward {
  date: string;
  awards: Record<string, number>;
}

export interface DlApiBestRecord {
  gameId: string;
  gameName: string;
  bestScore: number;
  bestDate: string | null;
}

export interface DlApiGameAverage {
  gameId: string;
  gameName: string;
  average: number;
  playCount: number;
}

export interface DlApiBundleData {
  userData: DlApiUserData;
  totalAward: Record<string, { monthly: number; total: number }>;
  awardList: DlApiMonthlyAward[];
  bestRecords: DlApiBestRecord[];
  dartoutList: { score: number; count: number }[];
  gameList: { gameId: string; gameName: string }[];
  gameAverages: DlApiGameAverage[];
  myDartsInfo: Record<string, unknown> | null;
}

export interface DlApiDailyStats {
  date: string;
  rating: number | null;
  stats01Avg: number | null;
  statsCriAvg: number | null;
  stats01Avg100: number | null;
  statsCriAvg100: number | null;
}

export interface DlApiMonthlyStats {
  month: string;
  rating: number | null;
  stats01Avg: number | null;
  statsCriAvg: number | null;
}

export interface DlApiPlayEntry {
  date: string;
  gameId: string;
  gameName: string;
  score: number | null;
  playLog: unknown[] | null;
  sensorData: unknown | null;
  awards: string[];
}

export interface DlApiFullSyncResult {
  bundle: DlApiBundleData;
  dailyHistory: DlApiDailyStats[];
  monthlyHistory: DlApiMonthlyStats[];
  recentPlays: DlApiPlayEntry[];
}

// ─── 内部ヘルパー ────────────────────────────

interface DlApiParams {
  [key: string]: string | number | undefined;
}

async function dlApiPost(params: DlApiParams): Promise<Record<string, unknown>> {
  const body = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) body.append(k, String(v));
  }

  const res = await fetch(DL_API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': DL_USER_AGENT,
      Authorization: DL_BASIC_AUTH,
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const actionType = params.ACTION_TYPE ?? 'unknown';
    const bodyText = await res.text().catch(() => '');
    throw new Error(
      `DARTSLIVE API error: ${actionType} ${res.status} ${res.statusText} — ${bodyText.slice(0, 200)}`,
    );
  }

  return res.json() as Promise<Record<string, unknown>>;
}

// ─── API関数 ─────────────────────────────────

/**
 * DARTSLIVE API ログイン (WAPI-0016 → WAPI-0017)
 * メインカード(KIND=1)のTO_IDを返す
 */
export async function dlApiLogin(email: string, password: string): Promise<DlApiLoginResult> {
  // Step 1: WAPI-0016 (メール認証)
  const authRes = await dlApiPost({
    ACTION_TYPE: 'WAPI-0016',
    MAIL: email,
    PASS: password,
  });

  const authKey = (authRes.AUTH_KEY ?? authRes.authKey ?? '') as string;
  if (!authKey) {
    throw new Error('LOGIN_FAILED: 認証キーが取得できません');
  }

  // Step 2: WAPI-0017 (カード一覧取得)
  const cardRes = await dlApiPost({
    ACTION_TYPE: 'WAPI-0017',
    AUTH_KEY: authKey,
  });

  const rawCards = (cardRes.CARD_LIST ?? cardRes.cardList ?? []) as Array<Record<string, unknown>>;
  const cards: DlApiCard[] = rawCards.map((c) => ({
    toId: String(c.TO_ID ?? c.toId ?? ''),
    cardId: String(c.CARD_ID ?? c.cardId ?? ''),
    cardName: String(c.CARD_NAME ?? c.cardName ?? ''),
    kind: Number(c.KIND ?? c.kind ?? 0),
  }));

  return { authKey, cards };
}

/**
 * バンドルデータ取得 (WAPI-0003)
 */
export async function dlApiFetchBundle(authKey: string, toId: string): Promise<DlApiBundleData> {
  const res = await dlApiPost({
    ACTION_TYPE: 'WAPI-0003',
    AUTH_KEY: authKey,
    TO_ID: toId,
    KIND: 'totalAward,awardList,userData,bestRecordList,dartoutList,gameList,myDartsInfo',
  });

  // userData パース
  const rawUser = (res.USER_DATA ?? res.userData ?? {}) as Record<string, unknown>;
  const userData: DlApiUserData = {
    rating: parseNum(rawUser.RATING ?? rawUser.rating),
    maxRating: parseNum(rawUser.MAX_RATING ?? rawUser.maxRating),
    maxRatingDate: parseStr(rawUser.MAX_RATING_DATE ?? rawUser.maxRatingDate),
    stats01Avg: parseNum(rawUser.STATS_01_AVG ?? rawUser.stats01Avg),
    stats01Best: parseNum(rawUser.STATS_01_BEST ?? rawUser.stats01Best),
    stats01WinRate: parseNum(rawUser.STATS_01_WIN_RATE ?? rawUser.stats01WinRate),
    stats01BullRate: parseNum(rawUser.STATS_01_BULL_RATE ?? rawUser.stats01BullRate),
    stats01ArrangeRate: parseNum(rawUser.STATS_01_ARRANGE_RATE ?? rawUser.stats01ArrangeRate),
    stats01AvgBust: parseNum(rawUser.STATS_01_AVG_BUST ?? rawUser.stats01AvgBust),
    statsCriAvg: parseNum(rawUser.STATS_CRI_AVG ?? rawUser.statsCriAvg),
    statsCriBest: parseNum(rawUser.STATS_CRI_BEST ?? rawUser.statsCriBest),
    statsCriWinRate: parseNum(rawUser.STATS_CRI_WIN_RATE ?? rawUser.statsCriWinRate),
    statsCriTripleRate: parseNum(rawUser.STATS_CRI_TRIPLE_RATE ?? rawUser.statsCriTripleRate),
    statsCriOpenCloseRate: parseNum(
      rawUser.STATS_CRI_OPEN_CLOSE_RATE ?? rawUser.statsCriOpenCloseRate,
    ),
    stats01Avg100: parseNum(rawUser.STATS_01_AVG_100 ?? rawUser.stats01Avg100),
    statsCriAvg100: parseNum(rawUser.STATS_CRI_AVG_100 ?? rawUser.statsCriAvg100),
  };

  // totalAward パース
  const rawAwards = (res.TOTAL_AWARD ?? res.totalAward ?? {}) as Record<
    string,
    Record<string, unknown>
  >;
  const totalAward: Record<string, { monthly: number; total: number }> = {};
  for (const [name, val] of Object.entries(rawAwards)) {
    totalAward[name] = {
      monthly: Number(val.MONTHLY ?? val.monthly ?? 0),
      total: Number(val.TOTAL ?? val.total ?? 0),
    };
  }

  // awardList パース
  const rawAwardList = (res.AWARD_LIST ?? res.awardList ?? []) as Array<Record<string, unknown>>;
  const awardList: DlApiMonthlyAward[] = rawAwardList.map((a) => ({
    date: String(a.DATE ?? a.date ?? ''),
    awards: Object.fromEntries(
      Object.entries(a)
        .filter(([k]) => k !== 'DATE' && k !== 'date')
        .map(([k, v]) => [k, Number(v ?? 0)]),
    ),
  }));

  // bestRecords パース
  const rawBest = (res.BEST_RECORD_LIST ?? res.bestRecordList ?? []) as Array<
    Record<string, unknown>
  >;
  const bestRecords: DlApiBestRecord[] = rawBest.map((b) => ({
    gameId: String(b.GAME_ID ?? b.gameId ?? ''),
    gameName: String(b.GAME_NAME ?? b.gameName ?? ''),
    bestScore: Number(b.BEST_SCORE ?? b.bestScore ?? 0),
    bestDate: parseStr(b.BEST_DATE ?? b.bestDate),
  }));

  // dartoutList パース
  const rawDartout = (res.DARTOUT_LIST ?? res.dartoutList ?? []) as Array<Record<string, unknown>>;
  const dartoutList = rawDartout.map((d) => ({
    score: Number(d.SCORE ?? d.score ?? 0),
    count: Number(d.COUNT ?? d.count ?? 0),
  }));

  // gameList パース
  const rawGames = (res.GAME_LIST ?? res.gameList ?? []) as Array<Record<string, unknown>>;
  const gameList = rawGames.map((g) => ({
    gameId: String(g.GAME_ID ?? g.gameId ?? ''),
    gameName: String(g.GAME_NAME ?? g.gameName ?? ''),
  }));

  // gameAverages パース（gameList内に平均が含まれる場合）
  const gameAverages: DlApiGameAverage[] = rawGames
    .filter((g) => g.AVERAGE != null || g.average != null)
    .map((g) => ({
      gameId: String(g.GAME_ID ?? g.gameId ?? ''),
      gameName: String(g.GAME_NAME ?? g.gameName ?? ''),
      average: Number(g.AVERAGE ?? g.average ?? 0),
      playCount: Number(g.PLAY_COUNT ?? g.playCount ?? 0),
    }));

  // myDartsInfo パース
  const myDartsInfo = (res.MY_DARTS_INFO ?? res.myDartsInfo ?? null) as Record<
    string,
    unknown
  > | null;

  return {
    userData,
    totalAward,
    awardList,
    bestRecords,
    dartoutList,
    gameList,
    gameAverages,
    myDartsInfo,
  };
}

/**
 * 日別スタッツ履歴取得 (WAPI-0006)、自動ページネーション
 */
export async function dlApiFetchDailyHistory(
  authKey: string,
  toId: string,
): Promise<DlApiDailyStats[]> {
  const all: DlApiDailyStats[] = [];
  let page = 1;
  const pageSize = 300;

  while (true) {
    const res = await dlApiPost({
      ACTION_TYPE: 'WAPI-0006',
      AUTH_KEY: authKey,
      TO_ID: toId,
      PAGE: page,
      PAGE_SIZE: pageSize,
    });

    const rawList = (res.STATS_LIST ?? res.statsList ?? []) as Array<Record<string, unknown>>;
    if (rawList.length === 0) break;

    for (const r of rawList) {
      all.push({
        date: String(r.DATE ?? r.date ?? ''),
        rating: parseNum(r.RATING ?? r.rating),
        stats01Avg: parseNum(r.STATS_01_AVG ?? r.stats01Avg),
        statsCriAvg: parseNum(r.STATS_CRI_AVG ?? r.statsCriAvg),
        stats01Avg100: parseNum(r.STATS_01_AVG_100 ?? r.stats01Avg100),
        statsCriAvg100: parseNum(r.STATS_CRI_AVG_100 ?? r.statsCriAvg100),
      });
    }

    if (rawList.length < pageSize) break;
    page++;
  }

  return all;
}

/**
 * 月別スタッツ履歴取得 (WAPI-0007)
 */
export async function dlApiFetchMonthlyHistory(
  authKey: string,
  toId: string,
): Promise<DlApiMonthlyStats[]> {
  const res = await dlApiPost({
    ACTION_TYPE: 'WAPI-0007',
    AUTH_KEY: authKey,
    TO_ID: toId,
  });

  const rawList = (res.STATS_LIST ?? res.statsList ?? []) as Array<Record<string, unknown>>;
  return rawList.map((r) => ({
    month: String(r.MONTH ?? r.month ?? ''),
    rating: parseNum(r.RATING ?? r.rating),
    stats01Avg: parseNum(r.STATS_01_AVG ?? r.stats01Avg),
    statsCriAvg: parseNum(r.STATS_CRI_AVG ?? r.statsCriAvg),
  }));
}

/**
 * プレイ履歴取得 (WAPI-0005)、ページネーション
 */
export async function dlApiFetchPlayHistory(
  authKey: string,
  toId: string,
  maxPages: number = 3,
): Promise<DlApiPlayEntry[]> {
  const all: DlApiPlayEntry[] = [];
  const pageSize = 200;

  for (let page = 1; page <= maxPages; page++) {
    const res = await dlApiPost({
      ACTION_TYPE: 'WAPI-0005',
      AUTH_KEY: authKey,
      TO_ID: toId,
      PAGE: page,
      PAGE_SIZE: pageSize,
    });

    const rawList = (res.PLAY_LIST ?? res.playList ?? []) as Array<Record<string, unknown>>;
    if (rawList.length === 0) break;

    for (const r of rawList) {
      const rawAwards = (r.AWARDS ?? r.awards ?? []) as string[];
      all.push({
        date: String(r.DATE ?? r.date ?? ''),
        gameId: String(r.GAME_ID ?? r.gameId ?? ''),
        gameName: String(r.GAME_NAME ?? r.gameName ?? ''),
        score: parseNum(r.SCORE ?? r.score),
        playLog: (r.PLAY_LOG ?? r.playLog ?? null) as unknown[] | null,
        sensorData: r.SENSOR_DATA ?? r.sensorData ?? null,
        awards: rawAwards,
      });
    }

    if (rawList.length < pageSize) break;
  }

  return all;
}

/**
 * フル同期: login → bundle + dailyHistory + monthlyHistory + plays を並列取得
 */
export async function dlApiFullSync(email: string, password: string): Promise<DlApiFullSyncResult> {
  const { authKey, cards } = await dlApiLogin(email, password);

  // メインカード (KIND=1) を探す
  const mainCard = cards.find((c) => c.kind === 1) ?? cards[0];
  if (!mainCard) {
    throw new Error('NO_CARDS: カードが見つかりません');
  }
  const toId = mainCard.toId;

  // 並列取得（個別ステップ名付きエラーハンドリング）
  const wrap = <T>(label: string, fn: Promise<T>): Promise<T> =>
    fn.catch((err) => {
      throw new Error(`${label}: ${err instanceof Error ? err.message : String(err)}`);
    });

  const [bundle, dailyHistory, monthlyHistory, recentPlays] = await Promise.all([
    wrap('bundle', dlApiFetchBundle(authKey, toId)),
    wrap('dailyHistory', dlApiFetchDailyHistory(authKey, toId)),
    wrap('monthlyHistory', dlApiFetchMonthlyHistory(authKey, toId)),
    wrap('playHistory', dlApiFetchPlayHistory(authKey, toId)),
  ]);

  return { bundle, dailyHistory, monthlyHistory, recentPlays };
}

/**
 * APIの結果を既存の ScrapedStats 形式に変換するヘルパー
 */
export function mapApiToScrapedStats(result: DlApiFullSyncResult): ScrapedStats {
  const { userData, totalAward } = result.bundle;

  const getAward = (name: string) => totalAward[name] ?? { monthly: 0, total: 0 };

  return {
    rating: userData.rating,
    ratingInt: userData.rating != null ? Math.floor(userData.rating) : null,
    stats01Avg: userData.stats01Avg,
    statsCriAvg: userData.statsCriAvg,
    dBullTotal: getAward('DOUBLE_BULL').total || getAward('D-BULL').total,
    sBullTotal: getAward('SINGLE_BULL').total || getAward('S-BULL').total,
    dBullMonthly: getAward('DOUBLE_BULL').monthly || getAward('D-BULL').monthly,
    sBullMonthly: getAward('SINGLE_BULL').monthly || getAward('S-BULL').monthly,
    hatTricksTotal: getAward('HAT_TRICK').total || getAward('HAT TRICK').total,
    hatTricksMonthly: getAward('HAT_TRICK').monthly || getAward('HAT TRICK').monthly,
    ton80: getAward('TON_80').total || getAward('TON 80').total,
    lowTon: getAward('LOW_TON').total || getAward('LOW TON').total,
    lowTonMonthly: getAward('LOW_TON').monthly || getAward('LOW TON').monthly,
    highTon: getAward('HIGH_TON').total || getAward('HIGH TON').total,
    threeInABed: getAward('THREE_IN_A_BED').total || getAward('3 IN A BED').total,
    threeInABlack: getAward('THREE_IN_THE_BLACK').total || getAward('3 - BLACK').total,
    whiteHorse: getAward('WHITE_HORSE').total || getAward('WHITE HRS').total,
  };
}

// ─── ユーティリティ ──────────────────────────

function parseNum(val: unknown): number | null {
  if (val == null || val === '') return null;
  const n = Number(val);
  return isNaN(n) ? null : n;
}

function parseStr(val: unknown): string | null {
  if (val == null || val === '') return null;
  return String(val);
}
