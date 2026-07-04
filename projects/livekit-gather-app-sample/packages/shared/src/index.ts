// packages/shared/src/index.ts
// フロントエンド・PartyKit・API で共有する型定義

// ============================================================
// PartyKit WebSocket メッセージ型
// ============================================================

/** クライアント → PartyKit */
export type ClientMessage =
  | JoinMessage
  | PositionMessage
  | LeaveMessage;

/** PartyKit → クライアント (broadcast) */
export type ServerMessage =
  | PlayerJoinedMessage
  | PlayerMovedMessage
  | PlayerLeftMessage
  | RoomStateMessage;

// ---- クライアント → サーバー ----

export interface JoinMessage {
  type: "join";
  identity: string;
  displayName: string;
  x: number;
  y: number;
}

export interface PositionMessage {
  type: "position";
  x: number;
  y: number;
}

export interface LeaveMessage {
  type: "leave";
}

// ---- サーバー → クライアント ----

export interface PlayerJoinedMessage {
  type: "player_joined";
  player: PlayerState;
}

export interface PlayerMovedMessage {
  type: "player_moved";
  identity: string;
  x: number;
  y: number;
}

export interface PlayerLeftMessage {
  type: "player_left";
  identity: string;
}

/** 接続直後に全プレイヤー情報をまとめて送る */
export interface RoomStateMessage {
  type: "room_state";
  players: PlayerState[];
}

// ============================================================
// プレイヤー状態
// ============================================================

export interface PlayerState {
  identity: string;
  displayName: string;
  x: number;
  y: number;
  /** 最終更新時刻 (UnixMs) */
  updatedAt: number;
}

// ============================================================
// API レスポンス型 (Cloudflare Workers / Hono)
// ============================================================

export interface TokenResponse {
  token: string;
}

export interface ErrorResponse {
  error: string;
}

// ============================================================
// 近接チェック定数
// ============================================================

export const PROXIMITY = {
  /** この距離以内で LiveKit 接続開始 (px) */
  CONNECT_DIST:    150,
  /** この距離以上で LiveKit 切断 (px / ヒステリシス) */
  DISCONNECT_DIST: 220,
  /** トースト表示開始距離 (px) */
  TOAST_DIST:      280,
} as const;
