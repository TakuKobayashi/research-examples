# ELA Inspector — Error Level Analysis API

画像の改ざん検出ツール。Hono + TypeScript で構築した REST API と、Next.js フロントエンドのモノレポです。

## プロジェクト構成

```
ela-api/
├── packages/
│   ├── worker/          # Cloudflare Workers 版 (Jimp)
│   ├── lambda-jimp/     # AWS Lambda 版 (Jimp, Pure JS)
│   ├── lambda-sharp/    # AWS Lambda 版 (Sharp, libvips)
│   └── frontend/        # Next.js フロントエンド
├── docs/
│   └── swagger.yml      # OpenAPI 3.1.0 仕様
├── package.json         # ルートワークスペース
└── .prettierrc
```

## セットアップ

```bash
# 依存関係のインストール
npm install

# フォーマッター実行（全パッケージ）
npm run format
```

## 開発

### Cloudflare Workers（ローカル）

```bash
cd packages/worker
npm run dev
# → http://localhost:8787
```

### フロントエンド（ローカル）

```bash
# .env.local を作成
cp packages/frontend/.env.example packages/frontend/.env.local
# NEXT_PUBLIC_API_BASE=http://localhost:8787

cd packages/frontend
npm run dev
# → http://localhost:3000
```

### AWS Lambda — Jimp 版（ローカル）

```bash
cd packages/lambda-jimp
npm run start
# → http://localhost:3001
```

### AWS Lambda — Sharp 版（ローカル）

```bash
cd packages/lambda-sharp
npm run start
# → http://localhost:3002
```

## API ドキュメント生成

```bash
cd packages/frontend
npm run build:docs
# → public/api-reference.html が生成される
```

ビルド後は `http://localhost:3000/api-reference.html` で API リファレンスを閲覧できます。

## デプロイ

### Cloudflare Workers + フロントエンド

1. Next.js を静的ビルドして `packages/worker/assets/` に配置:

```bash
cd packages/frontend
npm run build
# out/ ディレクトリが生成される

# フロントエンドのビルド成果物を worker の assets/ にコピー
cp -r out/* ../worker/assets/
```

2. Cloudflare Workers をデプロイ:

```bash
cd packages/worker
npm run deploy
```

`wrangler.jsonc` の `assets.directory` に `./assets` を指定しているため、
`/api/*` は Worker が処理し、それ以外は静的アセットが配信されます。

### AWS Lambda — Jimp 版

```bash
cd packages/lambda-jimp
npm run package   # lambda-jimp.zip を生成
npm run deploy    # AWS Lambda に zip をアップロード
```

**Lambda 設定例:**
- ランタイム: Node.js 22.x
- ハンドラー: `index.handler`
- メモリ: 512MB 以上推奨
- タイムアウト: 30秒以上推奨

### AWS Lambda — Sharp 版

```bash
cd packages/lambda-sharp
npm run package   # lambda-sharp.zip を生成
npm run deploy    # AWS Lambda に zip をアップロード
```

> **注意**: Sharp は Node.js の native addon を含みます。
> Lambda 環境（linux/x64）向けにビルドするには、同じアーキテクチャの環境（EC2 や Docker）でパッケージングするか、`npm install --platform=linux --arch=x64 sharp` でクロスコンパイルしてください。

**Lambda 設定例:**
- ランタイム: Node.js 22.x
- ハンドラー: `index.handler`
- メモリ: 256MB 以上推奨（Sharp は Jimp より高速・低メモリ）
- タイムアウト: 15秒以上推奨

## API エンドポイント

### `GET /api/health`

稼働確認。

```json
{
  "status": "ok",
  "runtime": "cloudflare-workers",
  "timestamp": "2025-05-01T00:00:00.000Z"
}
```

### `POST /api/ela`

ELA 解析を実行し、PNG 画像を返します。

**リクエスト** (`multipart/form-data`):

| フィールド | 型      | 必須 | デフォルト | 説明               |
|----------|---------|------|-----------|-------------------|
| image    | file    | ✅   | -         | JPEG/PNG/WebP, 最大10MB |
| quality  | integer | ❌   | 75        | JPEG 再圧縮品質 (1-99) |
| scale    | integer | ❌   | 10        | 差分増幅係数 (1-50) |

**レスポンス**: PNG バイナリ

```bash
curl -X POST \
  -F "image=@photo.jpg" \
  -F "quality=75" \
  -F "scale=10" \
  https://your-worker.workers.dev/api/ela \
  --output ela-result.png
```

## ライブラリ比較

| 項目 | Jimp (Worker/Lambda) | Sharp (Lambda) |
|-----|---------------------|---------------|
| 実装 | Pure JavaScript | libvips (native) |
| Cloudflare Workers | ✅ 対応 | ❌ native addon 不可 |
| 処理速度 | 低速 | 高速 |
| メモリ使用量 | 高め | 低め |
| インストール | シンプル | クロスコンパイル必要 |

## ELA の仕組み

1. **再圧縮**: 元画像を指定品質で JPEG 再圧縮
2. **差分計算**: 元画像と再圧縮画像のピクセル差分（RGB チャンネルごと）
3. **増幅**: `min(255, |diff| * scale)` で可視化

明るい領域（白）= 圧縮エラーが大きい = **改ざんの疑い**  
暗い領域（黒）= 圧縮エラーが小さい = 改ざんなしの可能性が高い

## フォーマッター

全パッケージに Prettier を導入済みです。

```bash
# ルートから全パッケージをフォーマット
npm run format

# チェックのみ（CI 向け）
npm run format:check

# 個別パッケージ
cd packages/worker && npm run format
cd packages/lambda-jimp && npm run format
cd packages/lambda-sharp && npm run format
cd packages/frontend && npm run format
```
