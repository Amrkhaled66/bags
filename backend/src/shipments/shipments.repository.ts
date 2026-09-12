import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { db, type Database, type DatabaseExecutor } from '../db/db.module';
import { shipments } from '../db/schemas';

export type ShipmentRecord = typeof shipments.$inferSelect;
export type CreateShipmentRecord = typeof shipments.$inferInsert;

@Injectable()
export class ShipmentsRepository {
  constructor(@Inject(db) private readonly database: Database) {}

  findByOrderId(orderId: string, executor: DatabaseExecutor = this.database) {
    return executor
      .select()
      .from(shipments)
      .where(eq(shipments.orderId, orderId))
      .limit(1);
  }

  create(
    values: CreateShipmentRecord,
    executor: DatabaseExecutor = this.database,
  ) {
    return executor.insert(shipments).values(values).returning();
  }

  update(
    orderId: string,
    values: Partial<CreateShipmentRecord>,
    executor: DatabaseExecutor = this.database,
  ) {
    return executor
      .update(shipments)
      .set(values)
      .where(eq(shipments.orderId, orderId))
      .returning();
  }
}
