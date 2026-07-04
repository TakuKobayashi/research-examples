import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import type { Env } from '../env';
import { getSessionToken } from '../utils/auth';
import {
  getUserByEmail,
  saveUser,
  getPasskeysByUserId,
  getPasskeyByCredentialId,
  savePasskey,
  updatePasskeyCounter,
  saveChallenge,
  getChallenge,
  deleteChallenge,
  saveSession,
  deleteSession,
  getSession,
  getUserById,
} from '../utils/kv';
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
    const now = new Date().toISOString();
    if (await getUserByEmail(c.env, email)) return c.json({ error: 'Email already registered' }, 409);
    const userId = generateId();
    const user = {
      id: userId,
      email: email.toLowerCase(),
      displayName,
      passwordHash: await hashPassword(password),
      createdAt: now,
      updatedAt: now,
    };
    await saveUser(c.env, user);
    const sessionId = generateSessionToken();
    await saveSession(c.env, { id: sessionId, userId, expiresAt: sessionExp(), createdAt: now });
    return c.json({ token: sessionId, user: { id: userId, email: user.email, displayName, createdAt: now, updatedAt: now } });
  },
);

app.post('/login', zValidator('json', z.object({ email: z.string().email(), password: z.string() })), async (c) => {
  const { email, password } = c.req.valid('json');
  const now = new Date().toISOString();
  const user = await getUserByEmail(c.env, email);
  if (!user || !user.passwordHash || !(await verifyPassword(password, user.passwordHash)))
    return c.json({ error: 'Invalid credentials' }, 401);
  const sessionId = generateSessionToken();
  await saveSession(c.env, { id: sessionId, userId: user.id, expiresAt: sessionExp(), createdAt: now });
  return c.json({
    token: sessionId,
    user: { id: user.id, email: user.email, displayName: user.displayName, createdAt: user.createdAt, updatedAt: user.updatedAt },
  });
});

app.post('/passkey/register/options', zValidator('json', z.object({ userId: z.string(), displayName: z.string() })), async (c) => {
  const { userId, displayName } = c.req.valid('json');
  const now = new Date().toISOString();
  const user = await getUserById(c.env, userId);
  if (!user) return c.json({ error: 'User not found' }, 404);
  const ups = await getPasskeysByUserId(c.env, userId);
  const options = await generateRegistrationOptions({
    rpName: c.env.RP_NAME,
    rpID: c.env.RP_ID,
    userID: new TextEncoder().encode(userId),
    userName: user.email,
    userDisplayName: displayName,
    excludeCredentials: ups.map((p) => ({ id: p.credentialId, transports: (p.transports ?? []) as AuthenticatorTransport[] })),
    authenticatorSelection: { residentKey: 'preferred', userVerification: 'preferred' },
  });
  const cid = generateId();
  const exp = new Date();
  exp.setMinutes(exp.getMinutes() + 5);
  await saveChallenge(c.env, { id: cid, challenge: options.challenge, userId, expiresAt: exp.toISOString() });
  return c.json({ options, challengeId: cid });
});

app.post('/passkey/register/verify', zValidator('json', z.object({ challengeId: z.string(), response: z.any() })), async (c) => {
  const { challengeId, response } = c.req.valid('json');
  const now = new Date().toISOString();
  const ch = await getChallenge(c.env, challengeId);
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
    await savePasskey(c.env, {
      id: generateId(),
      userId: ch.userId,
      credentialId: credential.id,
      publicKey: Array.from(credential.publicKey),
      counter: credential.counter,
      deviceType: credentialDeviceType,
      backedUp: credentialBackedUp,
      transports: credential.transports ?? [],
      createdAt: now,
    });
    await deleteChallenge(c.env, challengeId);
    return c.json({ verified: true });
  } catch {
    return c.json({ error: 'Verification failed' }, 400);
  }
});

app.post('/passkey/auth/options', zValidator('json', z.object({ email: z.string().email().optional() })), async (c) => {
  let allowCredentials: { id: string; transports?: AuthenticatorTransport[] }[] = [];
  let userId: string | undefined;
  if (c.req.valid('json').email) {
    const user = await getUserByEmail(c.env, c.req.valid('json').email!);
    if (user) {
      userId = user.id;
      const ups = await getPasskeysByUserId(c.env, user.id);
      allowCredentials = ups.map((p) => ({ id: p.credentialId, transports: (p.transports ?? []) as AuthenticatorTransport[] }));
    }
  }
  const options = await generateAuthenticationOptions({ rpID: c.env.RP_ID, allowCredentials, userVerification: 'preferred' });
  const cid = generateId();
  const exp = new Date();
  exp.setMinutes(exp.getMinutes() + 5);
  await saveChallenge(c.env, { id: cid, challenge: options.challenge, userId, expiresAt: exp.toISOString() });
  return c.json({ options, challengeId: cid });
});

app.post('/passkey/auth/verify', zValidator('json', z.object({ challengeId: z.string(), response: z.any() })), async (c) => {
  const { challengeId, response } = c.req.valid('json');
  const now = new Date().toISOString();
  const ch = await getChallenge(c.env, challengeId);
  if (!ch || ch.expiresAt < now) return c.json({ error: 'Invalid or expired challenge' }, 400);
  const passkey = await getPasskeyByCredentialId(c.env, response.id);
  if (!passkey) return c.json({ error: 'Passkey not found' }, 404);
  try {
    const v = await verifyAuthenticationResponse({
      response,
      expectedChallenge: ch.challenge,
      expectedOrigin: c.env.RP_ORIGIN,
      expectedRPID: c.env.RP_ID,
      credential: {
        id: passkey.credentialId,
        publicKey: new Uint8Array(passkey.publicKey),
        counter: passkey.counter,
        transports: (passkey.transports ?? []) as AuthenticatorTransport[],
      },
    });
    if (!v.verified) return c.json({ error: 'Verification failed' }, 400);
    await updatePasskeyCounter(c.env, passkey, v.authenticationInfo.newCounter);
    await deleteChallenge(c.env, challengeId);
    const user = await getUserById(c.env, passkey.userId);
    if (!user) return c.json({ error: 'User not found' }, 404);
    const sessionId = generateSessionToken();
    await saveSession(c.env, { id: sessionId, userId: user.id, expiresAt: sessionExp(), createdAt: now });
    return c.json({
      token: sessionId,
      user: { id: user.id, email: user.email, displayName: user.displayName, createdAt: user.createdAt, updatedAt: user.updatedAt },
    });
  } catch {
    return c.json({ error: 'Verification failed' }, 400);
  }
});

app.post('/logout', async (c) => {
  const token = getSessionToken(c.req);
  if (token) await deleteSession(c.env, token);
  return c.json({ success: true });
});

app.get('/me', async (c) => {
  const token = getSessionToken(c.req);
  if (!token) return c.json({ error: 'Unauthorized' }, 401);
  const session = await getSession(c.env, token);
  if (!session || session.expiresAt < new Date().toISOString()) return c.json({ error: 'Unauthorized' }, 401);
  const user = await getUserById(c.env, session.userId);
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  return c.json({
    user: { id: user.id, email: user.email, displayName: user.displayName, createdAt: user.createdAt, updatedAt: user.updatedAt },
  });
});

export default app;
