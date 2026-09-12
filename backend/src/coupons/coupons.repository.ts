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
  type SQL,
} from 'drizzle-orm';
import { searchPattern } from '../common/list-query.schema';
import { paginateQuery } from '../common/paginate-query';
import { db, type Database, type DatabaseExecutor } from '../db/db.module';
import { coupons, couponUsages } from '../db/schemas';
import type { ListCouponsQueryDto } from './dto/coupon.dto';

export type CouponRecord = typeof coupons.$inferSelect;
export type CreateCouponRecord = typeof coupons.$inferInsert;
export type CreateCouponUsageRecord = typeof couponUsages.$inferInsert;

@Injectable()
export class CouponsRepository {
  constructor(@Inject(db) private readonly database: Database) {}

  findAll(filters: ListCouponsQueryDto) {
    const conditions: SQL[] = [];

    if (filters.isActive !== undefined) {
      conditions.push(eq(coupons.isActive, filters.isActive));
    }

    if (filters.code) {
      conditions.push(eq(coupons.code, filters.code));
    }

    if (filters.search)
      conditions.push(ilike(coupons.code, searchPattern(filters.search)));
    if (filters.from) conditions.push(gte(coupons.createdAt, filters.from));
    if (filters.to) conditions.push(lte(coupons.createdAt, filters.to));
    const sort = filters.sortOrder === 'asc' ? asc : desc;
    return paginateQuery(
      this.database,
      this.database
        .select()
        .from(coupons)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(sort(coupons[filters.sortBy]), sort(coupons.id))
        .$dynamic(),
      filters,
    );
  }

  findById(id: string) {
    return this.database
      .select()
      .from(coupons)
      .where(eq(coupons.id, id))
      .limit(1);
  }

  findByCode(code: string, executor: DatabaseExecutor = this.database) {
    return executor
      .select()
      .from(coupons)
      .where(eq(coupons.code, code))
      .limit(1);
  }

  countUsages(couponId: string, executor: DatabaseExecutor = this.database) {
    return executor
      .select({ total: count() })
      .from(couponUsages)
      .where(eq(couponUsages.couponId, couponId));
  }

  createUsage(
    values: CreateCouponUsageRecord,
    executor: DatabaseExecutor = this.database,
  ) {
    return executor.insert(couponUsages).values(values).returning();
  }

  deleteUsageByOrderId(
    orderId: string,
    executor: DatabaseExecutor = this.database,
  ) {
    return executor
      .delete(couponUsages)
      .where(eq(couponUsages.orderId, orderId));
  }

  create(values: CreateCouponRecord) {
    return this.database.insert(coupons).values(values).returning();
  }

  attachOrderUsageCustomer(
    orderId: string,
    customerId: string,
    executor: DatabaseExecutor,
  ) {
    return executor
      .update(couponUsages)
      .set({ customerId })
      .where(eq(couponUsages.orderId, orderId));
  }

  update(id: string, values: Partial<CreateCouponRecord>) {
    return this.database
      .update(coupons)
      .set(values)
      .where(eq(coupons.id, id))
      .returning();
  }

  delete(id: string) {
    return this.database
      .delete(coupons)
      .where(eq(coupons.id, id))
      .returning({ id: coupons.id });
  }
}
