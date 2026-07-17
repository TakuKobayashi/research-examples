# com.phantomcatworks.realtimep2p

再利用可能なUnity向けリアルタイムP2Pライブラリ。マッチング → シグナリング → WebRTC接続 →
データ交換までを`P2PManager`シングルトン経由の一本のAPIにまとめています。

## 他プロジェクトへの持ち出し方

このフォルダ (`Packages/com.phantomcatworks.realtimep2p`) はUnityの **embedded package** です。
別プロジェクトで使う場合は次のいずれかで:

1. このフォルダを丸ごと別プロジェクトの `Packages/` 配下にコピーする(embedded package)
2. このフォルダだけを独立したgitリポジトリに切り出し、`Packages/manifest.json` に
   `"com.phantomcatworks.realtimep2p": "https://github.com/yourname/realtimep2pkit.git"`
   の形でUPM git依存として追加する(推奨・本来の想定形)

ゲーム固有のコード(Assets/Scripts/Demo以下)は一切参照していないので、そのまま持ち出せます。

## 依存関係

- `com.unity.webrtc` (Unity公式 WebRTCパッケージ)
- `com.unity.nuget.newtonsoft-json` (シグナリングJSONのシリアライズに使用)
- `NativeWebSocket` (github.com/endel/NativeWebSocket, UPM git依存。PartyKitとのWS通信に使用)
- `MessagePack-CSharp` (NuGet経由。NuGetForUnityで `MessagePack` パッケージをインストールしてください)

インストール手順やIL2CPP/AOTでの注意点はリポジトリルートの `README.md` を参照してください。

## 使い方(最小例)

```csharp
// 1. 起動時に一度だけ初期化
P2PManager.Instance.Initialize(myP2PConfig); // P2PConfig は ScriptableObject

// 2. 受信ハンドラを登録(packetIdはアプリ側で自由に決める1バイトのID)
P2PManager.Instance.RegisterPacketHandler<MyPacket>(1, packet => { ... });

// 3. イベント購読
P2PManager.Instance.Matched += info => Debug.Log($"matched: {info.OpponentId}");
P2PManager.Instance.DataChannelReady += () => Debug.Log("connected, ready to send/receive");

// 4. マッチング開始
P2PManager.Instance.StartMatchmaking(myPlayerId);

// 5. データ送信(MessagePackで自動シリアライズされる)
P2PManager.Instance.Send(1, new MyPacket { ... });
```

`MyPacket` は `[MessagePackObject]` + `[Key(n)]` を付けた任意の構造体/クラスでOKです。
ライブラリ自体はゲーム固有のパケット内容を一切知りません(座標同期はデモ側の実装例)。

## ログ

`P2PConfig.LogLevel` で調整できます。`Info` は接続フローの各ステップ
(マッチング開始/成立、シグナリング接続、Offer/Answer/ICE交換、DataChannel Open/Close等)、
`Verbose` はそれに加えて送受信するSDP本文・ICE candidate文字列・MessagePackバイト列の
中身までログ出力します。開発中は`Verbose`、本番ビルドは`Info`以下を推奨します。

## 差し替え可能なポイント

- `IMatchmakingClient` : マッチングAPIをHono以外に変えたい場合はこれを実装
- `ISignalingClient` : シグナリングをPartyKit以外に変えたい場合はこれを実装
- `IPayloadCodec` : MessagePack以外のシリアライズ形式に変えたい場合はこれを実装

いずれも `P2PManager` はインターフェース越しにしか触っていないため、内部実装を差し替えても
呼び出し側(ゲームコード)には影響しません。
