import { createMiddleware } from 'hono/factory';
import type { Env } from '../env';
import { getSessionToken } from '../utils/auth';
import { getSession, getUserById } from '../utils/kv';
type V = { userId: string; displayName: string; email: string };
export const authMiddleware = createMiddleware<{ Bindings: Env; Variables: V }>(async (c, next) => {
  const token = getSessionToken(c.req);
  if (!token) return c.json({ error: 'Unauthorized' }, 401);
  const session = await getSession(c.env, token);
  if (!session || session.expiresAt < new Date().toISOString()) return c.json({ error: 'Unauthorized' }, 401);
  const user = await getUserById(c.env, session.userId);
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  c.set('userId', user.id);
  c.set('displayName', user.displayName);
  c.set('email', user.email);
  await next();
});
