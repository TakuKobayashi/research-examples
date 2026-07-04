import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { performEla } from './ela';

type Bindings = {
  ASSETS: Fetcher;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('*', logger());
app.use(
  '/api/*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Accept'],
  })
);

// Health check
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', runtime: 'cloudflare-workers', timestamp: new Date().toISOString() });
});

// ELA endpoint
app.post('/api/ela', async (c) => {
  let formData: FormData;
  try {
    formData = await c.req.formData();
  } catch {
    return c.json({ error: 'Invalid multipart/form-data request' }, 400);
  }

  const file = formData.get('image');
  if (!file || !(file instanceof File)) {
    return c.json({ error: 'Missing required field: image (file)' }, 400);
  }

  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return c.json(
      { error: `Unsupported image type: ${file.type}. Allowed: jpeg, png, webp` },
      415
    );
  }

  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return c.json({ error: 'Image too large. Maximum size is 10MB' }, 413);
  }

  const qualityParam = formData.get('quality');
  const scaleParam = formData.get('scale');
  const quality = qualityParam ? Math.min(99, Math.max(1, parseInt(qualityParam, 10))) : 75;
  const scale = scaleParam ? Math.min(50, Math.max(1, parseInt(scaleParam, 10))) : 10;

  try {
    const arrayBuffer = await file.arrayBuffer();
    const elaBuffer = await performEla(arrayBuffer, { quality, scale });

    return new Response(elaBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': 'inline; filename="ela-result.png"',
        'X-ELA-Quality': String(quality),
        'X-ELA-Scale': String(scale),
        'X-Original-Filename': file.name,
        'X-Original-Size': String(file.size),
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('ELA processing error:', err);
    return c.json({ error: 'Failed to process image. Ensure the file is a valid image.' }, 500);
  }
});

// Fallback: serve frontend assets
app.all('*', async (c) => {
  return c.env.ASSETS.fetch(c.req.raw);
});

export default app;
