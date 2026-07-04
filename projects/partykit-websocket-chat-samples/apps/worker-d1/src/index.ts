import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import type { Env } from './env';
import authRoutes from './routes/auth';
import roomsRoute from './routes/rooms';
import messagesRoute from './routes/messages';
import { authMiddleware } from './middleware/auth';

export { ChatRoom } from './party/chat-room';

const app = new Hono<{ Bindings: Env }>();
app.use('*', logger());
app.use(
  '/api/*',
  cors({ origin: '*', allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], allowHeaders: ['Content-Type', 'Authorization'] }),
);

app.route('/api/auth', authRoutes);
app.route('/api/rooms', roomsRoute);
app.route('/api/rooms', messagesRoute);

app.get('/ws/:roomId', authMiddleware, async (c) => {
  const roomId = c.req.param('roomId');
  const doId = c.env.CHAT_ROOM.idFromName(roomId);
  const stub = c.env.CHAT_ROOM.get(doId);
  const url = new URL(c.req.url);
  url.searchParams.set('userId', c.get('userId'));
  url.searchParams.set('displayName', c.get('displayName'));
  url.searchParams.set('roomId', roomId);
  return stub.fetch(new Request(url.toString(), c.req.raw));
});

app.get('/api/health', (c) => c.json({ status: 'ok', db: 'd1' }));
app.get('*', async (c) => c.env.ASSETS.fetch(c.req.raw));

export default app;
