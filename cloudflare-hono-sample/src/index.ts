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

export default app
