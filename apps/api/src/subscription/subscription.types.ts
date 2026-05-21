import type {
  SubscriptionCreateDto,
  SubscriptionDto,
  SubscriptionListQuery,
  SubscriptionListResponse,
  SubscriptionUpdateDto,
} from '@subzero/shared';

export interface SubscriptionRepository {
  findProjectIdBySku(customerId: string, projectSku: string): Promise<string | null>;
  findServiceByCustomSku(
    sku: string,
  ): Promise<{ id: string; name: string; icon: string | null; categoryId: string } | null>;
  findCategoryIdBySku(sku: string): Promise<string | null>;
  list(
    customerId: string,
    q: SubscriptionListQuery,
  ): Promise<SubscriptionListResponse>;
  findBySku(customerId: string, sku: string): Promise<SubscriptionDto | null>;
  /** INSERT subscription + backfill billing_history в одной транзакции. */
  createWithBackfill(args: {
    customerId: string;
    projectId: string;
    sku: string;
    serviceId: string | null;
    nameCustom: string | null;
    iconCustom: string | null;
    categoryId: string;
    amount: string;
    currencyId: number;
    billingPeriodId: number;
    firstBillingDate: Date;
    nextBillingDate: Date;
    isTrial: boolean;
    promoAmount: string | null;
    promoEndsAt: Date | null;
    comment: string | null;
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
  /** Optimistic update — returns false on version mismatch. */
  update(args: {
    customerId: string;
    sku: string;
    version: number;
    patch: Record<string, unknown>;
  }): Promise<boolean>;
  /** Soft-delete (state=ARCHIVED, deleted_at=now). Returns false if не найдена / уже архив. */
  softDelete(customerId: string, sku: string): Promise<boolean>;
}

export interface SubscriptionServiceDeps {
  repo: SubscriptionRepository;
  now: () => Date;
  generateSku: (prefix: 'sub' | 'bil') => string;
}

export type SubscriptionCreateInput = SubscriptionCreateDto;
export type SubscriptionUpdateInput = SubscriptionUpdateDto;
