import { Hono } from 'hono';
import axios from 'axios';

const app = new Hono();

app.get('/', (c) => c.text('Hello Hono!おめでとうございます！'));

app.get('/binary', async (c) => {
  const response = await axios.get('https://t18.pimg.jp/063/748/498/1/63748498.jpg', { responseType: 'arraybuffer' });
  c.status(200);
  c.header('Content-Type', 'image/jpg');
  return c.body(response.data);
});

export default app;
