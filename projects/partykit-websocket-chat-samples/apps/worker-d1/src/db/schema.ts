import { sqliteTable, text, integer, blob } from 'drizzle-orm/sqlite-core';
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'),
  displayName: text('display_name').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});
export const passkeys = sqliteTable('passkeys', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  credentialId: text('credential_id').notNull().unique(),
  publicKey: blob('public_key', { mode: 'buffer' }).notNull(),
  counter: integer('counter').notNull().default(0),
  deviceType: text('device_type').notNull().default('singleDevice'),
  backedUp: integer('backed_up', { mode: 'boolean' }).notNull().default(false),
  transports: text('transports'),
  createdAt: text('created_at').notNull(),
});
export const challenges = sqliteTable('challenges', {
  id: text('id').primaryKey(),
  challenge: text('challenge').notNull(),
  userId: text('user_id'),
  expiresAt: text('expires_at').notNull(),
  createdAt: text('created_at').notNull(),
});
export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: text('expires_at').notNull(),
  createdAt: text('created_at').notNull(),
});
export const rooms = sqliteTable('rooms', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  createdBy: text('created_by')
    .notNull()
    .references(() => users.id),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});
export const messages = sqliteTable('messages', {
  id: text('id').primaryKey(),
  roomId: text('room_id')
    .notNull()
    .references(() => rooms.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  displayName: text('display_name').notNull(),
  content: text('content').notNull(),
  createdAt: text('created_at').notNull(),
});
