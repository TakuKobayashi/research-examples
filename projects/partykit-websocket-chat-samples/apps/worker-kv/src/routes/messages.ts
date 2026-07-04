import { Hono } from 'hono';
import type { Env } from '../env';
import { getMessages } from '../utils/kv';
import { authMiddleware } from '../middleware/auth';
type V = { userId: string; displayName: string; email: string };
const r = new Hono<{ Bindings: Env; Variables: V }>();
r.use('*', authMiddleware);
r.get('/:roomId/messages', async (c) =>
  c.json({ data: await getMessages(c.env, c.req.param('roomId'), Math.min(Number(c.req.query('limit') ?? 100), 200)) }),
);
export default r;
