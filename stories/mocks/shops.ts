import type { ShopBookmark, ShopList } from '@/types';
import { daysAgo } from './factories';

type MockShopBookmark = Omit<ShopBookmark, 'createdAt' | 'updatedAt' | 'lastVisitedAt'> & {
  id: string;
  createdAt: ReturnType<typeof daysAgo>;
  updatedAt: ReturnType<typeof daysAgo>;
  lastVisitedAt: ReturnType<typeof daysAgo> | null;
};

type MockShopList = Omit<ShopList, 'createdAt' | 'updatedAt'> & {
  id: string;
  createdAt: ReturnType<typeof daysAgo>;
  updatedAt: ReturnType<typeof daysAgo>;
};

export const MOCK_SHOP_BOOKMARKS: MockShopBookmark[] = [
  {
    id: 'shop_001',
    name: 'ラウンドワン 渋谷店',
    address: '東京都渋谷区宇田川町3-10',
    nearestStation: '渋谷駅',
    imageUrl: null,
    machineCount: { dl2: 4, dl3: 8 },
    tags: ['禁煙', '駅近'],
    lines: ['JR山手線', '東急東横線'],
    note: '深夜まで営業。DL3が多い。',
    rating: 4,
    visitCount: 12,
    lastVisitedAt: daysAgo(3),
    isFavorite: true,
    listIds: ['list_001'],
    lat: 35.6607,
    lng: 139.6983,
    dartsliveSearchUrl: null,
    createdAt: daysAgo(90),
    updatedAt: daysAgo(3),
  },
  {
    id: 'shop_002',
    name: 'ダーツバーBee 新宿店',
    address: '東京都新宿区歌舞伎町1-1-1',
    nearestStation: '新宿駅',
    imageUrl: null,
    machineCount: { dl2: 2, dl3: 3 },
    tags: ['分煙', 'バー'],
    lines: ['JR中央線', '東京メトロ丸ノ内線'],
    note: 'カクテルが美味しい',
    rating: 3,
    visitCount: 5,
    lastVisitedAt: daysAgo(14),
    isFavorite: false,
    listIds: ['list_001'],
    lat: 35.6938,
    lng: 139.7034,
    dartsliveSearchUrl: null,
    createdAt: daysAgo(60),
    updatedAt: daysAgo(14),
  },
  {
    id: 'shop_003',
    name: 'マンガ喫茶&ダーツ Space',
    address: '東京都豊島区南池袋2-2-2',
    nearestStation: '池袋駅',
    imageUrl: null,
    machineCount: { dl2: 6, dl3: 2 },
    tags: ['禁煙', '24時間'],
    lines: ['JR山手線', '東京メトロ副都心線'],
    note: '',
    rating: null,
    visitCount: 0,
    lastVisitedAt: null,
    isFavorite: false,
    listIds: [],
    lat: 35.7281,
    lng: 139.7109,
    dartsliveSearchUrl: null,
    createdAt: daysAgo(30),
    updatedAt: daysAgo(30),
  },
  {
    id: 'shop_004',
    name: 'BAGUS 六本木店',
    address: '東京都港区六本木4-4-4',
    nearestStation: '六本木駅',
    imageUrl: null,
    machineCount: { dl2: 0, dl3: 10 },
    tags: ['禁煙', '高級'],
    lines: ['東京メトロ日比谷線', '都営大江戸線'],
    note: 'DL3のみ。広くて綺麗。',
    rating: 5,
    visitCount: 3,
    lastVisitedAt: daysAgo(7),
    isFavorite: true,
    listIds: ['list_002'],
    lat: 35.6627,
    lng: 139.7312,
    dartsliveSearchUrl: null,
    createdAt: daysAgo(45),
    updatedAt: daysAgo(7),
  },
];

export const MOCK_SHOP_LISTS: MockShopList[] = [
  {
    id: 'list_001',
    name: 'よく行くお店',
    color: '#2196f3',
    sortOrder: 0,
    createdAt: daysAgo(90),
    updatedAt: daysAgo(3),
  },
  {
    id: 'list_002',
    name: '行きたいお店',
    color: '#ff9800',
    sortOrder: 1,
    createdAt: daysAgo(45),
    updatedAt: daysAgo(7),
  },
];
