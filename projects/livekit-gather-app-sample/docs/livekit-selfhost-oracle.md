# LiveKit Server セルフホスト構築ガイド (Oracle Cloud / Ubuntu)

Oracle Cloud に Ubuntu インスタンスを立て、SSH でアクセスできる状態から始めます。

---

## 目次

1. [Oracle Cloud ネットワーク設定](#1-oracle-cloud-のネットワーク設定)
2. [Ubuntu iptables 設定](#2-ubuntu-の-iptables-設定)
3. [API Key の生成](#3-api-key-の生成)
4. [インストール方法の比較](#4-インストール方法の比較docker-compose-vs-バイナリ直接)
5. [方法A: バイナリ直接インストール（推奨）](#方法a-バイナリ直接インストール推奨)
6. [方法B: Docker Compose](#方法b-docker-compose)
7. [接続確認・切り替え手順](#7-接続確認と切り替え手順)
8. [補足: jose を使っている理由](#8-補足-jose-を使っている理由-vs-livekit-server-sdk)

---

## 1. Oracle Cloud のネットワーク設定

Oracle Cloud はデフォルトでほぼ全ポートを遮断しています。
**コンソール → VCN → セキュリティリスト → イングレスルール** に以下を追加します。

| プロトコル | ポート | 用途 |
|---|---|---|
| TCP | 22 | SSH（既存） |
| TCP | 7880 | LiveKit HTTP / WebSocket |
| TCP | 7881 | LiveKit RTC (TCP) |
| UDP | 7882 | LiveKit RTC (UDP) |
| UDP | 50000-50020 | TURN / WebRTC メディア |

**手順:**
1. Oracle Cloud コンソール → **ネットワーキング → 仮想クラウド・ネットワーク**
2. 対象 VCN → **セキュリティ・リスト** → デフォルトセキュリティリスト
3. **イングレス・ルールの追加** で上記を1つずつ追加（ソース CIDR: `0.0.0.0/0`）

---

## 2. Ubuntu の iptables 設定

Oracle Cloud の Ubuntu は `iptables` がデフォルトで動いており、
VCN のセキュリティリストとは**別に** OS 側でもポートを開ける必要があります。

```bash
sudo iptables -I INPUT -p tcp --dport 7880 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 7881 -j ACCEPT
sudo iptables -I INPUT -p udp --dport 7882 -j ACCEPT
sudo iptables -I INPUT -p udp --dport 50000:50020 -j ACCEPT

# 永続化
sudo apt install -y iptables-persistent
sudo netfilter-persistent save
```

---

## 3. API Key の生成

LiveKit の API Key / Secret は**自分で決める任意の文字列**です。
以下で安全なランダム文字列を生成します。

```bash
# API Key（短め・識別しやすい名前でも OK）
echo "apikey-$(openssl rand -hex 8)"
# 例: apikey-3f9a2c1d4e5b6789

# API Secret（32文字以上必須）
openssl rand -hex 32
# 例: a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
```

生成した値を手元にメモしておきます。
`livekit.yaml` と Cloudflare Workers のシークレットに**同じ値**を設定します。

---

## 4. インストール方法の比較（Docker Compose vs バイナリ直接）

| | 方法A: バイナリ直接 | 方法B: Docker Compose |
|---|---|---|
| **セットアップ** | ✅ シンプル | △ Docker インストールが必要 |
| **依存関係** | Redis のみ apt で入れる | Docker だけあれば完結 |
| **リソース消費** | ✅ 軽い | △ コンテナのオーバーヘッドあり |
| **Oracle Cloud ARM** | ✅ ARM バイナリあり | ✅ Docker も ARM 対応 |
| **バージョン更新** | 手動でバイナリを置き換え | `docker compose pull` 1コマンド |
| **UDP ポート** | ✅ そのまま使える | `network_mode: host` が必要 |
| **ログ管理** | journald (systemd) | `docker compose logs` |
| **おすすめ** | ✅ **本番・長期運用** | 手軽に試したい場合 |

**結論: Oracle Cloud の本番環境では方法A（バイナリ直接）がシンプルで軽く動きます。**
Docker の UDP ポートマッピング問題を気にする必要がなく、systemd で確実に管理できます。

---

## 方法A: バイナリ直接インストール（推奨）

### A-1. パッケージ更新と Redis インストール

```bash
sudo apt update && sudo apt upgrade -y

# Redis をインストール
sudo apt install -y redis-server

# 起動・自動起動有効化
sudo systemctl enable --now redis-server

# 動作確認
redis-cli ping
# → PONG
```

### A-2. LiveKit Server バイナリのダウンロード

```bash
# アーキテクチャを確認
uname -m
# → aarch64 なら ARM64（Oracle Ampere A1）
# → x86_64 なら AMD64

# 最新バージョンは https://github.com/livekit/livekit/releases で確認
LIVEKIT_VERSION="v1.8.3"

# ARM64 の場合
wget "https://github.com/livekit/livekit/releases/download/${LIVEKIT_VERSION}/livekit_${LIVEKIT_VERSION}_linux_arm64.tar.gz"
tar xzf livekit_${LIVEKIT_VERSION}_linux_arm64.tar.gz
sudo mv livekit-server /usr/local/bin/
rm livekit_${LIVEKIT_VERSION}_linux_arm64.tar.gz

# AMD64 の場合（上記と差し替え）
# wget "https://github.com/livekit/livekit/releases/download/${LIVEKIT_VERSION}/livekit_${LIVEKIT_VERSION}_linux_amd64.tar.gz"
# tar xzf livekit_${LIVEKIT_VERSION}_linux_amd64.tar.gz
# sudo mv livekit-server /usr/local/bin/

# バージョン確認
livekit-server --version
```

### A-3. 設定ファイルの作成

```bash
sudo mkdir -p /etc/livekit

sudo tee /etc/livekit/livekit.yaml << 'EOF'
port: 7880

rtc:
  tcp_port: 7881
  udp_port: 7882
  use_external_ip: true     # Oracle Cloud では必須（NAT 越えのため）

redis:
  address: localhost:6379

keys:
  # 手順3で生成した値に置き換える
  apikey-3f9a2c1d4e5b6789: a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456

log_level: info
EOF
```

> ⚠️ `use_external_ip: true` は Oracle Cloud の NAT 環境で WebRTC が正しく動くために必須です。
> これがないと ICE candidate に内部 IP が使われ、外部クライアントから接続できません。

### A-4. systemd サービスの設定

```bash
sudo tee /etc/systemd/system/livekit-server.service << 'EOF'
[Unit]
Description=LiveKit Server
After=network.target redis-server.service
Requires=redis-server.service

[Service]
Type=simple
ExecStart=/usr/local/bin/livekit-server --config /etc/livekit/livekit.yaml
Restart=on-failure
RestartSec=5
User=nobody

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now livekit-server
```

### A-5. 動作確認

```bash
# サービス状態
sudo systemctl status livekit-server

# リアルタイムログ
sudo journalctl -u livekit-server -f

# HTTP 疎通確認
curl http://localhost:7880/
```

### A-6. バージョン更新

```bash
LIVEKIT_VERSION="v1.x.x"
wget "https://github.com/livekit/livekit/releases/download/${LIVEKIT_VERSION}/livekit_${LIVEKIT_VERSION}_linux_arm64.tar.gz"
tar xzf livekit_${LIVEKIT_VERSION}_linux_arm64.tar.gz
sudo systemctl stop livekit-server
sudo mv livekit-server /usr/local/bin/
sudo systemctl start livekit-server
```

### A-7. 管理コマンド

```bash
sudo systemctl start   livekit-server          # 起動
sudo systemctl stop    livekit-server          # 停止
sudo systemctl restart livekit-server          # 再起動
sudo systemctl status  livekit-server          # 状態確認
sudo journalctl -u livekit-server -f           # ログをリアルタイムで見る
sudo journalctl -u livekit-server --since "1 hour ago"  # 直近1時間のログ
```

---

## 方法B: Docker Compose

Docker を使いたい場合のみこちらを参照してください。

### B-1. Docker インストール

```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
exit  # 再 SSH 接続が必要
```

### B-2. 設定ファイルの作成

```bash
mkdir -p ~/livekit && cd ~/livekit

cat > livekit.yaml << 'EOF'
port: 7880

rtc:
  tcp_port: 7881
  udp_port: 7882
  use_external_ip: true

redis:
  address: localhost:6379   # network_mode: host のため localhost

keys:
  apikey-3f9a2c1d4e5b6789: a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456

log_level: info
EOF

cat > docker-compose.yml << 'EOF'
version: "3.8"

services:
  redis:
    image: redis:7-alpine
    restart: unless-stopped
    network_mode: host
    volumes:
      - redis_data:/data

  livekit:
    image: livekit/livekit-server:latest
    restart: unless-stopped
    network_mode: host    # UDP ポート問題を回避するため必須
    volumes:
      - ./livekit.yaml:/etc/livekit.yaml:ro
    command: --config /etc/livekit.yaml
    depends_on:
      - redis

volumes:
  redis_data:
EOF
```

> `network_mode: host` が必要な理由:
> Docker の bridge モードでは UDP のポートマッピングが WebRTC と相性が悪く
> メディアが通らないことがあります。host モードにすることで回避できます。

### B-3. 起動・管理

```bash
cd ~/livekit
docker compose up -d                           # バックグラウンド起動
docker compose logs -f livekit                 # ログ確認
docker compose down                            # 停止
docker compose pull && docker compose up -d    # バージョン更新
```

---

## 7. 接続確認と切り替え手順

### サーバー側の疎通確認

```bash
# サーバー上で
curl http://localhost:7880/

# 手元の PC から
curl http://YOUR_ORACLE_IP:7880/
```

レスポンスが返れば OK です。

### フロントエンドの接続先を切り替える

`apps/gather-frontend/src/environments/environment.prod.ts` を編集します。

```typescript
export const environment = {
  production: true,
  livekitUrl:  'wss://YOUR_ORACLE_IP:7880',
  apiBaseUrl:  'https://gather-livekit-api.your-subdomain.workers.dev',
  partyHost:   'gather-party.your-user.partykit.dev',
};
```

### Cloudflare Workers のシークレットを更新

```bash
cd apps/gather-livekit-api

pnpm wrangler secret put LIVEKIT_API_KEY
# → 手順3の API Key を入力

pnpm wrangler secret put LIVEKIT_API_SECRET
# → 手順3の API Secret を入力
```

ローカル開発用の `.dev.vars` も更新します。

```
LIVEKIT_API_KEY=apikey-3f9a2c1d4e5b6789
LIVEKIT_API_SECRET=a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
```

---

## 8. 補足: jose を使っている理由 vs livekit-server-sdk

### なぜ livekit-server-sdk を使わないのか

`livekit-server-sdk` は **Node.js 専用**のライブラリです。
内部で Node.js の組み込みモジュール（`crypto`、`buffer`、`stream` など）を使っています。

Cloudflare Workers の実行環境は **Node.js ではなく V8 isolates** です。
`nodejs_compat` フラグを追加することで一部の Node.js API は使えますが、
`livekit-server-sdk` が依存しているすべてのモジュールが正しく動く保証はなく、
実際にビルドエラーが発生します（今回最初に試してエラーになったのがこれです）。

```
# Workers でビルドすると出るエラー
Could not resolve "crypto"
Could not resolve "buffer"
Could not resolve "stream"
```

### jose を使う利点

`jose` は **Web Crypto API** ベースで設計されており、
Cloudflare Workers・ブラウザ・Deno・Bun などの**エッジランタイムで動くことを前提**にしています。

| | livekit-server-sdk | jose |
|---|---|---|
| **動作環境** | Node.js のみ | どこでも動く（Web Crypto API） |
| **Workers 互換性** | ❌ ビルドエラーになる | ✅ 問題なし |
| **バンドルサイズ** | 大きい（依存多数） | 小さい |
| **できること** | トークン生成・ルーム管理 API など多機能 | JWT の署名・検証に特化 |

### LiveKit のトークンは単なる JWT

LiveKit のアクセストークンは特別なものではなく、
**HS256 で署名した JWT に LiveKit 固有クレームを入れたもの**に過ぎません。

```json
{
  "iss": "API_KEY",
  "sub": "identity",
  "exp": 1234567890,
  "video": {
    "roomJoin": true,
    "room": "world-1",
    "canPublish": true,
    "canSubscribe": true
  }
}
```

`jose` で同じ JWT を作れるので、Workers 環境では `livekit-server-sdk` より `jose` の方が適切です。

### Node.js 環境（Express 等）で動かす場合は livekit-server-sdk でOK

将来 kayaba-broadway と統合した際など、Node.js サーバーで動かすときは
`livekit-server-sdk` を素直に使うのがベストです。

```typescript
// Node.js 環境なら livekit-server-sdk が一番シンプル
import { AccessToken } from 'livekit-server-sdk';

const token = new AccessToken(apiKey, apiSecret, { identity });
token.addGrant({ roomJoin: true, room, canPublish: true, canSubscribe: true });
const jwt = await token.toJwt();
```

---

## まとめ：環境別の設定一覧

| 項目 | ローカル開発 | Oracle Cloud 本番 |
|---|---|---|
| LiveKit URL | `ws://localhost:7880` | `wss://YOUR_ORACLE_IP:7880` |
| LIVEKIT_API_KEY | `devkey` | 手順3で生成した値 |
| LIVEKIT_API_SECRET | `secret-at-least-32-chars-long!!` | 手順3で生成した値 |
| 起動方法 | `pnpm run livekit:up` | systemd または docker compose |

**コードの変更は一切不要です。**
`environment.prod.ts` の URL と Cloudflare Workers のシークレットを更新するだけで切り替えできます。
