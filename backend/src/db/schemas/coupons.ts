import {
  boolean,
  integer,
  numeric,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const coupons = pgTable('coupons', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: varchar('code', { length: 100 }).unique(),
  percentage: numeric('percentage', { precision: 5, scale: 2 }),
  minimumOrder: numeric('minimum_order', { precision: 12, scale: 2 }),
  usageLimit: integer('usage_limit'),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  isActive: boolean('is_active'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
