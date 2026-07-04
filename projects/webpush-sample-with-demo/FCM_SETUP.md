# Firebase Cloud Messaging (FCM) 設定ガイド

このガイドでは、Web Push デモアプリにFCMを追加する手順を説明します。

## 📋 前提条件

- Googleアカウント
- Firebase Console へのアクセス権限
- Node.js と npm がインストール済み

## 🔥 Firebaseプロジェクトのセットアップ

### 1. Firebaseプロジェクトを作成

1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. 「プロジェクトを追加」をクリック
3. プロジェクト名を入力（例: `webpush-demo`）
4. Google アナリティクスの設定（任意）
5. 「プロジェクトを作成」をクリック

### 2. Webアプリを追加

1. プロジェクトダッシュボードで「ウェブ」アイコン（</>）をクリック
2. アプリのニックネームを入力（例: `Web Push Demo`）
3. 「アプリを登録」をクリック
4. Firebase SDK の設定をコピー:

```javascript
const firebaseConfig = {
  apiKey: 'AIzaSy...',
  authDomain: 'your-project.firebaseapp.com',
  projectId: 'your-project',
  storageBucket: 'your-project.appspot.com',
  messagingSenderId: '123456789',
  appId: '1:123456789:web:abc...',
};
```

### 3. Cloud Messaging を有効化

1. プロジェクト設定（⚙️アイコン）→「プロジェクトの設定」
2. 「Cloud Messaging」タブをクリック
3. 「Webプッシュ証明書」セクションで「鍵ペアを生成」をクリック
4. 生成されたVAPIDキーをコピー（例: `BNt7Xm...`）
5. 「Server Key」（レガシー）もコピー

## 🔧 アプリケーション設定

### 1. Firebase設定ファイルを更新

`src/config/firebase.ts`:

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

### 2. Service Worker を更新

`public/firebase-messaging-sw.js`:

```javascript
firebase.initializeApp({
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT_ID.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_PROJECT_ID.appspot.com',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId: 'YOUR_APP_ID',
});
```

### 3. フロントエンドのFCM初期化コードを更新

`src/pages/index.tsx`の`initializeFCM`関数内:

```typescript
const firebaseConfig = {
  // 上記と同じ設定
};

const token = await getToken(messaging, {
  vapidKey: 'YOUR_FIREBASE_VAPID_KEY', // Webプッシュ証明書の鍵
});
```

### 4. Cloudflare Workers設定

#### 4.1 KVネームスペースを作成

```bash
wrangler kv:namespace create "FCM_SUBSCRIPTIONS"
wrangler kv:namespace create "FCM_SUBSCRIPTIONS" --preview
```

出力例:

```
{ binding = "FCM_SUBSCRIPTIONS", id = "abc123..." }
{ binding = "FCM_SUBSCRIPTIONS", preview_id = "def456..." }
```

#### 4.2 wrangler.json を更新

```json
{
  "vars": {
    "VAPID_PUBLIC_KEY": "YOUR_VAPID_PUBLIC_KEY",
    "FCM_SERVER_KEY": "YOUR_FCM_SERVER_KEY"
  },
  "kv_namespaces": [
    {
      "binding": "SUBSCRIPTIONS",
      "id": "standard_kv_id",
      "preview_id": "standard_preview_id"
    },
    {
      "binding": "FCM_SUBSCRIPTIONS",
      "id": "fcm_kv_id",
      "preview_id": "fcm_preview_id"
    }
  ]
}
```

## 🧪 動作確認

### 1. ビルドとデプロイ

```bash
npm install
npm run build
npm run worker:deploy
```

### 2. ブラウザでテスト

1. デプロイされたURLにアクセス
2. 「通知を許可する」をクリック
3. 「FCMを初期化」ボタンをクリック
4. コンソールに「FCM Token: ...」が表示されることを確認
5. 「FCM Push送信」ボタンでテスト送信

### 3. トラブルシューティング

#### FCM初期化エラー

**エラー**: `Firebase: Error (auth/invalid-api-key)`

- **原因**: API Keyが間違っている
- **解決**: `firebaseConfig`のapiKeyを確認

**エラー**: `Messaging: We are unable to register the default service worker`

- **原因**: Service Workerのパスが間違っている
- **解決**: `public/firebase-messaging-sw.js`が存在することを確認

#### トークン取得エラー

**エラー**: `Messaging: A problem occurred while subscribing the user to FCM`

- **原因**: VAPID鍵が間違っている
- **解決**: Firebase ConsoleのWebプッシュ証明書の鍵を再確認

#### プッシュ送信エラー

**エラー**: `FCM error: 401 - Unauthorized`

- **原因**: Server Keyが間違っている
- **解決**: `wrangler.json`のFCM_SERVER_KEYを確認

**エラー**: `FCM error: 404 - Not Found`

- **原因**: トークンが無効または期限切れ
- **解決**: FCMを再初期化してトークンを再取得

## 📚 参考資料

- [Firebase Cloud Messaging ドキュメント](https://firebase.google.com/docs/cloud-messaging)
- [FCM Web Push 実装ガイド](https://firebase.google.com/docs/cloud-messaging/js/client)
- [Firebase Console](https://console.firebase.google.com/)

## 🎯 Standard Web Push vs FCM

### Standard Web Push

- ✅ 追加の依存関係なし
- ✅ 軽量
- ❌ ブラウザ依存の制限あり

### FCM

- ✅ Googleインフラで信頼性が高い
- ✅ 豊富な機能（トピック、グループなど）
- ✅ iOS対応（将来的に）
- ❌ Firebase SDKが必要
- ❌ セットアップが複雑

## 💡 ベストプラクティス

1. **本番環境では環境変数を使用**
   - API KeyやServer Keyをハードコードしない
   - Cloudflare Secretsを活用

2. **トークンの有効期限管理**
   - 定期的にトークンをリフレッシュ
   - 無効なトークンはKVから削除

3. **エラーハンドリング**
   - FCM APIのレスポンスを適切に処理
   - ユーザーにわかりやすいエラーメッセージを表示

4. **セキュリティ**
   - Server Keyは絶対にクライアントに公開しない
   - HTTPSを必須にする
