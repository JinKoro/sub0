import { Inject, Injectable } from '@nestjs/common';
import { CustomerState, VerificationTokenType } from '@subzero/shared';
import { and, desc, eq, isNotNull, isNull } from 'drizzle-orm';

import { DRIZZLE, type DrizzleDB } from '../db/db.module';
import { customer } from '../db/schema/customer';
import { mailOutbox } from '../db/schema/mail-outbox';
import { refreshToken } from '../db/schema/refresh-token';
import { verificationToken } from '../db/schema/verification-token';
import type {
  ActiveCustomer,
  CompletePasswordResetArgs,
  CompleteRegistrationArgs,
  CreatePasswordResetArgs,
  TokenRow,
  VerificationRepository,
} from './verification.types';

const RESET_TEMPLATE = 'reset-password';

@Injectable()
export class DrizzleVerificationRepository implements VerificationRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findToken(tokenHash: string): Promise<TokenRow | null> {
    const rows = await this.db
      .select({
        id: verificationToken.id,
        customerId: verificationToken.customerId,
        typeId: verificationToken.typeId,
        expiresAt: verificationToken.expiresAt,
        usedAt: verificationToken.usedAt,
        customerStateId: customer.stateId,
        customerEmail: customer.email,
        customerPlanId: customer.planId,
      })
      .from(verificationToken)
      .innerJoin(customer, eq(customer.id, verificationToken.customerId))
      .where(eq(verificationToken.tokenHash, tokenHash))
      .limit(1);
    return rows[0] ?? null;
  }

  async completeRegistration(args: CompleteRegistrationArgs): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx
        .update(customer)
        .set({ passwordHash: args.passwordHash, stateId: CustomerState.ACTIVE })
        .where(eq(customer.id, args.customerId));
      await tx
        .update(verificationToken)
        .set({ usedAt: new Date() })
        .where(eq(verificationToken.id, args.tokenId));
    });
  }

  async createPasswordReset(args: CreatePasswordResetArgs): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx.insert(verificationToken).values({
        customerId: args.customerId,
        typeId: VerificationTokenType.PASSWORD_RESET,
        tokenHash: args.tokenHash,
        expiresAt: args.expiresAt,
      });
      await tx.insert(mailOutbox).values({
        customerId: args.customerId,
        template: RESET_TEMPLATE,
        localeId: args.localeId,
        toEmail: args.email,
        context: { verifyPath: args.verifyPath },
      });
    });
  }

  async completePasswordReset(args: CompletePasswordResetArgs): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx
        .update(customer)
        .set({ passwordHash: args.passwordHash })
        .where(eq(customer.id, args.customerId));
      await tx
        .update(verificationToken)
        .set({ usedAt: new Date() })
        .where(eq(verificationToken.id, args.tokenId));
      // ctx-security.md §2: password change → revoke ALL refresh tokens.
      await tx
        .update(refreshToken)
        .set({ revokedAt: new Date() })
        .where(and(eq(refreshToken.customerId, args.customerId), isNull(refreshToken.revokedAt)));
    });
  }

  async findActiveCustomerByEmail(email: string): Promise<ActiveCustomer | null> {
    const rows = await this.db
      .select({
        id: customer.id,
        localeId: customer.localeId,
        stateId: customer.stateId,
        email: customer.email,
      })
      .from(customer)
      .where(and(eq(customer.email, email), isNull(customer.deletedAt)))
      .limit(1);
    return rows[0] ?? null;
  }

  async findArchivedCustomerByEmail(email: string): Promise<{ id: string } | null> {
    const rows = await this.db
      .select({ id: customer.id })
      .from(customer)
      .where(
        and(
          eq(customer.email, email),
          eq(customer.stateId, CustomerState.ARCHIVED),
          isNotNull(customer.deletedAt),
        ),
      )
      .orderBy(desc(customer.deletedAt))
      .limit(1);
    return rows[0] ?? null;
  }
}
