import type * as Party from "partykit/server";

/**
 * One "room" per matched 1v1 pair, keyed by roomId (wss://.../party/{roomId}).
 * Pure relay: whatever one peer sends (offer / answer / ice-candidate JSON), the
 * other peer receives verbatim. No message parsing/validation is done here on
 * purpose - SDP/ICE payload shape is owned by the Unity client, not the server.
 */
export default class RoomParty implements Party.Server {
  constructor(readonly room: Party.Room) {}

  onConnect(conn: Party.Connection) {
    const count = [...this.room.getConnections()].length;
    console.log(`[room:${this.room.id}] connected ${conn.id} (peers=${count})`);

    if (count > 2) {
      console.warn(`[room:${this.room.id}] rejecting ${conn.id}, room already has 2 peers (1v1 only)`);
      conn.close(4000, "room full");
      return;
    }

    conn.send(JSON.stringify({ type: "peer-count", count }));
  }

  onMessage(message: string, sender: Party.Connection) {
    console.log(`[room:${this.room.id}] relay from ${sender.id}: ${message}`);
    for (const conn of this.room.getConnections()) {
      if (conn.id !== sender.id) {
        conn.send(message);
      }
    }
  }

  onClose(conn: Party.Connection) {
    console.log(`[room:${this.room.id}] disconnected ${conn.id}`);
    for (const c of this.room.getConnections()) {
      c.send(JSON.stringify({ type: "peer-left" }));
    }
  }
}
