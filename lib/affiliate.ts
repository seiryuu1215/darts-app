import type { BarrelProduct, ShopLink } from '@/types';

export interface AffiliateConfig {
  rakutenAffiliateId: string;
  amazonAssociateTag: string;
  a8MediaId: string;
}

export function getAffiliateConfig(): AffiliateConfig {
  return {
    rakutenAffiliateId: process.env.NEXT_PUBLIC_RAKUTEN_AFFILIATE_ID ?? '',
    amazonAssociateTag: process.env.NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG ?? '',
    a8MediaId: process.env.NEXT_PUBLIC_A8_MEDIA_ID ?? '',
  };
}

export function toDartshiveAffiliateUrl(productUrl: string, config: AffiliateConfig): string {
  if (!config.a8MediaId) return productUrl;
  const encoded = encodeURIComponent(productUrl);
  return `https://px.a8.net/svt/ejp?a8mat=${config.a8MediaId}&a8ejpredirect=${encoded}`;
}

export function toSdartsSearchUrl(barrelName: string): string {
  const query = encodeURIComponent(barrelName);
  return `https://www.s-darts.com/search?q=${query}`;
}

export function toMaximSearchUrl(barrelName: string): string {
  const query = encodeURIComponent(barrelName);
  return `https://www.and-maxim.com/search?q=${query}`;
}

export function toTitoSearchUrl(barrelName: string): string {
  const query = encodeURIComponent(barrelName);
  return `https://tito-online.com/?s=${query}&post_type=product`;
}

export function toRakutenSearchUrl(barrelName: string, config: AffiliateConfig): string {
  const query = encodeURIComponent(barrelName);
  if (!config.rakutenAffiliateId) {
    return `https://search.rakuten.co.jp/search/mall/${query}/`;
  }
  return `https://hb.afl.rakuten.co.jp/hgc/${config.rakutenAffiliateId}/?pc=https%3A%2F%2Fsearch.rakuten.co.jp%2Fsearch%2Fmall%2F${query}%2F`;
}

export function toAmazonSearchUrl(barrelName: string, config: AffiliateConfig): string {
  const query = encodeURIComponent(barrelName);
  if (!config.amazonAssociateTag) {
    return `https://www.amazon.co.jp/s?k=${query}`;
  }
  return `https://www.amazon.co.jp/s?k=${query}&tag=${config.amazonAssociateTag}`;
}

export function getShopLinks(barrel: BarrelProduct, config?: AffiliateConfig): ShopLink[] {
  const c = config ?? getAffiliateConfig();
  const searchName = `${barrel.brand} ${barrel.name}`;

  return [
    {
      shop: 'dartshive',
      label: 'ダーツハイブ',
      url: toDartshiveAffiliateUrl(barrel.productUrl, c),
    },
    {
      shop: 'sdarts',
      label: 'エスダーツ',
      url: toSdartsSearchUrl(searchName),
    },
    {
      shop: 'maxim',
      label: 'MAXIM',
      url: toMaximSearchUrl(searchName),
    },
    {
      shop: 'tito',
      label: 'TiTO Online',
      url: toTitoSearchUrl(searchName),
    },
    {
      shop: 'rakuten',
      label: '楽天',
      url: toRakutenSearchUrl(searchName, c),
    },
    {
      shop: 'amazon',
      label: 'Amazon',
      url: toAmazonSearchUrl(searchName, c),
    },
  ];
}
