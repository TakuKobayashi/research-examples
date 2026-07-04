# netlify-cms-functions について

## メモ

### netlify functionsについて

`プロジェクトベース/netlify/functions/`

以下のディレクトリにスクリプトを書いておくとNetlifyへのDeploy時に勝手に読み取ってDeployしてくれる
`functions`のURLは `プロジェクトベース/netlify/functions/hello.js` といったファイル名でスクリプトを置いていると

`https://サイトドメイン/.netlify/functions/hello`

が `Netlify Functions` の実行先のURLとなる

### netlify CMSについて

CMS(WordpressのようにWeb管理ツールからwebサイトの編集が可能な管理画面)の導入についてのメモ

まずは導入は `netlify-cms-app` と `gatsby-plugin-netlify-cms` をいれる

```
npm install netlify-cms-app gatsby-plugin-netlify-cms
```

`gatsby-config.js` に追加

```gatsby-config.js
module.exports = {
  plugins: [
    `gatsby-plugin-netlify-cms`,
  ],
}
```

管理画面の設定ファイルは
`static/admin/config.yml`
にあるymlを編集して管理ツールの設定を行う

#### 参考

* [Gatsby.jsでnetlify cmsを使ってみる](https://zenn.dev/enuenu/articles/2151089c11e8e0)