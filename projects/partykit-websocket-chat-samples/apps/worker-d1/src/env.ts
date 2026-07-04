import type { DrizzleD1Database } from 'drizzle-orm/d1';
import type * as schema from './db/schema';
export interface Env {
  DB: D1Database;
  CHAT_ROOM: DurableObjectNamespace;
  ASSETS: Fetcher;
  JWT_SECRET: string;
  RP_ID: string;
  RP_NAME: string;
  RP_ORIGIN: string;
  ENVIRONMENT: string;
}
export type DrizzleDB = DrizzleD1Database<typeof schema>;
