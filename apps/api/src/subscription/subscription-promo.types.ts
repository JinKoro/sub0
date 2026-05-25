import type { PromoDto } from '@subzero/shared';

export interface SubscriptionPromoRepository {
  listForSubscription(subscriptionId: string): Promise<PromoDto[]>;
  bulkInsert(args: {
    subscriptionId: string;
    rows: Array<{ sku: string; amount: string; endsAt: Date }>;
  }): Promise<void>;
  softDelete(sku: string, subscriptionId: string): Promise<boolean>;
  update(args: {
    sku: string;
    subscriptionId: string;
    version: number;
    patch: { amount?: string; endsAt?: Date };
  }): Promise<boolean>;
}
