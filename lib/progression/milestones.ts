/**
 * 累計XPマイルストーン定義（バッジのみ）
 */

export interface MilestoneDef {
  id: string;
  xp: number;
  label: string;
  badge: string;
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
  },
  {
    id: 'iron_will',
    xp: 5000,
    label: '鉄の意志',
    badge: 'gold',
  },
  {
    id: 'elite',
    xp: 10000,
    label: 'エリート',
    badge: 'platinum',
  },
  {
    id: 'legend',
    xp: 25000,
    label: 'レジェンド',
    badge: 'diamond',
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
  {
    id: 'transcendent',
    xp: 200000,
    label: '超越者',
    badge: 'transcendent',
  },
  {
    id: 'beyond',
    xp: 500000,
    label: '限界突破',
    badge: 'beyond',
  },
];
