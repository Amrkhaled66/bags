import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { returnStatusEnum } from './enum';
import { orderItems, orders } from './orders';

export const returns = pgTable('returns', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id')
    .notNull()
    .references(() => orders.id),
  status: returnStatusEnum('status').notNull().default('requested'),
  reason: text('reason').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const returnItems = pgTable(
  'return_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    returnId: uuid('return_id')
      .notNull()
      .references(() => returns.id),
    orderItemId: uuid('order_item_id')
      .notNull()
      .references(() => orderItems.id),
    quantity: integer('quantity').notNull(),
  },
  (table) => [
    uniqueIndex('return_items_return_id_order_item_id_unique').on(
      table.returnId,
      table.orderItemId,
    ),
  ],
);

export const refunds = pgTable('refunds', {
  id: uuid('id').defaultRandom().primaryKey(),
  returnId: uuid('return_id')
    .notNull()
    .unique()
    .references(() => returns.id),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  isRefunded: boolean('is_refunded').notNull().default(false),
  refundedAt: timestamp('refunded_at', { withTimezone: true }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const returnsRelations = relations(returns, ({ one, many }) => ({
  order: one(orders, {
    fields: [returns.orderId],
    references: [orders.id],
  }),
  items: many(returnItems),
  refunds: many(refunds),
}));

export const returnItemsRelations = relations(returnItems, ({ one }) => ({
  return: one(returns, {
    fields: [returnItems.returnId],
    references: [returns.id],
  }),
  orderItem: one(orderItems, {
    fields: [returnItems.orderItemId],
    references: [orderItems.id],
  }),
}));

export const refundsRelations = relations(refunds, ({ one }) => ({
  return: one(returns, {
    fields: [refunds.returnId],
    references: [returns.id],
  }),
}));
