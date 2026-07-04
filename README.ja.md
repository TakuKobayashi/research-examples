# README.ja.template.md

# research-examples

[English README](./README.md)

多種多様な技術、サービス、ライブラリ、フレームワーク、APIなどを実際に触りながら調査・検証した内容を蓄積していくリポジトリです。

新しい技術やサービスを知ったとき、ドキュメントを読むだけではなく、実際に動くものを作りながら試してみることで理解を深めています。

ここには、その過程で作成したサンプル、実験コード、PoC（概念実証）、技術検証の成果などを保存しています。

多くのプロジェクトは小規模なサンプルや検証用コードですが、そこで得られた知見や実装パターンは、将来の開発で再利用できる技術資産として活用しています。

また、技術調査の結果が複数のリポジトリへ分散してしまうことを防ぎ、後から検索・参照しやすくすることも目的のひとつです。

---

## 開発フェーズ

- incubating → アイディア具現化中
- validating → 検証・改善中
- launched → 参照実装として利用可能
- archived → 保守停止・技術資産化

---

## プロジェクト一覧

| プロジェクト                                                                       | 説明                                                                                                                                     | status     |
| ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| [AndroidScreenRecord](./projects/AndroidScreenRecord/)                             | Android の MediaProjection とフォアグラウンドサービスを使い、端末画面の録画処理を検証するサンプルプロジェクト。                          | incubating |
| [AndroidWebRTCSample](./projects/AndroidWebRTCSample/)                             | Android アプリで WebRTC のカメラ映像取得、SurfaceViewRenderer 表示、カメラ切り替えなどを検証するサンプルプロジェクト。                   | incubating |
| [aws-lambda-cdk-hono-images](./projects/aws-lambda-cdk-hono-images/)               | AWS CDK と Hono を使い、Lambda 上で画像取得や HTTP API の構成を検証する TypeScript サンプルプロジェクト。                                | incubating |
| [chat-app](./projects/chat-app/)                                                   | PartyKitを活用し、リアルタイム通信・WebSocket構成・無料運用可能性を学ぶためのマルチプラットフォーム対応チャットアプリサンプル。          | incubating |
| [cloudflare-hono-sample](./projects/cloudflare-hono-sample/)                       | Cloudflare Workers 上で Hono、KV、D1、Prisma を組み合わせた API 実装を検証するサンプルプロジェクト。                                     | incubating |
| [gather-app](./projects/gather-app/)                                               | Gather風バーチャルワークスペースサービス。PartyKitとLiveKitを用いたWebSocket / WebRTC構成やオンライン空間設計を検証。                    | incubating |
| [gatsby-cloud-functions](./projects/gatsby-cloud-functions/)                       | Gatsby Cloud Functions の使い方を調査するため、Gatsby ブログスターターをベースに機能検証を行うサンプルプロジェクト。                     | incubating |
| [github-api-file-upload](./projects/github-api-file-upload/)                       | GitHub API と Octokit を使い、リポジトリ内ファイルの作成・更新・アップロード処理を検証するサンプルプロジェクト。                         | incubating |
| [github-webhook-api-workflows](./projects/github-webhook-api-workflows/)           | GitHub API で Actions のワークフロー一覧、実行履歴、dispatch 実行などを扱う API を検証する Serverless サンプルプロジェクト。             | incubating |
| [GodotSample](./projects/GodotSample/)                                             | Godot 4 の基本プロジェクト構成や 3D シーン作成を試すための小規模な検証サンプル。                                                         | incubating |
| [japanese-address-research](./projects/japanese-address-research/)                 | 日本の住所データを使い、住所の正規化や検索・変換処理の検証を行う調査用プロジェクト。                                                     | incubating |
| [jets-examples](./projects/jets-examples/)                                         | Ruby の Jets フレームワークを使ったサーバーレスアプリケーション構成を調査するためのサンプルプロジェクト。                                | incubating |
| [livekit-gather-app-sample](./projects/livekit-gather-app-sample/)                 |                                                                                                                                          | incubating |
| [mermaid-doc-sample](./projects/mermaid-doc-sample/)                               | Mermaid 記法で ER 図などの技術ドキュメント用ダイアグラムを作成・表示できるか検証するサンプルプロジェクト。                               | incubating |
| [MLKitSample](./projects/MLKitSample/)                                             | Android の CameraX と Google ML Kit を使い、顔検出やバーコード読み取りをカメラ映像から行う検証サンプル。                                 | incubating |
| [mmd-parser-sample](./projects/mmd-parser-sample/)                                 | mmd-parser を使い、MMD の PMX モデルファイルや VMD モーションファイルを Node.js/Serverless 環境で読み込む検証プロジェクト。              | incubating |
| [NearbyConnectionSample](./projects/NearbyConnectionSample/)                       | Android の Nearby Connections API を使い、近距離端末間の広告、検出、接続、ペイロード送受信を検証するサンプルプロジェクト。               | incubating |
| [netlify-cms-functions](./projects/netlify-cms-functions/)                         | Netlify Functions と Netlify CMS を Gatsby サイトへ組み込み、CMS 管理画面や Functions の動作を調査するサンプルプロジェクト。             | incubating |
| [netlify-cms-functions-typescript](./projects/netlify-cms-functions-typescript/)   | TypeScript 対応の Gatsby Material Starter をベースに、Netlify CMS や Gatsby テーマ構成を検証するサンプルプロジェクト。                   | incubating |
| [nextjs-cloudflare-pages-sample](./projects/nextjs-cloudflare-pages-sample/)       | Next.js で作成した静的サイトを Cloudflare Pages にデプロイする手順や構成を検証するサンプルプロジェクト。                                 | incubating |
| [nextjs-spotify-player](./projects/nextjs-spotify-player/)                         | Spotify Web Playback SDK を Next.js から利用し、ブラウザ上で Spotify の再生操作を行う方法を検証するサンプルプロジェクト。                | incubating |
| [nextjs-typescript-blog-sample](./projects/nextjs-typescript-blog-sample/)         | Next.js と TypeScript で Markdown ベースのブログサイトを作成し、動的ルーティングや Markdown 変換を検証するサンプルプロジェクト。         | incubating |
| [nextjs-webrtc-sample](./projects/nextjs-webrtc-sample/)                           | Next.js 上で WebRTC を使った通信機能を試し、ブラウザ間のリアルタイム通信を検証するサンプルプロジェクト。                                 | incubating |
| [notion-api-examples](./projects/notion-api-examples/)                             | Notion API と Notion SDK を使い、Fastify と Serverless Framework から Notion データを扱う方法を検証するサンプルプロジェクト。            | incubating |
| [partykit-websocket-chat-samples](./projects/partykit-websocket-chat-samples/)     |                                                                                                                                          | incubating |
| [PushNotification](./projects/PushNotification/)                                   | Android のプッシュ通知やネイティブ連携の検証を目的とした、Kotlin と C++ ネイティブコードを含む Android サンプルプロジェクト。            | incubating |
| [python-aws-lambda](./projects/python-aws-lambda/)                                 | Python で AWS Lambda 向けのアプリケーションを構築し、Chalice や依存関係管理を含む開発環境を検証するサンプルプロジェクト。                | incubating |
| [python-opencv](./projects/python-opencv/)                                         | Python と OpenCV を使った画像処理やローカル実行環境を検証するためのサンプルプロジェクト。                                                | incubating |
| [serverless-ffmpeg](./projects/serverless-ffmpeg/)                                 | Serverless Framework と Express を使い、AWS Lambda 上で ffmpeg を利用する構成を検証する TypeScript サンプルプロジェクト。                | incubating |
| [serverless-github-upload-reources](./projects/serverless-github-upload-reources/) | Serverless Framework、Fastify、Octokit を使い、GitHub リポジトリへのリソースアップロード API を検証するサンプルプロジェクト。            | incubating |
| [serverless-google-photos](./projects/serverless-google-photos/)                   | Google Photos API と googleapis を Serverless Framework 上で扱い、写真データ連携を検証する TypeScript サンプルプロジェクト。             | incubating |
| [serverless-nestjs-sample](./projects/serverless-nestjs-sample/)                   | NestJS アプリケーションを Serverless Framework と serverless-express で AWS Lambda に載せる構成を検証するサンプルプロジェクト。          | incubating |
| [serverless-plantscale-mysql](./projects/serverless-plantscale-mysql/)             | Serverless Framework と Fastify を使い、PlanetScale MySQL との接続やサーバーレス API 構成を検証するサンプルプロジェクト。                | incubating |
| [serverless-puppeteer](./projects/serverless-puppeteer/)                           | AWS Lambda 上で puppeteer-core と chromium を動かし、サーバーレス環境でのブラウザ自動操作を検証するサンプルプロジェクト。                | incubating |
| [serverless-python-docker](./projects/serverless-python-docker/)                   | Serverless Framework で Python と Docker を使い、AWS Lambda 向けコンテナ実行環境を検証するサンプルプロジェクト。                         | incubating |
| [serverless-python-flask](./projects/serverless-python-flask/)                     | Serverless Framework を使い、Python と Flask のアプリケーションを AWS Lambda にデプロイする構成を検証するサンプルプロジェクト。          | incubating |
| [turnless-webrtc-sample](./projects/turnless-webrtc-sample/)                       | TURN サーバーを使わず STUN のみで WebRTC のビデオチャットとデータチャネル通信を試す Next.js サンプルプロジェクト。                       | incubating |
| [twitter-api-v2-sample](./projects/twitter-api-v2-sample/)                         | Twitter API v2 SDK を Serverless Framework と Fastify から利用し、API 連携を検証する TypeScript サンプルプロジェクト。                   | incubating |
| [webpush-sample-with-demo](./projects/webpush-sample-with-demo/)                   | Cloudflare Workers Assets と Next.js を使い、Web Push API と Firebase Cloud Messaging によるブラウザ通知配信を検証するデモプロジェクト。 | incubating |
| [WifiP2PSample](./projects/WifiP2PSample/)                                         | Android の Wi-Fi Direct / Wi-Fi P2P を使った端末間通信の基礎を検証するためのサンプルプロジェクト。                                       | incubating |

---

## 開発フロー

### 新規プロジェクト追加

```bash
npm run projects:add -- --name my-new-project --description "Project description"
```

### README同期

```bash
npm run projects:sync
```

### project.yml検証

```bash
npm run projects:validate
```

---

## Submodule運用（分離後）

### 初回clone

```bash
git clone --recurse-submodules <repo-url>
```

### 他PCで最新取得（親 + 全submodule）

```bash
npm run projects:pull
```

### 開発内容を全反映

```bash
npm run projects:push
```

### 状態確認

```bash
npm run projects:status
```

---

## リポジトリ運用方針

このリポジトリでは、まず `projects/` 配下で技術調査やサンプル実装を行います。

検証が進み、独立して管理したいプロジェクトや再利用価値の高い実装については、個別リポジトリへ切り出しつつ Git Submodule として管理を継続します。

これにより、

- 技術サンプルの集約
- プロジェクトごとの独立運用
- 実装パターンの再利用
- 一覧管理

を両立しています。

運用イメージ:

```
projects/
├── project-a
├── project-b
└── project-c
```

↓

```
projects/
├── project-a (Submodule)
├── project-b (Submodule)
└── project-c
```

### プロジェクトを独立リポジトリ化する

```
cd projects/my-project
```

GitHubで新規リポジトリを作成後、pushします。

```
git init
git add .
git commit -m "Initial commit"

git branch -M main

git remote add origin https://github.com/<user>/my-project.git

git push -u origin main
```

親リポジトリ側からディレクトリを削除します。

```
git rm -r projects/my-project

git commit -m "Remove local project"
```

その後 Git Submodule として再登録します。

```
git submodule add https://github.com/<user>/my-project.git projects/my-project

git commit -m "Add submodule"
```

### Submodule込みでcloneする

```
git clone --recursive <repository-url>
```

### 後からSubmoduleを取得する

```
git submodule update --init --recursive
```

### 全Submoduleを最新化する

```
git submodule update --remote
```

### 誤って追加したSubmoduleを削除する

```
git submodule deinit -f projects/my-project

git rm -f projects/my-project

rm -rf .git/modules/projects/my-project
```
