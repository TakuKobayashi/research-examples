import { Hono } from "hono";

const app = new Hono()

app.get('/', (c) => c.text('Hello Hono!おめでとうございます！'))  // 確認用

export default app;