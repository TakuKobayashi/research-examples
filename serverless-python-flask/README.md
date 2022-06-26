# serverless-python-flask

Serverless Frameworkを使ってaws lambdaに向けて、python + flaskで開発してその内容をdeployできるようにするための環境構築調査のためのプロジェクトです

## 環境構築手順

### project作成

```
serverless create -t aws-python3 -p プロジェクトパス
```

### pythonのイントール

[こちら](https://www.python.org/downloads/) から該当のPythonをダウンロードする

### pipenv install

まず `pip` をupgradeする

```
pip install --upgrade pip
```

もしアクセス拒否になってエラーになったら

```
pip install --upgrade pip --user
```

【参考】

* [pipインストール時のアクセス拒否の対応メモ](https://qiita.com/kimisyo/items/2f7c2471d10db630d1ff)


その後 `pipenv` をインストールする

```
pip install pipenv
```

### Flaskなどインストールしていく

まずは開発するバージョンをserverlessに合わせた python のバージョンにする

```
pipenv --python 3.8
```

Flaskのインストール

```
pipenv install flask
```

### 各種serverless pluginのインストール

[package.json](./package.json) を作ってPluginのインストールなどはNPM経由で管理していく方がやりやすそう
その中で特に

* [serverless-python-requirements](https://www.serverless.com/plugins/serverless-python-requirements): `requirements.txt` に記述された、pythonで使用するライブラリの一覧をインストールし、`serverless deploy` コマンドでdeployするときに一緒にアップロードされる
ようになる
* [serverless-wsgi](https://www.serverless.com/plugins/serverless-wsgi): Flaskなどのserverライブラリをserverlessの中に含ませることができるためのもの

は最低限インストールして使用する

### `serverless.yml` に記述する内容について

[serverless-python-requirements](https://www.serverless.com/plugins/serverless-python-requirements) と [serverless-wsgi](https://www.serverless.com/plugins/serverless-wsgi) を適用させるために `serverless.yml` に以下のような項目を追記する


```serverless.yml
custom:
  wsgi:
    app: api.app
  pythonRequirements:
    dockerizePip: false

functions:
  app:
    handler: wsgi_handler.handler
    events:
      - http: ANY /
      - http: 'ANY {proxy+}'
```

上記の `custom.wsgi.app` の 名前について、serverとして実行するファイル名.app と記述する。たとえば Flaskのコードを記述してあるファイル名が `api.py` だった場合 `api.app` と記述する。
`custom.wsgi.packRequirements` を `false` と設定すると自動的に `requirements.txt` のライブラリを一緒にpackingされないようになります。
(指定なしの場合は自動的にpackingされる)

`custom.pythonRequirements.dockerizePip` はライブラリをdeployするpackageの中に固めるときに`docker`を使うかどうかの設定になります。
PythonのライブラリにはインストールするときにC++で書かれたものを一度事前にBuildするようなことがあります。 そのBuildはDockerを使って行われることが多いので、そのようなライブラリを使用するときにはこの設定を`true`にしてDockerの設定を確認する必要があります

`functions.app.handler` には `wsgi_handler.handler` という名前をしてしています。このとき、`app` の部分は適当な名前に置き換えることもできます。`wsgi_handler.handler` という名前は [serverless-wsgi](https://www.serverless.com/plugins/serverless-wsgi) を適用させるときにはこの名前に固定させる必要がある。`wsgi.handler` でもかつては可能であったが、こちらは `deprecated` された。
(`wsgi.handler` と設定するとこのようなwarningがでる。 `Please change "wsgi.handler" to "wsgi_handler.handler" in serverless.yml`)

### `serverless deploy`

`serverless deploy` コマンドを実行することでAWS Lambdaにdeployを行う。
このプロジェクトではライブラリの管理は `pipenv` で行っているので、deployを行う前には必ず、以下のコマンドを実行して `requirements.txt` に使用しているライブラリに一覧を抽出する。

```
pipenv lock -r > requirements.txt
```

こうやって、`requirements.txt` に使用するライブラリの一覧を抽出した後に

```
serverlss deploy
```

コマンドを実行してdeployを行う