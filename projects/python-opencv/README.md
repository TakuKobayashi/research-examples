# pythonでのプロジェクト構築メモ

1. [uv](https://docs.astral.sh/uv/) のインストール
2. [uv](https://docs.astral.sh/uv/) のインストールが完了したらpythonをインストールする。↓は `python3.12系` のインストールコマンド例

```
uv python install 3.12
```

3. 仮想環境で `python 3.12` を実行できるようにする

```
uv venv --python 3.12
```

4. pythonで開発するプロジェクトの初期化。↓は `example` という名前のプロジェクトの初期化コマンドの実行例

```
uv init example
```

# uvを使ったライブラリの管理

## ライブラリのインストール

以下は `opencv-python` をインストールするときのコマンド

```
uv add opencv-python
```

インストールが完了すると `pyproject.toml` に追加したライブラリが追記され、`uv.lock` にインストールされたライブラリのバージョンなどの詳細情報が追記される

## pythonスクリプトの実行

例えば、`main.py` ファイルのpythonファイルの実行は以下のようなコマンドで実行できる

```
uv run .\main.py
```

引数をつけて実行した内容を受け取る場合は`main.py` ファイルを以下のような感じで書き換える

```python
import sys

print(" ".join(sys.argv[1:]))
```

その上で以下のようなコマンドを実行して、その結果を得られる

```
uv run main.py test

uv run main.py hello world!
```