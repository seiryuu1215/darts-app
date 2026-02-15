/**
 * ショップアイテム定義
 * XPを消費してストリーク保護などのアイテムを購入
 */

export interface ShopItem {
  id: string;
  cost: number;
  label: string;
  description: string;
  maxOwned: number;
}

export const SHOP_ITEMS: Record<string, ShopItem> = {
  streak_freeze: {
    id: 'streak_freeze',
    cost: 200,
    label: 'ストリークフリーズ',
    description: '1日分のストリークを保護。記録を休んでもストリークが途切れない',
    maxOwned: 2,
  },
  double_xp: {
    id: 'double_xp',
    cost: 300,
    label: 'ダブルXPブースト',
    description: '次の1セッションで獲得XPが2倍',
    maxOwned: 1,
  },
  streak_revive: {
    id: 'streak_revive',
    cost: 500,
    label: 'ストリーク復活',
    description: '途切れたストリークを前日に遡って復活',
    maxOwned: 1,
  },
} as const;

export function getShopItem(id: string): ShopItem | undefined {
  return SHOP_ITEMS[id];
}

export function getAllShopItems(): ShopItem[] {
  return Object.values(SHOP_ITEMS);
}
