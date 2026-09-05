import { boolean, numeric, pgTable, uuid, varchar } from 'drizzle-orm/pg-core';

export const shippingRates = pgTable('shipping_rates', {
  id: uuid('id').defaultRandom().primaryKey(),
  governorate: varchar('governorate', { length: 100 }).unique(),
  shippingPrice: numeric('shipping_price', { precision: 12, scale: 2 }),
  freeShippingThreshold: numeric('free_shipping_threshold', {
    precision: 12,
    scale: 2,
  }),
  isActive: boolean('is_active'),
});
