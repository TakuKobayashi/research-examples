import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import type { Env } from '../env';
import { getDB } from '../db';
import { users, passkeys, challenges, sessions } from '../db/schema';
import { hashPassword, verifyPassword, generateId, generateSessionToken } from '../utils/crypto';

const app = new Hono<{ Bindings: Env }>();
const SESSION_TTL_HOURS = 24 * 7;
function sessionExp() {
  const d = new Date();
  d.setHours(d.getHours() + SESSION_TTL_HOURS);
  return d.toISOString();
}

app.post(
  '/register',
  zValidator('json', z.object({ email: z.string().email(), password: z.string().min(8), displayName: z.string().min(1).max(50) })),
  async (c) => {
    const { email, password, displayName } = c.req.valid('json');
    const db = getDB(c.env.DB);
    const now = new Date().toISOString();
    if (await db.select({ id: users.id }).from(users).where(eq(users.email, email.toLowerCase())).get())
      return c.json({ error: 'Email already registered' }, 409);
    const userId = generateId();
    await db.insert(users).values({
      id: userId,
      email: email.toLowerCase(),
      passwordHash: await hashPassword(password),
      displayName,
      createdAt: now,
      updatedAt: now,
    });
    const sessionId = generateSessionToken();
    await db.insert(sessions).values({ id: sessionId, userId, expiresAt: sessionExp(), createdAt: now });
    return c.json({ token: sessionId, user: { id: userId, email: email.toLowerCase(), displayName, createdAt: now, updatedAt: now } });
  },
);

app.post('/login', zValidator('json', z.object({ email: z.string().email(), password: z.string() })), async (c) => {
  const { email, password } = c.req.valid('json');
  const db = getDB(c.env.DB);
  const now = new Date().toISOString();
  const user = await db.select().from(users).where(eq(users.email, email.toLowerCase())).get();
  if (!user || !user.passwordHash || !(await verifyPassword(password, user.passwordHash)))
    return c.json({ error: 'Invalid credentials' }, 401);
  const sessionId = generateSessionToken();
  await db.insert(sessions).values({ id: sessionId, userId: user.id, expiresAt: sessionExp(), createdAt: now });
  return c.json({
    token: sessionId,
    user: { id: user.id, email: user.email, displayName: user.displayName, createdAt: user.createdAt, updatedAt: user.updatedAt },
  });
});

app.post('/passkey/register/options', zValidator('json', z.object({ userId: z.string(), displayName: z.string() })), async (c) => {
  const { userId, displayName } = c.req.valid('json');
  const db = getDB(c.env.DB);
  const now = new Date().toISOString();
  const user = await db.select().from(users).where(eq(users.id, userId)).get();
  if (!user) return c.json({ error: 'User not found' }, 404);
  const userPasskeys = await db.select().from(passkeys).where(eq(passkeys.userId, userId)).all();
  const options = await generateRegistrationOptions({
    rpName: c.env.RP_NAME,
    rpID: c.env.RP_ID,
    userID: new TextEncoder().encode(userId),
    userName: user.email,
    userDisplayName: displayName,
    excludeCredentials: userPasskeys.map((p) => ({
      id: p.credentialId,
      transports: p.transports ? (JSON.parse(p.transports) as AuthenticatorTransport[]) : [],
    })),
    authenticatorSelection: { residentKey: 'preferred', userVerification: 'preferred' },
  });
  const cid = generateId();
  const exp = new Date();
  exp.setMinutes(exp.getMinutes() + 5);
  await db.insert(challenges).values({ id: cid, challenge: options.challenge, userId, expiresAt: exp.toISOString(), createdAt: now });
  return c.json({ options, challengeId: cid });
});

app.post('/passkey/register/verify', zValidator('json', z.object({ challengeId: z.string(), response: z.any() })), async (c) => {
  const { challengeId, response } = c.req.valid('json');
  const db = getDB(c.env.DB);
  const now = new Date().toISOString();
  const ch = await db.select().from(challenges).where(eq(challenges.id, challengeId)).get();
  if (!ch?.userId || ch.expiresAt < now) return c.json({ error: 'Invalid or expired challenge' }, 400);
  try {
    const v = await verifyRegistrationResponse({
      response,
      expectedChallenge: ch.challenge,
      expectedOrigin: c.env.RP_ORIGIN,
      expectedRPID: c.env.RP_ID,
    });
    if (!v.verified || !v.registrationInfo) return c.json({ error: 'Verification failed' }, 400);
    const { credential, credentialDeviceType, credentialBackedUp } = v.registrationInfo;
    await db.insert(passkeys).values({
      id: generateId(),
      userId: ch.userId,
      credentialId: credential.id,
      publicKey: Buffer.from(credential.publicKey),
      counter: credential.counter,
      deviceType: credentialDeviceType,
      backedUp: credentialBackedUp,
      transports: credential.transports ? JSON.stringify(credential.transports) : null,
      createdAt: now,
    });
    await db.delete(challenges).where(eq(challenges.id, challengeId));
    return c.json({ verified: true });
  } catch {
    return c.json({ error: 'Verification failed' }, 400);
  }
});

app.post('/passkey/auth/options', zValidator('json', z.object({ email: z.string().email().optional() })), async (c) => {
  const { email } = c.req.valid('json');
  const db = getDB(c.env.DB);
  const now = new Date().toISOString();
  let allowCredentials: { id: string; transports?: AuthenticatorTransport[] }[] = [];
  let userId: string | undefined;
  if (email) {
    const user = await db.select().from(users).where(eq(users.email, email.toLowerCase())).get();
    if (user) {
      userId = user.id;
      const ups = await db.select().from(passkeys).where(eq(passkeys.userId, user.id)).all();
      allowCredentials = ups.map((p) => ({
        id: p.credentialId,
        transports: p.transports ? (JSON.parse(p.transports) as AuthenticatorTransport[]) : [],
      }));
    }
  }
  const options = await generateAuthenticationOptions({ rpID: c.env.RP_ID, allowCredentials, userVerification: 'preferred' });
  const cid = generateId();
  const exp = new Date();
  exp.setMinutes(exp.getMinutes() + 5);
  await db
    .insert(challenges)
    .values({ id: cid, challenge: options.challenge, userId: userId ?? null, expiresAt: exp.toISOString(), createdAt: now });
  return c.json({ options, challengeId: cid });
});

app.post('/passkey/auth/verify', zValidator('json', z.object({ challengeId: z.string(), response: z.any() })), async (c) => {
  const { challengeId, response } = c.req.valid('json');
  const db = getDB(c.env.DB);
  const now = new Date().toISOString();
  const ch = await db.select().from(challenges).where(eq(challenges.id, challengeId)).get();
  if (!ch || ch.expiresAt < now) return c.json({ error: 'Invalid or expired challenge' }, 400);
  const passkey = await db.select().from(passkeys).where(eq(passkeys.credentialId, response.id)).get();
  if (!passkey) return c.json({ error: 'Passkey not found' }, 404);
  try {
    const v = await verifyAuthenticationResponse({
      response,
      expectedChallenge: ch.challenge,
      expectedOrigin: c.env.RP_ORIGIN,
      expectedRPID: c.env.RP_ID,
      credential: {
        id: passkey.credentialId,
        publicKey: new Uint8Array(passkey.publicKey as ArrayBuffer),
        counter: passkey.counter,
        transports: passkey.transports ? (JSON.parse(passkey.transports) as AuthenticatorTransport[]) : [],
      },
    });
    if (!v.verified) return c.json({ error: 'Verification failed' }, 400);
    await db.update(passkeys).set({ counter: v.authenticationInfo.newCounter }).where(eq(passkeys.id, passkey.id));
    await db.delete(challenges).where(eq(challenges.id, challengeId));
    const user = await db.select().from(users).where(eq(users.id, passkey.userId)).get();
    if (!user) return c.json({ error: 'User not found' }, 404);
    const sessionId = generateSessionToken();
    await db.insert(sessions).values({ id: sessionId, userId: user.id, expiresAt: sessionExp(), createdAt: now });
    return c.json({
      token: sessionId,
      user: { id: user.id, email: user.email, displayName: user.displayName, createdAt: user.createdAt, updatedAt: user.updatedAt },
    });
  } catch {
    return c.json({ error: 'Verification failed' }, 400);
  }
});

app.post('/logout', async (c) => {
  const auth = c.req.header('Authorization');
  if (auth?.startsWith('Bearer '))
    await getDB(c.env.DB)
      .delete(sessions)
      .where(eq(sessions.id, auth.slice(7)));
  return c.json({ success: true });
});

app.get('/me', async (c) => {
  const auth = c.req.header('Authorization');
  if (!auth?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401);
  const db = getDB(c.env.DB);
  const now = new Date().toISOString();
  const r = await db
    .select({
      userId: users.id,
      email: users.email,
      displayName: users.displayName,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      expiresAt: sessions.expiresAt,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.id, auth.slice(7)))
    .get();
  if (!r || r.expiresAt < now) return c.json({ error: 'Unauthorized' }, 401);
  return c.json({ user: { id: r.userId, email: r.email, displayName: r.displayName, createdAt: r.createdAt, updatedAt: r.updatedAt } });
});

export default app;
