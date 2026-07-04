// apps/partykit/src/server.ts
// PartyKit WebSocket サーバー
// 全プレイヤーの (x, y) 座標をリアルタイムで同期する

import type * as Party from "partykit/server";
import type {
  ClientMessage,
  ServerMessage,
  PlayerState,
  JoinMessage,
  PositionMessage,
  RoomStateMessage,
  PlayerJoinedMessage,
  PlayerMovedMessage,
  PlayerLeftMessage,
} from "@gather/shared";

// ============================================================
// PartyKit Server クラス
//
// 1 つの "party" (= room) に 1 インスタンスが生成される。
// URL の room ID がパーティ識別子として使われる。
// 例: ws://localhost:1999/parties/main/world-1
//      → party name = "main", party id = "world-1"
// ============================================================
export default class GatherServer implements Party.Server {
  // roomId → PlayerState のマップ (in-memory)
  // PartyKit は Durable Object ベースなので同一 party 内で永続する
  private players = new Map<string, PlayerState>();

  constructor(readonly room: Party.Room) {}

  // ----------------------------------------------------------
  // 接続イベント
  // ----------------------------------------------------------
  onConnect(conn: Party.Connection) {
    // 接続直後に現在の全プレイヤー情報を送る
    const msg: RoomStateMessage = {
      type: "room_state",
      players: Array.from(this.players.values()),
    };
    conn.send(JSON.stringify(msg));
    console.log(`[Party] connect: ${conn.id}  players: ${this.players.size}`);
  }

  // ----------------------------------------------------------
  // メッセージ受信
  // ----------------------------------------------------------
  onMessage(message: string, sender: Party.Connection) {
    let data: ClientMessage;
    try {
      data = JSON.parse(message) as ClientMessage;
    } catch {
      console.warn("[Party] invalid JSON from", sender.id);
      return;
    }

    switch (data.type) {
      case "join":
        this.handleJoin(sender, data);
        break;
      case "position":
        this.handlePosition(sender, data);
        break;
      case "leave":
        this.handleLeave(sender);
        break;
      default:
        console.warn("[Party] unknown message type:", (data as any).type);
    }
  }

  // ----------------------------------------------------------
  // 切断イベント
  // ----------------------------------------------------------
  onClose(conn: Party.Connection) {
    this.handleLeave(conn);
  }

  onError(conn: Party.Connection, err: Error) {
    console.error(`[Party] error: ${conn.id}`, err);
    this.handleLeave(conn);
  }

  // ----------------------------------------------------------
  // ハンドラ実装
  // ----------------------------------------------------------

  private handleJoin(conn: Party.Connection, data: JoinMessage) {
    const player: PlayerState = {
      identity:    conn.id,
      displayName: data.displayName,
      x:           data.x,
      y:           data.y,
      updatedAt:   Date.now(),
    };
    this.players.set(conn.id, player);

    // 自分以外の全員に新規参加を通知
    const msg: PlayerJoinedMessage = {
      type: "player_joined",
      player,
    };
    this.room.broadcast(JSON.stringify(msg), [conn.id]);

    console.log(
      `[Party] join: ${data.displayName} (${conn.id})  total: ${this.players.size}`
    );
  }

  private handlePosition(conn: Party.Connection, data: PositionMessage) {
    const player = this.players.get(conn.id);
    if (!player) return;

    player.x         = data.x;
    player.y         = data.y;
    player.updatedAt = Date.now();

    // 全員に位置更新をブロードキャスト（送信者を除く）
    const msg: PlayerMovedMessage = {
      type: "player_moved",
      identity: conn.id,
      x: data.x,
      y: data.y,
    };
    this.room.broadcast(JSON.stringify(msg), [conn.id]);
  }

  private handleLeave(conn: Party.Connection) {
    if (!this.players.has(conn.id)) return;
    this.players.delete(conn.id);

    const msg: PlayerLeftMessage = {
      type: "player_left",
      identity: conn.id,
    };
    this.room.broadcast(JSON.stringify(msg));

    console.log(
      `[Party] leave: ${conn.id}  remaining: ${this.players.size}`
    );
  }
}

// PartyKit に必要な named export
export const onFetch = (req: Request) =>
  new Response("gather-party running", { status: 200 });
