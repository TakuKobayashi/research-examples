# chaliceについて

[chalice](https://github.com/aws/chalice) はAWS Lambda開発用ツールです
uvを使ってプロジェクトの作成と導入を行います。
以下のコマンドを実行してプロジェクトを作成する

```
uv init python-aws-lambda
```

[chalice](https://github.com/aws/chalice) を追加する

```
uv add chalice
```

[chalice](https://github.com/aws/chalice) のプロジェクトを初期化する

```
uv run chalice new-project python-aws-lambda-sample
```

あとは uv のプロジェクトと [chalice](https://github.com/aws/chalice) のプロジェクトの構成を整える。
以下のコマンドを実行するとAWS Lambdaへとdeployする。

```
uv run chalice deploy --stage dev
```