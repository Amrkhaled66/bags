import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, sql } from 'drizzle-orm';
import {
  db,
  type Database,
  type DatabaseExecutor,
  type DatabaseTransaction,
  withTransactionRetry,
} from '../db/db.module';
import {
  cartItems,
  carts,
  inventory,
  products,
  productVariants,
} from '../db/schemas';

export type CartRecord = typeof carts.$inferSelect;
export type CreateCartRecord = typeof carts.$inferInsert;
export type CartItemRecord = typeof cartItems.$inferSelect;
export type CreateCartItemRecord = typeof cartItems.$inferInsert;

@Injectable()
export class CartsRepository {
  constructor(@Inject(db) private readonly database: Database) {}

  findById(id: string, executor: DatabaseExecutor = this.database) {
    return executor.select().from(carts).where(eq(carts.id, id)).limit(1);
  }

  findBySessionToken(
    sessionToken: string,
    executor: DatabaseExecutor = this.database,
  ) {
    return executor
      .select()
      .from(carts)
      .where(eq(carts.sessionToken, sessionToken))
      .limit(1);
  }

  findByCustomerId(
    customerId: string,
    executor: DatabaseExecutor = this.database,
  ) {
    return executor
      .select()
      .from(carts)
      .where(eq(carts.customerId, customerId))
      .limit(1);
  }

  create(values: CreateCartRecord, executor: DatabaseExecutor = this.database) {
    return executor.insert(carts).values(values).returning();
  }

  updateCartTimestamp(id: string, executor: DatabaseExecutor = this.database) {
    return executor
      .update(carts)
      .set({ updatedAt: new Date() })
      .where(eq(carts.id, id))
      .returning();
  }

  attachCustomer(
    cartId: string,
    customerId: string,
    executor: DatabaseExecutor = this.database,
  ) {
    return executor
      .update(carts)
      .set({
        customerId,
        sessionToken: null,
        updatedAt: new Date(),
      })
      .where(eq(carts.id, cartId))
      .returning();
  }

  findItemsByCartId(
    cartId: string,
    executor: DatabaseExecutor = this.database,
  ) {
    return executor
      .select({
        id: cartItems.id,
        cartId: cartItems.cartId,
        variantId: cartItems.variantId,
        quantity: cartItems.quantity,
        createdAt: cartItems.createdAt,
        variantSku: productVariants.sku,
        colorName: productVariants.colorName,
        imageUrl: productVariants.imageUrl,
        isActive: productVariants.isActive,
        productId: products.id,
        productName: products.name,
        productSlug: products.slug,
        productStatus: products.status,
        sellerPrice: products.sellerPrice,
        originalPrice: products.originalPrice,
        discountedPrice: products.discountedPrice,
        stockQuantity: inventory.stockQuantity,
        reservedQuantity: inventory.reservedQuantity,
      })
      .from(cartItems)
      .innerJoin(productVariants, eq(cartItems.variantId, productVariants.id))
      .innerJoin(products, eq(productVariants.productId, products.id))
      .leftJoin(inventory, eq(inventory.variantId, productVariants.id))
      .where(eq(cartItems.cartId, cartId))
      .orderBy(desc(cartItems.createdAt));
  }

  findItemById(itemId: string, executor: DatabaseExecutor = this.database) {
    return executor
      .select()
      .from(cartItems)
      .where(eq(cartItems.id, itemId))
      .limit(1);
  }

  findItemByCartAndVariant(
    cartId: string,
    variantId: string,
    executor: DatabaseExecutor = this.database,
  ) {
    return executor
      .select()
      .from(cartItems)
      .where(
        and(eq(cartItems.cartId, cartId), eq(cartItems.variantId, variantId)),
      )
      .limit(1);
  }

  createItem(
    values: CreateCartItemRecord,
    executor: DatabaseExecutor = this.database,
  ) {
    return executor.insert(cartItems).values(values).returning();
  }

  updateItemQuantity(
    itemId: string,
    quantity: number,
    executor: DatabaseExecutor = this.database,
  ) {
    return executor
      .update(cartItems)
      .set({ quantity })
      .where(eq(cartItems.id, itemId))
      .returning();
  }

  deleteItem(itemId: string, executor: DatabaseExecutor = this.database) {
    return executor
      .delete(cartItems)
      .where(eq(cartItems.id, itemId))
      .returning({ id: cartItems.id });
  }

  clearItems(cartId: string, executor: DatabaseExecutor = this.database) {
    return executor.delete(cartItems).where(eq(cartItems.cartId, cartId));
  }

  deleteCart(cartId: string, executor: DatabaseExecutor = this.database) {
    return executor.delete(carts).where(eq(carts.id, cartId));
  }

  transaction<T>(callback: (transaction: DatabaseTransaction) => Promise<T>) {
    return withTransactionRetry(this.database, callback, 'read committed');
  }

  lockCustomerMerge(customerId: string, executor: DatabaseTransaction) {
    return executor.execute(
      sql`select pg_advisory_xact_lock(hashtextextended(${customerId}, 0))`,
    );
  }

  lockBySessionToken(sessionToken: string, executor: DatabaseTransaction) {
    return executor
      .select()
      .from(carts)
      .where(eq(carts.sessionToken, sessionToken))
      .limit(1)
      .for('update');
  }
}
