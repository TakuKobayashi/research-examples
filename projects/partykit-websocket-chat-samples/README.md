# ChatApp — Cloudflare Workers + Durable Objects チャットサンプル

モノリポジトリ構成のリアルタイムチャットアプリ。

## 構成

```
chat-app/
├── apps/
│   ├── web/          # Next.js フロントエンド (静的エクスポート)
│   ├── worker-d1/    # Hono バックエンド + Drizzle ORM + D1 (SQLite)
│   └── worker-kv/    # Hono バックエンド + KV Store
└── packages/
    └── shared/       # 共有型定義
```

## 技術スタック

| 項目 | 技術 |
|------|------|
| バックエンド | Hono + TypeScript |
| リアルタイム | Cloudflare Durable Objects (WebSocket) |
| DB (D1版) | Cloudflare D1 + Drizzle ORM |
| DB (KV版) | Cloudflare KV |
| フロントエンド | Next.js 14 (静的エクスポート) |
| 認証 | セッション + パスワード(PBKDF2) + パスキー(WebAuthn) |
| スタイル | Pure CSS (Tailwind なし) |

## セットアップ

### 前提条件
- Node.js 20+
- pnpm 9+
- Cloudflare アカウント
- Wrangler CLI (`npm install -g wrangler`)

### インストール

```bash
pnpm install
```

### D1 版のセットアップ

```bash
# D1 データベース作成
wrangler d1 create chat-d1-db

# wrangler.toml の database_id を更新後
cd apps/worker-d1

# マイグレーション実行
wrangler d1 migrations apply chat-d1-db --local  # ローカル
wrangler d1 migrations apply chat-d1-db          # 本番

# JWT シークレット設定
wrangler secret put JWT_SECRET

# 開発サーバー起動
pnpm dev:d1
```

### KV 版のセットアップ

```bash
# KV 名前空間作成 (5つ作成)
wrangler kv namespace create USERS_KV
wrangler kv namespace create ROOMS_KV
wrangler kv namespace create MESSAGES_KV
wrangler kv namespace create SESSIONS_KV
wrangler kv namespace create CHALLENGES_KV

# wrangler.toml の各 id を更新後
pnpm dev:kv
```

### フロントエンド開発

```bash
# フロントのみ開発 (バックエンドが別ポートで動いている場合)
pnpm dev:web
```

## API エンドポイント

### 認証

| Method | Path | 説明 |
|--------|------|------|
| POST | `/api/auth/register` | メール+パスワード登録 |
| POST | `/api/auth/login` | メール+パスワードログイン |
| POST | `/api/auth/logout` | ログアウト |
| GET  | `/api/auth/me` | 現在のユーザー情報 |
| POST | `/api/auth/passkey/register/options` | パスキー登録オプション取得 |
| POST | `/api/auth/passkey/register/verify` | パスキー登録検証 |
| POST | `/api/auth/passkey/auth/options` | パスキー認証オプション取得 |
| POST | `/api/auth/passkey/auth/verify` | パスキー認証検証 |

### ルーム

| Method | Path | 説明 |
|--------|------|------|
| GET    | `/api/rooms` | ルーム一覧 |
| POST   | `/api/rooms` | ルーム作成 |
| GET    | `/api/rooms/:id` | ルーム詳細 |
| PUT    | `/api/rooms/:id` | ルーム更新 (作成者のみ) |
| DELETE | `/api/rooms/:id` | ルーム削除 (作成者のみ) |
| GET    | `/api/rooms/:roomId/messages` | メッセージ履歴 |

### WebSocket

```
ws://[host]/ws/:roomId
Authorization: Bearer <token> ヘッダー or URL クエリパラメータ経由
```

#### WebSocket メッセージ形式

```json
// 送信
{ "type": "message", "content": "こんにちは" }
{ "type": "ping" }

// 受信
{ "type": "history", "data": [...messages] }
{ "type": "message", "data": { id, roomId, userId, displayName, content, createdAt } }
{ "type": "join", "data": { userId, displayName } }
{ "type": "leave", "data": { userId, displayName } }
{ "type": "pong", "data": null }
```

## デプロイ

### D1版

```bash
# 本番 wrangler.toml の設定を確認後
pnpm deploy:d1
```

### KV版

```bash
pnpm deploy:kv
```

## 本番環境の設定

### wrangler.toml を更新

```toml
[vars]
RP_ID = "yourdomain.com"
RP_NAME = "Your App Name"
RP_ORIGIN = "https://yourdomain.com"
ENVIRONMENT = "production"
```

### シークレットを設定

```bash
wrangler secret put JWT_SECRET  # D1版
```

## 将来の拡張 (Unity/Android/iOS)

WebSocket 接続は標準仕様に準拠しているため、各プラットフォームから直接接続可能です。

```
接続: ws(s)://[host]/ws/[roomId]?token=[sessionToken]
メッセージ送信: {"type":"message","content":"..."}
```

認証トークンは `/api/auth/login` または `/api/auth/passkey/auth/verify` のレスポンスで取得できます。
