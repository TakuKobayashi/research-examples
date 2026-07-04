# web-angular — Angular 17 フロントエンド

Next.js 版と同じバックエンド API / WebSocket に接続する Angular 17 製フロントエンドです。

## 技術スタック

| 項目 | 技術 |
|------|------|
| フレームワーク | Angular 17 (Standalone Components) |
| 状態管理 | Angular Signals |
| HTTP | HttpClient + functional interceptor |
| ルーティング | Angular Router (hash mode) |
| 認証UI | WebAuthn (@simplewebauthn/browser) |
| スタイル | Pure CSS (Tailwind なし) — Next.js 版と同じデザイン言語 |
| ビルド | @angular-devkit/build-angular (esbuild) |

## 機能

Next.js 版と完全に同等の機能を実装しています：

- メールアドレス + パスワード登録・ログイン
- パスキー (WebAuthn) 登録・ログイン
- ルーム CRUD（作成者のみ編集・削除可能）
- リアルタイムチャット（WebSocket URL 直接入力で接続）
- サイドバーにルーム一覧表示
- ログイン状態の永続化（localStorage）

## 開発

```bash
# Angular 開発サーバー起動 (ポート 4200)
pnpm dev:angular

# バックエンドも起動しておく (別ターミナル)
pnpm dev:d1   # ポート 8787
```

Angular の開発サーバーは `4200` で起動しますが、API コールは `window.location.origin` を向くため、
本番の worker と組み合わせて使うか、Angular の `proxy.conf.json` を設定してください。

### プロキシ設定（開発時）

`apps/web-angular/proxy.conf.json` を作成:

```json
{
  "/api": { "target": "http://localhost:8787", "changeOrigin": true },
  "/ws":  { "target": "http://localhost:8787", "changeOrigin": true, "ws": true }
}
```

`angular.json` の `serve` オプションに追加:
```json
"proxyConfig": "proxy.conf.json"
```

## ビルド & デプロイ

```bash
# ビルド (dist/ に出力)
pnpm build:angular

# Cloudflare Workers の ASSETS として D1 バックエンドと一緒にデプロイ
pnpm deploy:angular-d1
```

デプロイ時は `wrangler.toml` の `[assets] directory` が Angular の `dist/browser` を指しています。
worker-d1 の wrangler.toml と組み合わせて使う場合は、assets のパスを調整してください。

## Angular 固有の実装ポイント

- **Standalone Components**: NgModule なし。`app.config.ts` で providers を集中管理。
- **Signals**: `signal()` / `computed()` でリアクティブな状態管理。`ChangeDetectionStrategy.OnPush` で最適化。
- **functional guards**: `authGuard` / `guestGuard` を関数型で実装。
- **HttpClient interceptor**: `authInterceptor` 関数で全リクエストに Bearer トークンを自動付与。
- **`@for` / `@if`**: Angular 17 の新テンプレート構文 (control flow) を使用。
