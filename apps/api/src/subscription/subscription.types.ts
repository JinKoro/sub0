import type {
  SubscriptionDto,
  SubscriptionListQuery,
  SubscriptionListResponse,
} from '@subzero/shared';

import type { SubscriptionPromoRepository } from './subscription-promo.types';

export interface SubscriptionRepository {
  findProjectIdBySku(customerId: string, projectSku: string): Promise<string | null>;
  findServiceBySku(
    sku: string,
  ): Promise<{ id: string; name: string; icon: string | null; categoryId: string } | null>;
  findCategoryIdBySku(sku: string): Promise<string | null>;
  findIdBySku(customerId: string, sku: string): Promise<string | null>;
  /** Текущий план кастомера: для проверки лимита Free перед create. */
  findCustomerPlanId(customerId: string): Promise<number | null>;
  /** Счётчик не-архивных подписок: ACTIVE + PAUSED + CANCELLED, deleted_at IS NULL. */
  countActiveForCustomer(customerId: string): Promise<number>;

  list(customerId: string, q: SubscriptionListQuery): Promise<SubscriptionListResponse>;
  findBySku(customerId: string, sku: string): Promise<SubscriptionDto | null>;

  /** INSERT subscription + promo (если есть) + backfill billing_history в одной транзакции. */
  createWithBackfill(args: {
    customerId: string;
    projectId: string;
    sku: string;
    serviceId: string | null;
    nameCustom: string | null;
    iconCustom: string | null;
    color: string | null;
    categoryId: string;
    amount: string;
    currencyId: number;
    billingPeriodId: number;
    firstBillingDate: Date;
    nextBillingDate: Date;
    isTrial: boolean;
    trialEndsAt: Date | null;
    comment: string | null;
    promos: Array<{ sku: string; amount: string; endsAt: Date }>;
    backfill: Array<{
      sku: string;
      periodStart: Date;
      periodEnd: Date;
      billedAt: Date;
      amount: string;
      isPromo: boolean;
      currencyId: number;
    }>;
  }): Promise<SubscriptionDto>;

  update(args: {
    customerId: string;
    sku: string;
    version: number;
    patch: Record<string, unknown>;
  }): Promise<boolean>;

  /** HARD delete — DELETE FROM subscription (promos и billing_history каскадно). */
  hardDelete(customerId: string, sku: string): Promise<boolean>;
}

export interface SubscriptionServiceDeps {
  repo: SubscriptionRepository;
  promoRepo: SubscriptionPromoRepository;
  now: () => Date;
  generateSku: (prefix: 'sub' | 'bil' | 'spm') => string;
}
