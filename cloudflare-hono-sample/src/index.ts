import { KVNamespace, D1Database } from '@cloudflare/workers-types';
import { Context, Hono } from 'hono';
import { PrismaClient } from '@prisma/client';
import { PrismaD1 } from '@prisma/adapter-d1';

type Bindings = {
  DB: D1Database;
  KV: KVNamespace;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get('/', (c) => {
  return c.text('Hello Hono!');
});

app.get('/json', (c) => {
  return c.json({ hello: 'Hono JSON' });
});

app.get('/kv/getsample', async (c) => {
  const kv = c.env.KV;
  const kvList = await kv.list();
  return c.json(kvList);
});

app.get('/kv/putsample', async (c) => {
  const kv = c.env.KV;
  const key = Math.random().toString(32).substring(2);
  const value = Math.random().toString(32).substring(2);
  await kv.put(key, value);
  return c.json({ key: key, value: value });
});

app.get('/db/queryping', async (c) => {
  try {
    const { results } = await c.env.DB.prepare('SELECT * FROM users').all();
    return c.json(results);
  } catch (e: any) {
    return c.json({ err: e.message }, 500);
  }
});

app.get('/db/prisma/ping', async (c) => {
  const prisma = loadPrismaClient(c);
  const users = await prisma.user.findMany();
  return c.json(users);
});

app.get('/db/prisma/create/random', async (c: Context) => {
  const prisma = loadPrismaClient(c);
  const user = await prisma.user.create({
    data: {
      email: Math.random().toString(32).substring(2),
      name: Math.random().toString(32).substring(2),
    },
  });
  return c.json(user);
});

function loadPrismaClient(context: Context): PrismaClient {
  const adapter = new PrismaD1(context.env.DB);
  return new PrismaClient({ log: ['query'], adapter });
}

export default app;
