# Web Push データ配信デモ（Cloudflare Workers + Assets）

このプロジェクトは、Cloudflare Workers AssetsでフロントエンドとバックエンドをひとつのWorkerで配信し、Web Push APIでサーバーからブラウザにデータを送信するデモアプリケーションです。

## 🎯 特徴

- ✅ **単一Workerでフロントエンド + API** - Cloudflare Workers Assetsを使用
- ✅ **Standard Web Push + FCM対応** - 2種類のプッシュ通知方式を実装
- ✅ **通知モード切り替え** - サイレント配信 ⇄ 通知表示
- ✅ **パーミッション管理** - 許可リクエスト・状態表示・リセット案内
- ✅ **データ可視化** - 受信データを構造化して表示（Standard/FCM識別）
- ✅ **wrangler.json** - JSON形式の設定ファイル

## 📁 プロジェクト構成

```
webpush-demo/
├── src/
│   ├── pages/           # Next.jsページ（ビルド後→out/）
│   ├── styles/          # CSSファイル
│   └── worker/          # Cloudflare Worker
│       └── index.ts     # APIとAssets配信
├── public/
│   └── sw.js           # Service Worker
├── out/                # Next.jsビルド出力（Assetsとして配信）
├── scripts/
│   └── generate-vapid-keys.js
├── wrangler.json       # Cloudflare Workers設定（JSON）
├── package.json
├── tsconfig.json
└── next.config.js
```

## 🚀 セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. VAPID鍵の生成

```bash
node scripts/generate-vapid-keys.js
```

公開鍵と秘密鍵が表示されます。メモしてください。

### 3. Cloudflare KVの作成

```bash
wrangler login
wrangler kv:namespace create "SUBSCRIPTIONS"
wrangler kv:namespace create "SUBSCRIPTIONS" --preview
```

### 4. wrangler.jsonの設定

`wrangler.json`を編集:

```json
{
  "vars": {
    "VAPID_PUBLIC_KEY": "生成された公開鍵をここに"
  },
  "kv_namespaces": [
    {
      "binding": "SUBSCRIPTIONS",
      "id": "本番用KV ID",
      "preview_id": "プレビュー用KV ID"
    }
  ]
}
```

### 5. シークレット設定

```bash
wrangler secret put VAPID_PRIVATE_KEY
# プロンプトが表示されたら秘密鍵を貼り付け
```

### 6. Firebase Cloud Messaging (FCM) の設定（オプション）

FCM機能を使用する場合:

#### 6.1 Firebaseプロジェクトを作成

1. [Firebase Console](https://console.firebase.google.com/)にアクセス
2. 新しいプロジェクトを作成
3. プロジェクト設定 → 全般 → Webアプリを追加
4. Firebase SDKの設定をコピー

#### 6.2 Cloud Messaging設定

1. プロジェクト設定 → Cloud Messaging
2. Webプッシュ証明書を生成（VAPID鍵）
3. Server Keyをコピー

#### 6.3 設定ファイルを更新

`src/config/firebase.ts`を編集:

```typescript
export const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT_ID.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_PROJECT_ID.appspot.com',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId: 'YOUR_APP_ID',
};
```

`public/firebase-messaging-sw.js`も同様に更新してください。

`src/pages/index.tsx`のinitializeFCM関数内のfirebaseConfigとvapidKeyも更新:

```typescript
const firebaseConfig = {
  /* 上記と同じ設定 */
};
const token = await getToken(messaging, {
  vapidKey: 'YOUR_FIREBASE_VAPID_KEY', // Firebase Consoleから取得
});
```

#### 6.4 KVネームスペースを作成

```bash
wrangler kv:namespace create "FCM_SUBSCRIPTIONS"
wrangler kv:namespace create "FCM_SUBSCRIPTIONS" --preview
```

`wrangler.json`に追加:

```json
{
  "kv_namespaces": [
    {
      "binding": "FCM_SUBSCRIPTIONS",
      "id": "FCM用KV ID",
      "preview_id": "FCM用プレビューKV ID"
    }
  ]
}
```

#### 6.5 FCM Server Keyを設定

`wrangler.json`を編集:

```json
{
  "vars": {
    "FCM_SERVER_KEY": "Firebase ConsoleのServer Key"
  }
}
```

### 7. フロントエンドのビルド

```bash
npm run build
```

これで`out/`ディレクトリに静的ファイルが生成されます。

### 7. Workerのデプロイ

```bash
npm run worker:deploy
```

デプロイされたURLにアクセスしてアプリを使用できます！

## 💻 ローカル開発

### 方法1: 本番同様の環境（推奨）

```bash
# 1. フロントエンドをビルド
npm run build

# 2. Workerを起動（Assetsも配信される）
npm run worker:dev
```

http://localhost:8787 でアクセス

### 方法2: フロントエンドのみ開発

```bash
npm run dev
```

http://localhost:3000 でアクセス
（この場合、APIは別途Workerを起動する必要があります）

## 🏗️ アーキテクチャ

```
[ブラウザ]
    ↓
[Cloudflare Worker]
    ├─ /api/* → Hono API（KVにアクセス）
    └─ /* → Assets（out/から静的ファイル配信）
```

### APIエンドポイント

#### Standard Web Push

- `GET /api/vapid-public-key` - VAPID公開鍵取得
- `POST /api/subscribe` - プッシュ購読を保存
- `POST /api/send-push` - プッシュ通知送信

#### Firebase Cloud Messaging (FCM)

- `GET /api/fcm/config` - FCM設定取得
- `POST /api/fcm/subscribe` - FCMトークンを保存
- `POST /api/fcm/send-push` - FCM経由でプッシュ通知送信

### フロントエンド

- Next.js Static Export（`out/`）
- Service Worker（`/sw.js`）
- 相対パスでAPIにアクセス

## 📖 使用方法

### Standard Web Push

1. **通知を許可** → ブラウザのプロンプトで許可
2. **購読を開始** → Standard Web Push購読ボタンをクリック
3. **モード選択** → 🔕サイレント or 🔔通知あり
4. **テスト送信** → "Standard Push送信"ボタンをクリック
5. **受信確認** → 履歴セクションでデータを確認（📡 Standardバッジ）

### Firebase Cloud Messaging (FCM)

1. **通知を許可** → ブラウザのプロンプトで許可
2. **FCMを初期化** → "FCMを初期化"ボタンをクリック
3. **モード選択** → 🔕サイレント or 🔔通知あり
4. **テスト送信** → "FCM Push送信"ボタンをクリック
5. **受信確認** → 履歴セクションでデータを確認（🔥 FCMバッジ）

## 🔧 トラブルシューティング

### ビルドエラー: "Cannot find name 'KVNamespace'"

→ Worker用のtsconfig.jsonに型定義が設定されています。`src/worker/tsconfig.json`を確認してください。

### デプロイエラー: "VAPID_PUBLIC_KEY not configured"

→ `wrangler.json`の`vars`に公開鍵を設定してください。

### プッシュが受信されない

1. `npm run build`でフロントエンドをビルド
2. `npm run worker:deploy`で再デプロイ
3. ブラウザのキャッシュをクリア
4. 購読を解除して再度購読

## 📦 デプロイ

```bash
# フロントエンドをビルド + Workerデプロイ
npm run build:worker

# または個別に
npm run build          # Next.jsビルド
npm run worker:deploy  # Workerデプロイ
```

## 🌟 本番環境での改善点

- [ ] 完全なVAPID JWT署名実装
- [ ] Web Push暗号化の完全実装
- [ ] エラーハンドリングとリトライ
- [ ] レート制限
- [ ] 購読の有効期限管理
- [ ] モニタリングとロギング

## 📝 ライセンス

MIT
