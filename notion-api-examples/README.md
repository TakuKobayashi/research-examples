# notion-api-examples とは?

Notion のAPIを試してみて読み込んだり書き込んだりしてみるプロジェクト

## やること・概念

### 1. アプリの作成(API Keyを取得)

[My integrations](https://www.notion.so/my-integrations) よりIntegration(いわゆるアプリ) を作成する。このときOAuthができるようにするには `Public integration` を選択して `redirect uri` などの各種情報を入力する(必須) 一応使う分には `Internal` で十分。
Integrationを作成したら `Internal Integration Token` が作成されるのでそこに記述されている値を記録する。

### @notionhq/client をインストールする(Node.JSでNotion APIを実行する場合)

[@notionhq/client](https://github.com/makenotion/notion-sdk-js) を導入してNotion のAPIを実行していく(結局はWeb APIなのでAPIを直に実行することでも情報を取得することができる)

```
yarn add @notionhq/client
```

基本的な使い方は

```typescript
const { Client } = require("@notionhq/client")

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
})
```

このような感じ
このとき `process.env.NOTION_TOKEN` で使用している値が上記で発行した `Internal Integration Token` の値
(`Internal Integration Token` はBotの扱い。Bot自身のAccessTokenという意味なので他のUserの情報を取得する場合は `Public integration` の設定にして OAuth認可を通して `Integration Token` を取得して用いる)

### Pageの一覧をAPIから取得する

Notionで作成したPagesより `Add Connections` を選択して[My integrations](https://www.notion.so/my-integrations) で作成した integration を追加する。
この状態で以下のようぶ `search` をAPIより実行すると `Connection` されているページの一覧やDatabaseの情報を取得することができる。(integration はあくまでBotの扱いなので `Add Connections` を実行してBotとして追加されていないとPageなどのデータにアクセスができない)

```typescript
const { Client } = require("@notionhq/client")

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
})

async () => {
  const response = await notion.search({})
}
```


## 参考

* [Notion API利用のためのトークン取得・初期設定方法](https://programming-zero.net/notion-api-setting/)