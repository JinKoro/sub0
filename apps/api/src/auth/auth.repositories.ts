import { Inject, Injectable } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';

import { DRIZZLE, type DrizzleDB } from '../db/db.module';
import { customer } from '../db/schema/customer';
import { refreshToken } from '../db/schema/refresh-token';
import type {
  CustomerRecord,
  CustomerRepository,
  NewRefreshTokenRow,
  RefreshTokenRepository,
} from './auth.types';

@Injectable()
export class DrizzleCustomerRepository implements CustomerRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findActiveByEmail(email: string): Promise<CustomerRecord | null> {
    const rows = await this.db
      .select({
        id: customer.id,
        email: customer.email,
        passwordHash: customer.passwordHash,
        planId: customer.planId,
        stateId: customer.stateId,
      })
      .from(customer)
      .where(and(eq(customer.email, email), isNull(customer.deletedAt)))
      .limit(1);
    return rows[0] ?? null;
  }

  async findById(id: string): Promise<CustomerRecord | null> {
    const rows = await this.db
      .select({
        id: customer.id,
        email: customer.email,
        passwordHash: customer.passwordHash,
        planId: customer.planId,
        stateId: customer.stateId,
      })
      .from(customer)
      .where(and(eq(customer.id, id), isNull(customer.deletedAt)))
      .limit(1);
    return rows[0] ?? null;
  }
}

@Injectable()
export class DrizzleRefreshTokenRepository implements RefreshTokenRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async create(row: NewRefreshTokenRow): Promise<void> {
    await this.db.insert(refreshToken).values(row);
  }

  async findByHash(
    tokenHash: string,
  ): Promise<{ customerId: string; revokedAt: Date | null; expiresAt: Date } | null> {
    const rows = await this.db
      .select({
        customerId: refreshToken.customerId,
        revokedAt: refreshToken.revokedAt,
        expiresAt: refreshToken.expiresAt,
      })
      .from(refreshToken)
      .where(eq(refreshToken.tokenHash, tokenHash))
      .limit(1);
    return rows[0] ?? null;
  }

  async revoke(tokenHash: string): Promise<void> {
    await this.db
      .update(refreshToken)
      .set({ revokedAt: new Date() })
      .where(and(eq(refreshToken.tokenHash, tokenHash), isNull(refreshToken.revokedAt)));
  }

  async revokeAllForCustomer(customerId: string): Promise<void> {
    await this.db
      .update(refreshToken)
      .set({ revokedAt: new Date() })
      .where(and(eq(refreshToken.customerId, customerId), isNull(refreshToken.revokedAt)));
  }
}
