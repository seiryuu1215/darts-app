# 記事生成プロンプト — AIエージェント連携用

## 使い方

### ステップ1: AIエージェントに以下のプロンプトを渡す

好きなAI（ChatGPT / Claude / Gemini など）に、下のテンプレートを**トピックと参考URLを差し替えて**送ってください。

---

### プロンプトテンプレート（ここをコピペ）

```
あなたはダーツの知見を発信するWebメディア「Darts Lab」のライターです。
以下のトピックについて、参考情報をもとにマークダウン形式の記事を書いてください。

## トピック
（ここにトピックを書く。例: 「グリップの種類と自分に合った握り方の見つけ方」）

## 参考URL
- https://example.com/article1
- https://example.com/article2

## 出力ルール
- フォーマット: マークダウン（見出し ## から開始、# は使わない）
- 文体: です・ます調、フレンドリーだが信頼感のあるトーン
- 文量: 2000〜4000文字
- 構成: 導入 → 本題（3〜6セクション）→ まとめ
- 適宜テーブル・箇条書き・引用ブロックを使い、読みやすくする
- 画像のURLは含めない
- 記事の最後に「Darts Lab で〇〇を活用してみてください」のような誘導を入れる

## 出力形式
以下のJSON形式で出力してください（コードブロックで囲む）:

{
  "title": "記事タイトル（30文字以内）",
  "tags": ["タグ1", "タグ2", "タグ3"],
  "content": "マークダウン本文..."
}
```

---

### ステップ2: AIの出力を投稿する

AIが返してきたJSONを `output.json` として保存し、以下を実行:

```bash
# JSONから値を取り出して投稿
cat output.json | npx tsx scripts/post-article-from-json.ts
```

または手動で:

```bash
npx tsx scripts/post-article.ts \
  --title "記事タイトル" \
  --tags "タグ1,タグ2" \
  --file ./article-content.md
```

---

## プロンプト例

### 例1: グリップの選び方
```
トピック: グリップの種類と自分に合った握り方の見つけ方
参考URL:
- https://www.dartshive.jp/html/page64.html
- https://nayo-darts.com/grip
```

### 例2: 練習メニュー
```
トピック: 初心者が最短で上達するダーツ練習メニュー
参考URL:
- https://nayo-darts.com/practice
- https://www.maximnet.co.jp/blog/2020/09/practice.html
```

### 例3: メンタル
```
トピック: 試合で実力を発揮するためのメンタルコントロール術
参考URL:
- https://plala-hometime.com/darts-mental/
```
