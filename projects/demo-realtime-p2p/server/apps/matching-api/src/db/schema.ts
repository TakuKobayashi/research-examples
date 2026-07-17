import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

/**
 * One row per player currently in (or recently matched out of) the queue.
 * "waiting"  -> still looking for an opponent.
 * "matched"  -> paired with opponentId in roomId; both rows are updated
 *               atomically-ish in the same request (see routes/matchmaking.ts).
 */
export const queuePlayers = sqliteTable("queue_players", {
  id: text("id").primaryKey(), // playerId, provided by the Unity client
  status: text("status", { enum: ["waiting", "matched"] })
    .notNull()
    .default("waiting"),
  roomId: text("room_id"),
  opponentId: text("opponent_id"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});
