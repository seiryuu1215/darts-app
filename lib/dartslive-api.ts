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
const DL_DEVICE_ID = 'darts-app-server';
const DL_APP_VERSION = '3.5.2';

// COUNT-UP GAME_ID
const GAME_ID_COUNTUP = 3001;

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
  gameId: number;
  gameName: string;
  score: number | null;
  playLog: string | null;
  dl3Info: {
    vectorX: number;
    vectorY: number;
    radius: number;
    speed: number;
  } | null;
  awards: string[];
}

/** COUNT-UP専用の軽量プレイデータ（Firestoreに保存用） */
export interface CountUpPlayData {
  time: string;
  score: number;
  playLog: string;
  dl3VectorX: number;
  dl3VectorY: number;
  dl3Radius: number;
  dl3Speed: number;
}

export interface DlApiFullSyncResult {
  bundle: DlApiBundleData;
  dailyHistory: DlApiDailyStats[];
  monthlyHistory: DlApiMonthlyStats[];
  recentPlays: DlApiPlayEntry[];
  countupPlays: CountUpPlayData[];
}

// ─── 内部ヘルパー ────────────────────────────

interface DlApiRequestConfig {
  actionId: string;
  queryParams?: Record<string, string>;
  bodyParams?: Record<string, string>;
}

async function dlApiRequest(config: DlApiRequestConfig): Promise<Record<string, unknown>> {
  const url = new URL(DL_API_BASE);
  url.searchParams.set('actionid', config.actionId);
  url.searchParams.set('phonekind', '2');
  url.searchParams.set('appversion', DL_APP_VERSION);
  url.searchParams.set('phoneid', DL_DEVICE_ID);
  if (config.queryParams) {
    for (const [k, v] of Object.entries(config.queryParams)) {
      url.searchParams.set(k, v);
    }
  }

  const body = new URLSearchParams();
  if (config.bodyParams) {
    for (const [k, v] of Object.entries(config.bodyParams)) {
      body.append(k, v);
    }
  }

  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': DL_USER_AGENT,
      Authorization: DL_BASIC_AUTH,
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const bodyText = await res.text().catch(() => '');
    throw new Error(
      `DARTSLIVE API error: ${config.actionId} ${res.status} ${res.statusText} — ${bodyText.slice(0, 200)}`,
    );
  }

  return res.json() as Promise<Record<string, unknown>>;
}

// ─── ゲーム名マッピング ──────────────────────

const GAME_NAME_MAP: Record<number, string> = {
  1001: '301',
  1002: '501',
  1003: '701',
  1004: '901',
  1005: '1001',
  1006: '1101',
  2001: 'CRICKET',
  2003: 'CUT THROAT',
  3001: 'COUNT-UP',
  3002: 'SHOOT OUT',
  3007: 'SKILL CHECK',
  3012: "EAGLE'S EYE",
  3036: 'BULL SHOOTER',
  4010: 'BIG BULL',
  4022: 'HALF-IT',
  4033: 'SHANGHAI',
  4042: 'LUCKY BALLOON',
  4131: 'OISHII',
  7001: 'MEDLEY',
  7002: 'GLOBAL MATCH',
};

function getGameName(gameId: number): string {
  return GAME_NAME_MAP[gameId] ?? `GAME-${gameId}`;
}

// ─── API関数 ─────────────────────────────────

/**
 * DARTSLIVE API ログイン (WAPI-0016 → WAPI-0017)
 * メインカード(KIND=1)のTO_IDを返す
 */
export async function dlApiLogin(email: string, password: string): Promise<DlApiLoginResult> {
  // Step 1: WAPI-0016 (メール認証)
  const authRes = await dlApiRequest({
    actionId: 'WAPI-0016',
    queryParams: { authkey: '', locale: 'JP' },
    bodyParams: { loginid: email, pa: password, encryptpassword: '' },
  });

  const authKey = (authRes.AUTH_KEY ?? '') as string;
  if (!authKey) {
    throw new Error('LOGIN_FAILED: 認証キーが取得できません');
  }

  // Step 2: WAPI-0017 (カード一覧取得)
  const cardRes = await dlApiRequest({
    actionId: 'WAPI-0017',
    queryParams: { authkey: authKey },
  });

  const rawCards = (cardRes.CARD_DATA_LIST ?? cardRes.CARD_LIST ?? []) as Array<
    Record<string, unknown>
  >;
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
  const res = await dlApiRequest({
    actionId: 'WAPI-0003',
    queryParams: {
      apikey: '',
      kind: 'totalAward,awardList,userData,bestRecordList,dartoutList,gameList,myDartsInfo',
      targetcardid: toId,
      authkey: authKey,
      ti: toId,
    },
  });

  // userData パース
  const rawUser = (res.USER_DATA ?? {}) as Record<string, unknown>;
  // ZERO_ONE / CRICKET オブジェクトも展開
  const zeroOne = (rawUser.ZERO_ONE ?? {}) as Record<string, unknown>;
  const cricket = (rawUser.CRICKET ?? {}) as Record<string, unknown>;

  const userData: DlApiUserData = {
    rating: parseNum(rawUser.RATING),
    maxRating: parseNum(rawUser.MAX_RATING),
    maxRatingDate: parseStr(rawUser.MAX_RATING_DATE),
    stats01Avg: parseNum(rawUser.STATS_01 ?? rawUser.BASE_STATS_01),
    stats01Best: parseNum(rawUser.STATS_01_BEST),
    stats01WinRate: parseNum(zeroOne.WIN_RATE_01),
    stats01BullRate: parseNum(zeroOne.BULL_RATE_01),
    stats01ArrangeRate: parseNum(zeroOne.ARRANGE_SKILL),
    stats01AvgBust: parseNum(zeroOne.BUST_AVG),
    statsCriAvg: parseNum(rawUser.STATS_CRICKET ?? rawUser.BASE_STATS_CRICKET),
    statsCriBest: parseNum(rawUser.STATS_CRI_BEST),
    statsCriWinRate: parseNum(cricket.WIN_RATE_CRICKET),
    statsCriTripleRate: parseNum(cricket.TRIPLE_RATE_CRICKET),
    statsCriOpenCloseRate: parseNum(cricket.OPEN_RATE),
    stats01Avg100: parseNum(rawUser.STATS_100P_01),
    statsCriAvg100: parseNum(rawUser.STATS_100P_CRICKET),
  };

  // totalAward パース
  const rawAwards = (res.TOTAL_AWARD ?? {}) as Record<string, Record<string, unknown>>;
  const totalAward: Record<string, { monthly: number; total: number }> = {};
  for (const [name, val] of Object.entries(rawAwards)) {
    totalAward[name] = {
      monthly: Number(val.MONTHLY ?? val.monthly ?? 0),
      total: Number(val.TOTAL ?? val.total ?? 0),
    };
  }

  // awardList パース
  const rawAwardList = (res.AWARD_LIST ?? []) as Array<Record<string, unknown>>;
  const awardList: DlApiMonthlyAward[] = rawAwardList.map((a) => ({
    date: String(a.DATE ?? ''),
    awards: Object.fromEntries(
      Object.entries(a)
        .filter(([k]) => k !== 'DATE')
        .map(([k, v]) => [k, Number(v ?? 0)]),
    ),
  }));

  // bestRecords パース
  const rawBest = (res.BEST_RECORD_LIST ?? []) as Array<Record<string, unknown>>;
  const bestRecords: DlApiBestRecord[] = rawBest.map((b) => ({
    gameId: String(b.GAME_ID ?? ''),
    gameName: String(b.GAME_NAME ?? getGameName(Number(b.GAME_ID ?? 0))),
    bestScore: Number(b.BEST_SCORE ?? 0),
    bestDate: parseStr(b.BEST_DATE),
  }));

  // dartoutList パース
  const rawDartout = (res.DART_OUT_LIST ?? res.DARTOUT_LIST ?? []) as Array<
    Record<string, unknown>
  >;
  const dartoutList = rawDartout.map((d) => ({
    score: Number(d.SCORE ?? 0),
    count: Number(d.COUNT ?? 0),
  }));

  // gameList パース
  const rawGames = (res.GAME_LIST ?? []) as Array<Record<string, unknown>>;
  const gameList = rawGames.map((g) => ({
    gameId: String(g.GAME_ID ?? ''),
    gameName: String(g.GAME_NAME ?? getGameName(Number(g.GAME_ID ?? 0))),
  }));

  // gameAverages パース
  const gameAverages: DlApiGameAverage[] = rawGames
    .filter((g) => g.AVERAGE != null)
    .map((g) => ({
      gameId: String(g.GAME_ID ?? ''),
      gameName: String(g.GAME_NAME ?? getGameName(Number(g.GAME_ID ?? 0))),
      average: Number(g.AVERAGE ?? 0),
      playCount: Number(g.PLAY_COUNT ?? 0),
    }));

  // myDartsInfo パース
  const myDartsInfo = (res.MY_DARTS_INFO ?? null) as Record<string, unknown> | null;

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
 * 日別スタッツ履歴取得 (WAPI-0006)、ldt ページネーション
 */
export async function dlApiFetchDailyHistory(
  authKey: string,
  toId: string,
): Promise<DlApiDailyStats[]> {
  const all: DlApiDailyStats[] = [];
  let ldt = '2020-01-01_00:00:00';

  while (true) {
    const res = await dlApiRequest({
      actionId: 'WAPI-0006',
      queryParams: {
        apikey: '',
        ldt,
        targetcardid: toId,
        authkey: authKey,
        ti: toId,
      },
    });

    const rawList = (res.STATS_LIST ?? []) as Array<Record<string, unknown>>;
    if (rawList.length === 0) break;

    for (const r of rawList) {
      all.push({
        date: String(r.DATE ?? ''),
        rating: parseNum(r.RATING),
        stats01Avg: parseNum(r.STATS_01 ?? r.STATS_01_AVG),
        statsCriAvg: parseNum(r.STATS_CRICKET ?? r.STATS_CRI_AVG),
        stats01Avg100: parseNum(r.STATS_01_100 ?? r.STATS_100P_01),
        statsCriAvg100: parseNum(r.STATS_CRICKET_100 ?? r.STATS_100P_CRICKET),
      });
    }

    // ldt ページネーション: 最後の DATE を次のリクエストに
    const lastDate = String(rawList[rawList.length - 1].DATE ?? '');
    if (!lastDate || rawList.length < 300) break;
    ldt = lastDate.replace(' ', '_');
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
  const res = await dlApiRequest({
    actionId: 'WAPI-0007',
    queryParams: {
      apikey: '',
      ldt: '2020-01-01_00:00:00',
      targetcardid: toId,
      authkey: authKey,
      ti: toId,
    },
  });

  const rawList = (res.STATS_LIST ?? []) as Array<Record<string, unknown>>;
  return rawList.map((r) => ({
    month: String(r.MONTH ?? r.DATE ?? ''),
    rating: parseNum(r.RATING),
    stats01Avg: parseNum(r.STATS_01 ?? r.STATS_01_AVG),
    statsCriAvg: parseNum(r.STATS_CRICKET ?? r.STATS_CRI_AVG),
  }));
}

/**
 * プレイ履歴取得 (WAPI-0005)、ldt ページネーション（全件取得）
 */
export async function dlApiFetchPlayHistory(
  authKey: string,
  toId: string,
  maxPages: number = 50,
): Promise<DlApiPlayEntry[]> {
  const all: DlApiPlayEntry[] = [];
  let ldt = '2020-01-01_00:00:00';

  for (let page = 0; page < maxPages; page++) {
    const res = await dlApiRequest({
      actionId: 'WAPI-0005',
      queryParams: {
        apikey: '',
        ldt,
        targetcardid: toId,
        authkey: authKey,
        ti: toId,
      },
    });

    const rawList = (res.PLAY_DATA_LIST ?? res.PLAY_LIST ?? []) as Array<Record<string, unknown>>;
    if (rawList.length === 0) break;

    for (const r of rawList) {
      const gameId = Number(r.GAME_ID ?? 0);
      const dl3 = r.DL3_INFO as Record<string, unknown> | null;

      all.push({
        date: String(r.TIME ?? r.DATE ?? ''),
        gameId,
        gameName: getGameName(gameId),
        score: parseNum(r.SCORE),
        playLog: typeof r.PLAY_LOG === 'string' ? r.PLAY_LOG : null,
        dl3Info: dl3
          ? {
              vectorX: Number(dl3.AVG_VECTOR_X ?? 0),
              vectorY: Number(dl3.AVG_VECTOR_Y ?? 0),
              radius: Number(dl3.AVG_RADIUS ?? 0),
              speed: Number(dl3.AVG_DART_SPEED ?? 0),
            }
          : null,
        awards: extractAwards(r),
      });
    }

    // ldt ページネーション: 最後の TIME を次のリクエストに
    const lastTime = String(rawList[rawList.length - 1].TIME ?? '');
    if (!lastTime) break;
    ldt = lastTime.replace(' ', '_');

    // 空ページで終了
    if (rawList.length < 100) break;
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

  // COUNT-UP プレイデータを抽出（PLAY_LOG付き）
  const countupPlays: CountUpPlayData[] = recentPlays
    .filter((p) => p.gameId === GAME_ID_COUNTUP && p.playLog)
    .map((p) => ({
      time: p.date,
      score: p.score ?? 0,
      playLog: p.playLog!,
      dl3VectorX: p.dl3Info?.vectorX ?? 0,
      dl3VectorY: p.dl3Info?.vectorY ?? 0,
      dl3Radius: p.dl3Info?.radius ?? 0,
      dl3Speed: p.dl3Info?.speed ?? 0,
    }));

  return { bundle, dailyHistory, monthlyHistory, recentPlays, countupPlays };
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

/** アワードフィールドを抽出 */
function extractAwards(r: Record<string, unknown>): string[] {
  const awards: string[] = [];
  const awardFields = [
    'DOUBLE_BULL',
    'SINGLE_BULL',
    'LOW_TON',
    'HIGH_TON',
    'HAT_TRICK',
    'TON_EIGHTY',
    'THREE_IN_A_BED',
    'THREE_IN_THE_BLACK',
    'WHITE_HORSE',
  ];
  for (const field of awardFields) {
    const count = Number(r[field] ?? 0);
    if (count > 0) {
      for (let i = 0; i < count; i++) awards.push(field);
    }
  }
  return awards;
}
