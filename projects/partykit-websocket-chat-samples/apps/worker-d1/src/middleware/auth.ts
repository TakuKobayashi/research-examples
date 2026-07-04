import { createMiddleware } from 'hono/factory';
import { eq } from 'drizzle-orm';
import type { Env } from '../env';
import { getDB } from '../db';
import { sessions, users } from '../db/schema';
import { getSessionToken } from '../utils/auth';

type Variables = { userId: string; displayName: string; email: string };

export const authMiddleware = createMiddleware<{ Bindings: Env; Variables: Variables }>(async (c, next) => {
  const token = getSessionToken(c.req);
  if (!token) return c.json({ error: 'Unauthorized' }, 401);
  const db = getDB(c.env.DB);
  const now = new Date().toISOString();
  const result = await db
    .select({ userId: users.id, displayName: users.displayName, email: users.email, expiresAt: sessions.expiresAt })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.id, token))
    .get();
  if (!result || result.expiresAt < now) return c.json({ error: 'Unauthorized' }, 401);
  c.set('userId', result.userId);
  c.set('displayName', result.displayName);
  c.set('email', result.email);
  await next();
});
