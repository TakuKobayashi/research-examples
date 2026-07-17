# realtime-p2p demo (Unity + WebRTC + PartyKit + Cloudflare)

1対1リアルタイム対戦ゲームの実証実験。座標(xyz)をWebRTC DataChannel経由でP2P直接送信し、
シグナリング/マッチングだけをサーバーレスなCloudflareスタックで行う構成です。

```
[Unity A]                                   [Unity B]
   |  1. POST /api/matchmaking/join            |
   |----------------> matching-api (Hono/D1) <-|
   |                        |                  |
   |   2. push "matched" via PartyKit lobby     |
   |<-----------------------+                  |
   |  3. connect to PartyKit "room" (signaling) |
   |<===== SDP offer/answer, ICE candidates ===>|
   |  4. WebRTC P2P DataChannel (STUNのみ, TURNなし)
   |<========= MessagePack encoded xyz =========>|
```

- **マッチング**: Hono (Cloudflare Workers) + Drizzle ORM + D1
- **シグナリング**: PartyKit (WebSocket, Cloudflare Durable Objects上で動作)
- **P2P本体**: Unity (`com.unity.webrtc`) + MessagePack、STUNのみ・TURNなし直接P2P
- **Unity側ライブラリ化**: `unity-client/Packages/com.phantomcatworks.realtimep2p`
  (詳細はそのフォルダのREADME.md参照。他プロジェクトへ再利用可能)

## ディレクトリ構成

```
server/
  apps/matching-api/      Hono + Drizzle + D1, Cloudflare Workersにデプロイ
  apps/signaling-party/   PartyKit (lobby / room の2パーティ)
unity-client/
  Packages/com.phantomcatworks.realtimep2p/   再利用可能なP2Pライブラリ (UPM embedded package)
  Assets/Scripts/Demo/                        ライブラリを使うデモゲーム側コード
  Assets/Scripts/Demo/Editor/DemoSceneBuilder.cs  デモSceneをコード生成するメニュー
```

## セットアップ

### 1. サーバー (server/)

```bash
cd server
pnpm install

# --- signaling-party (PartyKit) を先にデプロイしてホスト名を確定させる ---
pnpm --filter signaling-party exec partykit login
pnpm deploy:party
# => https://signaling-party.<your-partykit-user>.partykit.dev が発行される

# --- matching-api (Cloudflare Workers + D1) ---
pnpm --filter matching-api exec wrangler d1 create realtime-p2p-db
# 出力された database_id を apps/matching-api/wrangler.jsonc に反映
# vars.PARTYKIT_HOST に上記PartyKitホスト名(スキームなし)を設定

pnpm db:migrate:remote
pnpm deploy:api
# => https://matching-api.<your-account>.workers.dev が発行される
```

ローカル開発は `pnpm dev:api` / `pnpm dev:party` (別ターミナルで両方起動)。
`pnpm db:migrate:local` でローカルD1にもマイグレーションを当ててください。

### 2. Unity (unity-client/)

1. Unity Hubで `unity-client/` を開く(Unity 2022.3 LTS以降、URP推奨)
2. **NuGetForUnity** は `Packages/manifest.json` に既に登録済み。Unity起動後、
   メニュー `NuGet > Manage NuGet Packages` から **MessagePack** を検索してインストール
   (`Assets/Packages/MessagePack.x.x.x/` にDLLが展開されます)
3. `com.unity.webrtc` はネイティブプラグインのため、初回インポート後にUnity再起動を推奨
4. `Assets/Resources/P2PConfig.asset` を作成 (未作成ならメニュー実行時に自動生成されます) し、
   - `MatchmakingApiBaseUrl` = 上記でデプロイした matching-api の URL
   - `PartyKitHost` = 上記でデプロイした signaling-party のホスト名(スキームなし)
   を設定
5. メニュー `RealtimeP2PKit > Build Demo Scene` を実行 → `Assets/Scenes/P2PDemo.unity` が生成されます
6. 実機/2台のエディタ(ParrelSyncやビルド2本)でSceneを再生し、2人がキューに入るとP2P接続が始まります

## 既知の制約・注意点

- **TURNサーバー未使用**: 要件通りSTUNのみの直接P2Pです。両者が対称NAT(symmetric NAT)配下だと
  接続できません。実運用では coturn 等のTURNフォールバックを検討してください。
- **STUNサーバー**: `stun.l.google.com:19302` 等のGoogleの公開STUNは広く使われていますが、
  Googleが公式にドキュメント化・SLA保証しているサービスではないため、将来的に制限される
  可能性があります。`P2PConfig.StunServerUrls` は配列なので複数フォールバックを設定できます。
- **MessagePack + IL2CPP**: デフォルトの動的コード生成はIL2CPP/AOTビルドで動作しません。
  実機ビルドを行う場合は `mpc` (MessagePack Code Generator) で事前コード生成し、
  `MessagePackPayloadCodec` に生成された `GeneratedResolver` を渡してください。
- **D1のマッチング整合性**: デモ用の簡易実装のため、同時に大量の join が来た場合の
  完全な原子性は保証していません(SQLiteの単一ライター特性である程度緩和されますが、
  本番運用ではDurable Object等でのロックを検討してください)。

## ライブラリの再利用について

`unity-client/Packages/com.phantomcatworks.realtimep2p` はWebRTC接続〜データ交換の流れを
汎用化した独立パッケージです。エントリーポイントは `P2PManager` シングルトンのみで、
マッチング/シグナリング/WebRTC/シリアライズの各層はインターフェース越しに差し替え可能です。
詳細は同フォルダの README.md を参照してください。
