import { Inject, Injectable } from '@nestjs/common';
import { desc, eq, inArray, like } from 'drizzle-orm';
import { db, type Database } from '../db/db.module';
import { categories } from '../db/schemas';

export type CategoryRecord = typeof categories.$inferSelect;
export type CreateCategoryRecord = typeof categories.$inferInsert;

@Injectable()
export class CategoriesRepository {
  constructor(@Inject(db) private readonly database: Database) {}

  findAll() {
    return this.database
      .select()
      .from(categories)
      .orderBy(desc(categories.createdAt));
  }

  findImageReferences(filename: string) {
    return this.database
      .select({ id: categories.id })
      .from(categories)
      .where(like(categories.imageUrl, `%/uploads/images/${filename}%`))
      .limit(1);
  }

  findById(id: string) {
    return this.database
      .select()
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);
  }

  findBySlug(slug: string) {
    return this.database
      .select()
      .from(categories)
      .where(eq(categories.slug, slug))
      .limit(1);
  }

  findIds(categoryIds: string[]) {
    if (categoryIds.length === 0) {
      return [];
    }

    return this.database
      .select({ id: categories.id })
      .from(categories)
      .where(inArray(categories.id, categoryIds));
  }

  create(values: CreateCategoryRecord) {
    return this.database.insert(categories).values(values).returning();
  }

  update(id: string, values: Partial<CreateCategoryRecord>) {
    return this.database
      .update(categories)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(categories.id, id))
      .returning();
  }

  delete(id: string) {
    return this.database
      .delete(categories)
      .where(eq(categories.id, id))
      .returning({ id: categories.id });
  }
}
