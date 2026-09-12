import { Inject, Injectable } from '@nestjs/common';
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  lte,
  or,
  sql,
  type SQL,
} from 'drizzle-orm';
import { searchPattern } from '../common/list-query.schema';
import type { DateRange } from '../common/list-query.schema';
import { paginateQuery } from '../common/paginate-query';
import {
  db,
  type Database,
  type DatabaseExecutor,
  type DatabaseTransaction,
  type TransactionIsolation,
  withTransactionRetry,
} from '../db/db.module';
import { orderItems, orders, orderStatusHistory } from '../db/schemas';
import type { ListAdminOrdersQueryDto } from './dto/order.dto';

export type OrderRecord = typeof orders.$inferSelect;
export type CreateOrderRecord = typeof orders.$inferInsert;
export type CreateOrderItemRecord = typeof orderItems.$inferInsert;

@Injectable()
export class OrdersRepository {
  constructor(@Inject(db) private readonly database: Database) {}

  transaction<T>(
    callback: (tx: DatabaseTransaction) => Promise<T>,
    isolationLevel: TransactionIsolation = 'serializable',
  ) {
    return withTransactionRetry(this.database, callback, isolationLevel);
  }

  lockById(id: string, executor: DatabaseTransaction) {
    return executor
      .select()
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1)
      .for('update');
  }

  findById(id: string, executor: DatabaseExecutor = this.database) {
    return executor.select().from(orders).where(eq(orders.id, id)).limit(1);
  }

  lockByOrderNumber(orderNumber: string, executor: DatabaseTransaction) {
    return executor
      .select()
      .from(orders)
      .where(eq(orders.orderNumber, orderNumber))
      .limit(1)
      .for('update');
  }

  attachCustomer(
    orderId: string,
    customerId: string,
    executor: DatabaseTransaction,
  ) {
    return executor
      .update(orders)
      .set({ customerId, accessTokenHash: null, updatedAt: new Date() })
      .where(eq(orders.id, orderId))
      .returning();
  }

  findByOrderNumber(
    orderNumber: string,
    executor: DatabaseExecutor = this.database,
  ) {
    return executor
      .select()
      .from(orders)
      .where(eq(orders.orderNumber, orderNumber))
      .limit(1);
  }

  findByIdempotencyKey(
    idempotencyKey: string,
    executor: DatabaseExecutor = this.database,
  ) {
    return executor
      .select()
      .from(orders)
      .where(eq(orders.idempotencyKey, idempotencyKey))
      .limit(1);
  }

  findByCustomerId(
    customerId: string,
    executor: DatabaseExecutor = this.database,
  ) {
    return executor
      .select()
      .from(orders)
      .where(eq(orders.customerId, customerId))
      .orderBy(desc(orders.createdAt));
  }

  findAll(
    filters: ListAdminOrdersQueryDto,
    executor: DatabaseExecutor = this.database,
  ) {
    const conditions: SQL[] = [];

    if (filters.status) {
      conditions.push(eq(orders.status, filters.status));
    }

    if (filters.search) {
      conditions.push(
        or(
          ilike(orders.orderNumber, searchPattern(filters.search)),
          ilike(orders.customerName, searchPattern(filters.search)),
          ilike(orders.customerPhone, searchPattern(filters.search)),
        )!,
      );
    }

    if (filters.customerId)
      conditions.push(eq(orders.customerId, filters.customerId));
    if (filters.governorate)
      conditions.push(eq(orders.governorate, filters.governorate));
    if (filters.from) conditions.push(gte(orders.createdAt, filters.from));
    if (filters.to) conditions.push(lte(orders.createdAt, filters.to));
    const sort = filters.sortOrder === 'asc' ? asc : desc;
    return paginateQuery(
      executor,
      executor
        .select()
        .from(orders)
        .where(and(...conditions))
        .orderBy(sort(orders[filters.sortBy]), sort(orders.id))
        .$dynamic(),
      filters,
    );
  }

  getDashboardSummary(range: DateRange) {
    const conditions = this.createdAtConditions(range);

    return this.database
      .select({
        total: count(),
        pending: sql<number>`count(*) filter (where ${orders.status} = 'pending')::int`,
        confirmed: sql<number>`count(*) filter (where ${orders.status} = 'confirmed')::int`,
        shipped: sql<number>`count(*) filter (where ${orders.status} = 'shipped')::int`,
        delivered: sql<number>`count(*) filter (where ${orders.status} = 'delivered')::int`,
        cancelled: sql<number>`count(*) filter (where ${orders.status} = 'cancelled')::int`,
        grossSales: sql<string>`coalesce(sum(${orders.total}) filter (where ${orders.status} <> 'cancelled'), 0)::text`,
      })
      .from(orders)
      .where(and(...conditions));
  }

  findRecentForDashboard(range: DateRange, limit: number) {
    return this.database
      .select()
      .from(orders)
      .where(and(...this.createdAtConditions(range)))
      .orderBy(desc(orders.createdAt), desc(orders.id))
      .limit(limit);
  }

  findExpiredPending(
    expiresBefore: Date,
    limit: number,
    executor: DatabaseExecutor = this.database,
  ) {
    return executor
      .select({ id: orders.id })
      .from(orders)
      .where(
        and(
          eq(orders.status, 'pending'),
          lte(orders.reservationExpiresAt, expiresBefore),
        ),
      )
      .orderBy(orders.reservationExpiresAt)
      .limit(limit);
  }

  findItems(orderId: string, executor: DatabaseExecutor = this.database) {
    return executor
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));
  }

  findStatusHistory(
    orderId: string,
    executor: DatabaseExecutor = this.database,
  ) {
    return executor
      .select()
      .from(orderStatusHistory)
      .where(eq(orderStatusHistory.orderId, orderId))
      .orderBy(desc(orderStatusHistory.createdAt));
  }

  create(
    values: CreateOrderRecord,
    executor: DatabaseExecutor = this.database,
  ) {
    return executor.insert(orders).values(values).returning();
  }

  createItems(
    values: CreateOrderItemRecord[],
    executor: DatabaseExecutor = this.database,
  ) {
    return executor.insert(orderItems).values(values).returning();
  }

  createStatusHistory(
    values: typeof orderStatusHistory.$inferInsert,
    executor: DatabaseExecutor = this.database,
  ) {
    return executor.insert(orderStatusHistory).values(values).returning();
  }

  updateStatus(
    orderId: string,
    status: OrderRecord['status'],
    executor: DatabaseExecutor = this.database,
  ) {
    return executor
      .update(orders)
      .set({ status, reservationExpiresAt: null, updatedAt: new Date() })
      .where(eq(orders.id, orderId))
      .returning();
  }

  private createdAtConditions(range: DateRange) {
    const conditions: SQL[] = [];
    if (range.from) conditions.push(gte(orders.createdAt, range.from));
    if (range.to) conditions.push(lte(orders.createdAt, range.to));
    return conditions;
  }
}
