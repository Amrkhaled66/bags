import { pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export const customers = pgTable('customers', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 150 }),
  phone: varchar('phone', { length: 30 }),
  email: varchar('email', { length: 255 }).unique(),
  passwordHash: text('password_hash'),
  governorate: varchar('governorate', { length: 100 }),
  cityArea: varchar('city_area', { length: 150 }),
  streetAddress: text('street_address'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});
