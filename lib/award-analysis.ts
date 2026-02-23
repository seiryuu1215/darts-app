/**
 * アワードペース＆マイルストーン予測ユーティリティ
 */

interface AwardEntry {
  date: string; // YYYY-MM
  awards: Record<string, number>;
}

export interface AwardPace {
  awardName: string;
  totalCount: number;
  monthlyAvg: number; // 月平均取得数
  recentMonthlyAvg: number; // 直近3ヶ月の月平均
  trend: 'up' | 'down' | 'flat'; // 直近トレンド
  trendColor: string;
}

export interface Milestone {
  awardName: string;
  currentCount: number;
  targetCount: number;
  remaining: number;
  estimatedDate: string; // YYYY-MM形式の予測日
  estimatedMonths: number;
}

export interface AwardAnalysis {
  paces: AwardPace[];
  milestones: Milestone[];
  totalAwards: number;
  monthsCovered: number;
}

// よく使われるマイルストーン目標
const MILESTONE_TARGETS = [100, 200, 500, 1000, 2000, 3000, 5000, 10000];

/** アワードペースを算出 */
export function computeAwardPace(awardList: AwardEntry[]): AwardPace[] {
  if (awardList.length === 0) return [];

  const sorted = [...awardList].sort((a, b) => a.date.localeCompare(b.date));
  const months = sorted.length;

  // 各アワードの月別集計
  const awardTotals = new Map<string, number>();
  const awardRecent = new Map<string, number[]>();

  for (const entry of sorted) {
    for (const [name, count] of Object.entries(entry.awards)) {
      awardTotals.set(name, (awardTotals.get(name) ?? 0) + count);
      if (!awardRecent.has(name)) awardRecent.set(name, []);
      awardRecent.get(name)!.push(count);
    }
  }

  const paces: AwardPace[] = [];

  for (const [name, total] of awardTotals) {
    if (total === 0) continue;

    const monthlyAvg = months > 0 ? Math.round((total / months) * 10) / 10 : 0;
    const recentData = awardRecent.get(name)!;
    const recent3 = recentData.slice(-3);
    const recentMonthlyAvg =
      recent3.length > 0
        ? Math.round((recent3.reduce((a, b) => a + b, 0) / recent3.length) * 10) / 10
        : 0;

    // トレンド判定
    let trend: 'up' | 'down' | 'flat' = 'flat';
    let trendColor = '#FF9800';

    if (recent3.length >= 2) {
      const diff = recentMonthlyAvg - monthlyAvg;
      if (diff > monthlyAvg * 0.15) {
        trend = 'up';
        trendColor = '#4caf50';
      } else if (diff < -monthlyAvg * 0.15) {
        trend = 'down';
        trendColor = '#f44336';
      }
    }

    paces.push({
      awardName: name,
      totalCount: total,
      monthlyAvg,
      recentMonthlyAvg,
      trend,
      trendColor,
    });
  }

  return paces.sort((a, b) => b.totalCount - a.totalCount);
}

/** マイルストーン予測 */
export function projectMilestone(paces: AwardPace[]): Milestone[] {
  const milestones: Milestone[] = [];
  const now = new Date();

  for (const pace of paces) {
    if (pace.recentMonthlyAvg <= 0) continue;

    // 次の達成可能なマイルストーンを見つける
    const nextTarget = MILESTONE_TARGETS.find((t) => t > pace.totalCount);
    if (!nextTarget) continue;

    const remaining = nextTarget - pace.totalCount;
    const estimatedMonths = Math.ceil(remaining / pace.recentMonthlyAvg);

    if (estimatedMonths > 120) continue; // 10年以上先は表示しない

    const targetDate = new Date(now.getFullYear(), now.getMonth() + estimatedMonths, 1);
    const estimatedDate = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;

    milestones.push({
      awardName: pace.awardName,
      currentCount: pace.totalCount,
      targetCount: nextTarget,
      remaining,
      estimatedDate,
      estimatedMonths,
    });
  }

  return milestones.sort((a, b) => a.estimatedMonths - b.estimatedMonths);
}

/** アワード分析統合実行 */
export function analyzeAwards(awardList: AwardEntry[]): AwardAnalysis | null {
  if (!awardList || awardList.length < 2) return null;

  const paces = computeAwardPace(awardList);
  if (paces.length === 0) return null;

  const milestones = projectMilestone(paces);
  const totalAwards = paces.reduce((s, p) => s + p.totalCount, 0);

  return {
    paces,
    milestones,
    totalAwards,
    monthsCovered: awardList.length,
  };
}
