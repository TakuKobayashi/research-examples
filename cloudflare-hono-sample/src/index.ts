import { Hono } from 'hono'

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

export default app
