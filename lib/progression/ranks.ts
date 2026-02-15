export interface RankDefinition {
  level: number;
  name: string;
  requiredXp: number;
  icon: string;
  color: string;
}

export const RANKS: RankDefinition[] = [
  { level: 1, name: 'Rookie', requiredXp: 0, icon: '🎯', color: '#9E9E9E' },
  { level: 2, name: 'Beginner', requiredXp: 50, icon: '🎯', color: '#8D6E63' },
  { level: 3, name: 'Novice', requiredXp: 150, icon: '🏹', color: '#8D6E63' },
  { level: 4, name: 'D Player', requiredXp: 300, icon: '🥉', color: '#CD7F32' },
  { level: 5, name: 'C Player', requiredXp: 500, icon: '🥉', color: '#CD7F32' },
  { level: 6, name: 'CC Player', requiredXp: 800, icon: '🥈', color: '#C0C0C0' },
  { level: 7, name: 'B Player', requiredXp: 1200, icon: '🥈', color: '#C0C0C0' },
  { level: 8, name: 'BB Player', requiredXp: 1800, icon: '🥇', color: '#FFD700' },
  { level: 9, name: 'A Player', requiredXp: 2500, icon: '🥇', color: '#FFD700' },
  { level: 10, name: 'AA Player', requiredXp: 3500, icon: '💎', color: '#B9F2FF' },
  { level: 11, name: 'SA Player', requiredXp: 5000, icon: '💎', color: '#B9F2FF' },
  { level: 12, name: 'Master', requiredXp: 7000, icon: '🔥', color: '#E040FB' },
  { level: 13, name: 'Grand Master', requiredXp: 10000, icon: '🔥', color: '#E040FB' },
  { level: 14, name: 'Legend', requiredXp: 14000, icon: '⭐', color: '#FF6D00' },
  { level: 15, name: 'Champion', requiredXp: 19000, icon: '⭐', color: '#FF6D00' },
  { level: 16, name: 'World Class', requiredXp: 25000, icon: '🌟', color: '#F44336' },
  { level: 17, name: 'PERFECT', requiredXp: 32000, icon: '🌟', color: '#F44336' },
  { level: 18, name: 'DIVINE', requiredXp: 40000, icon: '👑', color: '#FFD700' },
  { level: 19, name: 'IMMORTAL', requiredXp: 50000, icon: '👑', color: '#E040FB' },
  { level: 20, name: 'THE GOD', requiredXp: 65000, icon: '🏆', color: '#FFD700' },
];
