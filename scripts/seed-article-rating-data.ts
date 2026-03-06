/**
 * レーティング別データ分析シリーズ記事投入スクリプト
 * 使い方: npx tsx scripts/seed-article-rating-data.ts
 */

import 'dotenv/config';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { config } from 'dotenv';
config({ path: '.env.local' });

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
if (!projectId) {
  console.error('NEXT_PUBLIC_FIREBASE_PROJECT_IDが設定されていません');
  process.exit(1);
}

let app;
if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  app = initializeApp({
    credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS),
  });
} else {
  app = initializeApp({ projectId });
}

const db = getFirestore(app);

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';

const article = {
  slug: 'dartslive-rating-data-analysis',
  title: 'DARTSLIVE公式データで見る「レーティング別の実力差」— 5つの公式コラムまとめ',
  content: `DARTSLIVEが公式に発表しているレーティング別のデータ分析シリーズを、Darts Lab での活用方法とあわせてまとめました。

自分のスタッツと公式データを比較することで、**今の実力がどの位置にあるか**、**次のフライトに上がるために何を改善すべきか**が明確になります。

---

## 1. レーティングとレンジ値の関係

> 出典: [DARTSLIVE公式コラム](https://www.dartslive.com/jp/news/127509/)

DL3のフルビットセンサーで計測される「レンジ」（グルーピング半径）のレーティング別平均値です。

| Rt | レンジ(mm) | Rt | レンジ(mm) | Rt | レンジ(mm) |
|----|----------|----|----------|----|----------|
| 1  | 111.9    | 7  | 65.7     | 13 | 63.0     |
| 2  | 93.2     | 8  | 63.9     | 14 | 64.1     |
| 3  | 82.9     | 9  | 63.4     | 15 | 65.9     |
| 4  | 76.7     | 10 | 62.8     | 16 | 67.7     |
| 5  | 72.3     | 11 | 62.5     | 17 | 71.2     |
| 6  | 68.2     | 12 | 62.0     | 18 | 59.2     |

### 注目ポイント

- **Rt2→5 の急激な改善**: 93.2mm → 72.3mm と約 20mm も縮小。初心者が中級者に移行する時期にグルーピングが最も改善する
- **Rt6〜17 の横ばい**: 68mm → 62mm 前後でほぼ安定。中級者以上ではレンジよりもブルへの精度が重要になる
- **Rt18 の最小値**: 59.2mm。トッププレイヤーはグルーピングも一段階小さい

### Darts Lab での活用

Darts Lab の**レンジ推移チャート**では、直近30Gのレンジ値の変化を折れ線グラフで確認できます。グラフ上にはご自身のレーティングに対応するベンチマーク値が破線で表示されるので、公式平均と比べて自分のグルーピングがどの位置にあるか一目でわかります。

---

## 2. レーティング別ブル率・ハットトリック確率

> 出典: [DARTSLIVE公式コラム](https://www.dartslive.com/jp/news/118581/)

レーティングごとの**1ラウンド（3投）あたりの確率**を公開した記事です。

| Rt | ブル率/投 | ノーブル率 | ロートン率 | ハット率 | ハット頻度 |
|----|----------|----------|----------|---------|----------|
| 4  | 16.7%    | 57.9%    | 7.0%     | 0.46%   | 1/217R   |
| 6  | 25.0%    | 42.2%    | 14.1%    | 1.56%   | 1/64R    |
| 8  | 33.3%    | 29.6%    | 22.2%    | 3.70%   | 1/27R    |
| 10 | 41.7%    | 19.9%    | 30.4%    | 7.24%   | 1/14R    |
| 12 | 50.0%    | 12.5%    | 37.5%    | 12.5%   | 1/8R     |
| 14 | 60.0%    | 6.4%     | 43.2%    | 21.6%   | 1/5R     |
| 18 | 83.3%    | 0.46%    | 34.7%    | 57.9%   | 1/1.7R   |

### 注目ポイント

- **Rt4で217ラウンドに1回**のハットトリックが、**Rt18では1.7ラウンドに1回**。実に127倍の差
- **Rt10のブル率は約42%**。2.4投に1回ブルに入る計算で、COUNT-UP換算では約840点ペース
- ノーブル率が50%を切る（＝半分以上のラウンドでブルに入る）のは**Rt5以上**

### Darts Lab での活用

Darts Lab の**レーティング別ベンチマーク表**にはこのデータが全て組み込まれています。自分のレーティングの行がハイライトされるので、現在の実力帯のブル率・ハット率の期待値をすぐに確認できます。

また、LINE通知の**COUNT-UP分析**では毎回のブル率が表示されるので、公式の期待値と日々比較できます。

---

## 3. レーティング分布（2025年版・4年ぶり更新）

> 出典: [DARTSLIVE公式コラム](https://www.dartslive.com/jp/news/119869/)

2025年版の最新レーティング分布データです。

| フライト | レーティング | プレイヤー比率 |
|---------|------------|-------------|
| N〜C    | 1〜3       | 約30%        |
| CC      | 4〜5       | 約18%        |
| B       | 6〜7       | 約22%        |
| BB      | 8〜9       | 約16%        |
| A       | 10〜11     | 約10%        |
| AA      | 12〜13     | 約3%         |
| SA      | 14〜18     | 約0.7%       |

### 注目ポイント

- **Bフライト（Rt6以上）はプレイヤーの4割** — 半数以上のプレイヤーはCC以下
- **Aフライト（Rt10以上）は全体の約1割** — 10人に1人の実力者
- **SAフライト（Rt14以上）は全体のわずか0.7%** — 約140人に1人
- **Rt18は2000人に1人（0.05%）** — まさにトップ・オブ・トップ

### Darts Lab での活用

自分のフライトが全プレイヤーの中でどの位置にあるかを知ることで、モチベーション管理に役立ちます。例えば「Aフライトになれば上位10%」という事実は、目標設定の大きな指針になります。

---

## 4. レーティング分布（初公開・2021年版）

> 出典: [DARTSLIVE公式コラム](https://www.dartslive.com/jp/news/74719/)

2020〜2021年の初公開データです。

- **Rt3が18.9%で最多** — ボリュームゾーンは初心者〜中級者の入口
- 2025年版と比較すると、4年間でプレイヤー層の分布がどう変化したかがわかる

2025年版と比べると全体的にレベルが上がっている傾向が見られ、ダーツプレイヤー全体のスキルが底上げされていることがわかります。

---

## 5. 都道府県別レーティングランキング

> 出典: [DARTSLIVE公式コラム](https://www.dartslive.com/jp/news/120609/)

都道府県ごとの平均レーティングランキングが公開されています。

- **1位: 愛媛県** — 意外な結果で話題に
- 地方 vs 都市部の実力差なども垣間見える

少し変わり種のデータですが、「自分の地域の平均レーティング」と比べることで新たなモチベーションが生まれるかもしれません。

---

## まとめ: 公式データ × Darts Lab の分析

これらの公式データは Darts Lab の各機能に組み込まれています。

| 公式データ | Darts Lab の対応機能 |
|-----------|-------------------|
| レンジ値 | レンジ推移チャート（ベンチマーク破線表示） |
| ブル率・ハット率 | レーティング別ベンチマーク表 |
| ブル率・ハット率 | LINE COUNT-UP通知（実績 vs 期待値） |
| レンジ値 | LINE通知（前回比較 + Rt目安表示） |
| レンジ値 | セッション比較カード |

自分のデータと公式統計を日々比較することで、**漠然とした「上手くなりたい」から、具体的な数値目標を持った練習**へとシフトできます。

Darts Lab を使って、効率的にレーティングアップを目指しましょう！

---

*データの出典は全てDARTSLIVE公式サイトのコラム記事です。最新の情報は[DARTSLIVE公式サイト](https://www.dartslive.com/jp/)をご確認ください。*
`,
  coverImageUrl: null,
  tags: ['ダーツ', '初心者', '技術'],
  isDraft: false,
  isFeatured: true,
  articleType: 'article',
};

async function seedArticle() {
  const snapshot = await db.collection('users').where('email', '==', ADMIN_EMAIL).get();

  let userId = '';
  let userName = '';
  if (!snapshot.empty) {
    const userDoc = snapshot.docs[0];
    userId = userDoc.id;
    userName = userDoc.data().displayName || '';
    console.log(`管理者ユーザ: ${userName} (${userId})`);
  } else {
    console.warn('管理者ユーザが見つかりません。userId空で作成します');
  }

  // 同じslugの記事が既にある場合はスキップ
  const existing = await db.collection('articles').where('slug', '==', article.slug).get();
  if (!existing.empty) {
    console.log(`同じスラッグの記事が既に存在します: ${article.slug}`);
    console.log('上書きする場合は先に削除してください');
    process.exit(0);
  }

  const docRef = db.collection('articles').doc();
  await docRef.set({
    ...article,
    userId,
    userName,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  console.log(`記事を作成しました: ${docRef.id}`);
  console.log(`スラッグ: ${article.slug}`);
  console.log(`URL: /articles/${article.slug}`);
}

seedArticle().catch((err) => {
  console.error('エラー:', err);
  process.exit(1);
});
