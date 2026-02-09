import type { Dart, BarrelProduct } from '@/types';

export interface UserPreference {
  avgWeight: number;
  avgDiameter: number | null;
  avgLength: number | null;
  favoriteCuts: string[];
  favoriteBrands: string[];
  keywords: string[];
  ownedBarrelNames: string[];
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
  };
}

export function scoreBarrel(barrel: BarrelProduct, pref: UserPreference): number {
  let score = 0;

  // 重量がレンジ内 (平均 ± 2g) → +3
  if (pref.avgWeight > 0 && barrel.weight >= pref.avgWeight - 2 && barrel.weight <= pref.avgWeight + 2) {
    score += 3;
  }

  // 最大径がレンジ内 (平均 ± 0.5mm) → +2
  if (pref.avgDiameter != null && barrel.maxDiameter != null) {
    if (barrel.maxDiameter >= pref.avgDiameter - 0.5 && barrel.maxDiameter <= pref.avgDiameter + 0.5) {
      score += 2;
    }
  }

  // 全長がレンジ内 (平均 ± 3mm) → +2
  if (pref.avgLength != null && barrel.length != null) {
    if (barrel.length >= pref.avgLength - 3 && barrel.length <= pref.avgLength + 3) {
      score += 2;
    }
  }

  // カット一致 → 完全一致 +2, 部分一致 +1
  if (barrel.cut && pref.favoriteCuts.length > 0) {
    const barrelCuts = barrel.cut.split(/[,+＋]/).map((s) => s.trim()).filter(Boolean);
    const hasExact = barrelCuts.some((c) => pref.favoriteCuts.includes(c));
    if (hasExact) {
      score += 2;
    } else {
      const hasPartial = barrelCuts.some((bc) =>
        pref.favoriteCuts.some((fc) => bc.includes(fc) || fc.includes(bc))
      );
      if (hasPartial) score += 1;
    }
  }

  // ブランド一致 → +1
  if (pref.favoriteBrands.includes(barrel.brand)) {
    score += 1;
  }

  // テキストキーワード一致 → +1
  if (pref.keywords.length > 0) {
    const barrelText = `${barrel.name} ${barrel.brand} ${barrel.cut}`.toLowerCase();
    if (pref.keywords.some((kw) => barrelText.includes(kw.toLowerCase()))) {
      score += 1;
    }
  }

  return score;
}

function getBarrelType(name: string): 'soft' | 'steel' | '' {
  const n = name.toLowerCase();
  if (n.includes('steel') || n.includes('スティール')) return 'steel';
  if (n.includes('2ba') || n.includes('4ba')) return 'soft';
  return '';
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
