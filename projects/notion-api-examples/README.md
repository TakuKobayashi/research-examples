# notion-api-examples とは?

Notion のAPIを試してみて読み込んだり書き込んだりしてみるプロジェクト

## やること・概念

### 1. アプリの作成(API Keyを取得)

[My integrations](https://www.notion.so/my-integrations) よりIntegration(いわゆるアプリ) を作成する。このときOAuthができるようにするには `Public integration` を選択して `redirect uri` などの各種情報を入力する(必須) 一応使う分には `Internal` で十分。
Integrationを作成したら `Internal Integration Token` が作成されるのでそこに記述されている値を記録する。

### 2. @notionhq/client をインストールする(Node.JSでNotion APIを実行する場合)

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

### 3. Pageの一覧をAPIから取得する

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

### 4. Pageを作成する

以下のように `notion.pages.create` を実行することで新しくPageを作成することができます。

```typescript
const response = await notion.pages.create({
  parent: {
    type: 'page_id',
    page_id: 'page_id',
  },
  properties: {
    title: [
      {
        text: {
          content: 'Notion API Test',
        },
      },
    ],
  },
});
```

Pageを作成するときは親となるPageの `page_id` を指定する必要がある。つまりPageはどこかのPageの子供に作られる。
また作成する親となるPageにも `Add Connections` を選択して[My integrations](https://www.notion.so/my-integrations) で作成した integration を事前に追加しておく必要がある。

### 5. Databaseを作成する

以下のように `notion.databases.create` を実行することでPageの中に新しくDatabaseを作成することができます

```typescript
const response = await notion.databases.create({
  parent: {
    type: 'page_id',
    page_id: 'page_id',
  },
  properties: {
    text: {
      title: {},
    },
    ...
  }
});
```

DatabaseはPageの中に作られるので `parent` にはそのPageの `page_id` を指定する。
`properties` にDatabaseに追加する列を種類を指定しつつ追加していく。上記の場合 `text` という名前の文字列を入力できる

### 6. Databaseにデータを追加する

Databaseにデータを追加する場合は `notion.pages.create` を実行するときに `database_id` を指定することでDatabaseにデータを追加することができる
上記で作成したDatabaseに対して以下のようにすることでデータを追加します。

```typescript
const response = await notion.pages.create({
  parent: {
    type: 'database_id',
    database_id: 'database_id',
  },
  properties: {
    text: {
      title: [
        {
          text: {
            content: 'hogehoge',
          },
        },
      ],
    },
  },
});
```

ここでは 列名が `text` の項目に `hogehoge` という文字列のデータを追加しています。
その他データの更新、削除は [Notion APIでデータベースを操作する](https://qiita.com/thomi40/items/fe2a828746f31ad827ba) を参考にして、同様に実施することができます。

## その他情報の取得について

### databaseの情報を取得したい

以下のように `notion.search` を実行するときに `filter` で `value: 'database'` 、 `property: 'object'` 都することでdatabaseの情報とその中に入っている情報を取得することができます

```typescript
const response = await notion.search({
  filter: {
    value: 'database',
    property: 'object'
  },
});
return response;
```

取得したdatabaseの情報を基に各種更新や削除をかけるようにAPIを実行するとよさそう。

### Page内にあるBlockの情報を取得したい

Page内にあるBlockの情報を取得する場合は `notion.blocks.children.list` を以下のように実行すると取得できます。

```typescript
const response = await notion.blocks.children.list({
  block_id: 'page_id',
  page_size: 100,
});
return response;
```

ドキュメントなどでは `block_id` を指定するように書かれているが、実態は`page_id` を指定するとBlockの情報を取得できる。
一回でとれるBlockの数はMAXで100件まで、件数は `page_size` にて指定できる。

### Page内にBlockを書き込んでいきたい

以下のように `notion.blocks.children.append` を実行することでPage内にさまざまな要素を記述していくことができます(Blockを末尾に追加するという意味)

```typescript
const response = await notion.blocks.children.append({
  block_id: 'page_id',
  children: [
    {
      heading_2: {
        rich_text: [
          {
            text: {
              content: 'Lacinato kale',
            },
          },
        ],
      },
    },
    ...
  ],
});
return response;
```

ドキュメントなどでは `block_id` を指定するように書かれているが、実態は`page_id` を指定するとPage内にBlockを追加することができる。
グラフとか画像とかも追加することができるかも?

## 参考

* [Notion API Referernce](https://developers.notion.com/reference)
* [Notion API利用のためのトークン取得・初期設定方法](https://programming-zero.net/notion-api-setting/)
* [Notion APIでデータベースを操作する](https://qiita.com/thomi40/items/fe2a828746f31ad827ba)
* [Notion APIのデータ構造を実際にAPIを叩きながら理解する](https://qiita.com/senju797/items/0e3bfb1c8f0b7b035f46)