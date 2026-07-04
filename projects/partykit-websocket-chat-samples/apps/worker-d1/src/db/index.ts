import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';
import type { DrizzleDB } from '../env';
export function getDB(d1: D1Database): DrizzleDB {
  return drizzle(d1, { schema });
}
