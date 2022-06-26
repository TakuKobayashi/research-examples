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

* [serverless-python-requirements](https://www.serverless.com/plugins/serverless-python-requirements)
* [serverless-wsgi](https://www.serverless.com/plugins/serverless-wsgi)

は最低限インストールして使用する