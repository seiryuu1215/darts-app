/**
 * セッション疲労分析ユーティリティ
 * COUNT-UPのタイムスタンプから日ごとセッションを構成し、
 * パフォーマンスの変化を分析する
 */

interface CountUpPlay {
  time: string;
  score: number;
  dl3Speed: number;
}

/** セッション（同日のプレイ群） */
export interface Session {
  date: string;
  plays: { time: string; score: number; gameIndex: number; dl3Speed: number }[];
  avgScore: number;
  gameCount: number;
}

/** セッション曲線のデータポイント */
export interface SessionCurvePoint {
  gameNumber: number;
  avgScore: number;
  count: number; // そのゲーム番号のサンプル数
}

/** 最適セッション長の分析結果 */
export interface OptimalLengthResult {
  optimalLength: number;
  peakGameNumber: number;
  peakAvgScore: number;
  dropoffGameNumber: number | null; // パフォーマンスが落ち始めるゲーム番号
}

/** 時間帯分析結果 */
export interface TimeOfDayResult {
  hour: number;
  avgScore: number;
  count: number;
}

/** セッション分析結果 */
export interface SessionAnalysis {
  sessions: Session[];
  sessionCurve: SessionCurvePoint[];
  optimalLength: OptimalLengthResult;
  timeOfDay: TimeOfDayResult[];
  avgSessionLength: number;
  totalSessions: number;
}

/** プレイを日ごとのセッションにグルーピング */
export function groupPlaysBySession(plays: CountUpPlay[]): Session[] {
  const sorted = [...plays].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

  const sessionMap = new Map<string, CountUpPlay[]>();

  for (const play of sorted) {
    const date = play.time.split(/[T ]/)[0];
    if (!sessionMap.has(date)) {
      sessionMap.set(date, []);
    }
    sessionMap.get(date)!.push(play);
  }

  const sessions: Session[] = [];
  for (const [date, sessionPlays] of sessionMap) {
    // 時間順にソートし、ゲーム番号を付与
    const timeSorted = sessionPlays.sort(
      (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime(),
    );
    const plays = timeSorted.map((p, i) => ({
      time: p.time,
      score: p.score,
      gameIndex: i + 1,
      dl3Speed: p.dl3Speed,
    }));
    const avgScore = plays.reduce((s, p) => s + p.score, 0) / plays.length;
    sessions.push({ date, plays, avgScore, gameCount: plays.length });
  }

  return sessions.sort((a, b) => a.date.localeCompare(b.date));
}

/** セッション曲線（ゲーム番号ごとの平均スコア） */
export function computeSessionCurve(sessions: Session[]): SessionCurvePoint[] {
  const maxGames = Math.max(...sessions.map((s) => s.gameCount), 0);
  if (maxGames === 0) return [];

  const curve: SessionCurvePoint[] = [];

  for (let g = 1; g <= Math.min(maxGames, 20); g++) {
    const scoresAtG: number[] = [];
    for (const session of sessions) {
      if (session.gameCount >= g) {
        scoresAtG.push(session.plays[g - 1].score);
      }
    }
    if (scoresAtG.length >= 3) {
      // 最低3セッション以上のデータがある場合のみ
      const avg = scoresAtG.reduce((a, b) => a + b, 0) / scoresAtG.length;
      curve.push({
        gameNumber: g,
        avgScore: Math.round(avg * 10) / 10,
        count: scoresAtG.length,
      });
    }
  }

  return curve;
}

/** 最適セッション長を特定 */
export function findOptimalLength(curve: SessionCurvePoint[]): OptimalLengthResult {
  if (curve.length === 0) {
    return { optimalLength: 0, peakGameNumber: 0, peakAvgScore: 0, dropoffGameNumber: null };
  }

  // ピークゲーム番号
  let peakIdx = 0;
  for (let i = 1; i < curve.length; i++) {
    if (curve[i].avgScore > curve[peakIdx].avgScore) {
      peakIdx = i;
    }
  }

  // ドロップオフ検出: ピーク以降で平均が5%以上低下し始める地点
  let dropoffGameNumber: number | null = null;
  const peakScore = curve[peakIdx].avgScore;
  const threshold = peakScore * 0.95;

  for (let i = peakIdx + 1; i < curve.length; i++) {
    if (curve[i].avgScore < threshold) {
      dropoffGameNumber = curve[i].gameNumber;
      break;
    }
  }

  return {
    optimalLength: dropoffGameNumber ?? curve[curve.length - 1].gameNumber,
    peakGameNumber: curve[peakIdx].gameNumber,
    peakAvgScore: curve[peakIdx].avgScore,
    dropoffGameNumber,
  };
}

/** 時間帯別パフォーマンス分析 */
export function analyzeTimeOfDay(plays: CountUpPlay[]): TimeOfDayResult[] {
  const hourBuckets = new Map<number, number[]>();

  for (const play of plays) {
    const d = new Date(play.time);
    const hour = d.getHours();
    if (!hourBuckets.has(hour)) {
      hourBuckets.set(hour, []);
    }
    hourBuckets.get(hour)!.push(play.score);
  }

  const results: TimeOfDayResult[] = [];
  for (const [hour, scores] of hourBuckets) {
    if (scores.length >= 2) {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      results.push({
        hour,
        avgScore: Math.round(avg * 10) / 10,
        count: scores.length,
      });
    }
  }

  return results.sort((a, b) => a.hour - b.hour);
}

/** セッション分析の統合実行 */
export function analyzeSession(plays: CountUpPlay[]): SessionAnalysis | null {
  if (plays.length < 10) return null;

  const sessions = groupPlaysBySession(plays);
  if (sessions.length < 3) return null;

  const sessionCurve = computeSessionCurve(sessions);
  const optimalLength = findOptimalLength(sessionCurve);
  const timeOfDay = analyzeTimeOfDay(plays);

  const avgSessionLength = sessions.reduce((s, sess) => s + sess.gameCount, 0) / sessions.length;

  return {
    sessions,
    sessionCurve,
    optimalLength,
    timeOfDay,
    avgSessionLength: Math.round(avgSessionLength * 10) / 10,
    totalSessions: sessions.length,
  };
}
