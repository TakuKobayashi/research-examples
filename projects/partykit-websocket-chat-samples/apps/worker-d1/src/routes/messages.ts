import { Hono } from 'hono';
import { eq, desc } from 'drizzle-orm';
import type { Env } from '../env';
import { getDB } from '../db';
import { messages } from '../db/schema';
import { authMiddleware } from '../middleware/auth';

type V = { userId: string; displayName: string; email: string };
const r = new Hono<{ Bindings: Env; Variables: V }>();
r.use('*', authMiddleware);
r.get('/:roomId/messages', async (c) => {
  const limit = Math.min(Number(c.req.query('limit') ?? 100), 200);
  const msgs = await getDB(c.env.DB)
    .select()
    .from(messages)
    .where(eq(messages.roomId, c.req.param('roomId')))
    .orderBy(desc(messages.createdAt))
    .limit(limit)
    .all();
  return c.json({ data: msgs.reverse() });
});
export default r;
