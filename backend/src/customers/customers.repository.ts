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
  or,
  type SQL,
} from 'drizzle-orm';
import type { ListCustomersQueryDto } from './dto/customer.dto';
import type { DateRange } from '../common/list-query.schema';
import { searchPattern } from '../common/list-query.schema';
import { paginateQuery } from '../common/paginate-query';
import { db, type Database } from '../db/db.module';
import { customers } from '../db/schemas';

export type CustomerRecord = typeof customers.$inferSelect;
export type CreateCustomerRecord = typeof customers.$inferInsert;

const publicCustomerColumns = {
  id: customers.id,
  name: customers.name,
  phone: customers.phone,
  email: customers.email,
  governorate: customers.governorate,
  cityArea: customers.cityArea,
  streetAddress: customers.streetAddress,
  createdAt: customers.createdAt,
  updatedAt: customers.updatedAt,
};

@Injectable()
export class CustomersRepository {
  constructor(@Inject(db) private readonly database: Database) {}

  findAll(filters: ListCustomersQueryDto) {
    const conditions: SQL[] = [];
    if (filters.search) {
      const pattern = searchPattern(filters.search);
      conditions.push(
        or(
          ilike(customers.name, pattern),
          ilike(customers.email, pattern),
          ilike(customers.phone, pattern),
        )!,
      );
    }
    if (filters.governorate)
      conditions.push(eq(customers.governorate, filters.governorate));
    if (filters.from) conditions.push(gte(customers.createdAt, filters.from));
    if (filters.to) conditions.push(lte(customers.createdAt, filters.to));
    const sort = filters.sortOrder === 'asc' ? asc : desc;
    return paginateQuery(
      this.database,
      this.database
        .select(publicCustomerColumns)
        .from(customers)
        .where(and(...conditions))
        .orderBy(sort(customers[filters.sortBy]), sort(customers.id))
        .$dynamic(),
      filters,
    );
  }

  getDashboardSummary(range: DateRange) {
    const conditions: SQL[] = [];
    if (range.from) conditions.push(gte(customers.createdAt, range.from));
    if (range.to) conditions.push(lte(customers.createdAt, range.to));

    return Promise.all([
      this.database.select({ total: count() }).from(customers),
      this.database
        .select({ total: count() })
        .from(customers)
        .where(and(...conditions)),
    ]);
  }

  findById(id: string) {
    return this.database
      .select(publicCustomerColumns)
      .from(customers)
      .where(eq(customers.id, id))
      .limit(1);
  }

  findByEmail(email: string) {
    return this.database
      .select()
      .from(customers)
      .where(eq(customers.email, email))
      .limit(1);
  }

  create(values: CreateCustomerRecord) {
    return this.database
      .insert(customers)
      .values(values)
      .returning(publicCustomerColumns);
  }

  update(id: string, values: Partial<CreateCustomerRecord>) {
    return this.database
      .update(customers)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning(publicCustomerColumns);
  }
}
