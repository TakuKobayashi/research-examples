import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import type { Env } from '../env';
import { getDB } from '../db';
import { rooms } from '../db/schema';
import { authMiddleware } from '../middleware/auth';
import { generateId } from '../utils/crypto';

type V = { userId: string; displayName: string; email: string };
const r = new Hono<{ Bindings: Env; Variables: V }>();
r.use('*', authMiddleware);

r.get('/', async (c) => c.json({ data: await getDB(c.env.DB).select().from(rooms).all() }));
r.get('/:id', async (c) => {
  const room = await getDB(c.env.DB)
    .select()
    .from(rooms)
    .where(eq(rooms.id, c.req.param('id')))
    .get();
  return room ? c.json({ data: room }) : c.json({ error: 'Not found' }, 404);
});
r.post('/', zValidator('json', z.object({ name: z.string().min(1).max(100), description: z.string().max(500).optional() })), async (c) => {
  const { name, description } = c.req.valid('json');
  const now = new Date().toISOString();
  const id = generateId();
  await getDB(c.env.DB)
    .insert(rooms)
    .values({ id, name, description: description ?? null, createdBy: c.get('userId'), createdAt: now, updatedAt: now });
  return c.json({ data: await getDB(c.env.DB).select().from(rooms).where(eq(rooms.id, id)).get() }, 201);
});
r.put(
  '/:id',
  zValidator('json', z.object({ name: z.string().min(1).max(100).optional(), description: z.string().max(500).optional() })),
  async (c) => {
    const db = getDB(c.env.DB);
    const roomId = c.req.param('id');
    const ex = await db.select().from(rooms).where(eq(rooms.id, roomId)).get();
    if (!ex) return c.json({ error: 'Not found' }, 404);
    if (ex.createdBy !== c.get('userId')) return c.json({ error: 'Forbidden' }, 403);
    const body = c.req.valid('json');
    await db
      .update(rooms)
      .set({
        ...(body.name ? { name: body.name } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(rooms.id, roomId));
    return c.json({ data: await db.select().from(rooms).where(eq(rooms.id, roomId)).get() });
  },
);
r.delete('/:id', async (c) => {
  const db = getDB(c.env.DB);
  const roomId = c.req.param('id');
  const ex = await db.select().from(rooms).where(eq(rooms.id, roomId)).get();
  if (!ex) return c.json({ error: 'Not found' }, 404);
  if (ex.createdBy !== c.get('userId')) return c.json({ error: 'Forbidden' }, 403);
  await db.delete(rooms).where(eq(rooms.id, roomId));
  return c.json({ success: true });
});
export default r;
