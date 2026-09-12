import { Inject, Injectable } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import { db, type Database } from '../db/db.module';
import { admins } from '../db/schemas';

export type AdminRecord = typeof admins.$inferSelect;
export type CreateAdminRecord = typeof admins.$inferInsert;

const publicAdminColumns = {
  id: admins.id,
  name: admins.name,
  email: admins.email,
  role: admins.role,
  createdAt: admins.createdAt,
  updatedAt: admins.updatedAt,
};

@Injectable()
export class AdminsRepository {
  constructor(@Inject(db) private readonly database: Database) {}

  findAll() {
    return this.database
      .select(publicAdminColumns)
      .from(admins)
      .orderBy(desc(admins.createdAt));
  }

  findById(id: string) {
    return this.database
      .select(publicAdminColumns)
      .from(admins)
      .where(eq(admins.id, id))
      .limit(1);
  }

  findByEmail(email: string) {
    return this.database
      .select()
      .from(admins)
      .where(eq(admins.email, email))
      .limit(1);
  }

  create(values: CreateAdminRecord) {
    return this.database
      .insert(admins)
      .values(values)
      .returning(publicAdminColumns);
  }

  update(id: string, values: Partial<CreateAdminRecord>) {
    return this.database
      .update(admins)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(admins.id, id))
      .returning(publicAdminColumns);
  }

  delete(id: string) {
    return this.database.delete(admins).where(eq(admins.id, id)).returning({
      id: admins.id,
    });
  }
}
