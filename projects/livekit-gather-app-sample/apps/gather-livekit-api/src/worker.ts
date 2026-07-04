// apps/api/src/index.ts
// Cloudflare Workers + Hono による LiveKit トークン発行 API
//
// livekit-server-sdk は Node.js 依存のため Workers では動かない。
// jose (Web Crypto API ベース) で LiveKit JWT を直接生成する。

import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { SignJWT } from "jose";
import type { TokenResponse, ErrorResponse } from "@gather/shared";

type Env = {
  LIVEKIT_API_KEY: string;
  LIVEKIT_API_SECRET: string;
};

const app = new Hono<{ Bindings: Env }>();

// ============================================================
// ミドルウェア
// ============================================================
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: (origin) => origin ?? "*",
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    maxAge: 86400,
  })
);

// ============================================================
// ヘルスチェック
// ============================================================
app.get("/", (c) => c.json({ status: "ok", service: "gather-api" }));

// ============================================================
// GET /api/token?room=xxx&identity=xxx
//
// LiveKit JWT トークンを発行する。
// LiveKit のトークンは HS256 で署名した JWT。
// Claims:
//   iss   = API Key
//   sub   = identity
//   iat   = 発行時刻
//   exp   = 有効期限 (30分)
//   video = { roomJoin, room, canPublish, canSubscribe, canPublishData }
// ============================================================
app.get("/api/token", async (c) => {
  const room     = c.req.query("room");
  const identity = c.req.query("identity");

  if (!room || !identity) {
    return c.json<ErrorResponse>({ error: "room と identity は必須です" }, 400);
  }

  const apiKey    = c.env.LIVEKIT_API_KEY;
  const apiSecret = c.env.LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    console.error("[API] LIVEKIT_API_KEY / LIVEKIT_API_SECRET が未設定");
    return c.json<ErrorResponse>({ error: "サーバー設定エラー" }, 500);
  }

  try {
    // Web Crypto API で HMAC-SHA256 キーを生成
    const secretBytes = new TextEncoder().encode(apiSecret);
    const key = await crypto.subtle.importKey(
      "raw",
      secretBytes,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const now = Math.floor(Date.now() / 1000);

    const jwt = await new SignJWT({
      // LiveKit 固有の claims
      video: {
        roomJoin:       true,
        room,
        canPublish:     true,
        canSubscribe:   true,
        canPublishData: true,
      },
    })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setIssuer(apiKey)
      .setSubject(identity)
      .setIssuedAt(now)
      .setExpirationTime(now + 60 * 30) // 30分
      .sign(key);

    return c.json<TokenResponse>({ token: jwt });

  } catch (err) {
    console.error("[API] Token 発行エラー:", err);
    return c.json<ErrorResponse>(
      { error: err instanceof Error ? err.message : "Unknown error" },
      500
    );
  }
});

app.notFound((c) => c.json<ErrorResponse>({ error: "Not Found" }, 404));

export default app;
