import { Inject, Injectable } from '@nestjs/common';
import { and, eq, gte, inArray, lte, sql, type SQL } from 'drizzle-orm';
import { db, type Database, type DatabaseExecutor } from '../db/db.module';
import { orders, payments } from '../db/schemas';
import type { DateRange } from '../common/list-query.schema';

export type PaymentRecord = typeof payments.$inferSelect;
export type CreatePaymentRecord = typeof payments.$inferInsert;

@Injectable()
export class PaymentsRepository {
  constructor(@Inject(db) private readonly database: Database) {}

  findByOrderId(orderId: string, executor: DatabaseExecutor = this.database) {
    return executor
      .select()
      .from(payments)
      .where(eq(payments.orderId, orderId))
      .limit(1);
  }

  getDashboardSummary(range: DateRange) {
    const conditions: SQL[] = [
      inArray(payments.status, ['paid', 'partially_refunded', 'refunded']),
    ];
    if (range.from) conditions.push(gte(orders.createdAt, range.from));
    if (range.to) conditions.push(lte(orders.createdAt, range.to));

    return this.database
      .select({
        collected: sql<string>`coalesce(sum(${payments.amount}), 0)::text`,
      })
      .from(payments)
      .innerJoin(orders, eq(payments.orderId, orders.id))
      .where(and(...conditions));
  }

  create(
    values: CreatePaymentRecord,
    executor: DatabaseExecutor = this.database,
  ) {
    return executor.insert(payments).values(values).returning();
  }

  updateStatus(
    orderId: string,
    status: PaymentRecord['status'],
    executor: DatabaseExecutor = this.database,
  ) {
    return executor
      .update(payments)
      .set({ status })
      .where(eq(payments.orderId, orderId))
      .returning();
  }
}
