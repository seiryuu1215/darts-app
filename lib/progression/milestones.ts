/**
 * 累計XPマイルストーン報酬定義
 */

export interface MilestoneDef {
  id: string;
  xp: number;
  label: string;
  badge: string;
  rewards?: { itemId: string; quantity: number }[];
}

export const MILESTONES: MilestoneDef[] = [
  {
    id: 'first_step',
    xp: 100,
    label: 'はじめの一歩',
    badge: 'bronze',
  },
  {
    id: 'perseverance',
    xp: 1000,
    label: '継続は力なり',
    badge: 'silver',
    rewards: [{ itemId: 'streak_freeze', quantity: 1 }],
  },
  {
    id: 'iron_will',
    xp: 5000,
    label: '鉄の意志',
    badge: 'gold',
    rewards: [{ itemId: 'streak_freeze', quantity: 2 }],
  },
  {
    id: 'elite',
    xp: 10000,
    label: 'エリート',
    badge: 'platinum',
    rewards: [{ itemId: 'double_xp', quantity: 1 }],
  },
  {
    id: 'legend',
    xp: 25000,
    label: 'レジェンド',
    badge: 'diamond',
    rewards: [{ itemId: 'streak_revive', quantity: 1 }],
  },
  {
    id: 'divine',
    xp: 50000,
    label: '神域',
    badge: 'legendary',
  },
  {
    id: 'ultimate',
    xp: 100000,
    label: '極み',
    badge: 'ultimate',
  },
];
