import { Inject, Module, type OnApplicationShutdown } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './index';

export const db = 'db';
const databasePool = Symbol('databasePool');

export type Database = NodePgDatabase<typeof schema>;
export type DatabaseTransaction = Parameters<
  Parameters<Database['transaction']>[0]
>[0];
export type DatabaseExecutor = Database | DatabaseTransaction;
export type TransactionIsolation = 'serializable' | 'read committed';

export async function withTransactionRetry<T>(
  database: Database,
  callback: (transaction: DatabaseTransaction) => Promise<T>,
  isolationLevel: TransactionIsolation = 'serializable',
  maxAttempts = 3,
) {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await database.transaction(callback, { isolationLevel });
    } catch (error) {
      const code =
        error !== null && typeof error === 'object' && 'code' in error
          ? String(error.code)
          : null;
      if (!['40001', '40P01'].includes(code ?? '') || attempt >= maxAttempts) {
        throw error;
      }
      await new Promise((resolveDelay) =>
        setTimeout(resolveDelay, attempt * 25),
      );
    }
  }
}

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: databasePool,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        new Pool({
          connectionString: config.getOrThrow<string>('DATABASE_URL'),
          max: config.get<number>('DATABASE_POOL_MAX') ?? 10,
        }),
    },
    {
      provide: db,
      inject: [databasePool],
      useFactory: (pool: Pool) => drizzle({ client: pool, schema }),
    },
  ],
  exports: [db],
})
export class DbModule implements OnApplicationShutdown {
  constructor(@Inject(databasePool) private readonly pool: Pool) {}

  async onApplicationShutdown() {
    await this.pool.end();
  }
}
