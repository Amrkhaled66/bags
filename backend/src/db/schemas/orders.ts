import { relations } from 'drizzle-orm';
import {
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { coupons } from './coupons';
import { customers } from './customers';
import { orderStatusEnum } from './enum';
import { products, productVariants } from './products';

export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderNumber: varchar('order_number', { length: 50 }).unique(),
  idempotencyKey: uuid('idempotency_key').unique(),
  accessTokenHash: varchar('access_token_hash', { length: 64 }),
  customerId: uuid('customer_id').references(() => customers.id),
  customerName: varchar('customer_name', { length: 150 }),
  customerPhone: varchar('customer_phone', { length: 30 }),
  customerEmail: varchar('customer_email', { length: 255 }),
  governorate: varchar('governorate', { length: 100 }),
  cityArea: varchar('city_area', { length: 150 }),
  streetAddress: text('street_address'),
  status: orderStatusEnum('status'),
  subtotal: numeric('subtotal', { precision: 12, scale: 2 }),
  couponDiscount: numeric('coupon_discount', { precision: 12, scale: 2 }),
  shippingPrice: numeric('shipping_price', { precision: 12, scale: 2 }),
  total: numeric('total', { precision: 12, scale: 2 }),
  couponId: uuid('coupon_id').references(() => coupons.id),
  reservationExpiresAt: timestamp('reservation_expires_at', {
    withTimezone: true,
  }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const orderItems = pgTable('order_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').references(() => orders.id),
  productId: uuid('product_id').references(() => products.id),
  variantId: uuid('variant_id').references(() => productVariants.id),
  productName: varchar('product_name', { length: 200 }),
  sku: varchar('sku', { length: 150 }),
  colorName: varchar('color_name', { length: 100 }),
  sellerPrice: numeric('seller_price', { precision: 12, scale: 2 }),
  originalPrice: numeric('original_price', { precision: 12, scale: 2 }),
  discountedPrice: numeric('discounted_price', { precision: 12, scale: 2 }),
  finalUnitPrice: numeric('final_unit_price', { precision: 12, scale: 2 }),
  quantity: integer('quantity'),
  total: numeric('total', { precision: 12, scale: 2 }),
});

export const orderStatusHistory = pgTable('order_status_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').references(() => orders.id),
  status: orderStatusEnum('status'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  coupon: one(coupons, {
    fields: [orders.couponId],
    references: [coupons.id],
  }),
  items: many(orderItems),
  statusHistory: many(orderStatusHistory),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
  variant: one(productVariants, {
    fields: [orderItems.variantId],
    references: [productVariants.id],
  }),
}));

export const orderStatusHistoryRelations = relations(
  orderStatusHistory,
  ({ one }) => ({
    order: one(orders, {
      fields: [orderStatusHistory.orderId],
      references: [orders.id],
    }),
  }),
);
