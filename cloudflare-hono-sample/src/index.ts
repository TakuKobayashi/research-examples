import { Hono } from 'hono'
import { PrismaClient } from '@prisma/client'
import { PrismaD1 } from '@prisma/adapter-d1'

type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.get('/json', (c) => {
  return c.json({hello: "Hono JSON"})
})

app.get('/db/queryping', async (c) => {
  try {
    const results = await c.env.DB.prepare(
      "SELECT * FROM User",
    )
    .all();
    return c.json(results);
  } catch (e: any) {
    return c.json({ err: e.message }, 500);
  }
})

app.get('/db/prismaping', async (c) => {
  const adapter = new PrismaD1(c.env.DB)
  const prisma = new PrismaClient({ adapter });
  const users = await prisma.user.findMany();
  return c.json(users)
})

export default app
