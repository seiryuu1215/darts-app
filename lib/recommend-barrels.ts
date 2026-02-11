import type { Dart, BarrelProduct } from '@/types';

export interface UserPreference {
  avgWeight: number;
  avgDiameter: number | null;
  avgLength: number | null;
  favoriteCuts: string[];
  favoriteBrands: string[];
  keywords: string[];
  ownedBarrelNames: string[];
  weightOffset: number;
  diameterOffset: number;
  lengthOffset: number;
}

const KEYWORD_LIST = [
  '安定', '鋭い', '前重心', 'センター重心', '後ろ重心', 'グリップ',
  'ストレート', 'トルピード', '飛び', '抜け', 'コントロール',
  'パワー', 'シャープ', 'スリム', 'ロング', 'ショート',
];

export function analyzeUserDarts(darts: Dart[]): UserPreference {
  if (darts.length === 0) {
    return {
      avgWeight: 0,
      avgDiameter: null,
      avgLength: null,
      favoriteCuts: [],
      favoriteBrands: [],
      keywords: [],
      ownedBarrelNames: [],
      weightOffset: 0,
      diameterOffset: 0,
      lengthOffset: 0,
    };
  }

  // 重量平均
  const weights = darts.map((d) => d.barrel.weight).filter((w) => w > 0);
  const avgWeight = weights.length > 0 ? weights.reduce((a, b) => a + b, 0) / weights.length : 0;

  // 最大径平均
  const diameters = darts.map((d) => d.barrel.maxDiameter).filter((v): v is number => v != null && v > 0);
  const avgDiameter = diameters.length > 0 ? diameters.reduce((a, b) => a + b, 0) / diameters.length : null;

  // 全長平均
  const lengths = darts.map((d) => d.barrel.length).filter((v): v is number => v != null && v > 0);
  const avgLength = lengths.length > 0 ? lengths.reduce((a, b) => a + b, 0) / lengths.length : null;

  // カット集計
  const cutCount = new Map<string, number>();
  darts.forEach((d) => {
    if (d.barrel.cut) {
      d.barrel.cut.split(/[,+＋]/).map((s) => s.trim()).filter(Boolean).forEach((c) => {
        cutCount.set(c, (cutCount.get(c) || 0) + 1);
      });
    }
  });
  const favoriteCuts = Array.from(cutCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([cut]) => cut);

  // ブランド集計
  const brandCount = new Map<string, number>();
  darts.forEach((d) => {
    if (d.barrel.brand) {
      brandCount.set(d.barrel.brand, (brandCount.get(d.barrel.brand) || 0) + 1);
    }
  });
  const favoriteBrands = Array.from(brandCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([brand]) => brand);

  // テキストキーワード抽出
  const keywordSet = new Set<string>();
  darts.forEach((d) => {
    if (d.description) {
      KEYWORD_LIST.forEach((kw) => {
        if (d.description.includes(kw)) keywordSet.add(kw);
      });
    }
  });

  // 所持バレル名
  const ownedBarrelNames = darts.map((d) => d.barrel.name);

  return {
    avgWeight,
    avgDiameter,
    avgLength,
    favoriteCuts,
    favoriteBrands,
    keywords: Array.from(keywordSet),
    ownedBarrelNames,
    weightOffset: 0,
    diameterOffset: 0,
    lengthOffset: 0,
  };
}

/** テキストから好みオフセットをパースする */
export function parsePreferenceText(text: string): { weightOffset: number; diameterOffset: number; lengthOffset: number } {
  let weightOffset = 0;
  let diameterOffset = 0;
  let lengthOffset = 0;

  if (/重[くいめ]/.test(text)) weightOffset = +1;
  if (/軽[くいめ]/.test(text)) weightOffset = -1;
  if (/太[くいめ]/.test(text)) diameterOffset = +0.3;
  if (/細[くいめ]/.test(text)) diameterOffset = -0.3;
  if (/長[くいめ]/.test(text)) lengthOffset = +2;
  if (/短[くいめ]/.test(text)) lengthOffset = -2;

  return { weightOffset, diameterOffset, lengthOffset };
}

/** 線形減衰スコア: 差が0なら満点、maxDiffを超えたら0点 */
function linearDecayScore(diff: number, maxDiff: number, maxPoints: number): number {
  if (maxDiff <= 0) return maxPoints;
  const ratio = Math.max(0, 1 - Math.abs(diff) / maxDiff);
  return Math.round(ratio * maxPoints);
}

export function scoreBarrel(barrel: BarrelProduct, pref: UserPreference): number {
  let score = 0;

  // 重量: 0〜30点（差3g以上で0点）
  if (pref.avgWeight > 0) {
    const target = pref.avgWeight + pref.weightOffset;
    const diff = barrel.weight - target;
    score += linearDecayScore(diff, 3, 30);
  }

  // 最大径: 0〜25点（差1mm以上で0点）
  if (pref.avgDiameter != null && barrel.maxDiameter != null) {
    const target = pref.avgDiameter + pref.diameterOffset;
    const diff = barrel.maxDiameter - target;
    score += linearDecayScore(diff, 1, 25);
  }

  // 全長: 0〜25点（差6mm以上で0点）
  if (pref.avgLength != null && barrel.length != null) {
    const target = pref.avgLength + pref.lengthOffset;
    const diff = barrel.length - target;
    score += linearDecayScore(diff, 6, 25);
  }

  // カット: 完全一致+15、部分一致+8、不一致0
  if (barrel.cut && pref.favoriteCuts.length > 0) {
    const barrelCuts = barrel.cut.split(/[,+＋]/).map((s) => s.trim()).filter(Boolean);
    const hasExact = barrelCuts.some((c) => pref.favoriteCuts.includes(c));
    if (hasExact) {
      score += 15;
    } else {
      const hasPartial = barrelCuts.some((bc) =>
        pref.favoriteCuts.some((fc) => bc.includes(fc) || fc.includes(bc))
      );
      if (hasPartial) score += 8;
    }
  }

  // ブランド一致: +5
  if (pref.favoriteBrands.includes(barrel.brand)) {
    score += 5;
  }

  return score;
}

function getBarrelType(name: string): 'soft' | 'steel' | '' {
  const n = name.toLowerCase();
  if (n.includes('steel') || n.includes('スティール')) return 'steel';
  if (n.includes('2ba') || n.includes('4ba')) return 'soft';
  return '';
}

export interface BarrelAnalysis {
  barrel: BarrelProduct;
  score: number;
  maxScore: number;
  matchPercent: number;
  diffs: SpecDiff;
  insights: string[];
}

export interface SpecDiff {
  weightDiff: number | null;
  diameterDiff: number | null;
  lengthDiff: number | null;
  cutMatch: 'exact' | 'partial' | 'none';
  brandMatch: boolean;
}

function buildPrefFromBarrels(selectedBarrels: BarrelProduct[], userText?: string): UserPreference {
  const weights = selectedBarrels.map((b) => b.weight).filter((w) => w > 0);
  const avgWeight = weights.length > 0 ? weights.reduce((a, b) => a + b, 0) / weights.length : 0;

  const diameters = selectedBarrels.map((b) => b.maxDiameter).filter((v): v is number => v != null && v > 0);
  const avgDiameter = diameters.length > 0 ? diameters.reduce((a, b) => a + b, 0) / diameters.length : null;

  const lengths = selectedBarrels.map((b) => b.length).filter((v): v is number => v != null && v > 0);
  const avgLength = lengths.length > 0 ? lengths.reduce((a, b) => a + b, 0) / lengths.length : null;

  const cutCount = new Map<string, number>();
  selectedBarrels.forEach((b) => {
    if (b.cut) {
      b.cut.split(/[,+＋]/).map((s) => s.trim()).filter(Boolean).forEach((c) => {
        cutCount.set(c, (cutCount.get(c) || 0) + 1);
      });
    }
  });
  const favoriteCuts = Array.from(cutCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([cut]) => cut);

  const brandCount = new Map<string, number>();
  selectedBarrels.forEach((b) => {
    if (b.brand) {
      brandCount.set(b.brand, (brandCount.get(b.brand) || 0) + 1);
    }
  });
  const favoriteBrands = Array.from(brandCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([brand]) => brand);

  const offsets = userText ? parsePreferenceText(userText) : { weightOffset: 0, diameterOffset: 0, lengthOffset: 0 };

  return {
    avgWeight,
    avgDiameter,
    avgLength,
    favoriteCuts,
    favoriteBrands,
    keywords: [],
    ownedBarrelNames: selectedBarrels.map((b) => b.name),
    weightOffset: offsets.weightOffset,
    diameterOffset: offsets.diameterOffset,
    lengthOffset: offsets.lengthOffset,
  };
}

function analyzeBarrel(barrel: BarrelProduct, pref: UserPreference): BarrelAnalysis {
  const score = scoreBarrel(barrel, pref);
  // 最大スコア: 重量30 + 最大径25 + 全長25 + カット15 + ブランド5 = 100
  const maxScore = 100;
  const matchPercent = Math.round((score / maxScore) * 100);

  // スペック差分
  const weightDiff = pref.avgWeight > 0 ? Math.round((barrel.weight - pref.avgWeight) * 10) / 10 : null;
  const diameterDiff = pref.avgDiameter != null && barrel.maxDiameter != null
    ? Math.round((barrel.maxDiameter - pref.avgDiameter) * 100) / 100
    : null;
  const lengthDiff = pref.avgLength != null && barrel.length != null
    ? Math.round((barrel.length - pref.avgLength) * 10) / 10
    : null;

  let cutMatch: 'exact' | 'partial' | 'none' = 'none';
  if (barrel.cut && pref.favoriteCuts.length > 0) {
    const barrelCuts = barrel.cut.split(/[,+＋]/).map((s) => s.trim()).filter(Boolean);
    if (barrelCuts.some((c) => pref.favoriteCuts.includes(c))) {
      cutMatch = 'exact';
    } else if (barrelCuts.some((bc) => pref.favoriteCuts.some((fc) => bc.includes(fc) || fc.includes(bc)))) {
      cutMatch = 'partial';
    }
  }

  const brandMatch = pref.favoriteBrands.includes(barrel.brand);

  const diffs: SpecDiff = { weightDiff, diameterDiff, lengthDiff, cutMatch, brandMatch };

  // 感覚の違いを言語化
  const insights: string[] = [];

  if (weightDiff != null) {
    if (weightDiff > 1) insights.push(`${Math.abs(weightDiff)}g重く、飛びに力強さが増す傾向`);
    else if (weightDiff > 0.3) insights.push(`やや重め。安定感が増す可能性あり`);
    else if (weightDiff < -1) insights.push(`${Math.abs(weightDiff)}g軽く、スピード感のある飛びに`);
    else if (weightDiff < -0.3) insights.push(`やや軽め。取り回しが楽になる可能性あり`);
    else insights.push('重量はほぼ同じ。違和感なく移行できそう');
  }

  if (diameterDiff != null) {
    if (diameterDiff > 0.3) insights.push(`太め（+${diameterDiff.toFixed(1)}mm）。グリップの存在感が増す`);
    else if (diameterDiff < -0.3) insights.push(`細め（${diameterDiff.toFixed(1)}mm）。指離れが良くなる傾向`);
    else insights.push('最大径は近いサイズ感');
  }

  if (lengthDiff != null) {
    if (lengthDiff > 2) insights.push(`長め（+${lengthDiff.toFixed(1)}mm）。グリップポイントの選択肢が広がる`);
    else if (lengthDiff < -2) insights.push(`短め（${lengthDiff.toFixed(1)}mm）。コンパクトな振り感に`);
    else insights.push('全長は近い。持ち替え時の違和感が少なそう');
  }

  if (cutMatch === 'exact') insights.push('カットが一致。グリップ感の親和性が高い');
  else if (cutMatch === 'partial') insights.push('カット系統が近い。似たグリップ感が期待できる');
  else if (barrel.cut) insights.push('カットが異なる。グリップ感に変化あり');

  return { barrel, score, maxScore, matchPercent, diffs, insights };
}

export function recommendFromBarrels(
  selectedBarrels: BarrelProduct[],
  allBarrels: BarrelProduct[],
  limit = 10,
  userText?: string
): BarrelProduct[] {
  const results = recommendFromBarrelsWithAnalysis(selectedBarrels, allBarrels, limit, userText);
  return results.map((r) => r.barrel);
}

export function recommendFromBarrelsWithAnalysis(
  selectedBarrels: BarrelProduct[],
  allBarrels: BarrelProduct[],
  limit = 10,
  userText?: string
): BarrelAnalysis[] {
  if (selectedBarrels.length === 0) return [];

  const pref = buildPrefFromBarrels(selectedBarrels, userText);
  const ownedNames = new Set(pref.ownedBarrelNames.map((n) => n.toLowerCase()));

  return allBarrels
    .filter((b) => !ownedNames.has(b.name.toLowerCase()))
    .map((b) => analyzeBarrel(b, pref))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function recommendBarrels(
  darts: Dart[],
  barrels: BarrelProduct[],
  type: 'soft' | 'steel',
  limit = 10
): BarrelProduct[] {
  const pref = analyzeUserDarts(darts);
  if (pref.avgWeight === 0) return [];

  // 既に持っているバレルを除外
  const ownedNames = new Set(pref.ownedBarrelNames.map((n) => n.toLowerCase()));

  return barrels
    .filter((b) => {
      // 所持バレル除外
      if (ownedNames.has(b.name.toLowerCase())) return false;
      // タイプフィルター
      const bType = getBarrelType(b.name);
      if (type === 'soft') return bType === 'soft' || bType === '';
      if (type === 'steel') return bType === 'steel' || bType === '';
      return true;
    })
    .map((b) => ({ barrel: b, score: scoreBarrel(b, pref) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.barrel);
}
