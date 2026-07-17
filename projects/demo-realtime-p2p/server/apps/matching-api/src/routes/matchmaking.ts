import { Hono } from "hono";
import { and, asc, eq, ne } from "drizzle-orm";
import { createDb } from "../db/client";
import { queuePlayers } from "../db/schema";
import type { Env } from "../index";

const matchmaking = new Hono<{ Bindings: Env }>();

/**
 * POST /api/matchmaking/join { playerId }
 *
 * 1v1 matchmaking:
 *  - If this player is already matched (idempotent retry), return the existing match.
 *  - Otherwise look for another "waiting" player (oldest first).
 *    - Found  -> create a roomId, mark BOTH players "matched", push a "matched"
 *                websocket message to the OTHER player's PartyKit lobby room
 *                (since they already returned from their own request and are
 *                 just idly connected, waiting), and return the match to the
 *                caller directly in the HTTP response.
 *    - None   -> insert self as "waiting" and return { status: "waiting" }.
 *
 * The player who *triggers* the match (the second one to call /join) is set as
 * isInitiator=false and the player who was already waiting is isInitiator=true,
 * so exactly one side creates the WebRTC offer (avoids SDP glare).
 */
matchmaking.post("/join", async (c) => {
  const { playerId } = await c.req.json<{ playerId: string }>();
  if (!playerId) return c.json({ error: "playerId is required" }, 400);

  const db = createDb(c.env.DB);

  const existing = await db
    .select()
    .from(queuePlayers)
    .where(eq(queuePlayers.id, playerId))
    .get();

  if (existing?.status === "matched" && existing.roomId) {
    return c.json({
      status: "matched",
      roomId: existing.roomId,
      opponentId: existing.opponentId,
      isInitiator: false,
    });
  }

  const opponent = await db
    .select()
    .from(queuePlayers)
    .where(and(eq(queuePlayers.status, "waiting"), ne(queuePlayers.id, playerId)))
    .orderBy(asc(queuePlayers.createdAt))
    .limit(1)
    .get();

  if (!opponent) {
    await db
      .insert(queuePlayers)
      .values({ id: playerId, status: "waiting", createdAt: new Date() })
      .onConflictDoUpdate({
        target: queuePlayers.id,
        set: { status: "waiting", roomId: null, opponentId: null, createdAt: new Date() },
      });
    return c.json({ status: "waiting" });
  }

  const roomId = crypto.randomUUID();

  await db
    .update(queuePlayers)
    .set({ status: "matched", roomId, opponentId: playerId })
    .where(eq(queuePlayers.id, opponent.id));

  await db
    .insert(queuePlayers)
    .values({ id: playerId, status: "matched", roomId, opponentId: opponent.id, createdAt: new Date() })
    .onConflictDoUpdate({
      target: queuePlayers.id,
      set: { status: "matched", roomId, opponentId: opponent.id },
    });

  // Notify the opponent, who is no longer polling, via their PartyKit lobby room.
  c.executionCtx.waitUntil(
    fetch(`https://${c.env.PARTYKIT_HOST}/parties/lobby/${opponent.id}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        type: "matched",
        roomId,
        opponentId: playerId,
        isInitiator: true,
      }),
    }).catch((err) => console.error("lobby push failed", err))
  );

  return c.json({ status: "matched", roomId, opponentId: opponent.id, isInitiator: false });
});

matchmaking.post("/leave", async (c) => {
  const { playerId } = await c.req.json<{ playerId: string }>();
  if (!playerId) return c.json({ error: "playerId is required" }, 400);
  const db = createDb(c.env.DB);
  await db.delete(queuePlayers).where(eq(queuePlayers.id, playerId));
  return c.json({ status: "ok" });
});

/** Polling fallback in case the lobby websocket push is missed. */
matchmaking.get("/status/:playerId", async (c) => {
  const playerId = c.req.param("playerId");
  const db = createDb(c.env.DB);
  const row = await db.select().from(queuePlayers).where(eq(queuePlayers.id, playerId)).get();
  if (!row) return c.json({ status: "unknown" });
  return c.json({
    status: row.status,
    roomId: row.roomId ?? null,
    opponentId: row.opponentId ?? null,
  });
});

export default matchmaking;
