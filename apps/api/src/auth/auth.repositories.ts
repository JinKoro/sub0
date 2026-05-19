import { Inject, Injectable } from '@nestjs/common';
import { and, count, desc, eq, gte, isNull, lt } from 'drizzle-orm';

import { DRIZZLE, type DrizzleDB } from '../db/db.module';
import { customer } from '../db/schema/customer';
import { loginAttempt } from '../db/schema/login-attempt';
import { refreshToken } from '../db/schema/refresh-token';
import type {
  CustomerRecord,
  CustomerRepository,
  LoginAttemptKey,
  LoginAttemptRepository,
  NewRefreshTokenRow,
  RefreshTokenRepository,
} from './auth.types';

/** email + IP (NULL-safe) — the lockout bucket. */
function keyWhere(key: LoginAttemptKey) {
  return and(
    eq(loginAttempt.email, key.email),
    key.ip === null ? isNull(loginAttempt.ip) : eq(loginAttempt.ip, key.ip),
  );
}

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

@Injectable()
export class DrizzleLoginAttemptRepository implements LoginAttemptRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async record(attempt: LoginAttemptKey & { succeeded: boolean }): Promise<void> {
    await this.db.insert(loginAttempt).values({
      email: attempt.email,
      ip: attempt.ip,
      succeeded: attempt.succeeded,
    });
  }

  async lastSuccessAt(key: LoginAttemptKey): Promise<Date | null> {
    const rows = await this.db
      .select({ at: loginAttempt.createdAt })
      .from(loginAttempt)
      .where(and(keyWhere(key), eq(loginAttempt.succeeded, true)))
      .orderBy(desc(loginAttempt.createdAt))
      .limit(1);
    return rows[0]?.at ?? null;
  }

  async countFailuresSince(args: LoginAttemptKey & { since: Date }): Promise<number> {
    const rows = await this.db
      .select({ c: count() })
      .from(loginAttempt)
      .where(
        and(
          keyWhere(args),
          eq(loginAttempt.succeeded, false),
          gte(loginAttempt.createdAt, args.since),
        ),
      );
    return Number(rows[0]?.c ?? 0);
  }

  async deleteBefore(cutoff: Date): Promise<void> {
    await this.db.delete(loginAttempt).where(lt(loginAttempt.createdAt, cutoff));
  }
}
