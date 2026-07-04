import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { Env } from '../env';
import { listRooms, getRoomById, saveRoom, deleteRoom } from '../utils/kv';
import { authMiddleware } from '../middleware/auth';
import { generateId } from '../utils/crypto';
type V = { userId: string; displayName: string; email: string };
const r = new Hono<{ Bindings: Env; Variables: V }>();
r.use('*', authMiddleware);
r.get('/', async (c) => c.json({ data: await listRooms(c.env) }));
r.get('/:id', async (c) => {
  const room = await getRoomById(c.env, c.req.param('id'));
  return room ? c.json({ data: room }) : c.json({ error: 'Not found' }, 404);
});
r.post('/', zValidator('json', z.object({ name: z.string().min(1).max(100), description: z.string().max(500).optional() })), async (c) => {
  const { name, description } = c.req.valid('json');
  const now = new Date().toISOString();
  const room = { id: generateId(), name, description, createdBy: c.get('userId'), createdAt: now, updatedAt: now };
  await saveRoom(c.env, room);
  return c.json({ data: room }, 201);
});
r.put(
  '/:id',
  zValidator('json', z.object({ name: z.string().min(1).max(100).optional(), description: z.string().max(500).optional() })),
  async (c) => {
    const ex = await getRoomById(c.env, c.req.param('id'));
    if (!ex) return c.json({ error: 'Not found' }, 404);
    if (ex.createdBy !== c.get('userId')) return c.json({ error: 'Forbidden' }, 403);
    const body = c.req.valid('json');
    const updated = { ...ex, ...body, updatedAt: new Date().toISOString() };
    await saveRoom(c.env, updated);
    return c.json({ data: updated });
  },
);
r.delete('/:id', async (c) => {
  const ex = await getRoomById(c.env, c.req.param('id'));
  if (!ex) return c.json({ error: 'Not found' }, 404);
  if (ex.createdBy !== c.get('userId')) return c.json({ error: 'Forbidden' }, 403);
  await deleteRoom(c.env, c.req.param('id'));
  return c.json({ success: true });
});
export default r;
