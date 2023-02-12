# nextjs-cloudflare-pages-sample

nextjsで開発したものをcloudflare pagesにデプロイして表示してみたサンプルプロジェクト

CLIでデプロイする場合は以下のコマンドを順次実行していけばデプロイ可能

```
npm install -g wrangler
```

```
wrangler login
```

```
yarn run export
```

```
CLOUDFLARE_ACCOUNT_ID=cloudflare_account_id npx wrangler pages publish out
```