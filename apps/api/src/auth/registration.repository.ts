import { Inject, Injectable } from '@nestjs/common';
import { CustomerState, VerificationTokenType } from '@subzero/shared';
import { and, eq, isNull } from 'drizzle-orm';

import { DRIZZLE, type DrizzleDB } from '../db/db.module';
import { customer } from '../db/schema/customer';
import { mailOutbox } from '../db/schema/mail-outbox';
import { project } from '../db/schema/project';
import { verificationToken } from '../db/schema/verification-token';
import type { CreateAccountArgs, RegistrationRepository, ReissueArgs } from './auth.types';

const VERIFY_TEMPLATE = 'verify-email';

@Injectable()
export class DrizzleRegistrationRepository implements RegistrationRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async createNewAccount(args: CreateAccountArgs): Promise<void> {
    await this.db.transaction(async (tx) => {
      const [c] = await tx
        .insert(customer)
        .values({
          email: args.email,
          name: args.name,
          timezone: args.timezone,
          localeId: args.localeId,
          stateId: CustomerState.CREATED,
          marketingConsentAt: args.marketingConsent ? new Date() : null,
        })
        .returning({ id: customer.id });

      await tx.insert(project).values({
        sku: args.sku,
        customerId: c.id,
        name: 'Personal',
        color: args.color,
      });

      await tx.insert(verificationToken).values({
        customerId: c.id,
        typeId: VerificationTokenType.EMAIL_VERIFY,
        tokenHash: args.tokenHash,
        expiresAt: args.expiresAt,
      });

      await tx.insert(mailOutbox).values({
        customerId: c.id,
        template: VERIFY_TEMPLATE,
        localeId: args.localeId,
        toEmail: args.email,
        context: { verifyPath: args.verifyPath, name: args.name },
      });
    });
  }

  async reissueVerification(args: ReissueArgs): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx
        .update(verificationToken)
        .set({ usedAt: new Date() })
        .where(
          and(
            eq(verificationToken.customerId, args.customerId),
            eq(verificationToken.typeId, VerificationTokenType.EMAIL_VERIFY),
            isNull(verificationToken.usedAt),
          ),
        );

      await tx.insert(verificationToken).values({
        customerId: args.customerId,
        typeId: VerificationTokenType.EMAIL_VERIFY,
        tokenHash: args.tokenHash,
        expiresAt: args.expiresAt,
      });

      await tx.insert(mailOutbox).values({
        customerId: args.customerId,
        template: VERIFY_TEMPLATE,
        localeId: args.localeId,
        toEmail: args.email,
        context: { verifyPath: args.verifyPath },
      });
    });
  }
}
