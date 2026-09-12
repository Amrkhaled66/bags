import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  index,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { categories } from './categories';
import { brands } from './brands';
import { productStatusEnum } from './enum';

export const products = pgTable(
  'products',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    brandId: uuid('brand_id').references(() => brands.id, {
      onDelete: 'set null',
    }),
    sku: varchar('sku', { length: 100 }).unique(),
    name: varchar('name', { length: 200 }),
    slug: varchar('slug', { length: 220 }).unique(),
    description: text('description'),
    imageUrl: text('image_url'),
    sellerPrice: numeric('seller_price', { precision: 12, scale: 2 }),
    originalPrice: numeric('original_price', { precision: 12, scale: 2 }),
    discountedPrice: numeric('discounted_price', { precision: 12, scale: 2 }),
    lengthCm: numeric('length_cm', { precision: 8, scale: 2 }),
    widthCm: numeric('width_cm', { precision: 8, scale: 2 }),
    status: productStatusEnum('status'),
    isFeatured: boolean('is_featured'),
    isNewArrival: boolean('is_new_arrival'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [index('products_brand_id_idx').on(table.brandId)],
);

export const productCategories = pgTable(
  'product_categories',
  {
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id),
  },
  (table) => [primaryKey({ columns: [table.productId, table.categoryId] })],
);

export const productVariants = pgTable(
  'product_variants',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    productId: uuid('product_id').references(() => products.id),
    colorName: varchar('color_name', { length: 100 }),
    sku: varchar('sku', { length: 150 }).unique(),
    imageUrl: text('image_url'),
    isActive: boolean('is_active'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex('product_variants_product_id_color_name_unique').on(
      table.productId,
      table.colorName,
    ),
  ],
);

export const inventory = pgTable('inventory', {
  variantId: uuid('variant_id')
    .primaryKey()
    .references(() => productVariants.id),
  stockQuantity: integer('stock_quantity'),
  reservedQuantity: integer('reserved_quantity'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const productVariantImages = pgTable(
  'product_variant_images',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    variantId: uuid('variant_id')
      .notNull()
      .references(() => productVariants.id, { onDelete: 'cascade' }),
    imageUrl: text('image_url').notNull(),
    sortOrder: integer('sort_order').notNull(),
  },
  (table) => [
    uniqueIndex('variant_images_position_unique').on(
      table.variantId,
      table.sortOrder,
    ),
  ],
);

export const productsRelations = relations(products, ({ many, one }) => ({
  brand: one(brands, {
    fields: [products.brandId],
    references: [brands.id],
  }),
  productCategories: many(productCategories),
  variants: many(productVariants),
}));

export const brandsRelations = relations(brands, ({ many }) => ({
  products: many(products),
}));

export const productCategoriesRelations = relations(
  productCategories,
  ({ one }) => ({
    product: one(products, {
      fields: [productCategories.productId],
      references: [products.id],
    }),
    category: one(categories, {
      fields: [productCategories.categoryId],
      references: [categories.id],
    }),
  }),
);

export const productVariantsRelations = relations(
  productVariants,
  ({ one }) => ({
    product: one(products, {
      fields: [productVariants.productId],
      references: [products.id],
    }),
    inventory: one(inventory, {
      fields: [productVariants.id],
      references: [inventory.variantId],
    }),
  }),
);

export const inventoryRelations = relations(inventory, ({ one }) => ({
  variant: one(productVariants, {
    fields: [inventory.variantId],
    references: [productVariants.id],
  }),
}));
