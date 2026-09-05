import { relations } from 'drizzle-orm';
import { pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';
import { coupons } from './coupons';
import { customers } from './customers';
import { orders } from './orders';

export const couponUsages = pgTable('coupon_usages', {
  id: uuid('id').defaultRandom().primaryKey(),
  couponId: uuid('coupon_id').references(() => coupons.id),
  orderId: uuid('order_id')
    .unique()
    .references(() => orders.id),
  customerId: uuid('customer_id').references(() => customers.id),
  usedAt: timestamp('used_at', { withTimezone: true }).defaultNow(),
});

export const couponUsagesRelations = relations(couponUsages, ({ one }) => ({
  coupon: one(coupons, {
    fields: [couponUsages.couponId],
    references: [coupons.id],
  }),
  order: one(orders, {
    fields: [couponUsages.orderId],
    references: [orders.id],
  }),
  customer: one(customers, {
    fields: [couponUsages.customerId],
    references: [customers.id],
  }),
}));
