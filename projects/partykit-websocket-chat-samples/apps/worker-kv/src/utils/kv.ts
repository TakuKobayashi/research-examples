import type { Env } from '../env';
import type { User, Room, Message } from '@chat-app/shared';

export async function getUserById(env: Env, id: string): Promise<(User & { passwordHash?: string | null }) | null> {
  return env.USERS_KV.get(`user:${id}`, 'json');
}
export async function getUserByEmail(env: Env, email: string): Promise<(User & { passwordHash?: string | null }) | null> {
  const id = await env.USERS_KV.get(`email:${email.toLowerCase()}`);
  return id ? getUserById(env, id) : null;
}
export async function saveUser(env: Env, user: User & { passwordHash?: string | null }): Promise<void> {
  await Promise.all([
    env.USERS_KV.put(`user:${user.id}`, JSON.stringify(user)),
    env.USERS_KV.put(`email:${user.email.toLowerCase()}`, user.id),
  ]);
}

export interface StoredPasskey {
  id: string;
  userId: string;
  credentialId: string;
  publicKey: number[];
  counter: number;
  deviceType: string;
  backedUp: boolean;
  transports?: string[];
  createdAt: string;
}
export async function getPasskeyByCredentialId(env: Env, credentialId: string): Promise<StoredPasskey | null> {
  return env.USERS_KV.get(`passkey:cred:${credentialId}`, 'json');
}
export async function getPasskeysByUserId(env: Env, userId: string): Promise<StoredPasskey[]> {
  const ids: string[] = (await env.USERS_KV.get(`user:${userId}:passkeys`, 'json')) ?? [];
  return (await Promise.all(ids.map((id) => env.USERS_KV.get<StoredPasskey>(`passkey:${id}`, 'json')))).filter(Boolean) as StoredPasskey[];
}
export async function savePasskey(env: Env, p: StoredPasskey): Promise<void> {
  const ids: string[] = (await env.USERS_KV.get(`user:${p.userId}:passkeys`, 'json')) ?? [];
  if (!ids.includes(p.id)) ids.push(p.id);
  await Promise.all([
    env.USERS_KV.put(`passkey:${p.id}`, JSON.stringify(p)),
    env.USERS_KV.put(`passkey:cred:${p.credentialId}`, JSON.stringify(p)),
    env.USERS_KV.put(`user:${p.userId}:passkeys`, JSON.stringify(ids)),
  ]);
}
export async function updatePasskeyCounter(env: Env, p: StoredPasskey, counter: number): Promise<void> {
  const u = { ...p, counter };
  await Promise.all([
    env.USERS_KV.put(`passkey:${p.id}`, JSON.stringify(u)),
    env.USERS_KV.put(`passkey:cred:${p.credentialId}`, JSON.stringify(u)),
  ]);
}

export interface StoredChallenge {
  id: string;
  challenge: string;
  userId?: string;
  expiresAt: string;
}
export async function saveChallenge(env: Env, c: StoredChallenge): Promise<void> {
  const ttl = Math.max(Math.floor((new Date(c.expiresAt).getTime() - Date.now()) / 1000), 60);
  await env.CHALLENGES_KV.put(`challenge:${c.id}`, JSON.stringify(c), { expirationTtl: ttl });
}
export async function getChallenge(env: Env, id: string): Promise<StoredChallenge | null> {
  return env.CHALLENGES_KV.get(`challenge:${id}`, 'json');
}
export async function deleteChallenge(env: Env, id: string): Promise<void> {
  await env.CHALLENGES_KV.delete(`challenge:${id}`);
}

export interface StoredSession {
  id: string;
  userId: string;
  expiresAt: string;
  createdAt: string;
}
export async function saveSession(env: Env, s: StoredSession): Promise<void> {
  const ttl = Math.max(Math.floor((new Date(s.expiresAt).getTime() - Date.now()) / 1000), 60);
  await env.SESSIONS_KV.put(`session:${s.id}`, JSON.stringify(s), { expirationTtl: ttl });
}
export async function getSession(env: Env, id: string): Promise<StoredSession | null> {
  return env.SESSIONS_KV.get(`session:${id}`, 'json');
}
export async function deleteSession(env: Env, id: string): Promise<void> {
  await env.SESSIONS_KV.delete(`session:${id}`);
}

const MAX_MESSAGES = 200;
export async function getMessages(env: Env, roomId: string, limit = 100): Promise<Message[]> {
  const all: Message[] = (await env.MESSAGES_KV.get(`messages:${roomId}`, 'json')) ?? [];
  return all.slice(-Math.min(limit, MAX_MESSAGES));
}
export async function appendMessage(env: Env, roomId: string, msg: Message): Promise<void> {
  const all: Message[] = (await env.MESSAGES_KV.get(`messages:${roomId}`, 'json')) ?? [];
  all.push(msg);
  await env.MESSAGES_KV.put(`messages:${roomId}`, JSON.stringify(all.slice(-MAX_MESSAGES)));
}

export async function listRooms(env: Env): Promise<Room[]> {
  const ids: string[] = (await env.ROOMS_KV.get('rooms:index', 'json')) ?? [];
  return (await Promise.all(ids.map((id) => env.ROOMS_KV.get<Room>(`room:${id}`, 'json')))).filter(Boolean) as Room[];
}
export async function getRoomById(env: Env, id: string): Promise<Room | null> {
  return env.ROOMS_KV.get(`room:${id}`, 'json');
}
export async function saveRoom(env: Env, room: Room): Promise<void> {
  const ids: string[] = (await env.ROOMS_KV.get('rooms:index', 'json')) ?? [];
  if (!ids.includes(room.id)) ids.push(room.id);
  await Promise.all([env.ROOMS_KV.put(`room:${room.id}`, JSON.stringify(room)), env.ROOMS_KV.put('rooms:index', JSON.stringify(ids))]);
}
export async function deleteRoom(env: Env, id: string): Promise<void> {
  const ids: string[] = (await env.ROOMS_KV.get('rooms:index', 'json')) ?? [];
  await Promise.all([env.ROOMS_KV.delete(`room:${id}`), env.ROOMS_KV.put('rooms:index', JSON.stringify(ids.filter((i) => i !== id)))]);
}
