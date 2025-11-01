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