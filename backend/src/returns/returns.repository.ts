import { Inject, Injectable } from '@nestjs/common';
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  lte,
  ilike,
  inArray,
  ne,
  or,
  sql,
  sum,
  type SQL,
} from 'drizzle-orm';
import {
  db,
  type Database,
  type DatabaseExecutor,
  type DatabaseTransaction,
  withTransactionRetry,
} from '../db/db.module';
import {
  orderItems,
  orders,
  refunds,
  returnItems,
  returns,
} from '../db/schemas';
import type { ListAdminReturnsQueryDto } from './dto/return.dto';
import type { DateRange } from '../common/list-query.schema';
import { searchPattern } from '../common/list-query.schema';
import { paginateQuery } from '../common/paginate-query';

export type ReturnRecord = typeof returns.$inferSelect;
export type CreateReturnRecord = typeof returns.$inferInsert;
export type CreateReturnItemRecord = typeof returnItems.$inferInsert;
export type CreateRefundRecord = typeof refunds.$inferInsert;

const returnSummaryColumns = {
  id: returns.id,
  orderId: returns.orderId,
  orderNumber: orders.orderNumber,
  customerId: orders.customerId,
  status: returns.status,
  reason: returns.reason,
  createdAt: returns.createdAt,
  updatedAt: returns.updatedAt,
};

@Injectable()
export class ReturnsRepository {
  constructor(@Inject(db) private readonly database: Database) {}

  transaction<T>(callback: (tx: DatabaseTransaction) => Promise<T>) {
    return withTransactionRetry(this.database, callback);
  }

  findById(id: string, executor: DatabaseExecutor = this.database) {
    return executor
      .select(returnSummaryColumns)
      .from(returns)
      .innerJoin(orders, eq(returns.orderId, orders.id))
      .where(eq(returns.id, id))
      .limit(1);
  }

  findByCustomerId(
    customerId: string,
    executor: DatabaseExecutor = this.database,
  ) {
    return executor
      .select(returnSummaryColumns)
      .from(returns)
      .innerJoin(orders, eq(returns.orderId, orders.id))
      .where(eq(orders.customerId, customerId))
      .orderBy(desc(returns.createdAt));
  }

  findAll(
    filters: ListAdminReturnsQueryDto,
    executor: DatabaseExecutor = this.database,
  ) {
    const conditions: SQL[] = [];

    if (filters.status) {
      conditions.push(eq(returns.status, filters.status));
    }

    if (filters.search) {
      conditions.push(
        or(
          ilike(orders.orderNumber, searchPattern(filters.search)),
          ilike(returns.reason, searchPattern(filters.search)),
        )!,
      );
    }

    if (filters.orderId) conditions.push(eq(returns.orderId, filters.orderId));
    if (filters.customerId)
      conditions.push(eq(orders.customerId, filters.customerId));
    if (filters.from) conditions.push(gte(returns.createdAt, filters.from));
    if (filters.to) conditions.push(lte(returns.createdAt, filters.to));
    const sort = filters.sortOrder === 'asc' ? asc : desc;
    return paginateQuery(
      executor,
      executor
        .select(returnSummaryColumns)
        .from(returns)
        .innerJoin(orders, eq(returns.orderId, orders.id))
        .where(and(...conditions))
        .orderBy(sort(returns[filters.sortBy]), sort(returns.id))
        .$dynamic(),
      filters,
    );
  }

  getDashboardCounts(range: DateRange) {
    const periodConditions: SQL[] = [];
    if (range.from) periodConditions.push(gte(returns.createdAt, range.from));
    if (range.to) periodConditions.push(lte(returns.createdAt, range.to));

    return Promise.all([
      this.database
        .select({ total: count() })
        .from(returns)
        .where(and(...periodConditions)),
      this.database
        .select({ total: count() })
        .from(returns)
        .where(eq(returns.status, 'requested')),
    ]);
  }

  getDashboardRefundTotal(range: DateRange) {
    const conditions: SQL[] = [eq(refunds.isRefunded, true)];
    if (range.from) conditions.push(gte(refunds.refundedAt, range.from));
    if (range.to) conditions.push(lte(refunds.refundedAt, range.to));

    return this.database
      .select({
        refunded: sql<string>`coalesce(sum(${refunds.amount}), 0)::text`,
      })
      .from(refunds)
      .where(and(...conditions));
  }

  findItems(returnId: string, executor: DatabaseExecutor = this.database) {
    return executor
      .select({
        id: returnItems.id,
        returnId: returnItems.returnId,
        orderItemId: returnItems.orderItemId,
        quantity: returnItems.quantity,
        productId: orderItems.productId,
        variantId: orderItems.variantId,
        productName: orderItems.productName,
        sku: orderItems.sku,
        colorName: orderItems.colorName,
        finalUnitPrice: orderItems.finalUnitPrice,
        orderedQuantity: orderItems.quantity,
      })
      .from(returnItems)
      .innerJoin(orderItems, eq(returnItems.orderItemId, orderItems.id))
      .where(eq(returnItems.returnId, returnId));
  }

  findRefunds(returnId: string, executor: DatabaseExecutor = this.database) {
    return executor
      .select()
      .from(refunds)
      .where(eq(refunds.returnId, returnId))
      .orderBy(desc(refunds.createdAt));
  }

  findPreviouslyRequestedQuantities(
    orderItemIds: string[],
    executor: DatabaseExecutor = this.database,
  ) {
    return executor
      .select({
        orderItemId: returnItems.orderItemId,
        quantity: sum(returnItems.quantity),
      })
      .from(returnItems)
      .innerJoin(returns, eq(returnItems.returnId, returns.id))
      .where(
        and(
          inArray(returnItems.orderItemId, orderItemIds),
          ne(returns.status, 'rejected'),
        ),
      )
      .groupBy(returnItems.orderItemId);
  }

  findRefundedQuantities(
    orderItemIds: string[],
    executor: DatabaseExecutor = this.database,
  ) {
    return executor
      .select({
        orderItemId: returnItems.orderItemId,
        quantity: sum(returnItems.quantity),
      })
      .from(returnItems)
      .innerJoin(returns, eq(returnItems.returnId, returns.id))
      .innerJoin(refunds, eq(refunds.returnId, returns.id))
      .where(
        and(
          inArray(returnItems.orderItemId, orderItemIds),
          eq(refunds.isRefunded, true),
        ),
      )
      .groupBy(returnItems.orderItemId);
  }

  sumRefundedAmountByOrderId(
    orderId: string,
    executor: DatabaseExecutor = this.database,
  ) {
    return executor
      .select({ amount: sum(refunds.amount) })
      .from(refunds)
      .innerJoin(returns, eq(refunds.returnId, returns.id))
      .where(and(eq(returns.orderId, orderId), eq(refunds.isRefunded, true)));
  }

  create(
    values: CreateReturnRecord,
    executor: DatabaseExecutor = this.database,
  ) {
    return executor.insert(returns).values(values).returning();
  }

  createItems(
    values: CreateReturnItemRecord[],
    executor: DatabaseExecutor = this.database,
  ) {
    return executor.insert(returnItems).values(values).returning();
  }

  updateStatus(
    returnId: string,
    status: ReturnRecord['status'],
    executor: DatabaseExecutor = this.database,
  ) {
    return executor
      .update(returns)
      .set({ status, updatedAt: new Date() })
      .where(eq(returns.id, returnId))
      .returning();
  }

  createRefund(
    values: CreateRefundRecord,
    executor: DatabaseExecutor = this.database,
  ) {
    return executor.insert(refunds).values(values).returning();
  }
}
