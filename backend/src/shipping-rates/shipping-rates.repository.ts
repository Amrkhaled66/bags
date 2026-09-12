import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, type SQL } from 'drizzle-orm';
import { db, type Database, type DatabaseExecutor } from '../db/db.module';
import { shippingRates } from '../db/schemas';
import type { ListShippingRatesQueryDto } from './dto/shipping-rate.dto';

export type ShippingRateRecord = typeof shippingRates.$inferSelect;
export type CreateShippingRateRecord = typeof shippingRates.$inferInsert;

@Injectable()
export class ShippingRatesRepository {
  constructor(@Inject(db) private readonly database: Database) {}

  findAll(filters: ListShippingRatesQueryDto) {
    const conditions: SQL[] = [];

    if (filters.isActive !== undefined) {
      conditions.push(eq(shippingRates.isActive, filters.isActive));
    }

    return this.database
      .select()
      .from(shippingRates)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(shippingRates.governorate));
  }

  findById(id: string) {
    return this.database
      .select()
      .from(shippingRates)
      .where(eq(shippingRates.id, id))
      .limit(1);
  }

  findByGovernorate(
    governorate: string,
    executor: DatabaseExecutor = this.database,
  ) {
    return executor
      .select()
      .from(shippingRates)
      .where(eq(shippingRates.governorate, governorate))
      .limit(1);
  }

  create(values: CreateShippingRateRecord) {
    return this.database.insert(shippingRates).values(values).returning();
  }

  update(id: string, values: Partial<CreateShippingRateRecord>) {
    return this.database
      .update(shippingRates)
      .set(values)
      .where(eq(shippingRates.id, id))
      .returning();
  }

  delete(id: string) {
    return this.database
      .delete(shippingRates)
      .where(eq(shippingRates.id, id))
      .returning({ id: shippingRates.id });
  }
}
