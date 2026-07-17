import type * as Party from "partykit/server";

/**
 * One "lobby" room per player, keyed by playerId (wss://.../parties/lobby/{playerId}).
 * The Unity client connects here right before calling POST /api/matchmaking/join
 * so that if it ends up waiting, it can still be notified the moment another
 * player's join request matches it - without polling.
 *
 * matching-api pushes the notification via a plain HTTP POST to this same party
 * (see onRequest below), which we then broadcast to the connected client.
 */
export default class LobbyParty implements Party.Server {
  constructor(readonly room: Party.Room) {}

  onConnect(conn: Party.Connection) {
    console.log(`[lobby:${this.room.id}] connected ${conn.id}`);
    conn.send(JSON.stringify({ type: "connected", playerId: this.room.id }));
  }

  onClose(conn: Party.Connection) {
    console.log(`[lobby:${this.room.id}] disconnected ${conn.id}`);
  }

  async onRequest(req: Party.Request) {
    if (req.method !== "POST") {
      return new Response("method not allowed", { status: 405 });
    }
    const body = await req.text();
    console.log(`[lobby:${this.room.id}] push received: ${body}`);
    this.room.broadcast(body);
    return new Response("ok");
  }
}
