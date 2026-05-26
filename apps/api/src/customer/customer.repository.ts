import { Inject, Injectable } from '@nestjs/common';
import { CustomerState } from '@subzero/shared';
import { and, eq, isNull, lt, sql } from 'drizzle-orm';

import { DRIZZLE, type DrizzleDB } from '../db/db.module';
import { billingHistory } from '../db/schema/billing-history';
import { customer } from '../db/schema/customer';
import { subscription } from '../db/schema/subscription';
import type { CustomerRepository, CustomerRow, ProfilePatch } from './customer.types';

@Injectable()
export class DrizzleCustomerProfileRepository implements CustomerRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findActiveById(id: string): Promise<CustomerRow | null> {
    const rows = await this.db
      .select({
        id: customer.id,
        email: customer.email,
        name: customer.name,
        timezone: customer.timezone,
        localeId: customer.localeId,
        currencyId: customer.currencyId,
        planId: customer.planId,
        passwordHash: customer.passwordHash,
        notificationsEnabled: customer.notificationsEnabled,
        notificationLeadDays: customer.notificationLeadDays,
        version: customer.version,
      })
      .from(customer)
      .where(and(eq(customer.id, id), isNull(customer.deletedAt)))
      .limit(1);
    return rows[0] ?? null;
  }

  async updateProfile(id: string, version: number, patch: ProfilePatch): Promise<boolean> {
    const set: Record<string, unknown> = { version: sql`${customer.version} + 1` };
    if (patch.name !== undefined) set.name = patch.name;
    if (patch.timezone !== undefined) set.timezone = patch.timezone;
    if (patch.localeId !== undefined) set.localeId = patch.localeId;
    if (patch.currencyId !== undefined) set.currencyId = patch.currencyId;
    if (patch.notificationsEnabled !== undefined) set.notificationsEnabled = patch.notificationsEnabled;
    if (patch.notificationLeadDays !== undefined) set.notificationLeadDays = patch.notificationLeadDays;

    const res = await this.db
      .update(customer)
      .set(set)
      .where(
        and(
          eq(customer.id, id),
          eq(customer.version, version),
          isNull(customer.deletedAt),
        ),
      );
    return (res.rowCount ?? 0) > 0;
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await this.db
      .update(customer)
      .set({ passwordHash })
      .where(and(eq(customer.id, id), isNull(customer.deletedAt)));
  }

  async softDelete(id: string): Promise<void> {
    await this.db
      .update(customer)
      .set({ deletedAt: new Date(), stateId: CustomerState.ARCHIVED })
      .where(and(eq(customer.id, id), isNull(customer.deletedAt)));
  }

  async hardDeleteArchivedBefore(cutoff: Date): Promise<void> {
    // FK cascades from customer.id erase all children; future child tables
    // (#11/#44/#45) add their own ON DELETE CASCADE — ctx-architecture §6.
    await this.db
      .delete(customer)
      .where(and(eq(customer.stateId, CustomerState.ARCHIVED), lt(customer.deletedAt, cutoff)));
  }

  async purgeSubscriptions(customerId: string): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx.delete(billingHistory).where(eq(billingHistory.customerId, customerId));
      await tx.delete(subscription).where(eq(subscription.customerId, customerId));
    });
  }
}
