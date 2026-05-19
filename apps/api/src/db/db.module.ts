import { Global, Inject, Module, type OnModuleDestroy } from '@nestjs/common';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import * as schema from './schema';

export const DRIZZLE = Symbol('DRIZZLE');
export const PG_POOL = Symbol('PG_POOL');
export type DrizzleDB = NodePgDatabase<typeof schema>;

@Global()
@Module({
  providers: [
    {
      provide: PG_POOL,
      useFactory: (): Pool => {
        const url = process.env.DATABASE_URL;
        if (!url) {
          throw new Error('DATABASE_URL is not set');
        }
        return new Pool({ connectionString: url });
      },
    },
    {
      provide: DRIZZLE,
      useFactory: (pool: Pool): DrizzleDB => drizzle(pool, { schema }),
      inject: [PG_POOL],
    },
  ],
  exports: [DRIZZLE],
})
export class DbModule implements OnModuleDestroy {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  // Close the pg pool on shutdown — clean app.close() (tests) + prod.
  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}
