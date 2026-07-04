# gather-app

Gather 風の近接ビデオチャット Web アプリ

## ⚠️ 既存プロジェクト内に配置する場合の注意

**gather-app は必ず独立したディレクトリとして配置してください。**
既存の pnpm monorepo (例: kayaba-broadway) の中に展開すると、
ワークスペースが混在してビルドエラーになります。

```
# 推奨: 独立したディレクトリに配置
~/workspaces/gather-app/   ← ここに展開する

# NG: 既存 monorepo の中に展開
~/workspaces/kayaba-broadway/gather-app/  ← これは避ける
```

どうしても既存プロジェクト内に置く場合は、
kayaba-broadway の `pnpm-workspace.yaml` から
`gather-app` 以下が拾われないようにしてください。

---

## 技術スタック

| レイヤー | 技術 |
|---|---|
| フロントエンド | AngularJS 1.8 + TypeScript + Vite |
| ビデオチャット | LiveKit Client SDK v2 |
| 位置情報同期 | PartyKit WebSocket |
| Web API | Cloudflare Workers + Hono (TypeScript) |
| ローカル LiveKit | Docker Compose (livekit-server + Redis) |
| モノレポ管理 | Turborepo + pnpm workspaces |

## ディレクトリ構成

```
gather-app/
├── apps/
│   ├── gather-frontend/        # AngularJS + Vite         :5173
│   ├── gather-livekit-api/     # Cloudflare Workers + Hono :8787
│   └── gather-partykit/        # PartyKit WebSocket        :1999
├── packages/
│   └── shared/                 # 共有型定義 + 近接距離定数
├── docker-compose.yml          # LiveKit Server + Redis
├── livekit.yaml                # LiveKit 設定
├── pnpm-workspace.yaml
└── turbo.json
```

---

## クリーンインストール & 起動

```bash
# 1. 既存の gather-app フォルダがある場合は完全削除してから展開
#    Windows: rd /s /q gather-app
#    Mac/Linux: rm -rf gather-app

# 2. zip を展開して移動
cd gather-app

# 3. 依存パッケージのインストール
pnpm install

# 4. LiveKit サーバーを起動（Docker が必要）
pnpm run livekit:up

# 5. 全サーバーを一括起動
pnpm run dev
```

起動後:
- フロントエンド: http://localhost:5173
- LiveKit Token API: http://localhost:8787
- PartyKit WS: ws://localhost:1999

---

## 本番デプロイ

### API (Cloudflare Workers)

```bash
cd apps/gather-livekit-api
pnpm wrangler secret put LIVEKIT_API_KEY
pnpm wrangler secret put LIVEKIT_API_SECRET
pnpm run deploy
```

### PartyKit

```bash
cd apps/gather-partykit
pnpm run deploy
# → https://gather-party.<your-user>.partykit.dev
```

### フロントエンド

`apps/gather-frontend/.env.local` を本番値に更新:

```bash
VITE_LIVEKIT_URL=wss://your-app.livekit.cloud
VITE_API_BASE_URL=https://gather-livekit-api.<subdomain>.workers.dev
VITE_PARTYKIT_HOST=gather-party.<user>.partykit.dev
```

```bash
cd apps/gather-frontend
pnpm run build
# dist/ を静的ホスティングに配置
```

---

## Oracle Cloud でセルフホスト LiveKit に切り替える

`livekit.yaml` を Oracle Cloud のインスタンスに配置:

```yaml
rtc:
  use_external_ip: true
  node_ip: "your.oracle.public.ip"
```

フロントエンドの接続先変更:
```
VITE_LIVEKIT_URL=wss://your.oracle.public.ip:7880
```

`apps/gather-livekit-api/.dev.vars` / wrangler secret を Oracle の `livekit.yaml` と同じキーに揃えるだけ。**コードの変更は不要。**

---

## 近接チェックの仕組み

`packages/shared/src/index.ts` の `PROXIMITY` 定数で制御:

```
CONNECT_DIST    = 150px  → この距離以内で LiveKit 接続
DISCONNECT_DIST = 220px  → この距離を超えると切断（ヒステリシス）
TOAST_DIST      = 280px  → 「近くにいます」トースト表示
```
