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

* incubating → アイディア具現化中
* validating → 検証・改善中
* launched → 参照実装として利用可能
* archived → 保守停止・技術資産化

---

## プロジェクト一覧

| プロジェクト | 説明 | status |
| ------------ | ---- | ------ |
{{PROJECT_TABLE_JA}}

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

* 技術サンプルの集約
* プロジェクトごとの独立運用
* 実装パターンの再利用
* 一覧管理

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
