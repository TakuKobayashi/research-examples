import { serve } from '@hono/node-server'
import app from './app'

const port = 8008
console.log(`Server is running on http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port
})