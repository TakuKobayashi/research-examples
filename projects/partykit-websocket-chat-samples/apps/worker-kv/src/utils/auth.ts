import type { HonoRequest } from 'hono';

export function getSessionToken(request: HonoRequest): string | null {
  const auth = request.header('Authorization');
  if (auth?.startsWith('Bearer ')) return auth.slice(7);
  return request.query('token');
}
