import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.get('/json', (c) => {
  return c.json({hello: "Hono JSON"})
})

export default app
