export interface RankDefinition {
  level: number;
  name: string;
  requiredXp: number;
}

export const RANKS: RankDefinition[] = [
  { level: 1, name: 'Rookie', requiredXp: 0 },
  { level: 2, name: 'Beginner', requiredXp: 50 },
  { level: 3, name: 'Novice', requiredXp: 150 },
  { level: 4, name: 'D Player', requiredXp: 300 },
  { level: 5, name: 'C Player', requiredXp: 500 },
  { level: 6, name: 'CC Player', requiredXp: 800 },
  { level: 7, name: 'B Player', requiredXp: 1200 },
  { level: 8, name: 'BB Player', requiredXp: 1800 },
  { level: 9, name: 'A Player', requiredXp: 2500 },
  { level: 10, name: 'AA Player', requiredXp: 3500 },
  { level: 11, name: 'SA Player', requiredXp: 5000 },
  { level: 12, name: 'Master', requiredXp: 7000 },
  { level: 13, name: 'Grand Master', requiredXp: 10000 },
  { level: 14, name: 'Legend', requiredXp: 14000 },
  { level: 15, name: 'Champion', requiredXp: 19000 },
  { level: 16, name: 'World Class', requiredXp: 25000 },
  { level: 17, name: 'PERFECT', requiredXp: 32000 },
  { level: 18, name: 'DIVINE', requiredXp: 40000 },
  { level: 19, name: 'IMMORTAL', requiredXp: 50000 },
  { level: 20, name: 'THE GOD', requiredXp: 65000 },
];
