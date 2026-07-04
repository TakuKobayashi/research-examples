# serverless-nestjs-sample について

[NestJS](https://nestjs.com/)と[Serverless Framework](https://www.serverless.com/) を用いてAWS Lambdaにアップして使用できるか、開発を進めることができるかどうか、試してみたプロジェクト

# 環境構築

ここに書いてある通りに実践していけば環境構築することができる
[NestJSをLambdaに載せたい](https://zenn.dev/saitom_tech/articles/nestjs_on_lambda)

# 使い方

## ローカルで確認する

NestJSをBuildする

```
yarn run build
```

Buildが完了した後 ローカルサーバーを立ち上げる

```
yarn run serverless offline start
```

サーバーが立ち上がったら http://localhost:3000/dev/hello にアクセスすると何かが表示されます

## AWS Lambdaにデプロイする

NestJSをBuildする

```
yarn run build
```

Buildが完了した後にdeployする

```
yarn run serverless deploy
```

デプロイが完了したら確認できるURLに `/hello` のパスを付け加えたURLにアクセスすると何かが表示されます


# 課題リスト

* 毎回 NestJSをBuildしなくても開発を進めることができるようにする方法を調査する


# 参考

* [NestJS Doc](https://docs.nestjs.com/)
* [NestJSをLambdaに載せたい](https://zenn.dev/saitom_tech/articles/nestjs_on_lambda)