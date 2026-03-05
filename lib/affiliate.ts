import type { BarrelProduct, ShopLink } from '@/types';

export interface AffiliateConfig {
  rakutenAffiliateId: string;
  amazonAssociateTag: string;
  /** ダーツハイブ商品リンク用（素材020: 自由テキスト、a8ejpredirect対応） */
  a8MediaId: string;
  /** ダーツハイブ一般リンク用（素材014: トップへの誘導） */
  a8MediaIdGeneral: string;
  /** 楽天市場A8素材（素材064: テキスト「楽天」） */
  a8RakutenMat: string;
}

export function getAffiliateConfig(): AffiliateConfig {
  return {
    rakutenAffiliateId: process.env.NEXT_PUBLIC_RAKUTEN_AFFILIATE_ID ?? '',
    amazonAssociateTag: process.env.NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG ?? '',
    a8MediaId: process.env.NEXT_PUBLIC_A8_MEDIA_ID ?? '',
    a8MediaIdGeneral: process.env.NEXT_PUBLIC_A8_MEDIA_ID_GENERAL ?? '',
    a8RakutenMat: process.env.NEXT_PUBLIC_A8_RAKUTEN_MAT ?? '',
  };
}

/** 商品ページへのリダイレクトリンク（素材020: 自由テキスト） */
export function toDartshiveAffiliateUrl(productUrl: string, config: AffiliateConfig): string {
  if (!config.a8MediaId) return productUrl;
  const encoded = encodeURIComponent(productUrl);
  return `https://px.a8.net/svt/ejp?a8mat=${config.a8MediaId}&a8ejpredirect=${encoded}`;
}

/** ダーツハイブトップへの一般リンク（素材014） */
export function toDartshiveGeneralUrl(config: AffiliateConfig): string {
  if (!config.a8MediaIdGeneral) return 'https://www.dartshive.jp/';
  return `https://px.a8.net/svt/ejp?a8mat=${config.a8MediaIdGeneral}`;
}

/** 楽天市場検索URL（A8.net経由リダイレクト） */
export function toRakutenSearchUrl(barrelName: string, config: AffiliateConfig): string {
  const query = encodeURIComponent(barrelName);
  const searchUrl = `https://search.rakuten.co.jp/search/mall/${query}/`;

  if (!config.a8RakutenMat || !config.rakutenAffiliateId) {
    return searchUrl;
  }

  // 楽天アフィリエイトURL → A8.netリダイレクトで二重トラッキング
  const rakutenAffUrl = `https://hb.afl.rakuten.co.jp/hgc/${config.rakutenAffiliateId}/?pc=${encodeURIComponent(searchUrl)}&m=${encodeURIComponent(searchUrl)}`;
  return `https://rpx.a8.net/svt/ejp?a8mat=${config.a8RakutenMat}&rakuten=y&a8ejpredirect=${encodeURIComponent(rakutenAffUrl)}`;
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
      label: 'ダーツハイブで見る',
      url: toDartshiveAffiliateUrl(barrel.productUrl, c),
    },
    {
      shop: 'rakuten',
      label: '楽天で検索',
      url: toRakutenSearchUrl(searchName, c),
    },
    {
      shop: 'amazon',
      label: 'Amazonで検索',
      url: toAmazonSearchUrl(searchName, c),
    },
  ];
}
