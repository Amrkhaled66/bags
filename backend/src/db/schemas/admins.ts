import { pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export const admins = pgTable('admins', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 150 }),
  email: varchar('email', { length: 255 }).unique(),
  passwordHash: text('password_hash'),
  role: varchar('role', { length: 50 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});
