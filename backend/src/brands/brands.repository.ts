import { Inject, Injectable } from '@nestjs/common';
import {
  and,
  asc,
  desc,
  eq,
  gte,
  ilike,
  like,
  lte,
  or,
  type SQL,
} from 'drizzle-orm';
import { searchPattern } from '../common/list-query.schema';
import { paginateQuery } from '../common/paginate-query';
import { db, type Database } from '../db/db.module';
import { brands } from '../db/schemas';
import type { ListBrandsQueryDto } from './dto/brand.dto';

export type CreateBrandRecord = typeof brands.$inferInsert;

@Injectable()
export class BrandsRepository {
  constructor(@Inject(db) private readonly database: Database) {}

  findAll(filters: ListBrandsQueryDto) {
    const conditions: SQL[] = [];
    if (filters.search) {
      conditions.push(
        or(
          ilike(brands.name, searchPattern(filters.search)),
          ilike(brands.slug, searchPattern(filters.search)),
        )!,
      );
    }
    if (filters.isActive !== undefined) {
      conditions.push(eq(brands.isActive, filters.isActive));
    }
    if (filters.from) conditions.push(gte(brands.createdAt, filters.from));
    if (filters.to) conditions.push(lte(brands.createdAt, filters.to));

    const sort = filters.sortOrder === 'asc' ? asc : desc;
    const query = this.database
      .select()
      .from(brands)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(sort(brands[filters.sortBy]), sort(brands.id))
      .$dynamic();

    return paginateQuery(this.database, query, filters);
  }

  findById(id: string) {
    return this.database
      .select()
      .from(brands)
      .where(eq(brands.id, id))
      .limit(1);
  }

  findBySlug(slug: string) {
    return this.database
      .select()
      .from(brands)
      .where(eq(brands.slug, slug))
      .limit(1);
  }

  findImageReferences(filename: string) {
    return this.database
      .select({ id: brands.id })
      .from(brands)
      .where(like(brands.logoUrl, `%/uploads/images/${filename}%`))
      .limit(1);
  }

  create(values: CreateBrandRecord) {
    return this.database.insert(brands).values(values).returning();
  }

  update(id: string, values: Partial<CreateBrandRecord>) {
    return this.database
      .update(brands)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(brands.id, id))
      .returning();
  }

  delete(id: string) {
    return this.database
      .delete(brands)
      .where(eq(brands.id, id))
      .returning({ id: brands.id });
  }
}
