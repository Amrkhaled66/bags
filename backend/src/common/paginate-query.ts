import { count, sql } from 'drizzle-orm';
import type { PgSelect } from 'drizzle-orm/pg-core';
import type { DatabaseExecutor } from '../db/db.module';
import type { ListQuery } from './list-query.schema';

export async function paginateQuery<T extends PgSelect>(
  executor: DatabaseExecutor,
  query: T,
  { page, limit }: Pick<ListQuery, 'page' | 'limit'>,
) {
  const [result] = await executor
    .select({ total: count() })
    .from(sql`(${query}) as filtered_list`);
  const data = await query.limit(limit).offset((page - 1) * limit);
  const total = result.total;
  return {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}
