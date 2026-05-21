import type { SubscriptionDto } from '@subzero/shared';

export type { SubscriptionDto };

/** UI-форматированная подписка для существующих компонентов кабинета. */
export interface CabinetSubscription {
  sku: string;
  name: string;
  icon: string | null;
  projectSku: string;
  categorySku: string | null;
  amount: string;
  currencyId: number;
  billingPeriodId: number;
  nextBillingDate: string;
  isTrial: boolean;
  promoEndsAt: string | null;
  stateId: number;
  comment: string | null;
  version: number;
}

export function toCabinetSubscription(dto: SubscriptionDto): CabinetSubscription {
  return {
    sku: dto.sku,
    name: dto.name,
    icon: dto.icon,
    projectSku: dto.projectSku,
    categorySku: dto.categorySku,
    amount: dto.amount,
    currencyId: dto.currencyId,
    billingPeriodId: dto.billingPeriodId,
    nextBillingDate: dto.nextBillingDate,
    isTrial: dto.isTrial,
    promoEndsAt: dto.promoEndsAt,
    stateId: dto.stateId,
    comment: dto.comment,
    version: dto.version,
  };
}
